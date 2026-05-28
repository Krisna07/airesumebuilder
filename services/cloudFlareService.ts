import OpenAI from "openai";
import { buildStructuredPrompt, parseStructuredJson } from "@/services/aiProviderUtils";

type JsonSchema = Record<string, unknown>;

export type CloudFlareCallOptions = {
    model: string;
    prompt: string;
    outputSchema?: JsonSchema;
    token?: string;
    baseURL?: string;
};

function getGatewayToken() {
    return (
        process.env.CLOUDFLARE_AI_GATEWAY_TOKEN ||
        process.env.BLOG_AI_WORKER_API_KEY ||
        process.env.BLOG_IMAGE_API_KEY ||
        ""
    );
}

function getGatewayBaseUrl() {
    return (
        process.env.CLOUDFLARE_AI_GATEWAY_BASE_URL ||
        "https://gateway.ai.cloudflare.com/v1/c55b8fadd0c7d0e3ddbb232e935708f0/default/compat"
    );
}

export async function callCloudFlareModel({
    model,
    prompt,
    outputSchema,
    token,
    baseURL,
}: CloudFlareCallOptions): Promise<any> {
    const resolvedToken = token || getGatewayToken();
    if (!resolvedToken) {
        throw new Error("Cloudflare gateway token is missing.");
    }

    const client = new OpenAI({
        apiKey: resolvedToken,
        baseURL: baseURL || getGatewayBaseUrl(),
        defaultHeaders: {
            "cf-aig-authorization": `Bearer ${resolvedToken}`,
        },
    });

    const response = await client.chat.completions.create({
        model,
        messages: [{ role: "user", content: outputSchema ? buildStructuredPrompt(prompt) : prompt }],
    });

    const content = response.choices?.[0]?.message?.content;
    if (!content) {
        throw new Error("No content in Cloudflare AI response");
    }

    if (!outputSchema) {
        return content;
    }

    return parseStructuredJson(content, "Cloudflare AI");
}
