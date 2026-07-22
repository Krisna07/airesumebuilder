/**
 * Hugging Face Inference Providers
 * Flexible multi-provider AI API with automatic provider selection
 * 
 * Benefits:
 * - Automatic provider routing (`:fastest`, `:cheapest`, `:preferred`)
 * - Access to 100+ models across multiple providers
 * - Drop-in OpenAI compatibility
 * - Free tier available
 * - No vendor lock-in
 */

const hasHfToken = Boolean(process.env.HF_TOKEN);

if (!hasHfToken) {
    console.warn("HFInferenceService: HF_TOKEN not found. Using fallback providers.");
}

export const HF_MODELS = {
    // Fast models (1000+ tok/s throughput)
    FAST_CHAT: "meta-llama/Llama-3.1-8B-Instruct:fastest", // Auto-selects fastest provider
    FAST_CODE: "deepseek-ai/DeepSeek-V3:fastest", // Latest & fast

    // Quality models (high-quality, still 200+ tok/s)
    QUALITY_CHAT: "meta-llama/Llama-3.1-70B-Instruct:fastest",
    QUALITY_CODE: "Qwen/Qwen2.5-72B-Instruct:fastest",

    // Cheap models (most cost-efficient)
    CHEAP: "meta-llama/Llama-3.1-8B-Instruct:cheapest",
};

export type HFModelType = keyof typeof HF_MODELS;

export interface HFInferenceOptions {
    model: string;
    prompt: string;
    temperature?: number;
    max_tokens?: number;
    provider?: "auto" | "groq" | "together" | "replicate" | "cohere" | string;
}

/**
 * Call Hugging Face Inference API
 */
export async function callHFInferenceModel(
    options: HFInferenceOptions
): Promise<string> {
    if (!hasHfToken) {
        throw new Error("Hugging Face token not configured. Set HF_TOKEN.");
    }

    try {
        const response = await fetch("https://api-inference.huggingface.co/models/" + options.model, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${process.env.HF_TOKEN}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                inputs: options.prompt,
                parameters: {
                    temperature: options.temperature ?? 0.7,
                    max_length: options.max_tokens ?? 4096,
                },
                options: {
                    wait_for_model: true,
                },
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`HF API error: ${error.error || response.statusText}`);
        }

        const result = await response.json();

        // Handle different response formats
        if (Array.isArray(result) && result[0]?.generated_text) {
            return result[0].generated_text;
        }
        if (result.generated_text) {
            return result.generated_text;
        }
        if (typeof result === "string") {
            return result;
        }

        throw new Error("Unexpected response format from HF API");
    } catch (error: any) {
        console.error("HF Inference API error:", error?.message);
        throw error;
    }
}

/**
 * Call using HF Inference Providers (OpenAI-compatible)
 * This uses the new HF Inference Providers router
 */
export async function callHFInferenceProvidersRouter(
    options: HFInferenceOptions
): Promise<string> {
    if (!hasHfToken) {
        throw new Error("Hugging Face token not configured. Set HF_TOKEN.");
    }

    try {
        const response = await fetch("https://router.huggingface.co/v1/chat/completions", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${process.env.HF_TOKEN}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: options.model,
                messages: [
                    {
                        role: "user",
                        content: options.prompt,
                    },
                ],
                temperature: options.temperature ?? 0.7,
                max_tokens: options.max_tokens ?? 4096,
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`HF Router error: ${error.error?.message || response.statusText}`);
        }

        const result = await response.json();
        const content = result.choices?.[0]?.message?.content;

        if (!content) {
            throw new Error("Empty response from HF Inference Providers");
        }

        return content;
    } catch (error: any) {
        console.error("HF Inference Providers Router error:", error?.message);
        throw error;
    }
}

/**
 * Check if HF is available
 */
export function isHFAvailable(): boolean {
    return hasHfToken;
}
