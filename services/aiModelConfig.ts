export type ModelProvider = "openrouter";

export type PreferredModel = {
    provider: ModelProvider;
    model: string;
};

// OpenRouter-specific models.
// Keep these separate from Groq-native model IDs.
export const OPENROUTER_FAST_MODEL = "nvidia/nemotron-3-nano-30b-a3b:free";
export const OPENROUTER_STRONG_LONG_CONTEXT_MODEL = "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free";

// Groq native model IDs from the allowed list.
export const GROQ_FAST_MODEL = "llama-3.1-8b-instant";
export const GROQ_STRONG_MODEL = "llama-3.3-70b-versatile";
export const GROQ_BALANCED_MODEL = "qwen/qwen3.6-27b";

export const openRouterModels = [
    OPENROUTER_FAST_MODEL,
    OPENROUTER_STRONG_LONG_CONTEXT_MODEL,
    "meta-llama/llama-3.2-3b-instruct:free",
];

// Task-specific preferred OpenRouter models, attempted before standard model rotation
// Strategy:
// - Heavy lifting and long outputs: OPENROUTER_STRONG_LONG_CONTEXT_MODEL
// - Speed-sensitive tasks: OPENROUTER_FAST_MODEL
export const MODEL_ROUTING: Record<string, PreferredModel[]> = {
    "resume-generation": [
        { provider: "openrouter", model: OPENROUTER_FAST_MODEL },
        { provider: "openrouter", model: OPENROUTER_STRONG_LONG_CONTEXT_MODEL },
    ],
    "cover-letter": [
        { provider: "openrouter", model: OPENROUTER_FAST_MODEL },
        { provider: "openrouter", model: OPENROUTER_STRONG_LONG_CONTEXT_MODEL },
    ],
    "resume-analysis": [
        { provider: "openrouter", model: OPENROUTER_STRONG_LONG_CONTEXT_MODEL },
        { provider: "openrouter", model: OPENROUTER_FAST_MODEL },
    ],
    "resume-extraction": [
        { provider: "openrouter", model: OPENROUTER_FAST_MODEL },
        { provider: "openrouter", model: OPENROUTER_STRONG_LONG_CONTEXT_MODEL },
    ],
    "job-extraction": [
        { provider: "openrouter", model: OPENROUTER_FAST_MODEL },
    ],
    "section-generation": [
        { provider: "openrouter", model: OPENROUTER_FAST_MODEL },
    ],
    "blog-title-generation": [
        { provider: "openrouter", model: OPENROUTER_FAST_MODEL },
    ],
    "blog-content-generation": [
        { provider: "openrouter", model: OPENROUTER_FAST_MODEL },
        { provider: "openrouter", model: OPENROUTER_STRONG_LONG_CONTEXT_MODEL },
    ],
};

function isHeavyTask(taskType?: string): boolean {
    if (!taskType) return false;
    return ["resume-analysis"].includes(taskType);
}

function isFastTask(taskType?: string): boolean {
    if (!taskType) return false;
    return [
        "job-extraction",
        "section-generation",
        "blog-title-generation",
        "blog-content-generation",
    ].includes(taskType);
}

export function getGroqModelForTask(taskType?: string): string {
    if (isHeavyTask(taskType)) return GROQ_STRONG_MODEL;
    if (isFastTask(taskType)) return GROQ_FAST_MODEL;
    return GROQ_BALANCED_MODEL;
}

export function getOpenRouterModelForTask(taskType?: string): string {
    if (isHeavyTask(taskType)) return OPENROUTER_STRONG_LONG_CONTEXT_MODEL;
    return OPENROUTER_FAST_MODEL;
}
