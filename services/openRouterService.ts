import { OpenRouter } from "@openrouter/sdk";
import { buildStructuredPrompt, parseStructuredJson } from "@/services/aiProviderUtils";

type OpenRouterJsonSchema = Record<string, unknown>;

export type OpenRouterCallOptions = {
    model: string;
    prompt: string;
    outputSchema?: OpenRouterJsonSchema;
};

function getClient() {
    const openRouterKey = process.env.OPENROUTER_API_KEY;
    if (!openRouterKey) {
        throw new Error('OpenRouter client is not initialized. Set OPENROUTER_API_KEY.');
    }

    return new OpenRouter({ apiKey: openRouterKey });
}

export async function callOpenRouterModel({ model, prompt, outputSchema }: OpenRouterCallOptions): Promise<any> {
    const openRouter = getClient();

    const response = await openRouter.chat.send({
        model,
        messages: [{ role: 'user', content: outputSchema ? buildStructuredPrompt(prompt) : prompt }],
        responseFormat: outputSchema
            ? {
                type: 'json_schema',
                jsonSchema: {
                    name: 'ai_response',
                    schema: outputSchema,
                    strict: true,
                },
            }
            : undefined,
        stream: false,
    });

    const choice = response?.choices?.[0];
    const content = choice?.message?.content;
    if (!content) {
        throw new Error('Empty response from OpenRouter');
    }

    if (typeof content !== 'string') {
        return content;
    }

    if (!outputSchema) {
        return content;
    }

    return parseStructuredJson(content, "OpenRouter");
}