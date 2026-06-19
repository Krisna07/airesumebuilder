export type ModelProvider = "openrouter" | "cloudflare";

export type PreferredModel = {
    provider: ModelProvider;
    model: string;
};

// OpenRouter tiers used across the app.
// - FAST: lower latency tasks
// - STRONG_LONG_CONTEXT: higher quality + larger context tasks
export const OPENROUTER_FAST_MODEL = "nvidia/nemotron-3-nano-30b-a3b:free";
export const OPENROUTER_STRONG_LONG_CONTEXT_MODEL = "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free";

export const openRouterModels = [
    OPENROUTER_FAST_MODEL,
    "openai/gpt-oss-20b:free",
    "meta-llama/llama-3.2-3b-instruct:free",
];

export const cloudflareModels = [
    "llama-3.2-11b-vision",
    "mistral-7b-instruct-v0.2",
    "phi-3-mini-128k-instruct",
];

// Task-specific preferred models, attempted before provider waterfalls.
// Strategy:
// - Heavy lifting and long outputs: OPENROUTER_STRONG_LONG_CONTEXT_MODEL
// - Speed-sensitive tasks: OPENROUTER_FAST_MODEL
export const MODEL_ROUTING: Record<string, PreferredModel[]> = {
    "resume-generation": [
        { provider: "openrouter", model: OPENROUTER_STRONG_LONG_CONTEXT_MODEL },
        { provider: "cloudflare", model: "llama-3.2-11b-vision" },
    ],
    "cover-letter": [
        { provider: "openrouter", model: OPENROUTER_STRONG_LONG_CONTEXT_MODEL },
        { provider: "cloudflare", model: "llama-3.2-11b-vision" },
    ],
    "resume-analysis": [
        { provider: "openrouter", model: OPENROUTER_STRONG_LONG_CONTEXT_MODEL },
        { provider: "cloudflare", model: "mistral-7b-instruct-v0.2" },
    ],
    "resume-extraction": [
        { provider: "openrouter", model: OPENROUTER_STRONG_LONG_CONTEXT_MODEL },
        { provider: "cloudflare", model: "mistral-7b-instruct-v0.2" },
    ],
    "job-extraction": [
        { provider: "openrouter", model: OPENROUTER_FAST_MODEL },
        { provider: "cloudflare", model: "mistral-7b-instruct-v0.2" },
    ],
    "section-generation": [
        { provider: "openrouter", model: OPENROUTER_FAST_MODEL },
        { provider: "cloudflare", model: "llama-3.2-11b-vision" },
    ],
    "blog-title-generation": [
        { provider: "openrouter", model: OPENROUTER_FAST_MODEL },
        { provider: "cloudflare", model: "llama-3.2-11b-vision" },
    ],
    "blog-content-generation": [
        { provider: "openrouter", model: OPENROUTER_STRONG_LONG_CONTEXT_MODEL },
        { provider: "cloudflare", model: "llama-3.2-11b-vision" },
    ],
};
