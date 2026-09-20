const signale = require("signale");

const providers = {
    groq: {
        name: "Groq",
        type: "openai",
        baseURL: "https://api.groq.com/openai/v1",
        keyEnv: "GROQ_API_KEY",
    },
    openai: {
        name: "OpenAI",
        type: "openai",
        baseURL: "https://api.openai.com/v1",
        keyEnv: "OPENAI_API_KEY",
    },
    openrouter: {
        name: "OpenRouter",
        type: "openai",
        baseURL: "https://openrouter.ai/api/v1",
        keyEnv: "OPENROUTER_API_KEY",
    },
    together: {
        name: "Together AI",
        type: "openai",
        baseURL: "https://api.together.xyz/v1",
        keyEnv: "TOGETHER_API_KEY",
    },
    gemini: {
        name: "Google Gemini",
        type: "gemini",
        baseURL: "https://generativelanguage.googleapis.com/v1beta",
        keyEnv: "GEMINI_API_KEY",
    },
};

function getApiKeys(keyEnv) {
    const keys = [];
    let i = 1;
    while (true) {
        const key = process.env[`${keyEnv}_${i}`];
        if (!key) break;
        keys.push(key);
        i++;
    }
    if (keys.length > 0) return keys;
    const single = process.env[keyEnv];
    return single ? [single] : [];
}

function getEnabledProviders() {
    return Object.entries(providers)
        .filter(([, provider]) => getApiKeys(provider.keyEnv).length > 0)
        .map(([id, provider]) => ({
            id,
            ...provider,
            keys: getApiKeys(provider.keyEnv),
        }));
}

function pickKey(provider) {
    provider._rotator = (provider._rotator || 0) % provider.keys.length;
    return provider.keys[provider._rotator++];
}

async function fetchModels(provider) {
    const key = pickKey(provider);
    try {
        if (provider.type === "openai") {
            const response = await fetch(`${provider.baseURL}/models`, {
                headers: {
                    Authorization: `Bearer ${key}`,
                },
            });
            if (!response.ok) return [];
            const data = await response.json();
            return (data.data || []).map((model) => model.id);
        }

        if (provider.type === "gemini") {
            const response = await fetch(`${provider.baseURL}/models?key=${key}`);
            if (!response.ok) return [];
            const data = await response.json();
            return (data.models || [])
                .filter((model) => model.supportedGenerationMethods?.includes("generateContent"))
                .map((model) => model.name.replace(/^models\//, ""));
        }
    } catch {
        return [];
    }
    return [];
}

async function complete(provider, model, messages, maxTokens) {
    const key = pickKey(provider);

    if (provider.type === "openai") {
        const response = await fetch(`${provider.baseURL}/chat/completions`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${key}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model,
                messages: messages.map((message) => ({
                    role: message.role,
                    content: message.content,
                })),
                max_completion_tokens: maxTokens,
            }),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || `Provider returned ${response.status}`);
        }
        const data = await response.json();
        return data.choices?.[0]?.message?.content ?? "";
    }

    if (provider.type === "gemini") {
        const response = await fetch(`${provider.baseURL}/models/${model}:generateContent?key=${key}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                contents: messages.map((message) => ({
                    role: message.role === "assistant" ? "model" : "user",
                    parts: [{
                        text: message.content
                    }],
                })),
                generationConfig: {
                    maxOutputTokens: maxTokens,
                },
            }),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || `Provider returned ${response.status}`);
        }
        const data = await response.json();
        return (data.candidates?.[0]?.content?.parts || []).map((part) => part.text).join("") || "";
    }

    throw new Error(`Unsupported provider type: ${provider.type}`);
}

async function refreshProviders(client) {
    const providers = getEnabledProviders().map((provider) => ({
        ...provider,
        models: [],
    }));

    client.aiProviders = providers;

    await Promise.all(
        providers.map(async (provider) => {
            provider.models = await fetchModels(provider);
        })
    );

    signale.info(
        `Refreshed ${providers.length} AI providers (${providers
            .map((provider) => `${provider.id}:${provider.models.length} models`)
            .join(", ")})`
    );
}

module.exports = {
    providers,
    getEnabledProviders,
    refreshProviders,
    complete,
    pickKey
};