export type ModelProvider = "gemini" | "openrouter";

export type PreferredModel = {
    provider: ModelProvider;
    model: string;
};

// Standard model waterfalls by provider.
export const geminiModels = [
    "gemini-3.1-flash-lite-preview",
    "gemma-3-27b-it",
    "gemini-3.1-flash",
];

export const openRouterModels = [
    "google/gemma-4-26b-a4b-it:free",
    "openai/gpt-oss-20b:free",
    "meta-llama/llama-3.2-3b-instruct:free",
];

// Task-specific preferred models, attempted before provider waterfalls.
export const MODEL_ROUTING: Record<string, PreferredModel[]> = {
    "resume-generation": [
        { provider: "gemini", model: "gemini-3.1-flash-lite-preview" },
    ],
    "cover-letter": [
        { provider: "gemini", model: "gemini-3.1-flash-lite-preview" },
    ],
    "resume-analysis": [
        { provider: "openrouter", model: "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free" },
    ],
    "resume-extraction": [
        { provider: "openrouter", model: "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free" },
    ],
    "job-extraction": [
        { provider: "openrouter", model: "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free" },
    ],
    "section-generation": [
        { provider: "openrouter", model: "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free" },
    ],
};
