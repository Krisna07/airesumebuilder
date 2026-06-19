export type ModelProvider = "openrouter";

export type PreferredModel = {
    provider: ModelProvider;
    model: string;
};

// OpenRouter models used across the app
// - FAST: lower latency tasks
// - STRONG_LONG_CONTEXT: higher quality + larger context tasks
export const OPENROUTER_FAST_MODEL = "nvidia/nemotron-3-nano-30b-a3b:free";
export const OPENROUTER_STRONG_LONG_CONTEXT_MODEL = "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free";

export const openRouterModels = [
    OPENROUTER_FAST_MODEL,
    "openai/gpt-oss-20b:free",
    "meta-llama/llama-3.2-3b-instruct:free",
];

// Task-specific preferred OpenRouter models, attempted before standard model rotation
// Strategy:
// - Heavy lifting and long outputs: OPENROUTER_STRONG_LONG_CONTEXT_MODEL
// - Speed-sensitive tasks: OPENROUTER_FAST_MODEL
export const MODEL_ROUTING: Record<string, PreferredModel[]> = {
    "resume-generation": [
        { provider: "openrouter", model: OPENROUTER_STRONG_LONG_CONTEXT_MODEL },
    ],
    "cover-letter": [
        { provider: "openrouter", model: OPENROUTER_STRONG_LONG_CONTEXT_MODEL },
    ],
    "resume-analysis": [
        { provider: "openrouter", model: OPENROUTER_STRONG_LONG_CONTEXT_MODEL },
    ],
    "resume-extraction": [
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
        { provider: "openrouter", model: OPENROUTER_STRONG_LONG_CONTEXT_MODEL },
    ],
};
