/**
 * Multi-Provider AI Orchestrator
 * Intelligent routing: Groq → HF Providers → OpenRouter → Fallback
 * 
 * Ensures your app is resilient and fast regardless of provider status
 */

import {
    callGroqModel,
    GROQ_MODELS,
    parseGroqJsonResponse as groqParseJson,
    isGroqAvailable,
} from "@/services/groqService";
import {
    callHFInferenceProvidersRouter,
    HF_MODELS,
    isHFAvailable,
} from "@/services/hfInferenceService";
import { callOpenRouterModel } from "@/services/openRouterService";
import { getGroqModelForTask, getOpenRouterModelForTask } from "@/services/aiModelConfig";

export type AIProviderType = "groq" | "huggingface" | "openrouter" | "none";

// Cache HF health check results for 5 minutes to avoid hammering the API
let hfHealthCheckCache: { healthy: boolean; timestamp: number } | null = null;
const HF_HEALTH_CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes

/**
 * Check if HuggingFace Inference API is healthy
 * Returns cached result if available and recent
 */
async function isHFHealthy(): Promise<boolean> {
    const now = Date.now();

    // Return cached result if still fresh
    if (hfHealthCheckCache && now - hfHealthCheckCache.timestamp < HF_HEALTH_CHECK_INTERVAL) {
        return hfHealthCheckCache.healthy;
    }

    // Run health check
    try {
        const response = await callHFInferenceProvidersRouter({
            model: HF_MODELS.FAST_CHAT,
            prompt: "Respond with: OK",
            max_tokens: 10,
        });

        const healthy: boolean = !!(response && typeof response === 'string' && response.includes("OK"));
        hfHealthCheckCache = { healthy, timestamp: now };
        console.log(`[HF Health] ${healthy ? "✓ Healthy" : "✗ Unhealthy"}`);
        return healthy;
    } catch (error) {
        console.warn("[HF Health] Check failed:", (error as any)?.message);
        hfHealthCheckCache = { healthy: false, timestamp: now };
        return false;
    }
}

export interface AICallOptions {
    prompt: string;
    schema?: any;
    temperature?: number;
    maxTokens?: number;
    taskType?: string; // For logging
    preferredProvider?: AIProviderType; // Force specific provider
}

/**
 * Determine which provider to use based on availability and preference
 * Optimized for: Fastest APIs first → HF (if healthy) → OpenRouter → Text Extractor
 */
async function getProviderPriority(preferredProvider?: AIProviderType): Promise<AIProviderType[]> {
    // User preference first
    if (preferredProvider) {
        const priority: AIProviderType[] = [preferredProvider];

        // Add alternatives in order: Groq → HF (if healthy) → OpenRouter
        if (preferredProvider !== "groq" && isGroqAvailable()) priority.push("groq");
        if (preferredProvider !== "huggingface" && isHFAvailable() && await isHFHealthy())
            priority.push("huggingface");
        if (preferredProvider !== "openrouter") priority.push("openrouter");

        return priority;
    }

    // Default priority: FASTEST FIRST, then HF (if working), then OpenRouter
    const priority: AIProviderType[] = [];

    if (isGroqAvailable()) priority.push("groq"); // PRIMARY: Fastest (70-300+ tok/s) ⚡

    // Check if HuggingFace is healthy and available
    if (isHFAvailable() && await isHFHealthy()) {
        priority.push("huggingface"); // FALLBACK 1: Use if working (100-500+ tok/s) 🔄
    }

    priority.push("openrouter"); // FALLBACK 2: Reliable (10-50 tok/s) ✓

    return priority;
}

/**
 * Make AI call with automatic provider fallback
 */
export async function callAI(options: AICallOptions): Promise<string> {
    const { prompt, schema, temperature = 0.7, maxTokens = 4096, taskType, preferredProvider } = options;

    const providers = await getProviderPriority(preferredProvider);
    let lastError: any = null;

    for (const provider of providers) {
        try {
            console.log(
                `[AI] Attempting ${taskType || "AI call"} with ${provider}...`
            );

            let response: string;

            switch (provider) {
                case "groq":
                    response = await callGroqModel({
                        model: getGroqModelForTask(taskType) || GROQ_MODELS.FAST_REASONING,
                        prompt: buildJsonPrompt(prompt, schema),
                        temperature,
                        max_tokens: maxTokens,
                    });
                    console.log(`[AI] ✓ ${taskType || "Generated"} with Groq (FAST - 70-300+ tok/s)`);
                    break;

                case "huggingface":
                    response = await callHFInferenceProvidersRouter({
                        model: HF_MODELS.QUALITY_CHAT,
                        prompt: buildJsonPrompt(prompt, schema),
                        temperature,
                        max_tokens: maxTokens,
                    });
                    console.log(`[AI] ✓ ${taskType || "Generated"} with HF Providers (100-500+ tok/s)`);
                    break;

                case "openrouter":
                    response = await callOpenRouterModel({
                        model: getOpenRouterModelForTask(taskType),
                        prompt: buildJsonPrompt(prompt, schema),
                        outputSchema: schema,
                    });
                    console.log(`[AI] ✓ ${taskType || "Generated"} with OpenRouter (10-50 tok/s)`);
                    break;

                default:
                    throw new Error(`Unknown provider: ${provider}`);
            }

            // Try to parse JSON if schema expected
            if (schema) {
                try {
                    if (provider === "groq") {
                        return JSON.stringify(groqParseJson(response));
                    }
                    return JSON.stringify(JSON.parse(response));
                } catch (parseError) {
                    console.warn(`[AI] JSON parsing failed for ${provider}, retrying with next provider...`);
                    lastError = parseError;
                    continue; // Try next provider
                }
            }

            return response;
        } catch (error: any) {
            console.warn(`[AI] ${provider} failed: ${error?.message}`);
            lastError = error;
            // Continue to next provider
        }
    }

    // All providers failed
    throw new Error(`All AI providers failed. Last error: ${lastError?.message}`);
}

/**
 * Build JSON-formatted prompt if schema provided
 */
function buildJsonPrompt(prompt: string, schema?: any): string {
    if (!schema) return prompt;

    return `${prompt}

Response must be valid JSON matching this schema:
${JSON.stringify(schema, null, 2)}

Respond with ONLY valid JSON, no markdown code blocks or explanations.`;
}

/**
 * Get status of all providers
 */
export function getProviderStatus() {
    return {
        groq: isGroqAvailable(),
        huggingface: isHFAvailable(),
        openrouter: true, // Always available as final fallback
    };
}

/**
 * Get provider health status (with HF check)
 */
export async function getProviderHealthStatus() {
    return {
        groq: isGroqAvailable(),
        huggingface: isHFAvailable() && await isHFHealthy(),
        openrouter: true,
    };
}

/**
 * Get estimated speed for each provider
 */
export function getProviderSpeedEstimates() {
    return {
        groq: "70-300+ tokens/sec (FASTEST)",
        huggingface: "100-500+ tokens/sec (varies by backend)",
        openrouter: "10-50 tokens/sec (slowest)",
    };
}
