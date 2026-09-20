const {
    SlashCommandBuilder,
    MessageFlags,
    TextDisplayBuilder,
    ContainerBuilder,
} = require("discord.js");
const AiConvo = require("../../models/AiConvo");
const {
    complete,
    refreshProviders
} = require("../../utils/aiProviders");

const ratelimitMs = 2000;
const rateLimits = new Map();
const maxResponseTokens = 350;
const maxResponseChars = 1400;
const defaultProviderPriority = ["groq", "gemini"];

function providerPriority() {
    const configured = (process.env.AI_PROVIDER_PRIORITY || "")
        .split(",")
        .map((id) => id.trim().toLowerCase())
        .filter(Boolean);
    return configured.length > 0 ? configured : [...defaultProviderPriority];
}

const replaceList = [{
        old: "@everyone",
        new: "@​everyone",
    },
    {
        old: "@here",
        new: "@​here",
    },
    {
        old: "discord.gg",
        new: "[filtered]",
    },
    {
        old: "discord.com/invite",
        new: "[filtered]",
    },
];

function isRateLimited(id) {
    const now = Date.now();
    const last = rateLimits.get(id) || 0;
    if (now - last < ratelimitMs) return true;
    rateLimits.set(id, now);
    return false;
}

function sanitize(text) {
    let cleaned = text;
    for (const replace of replaceList) {
        cleaned = cleaned.replaceAll(replace.old, replace.new);
    }
    return cleaned;
}

function orderedProviders(client) {
    const enabled = new Map((client.aiProviders || []).map((provider) => [provider.id, provider]));
    return providerPriority()
        .map((id) => enabled.get(id))
        .filter(Boolean);
}

function enforceLength(text) {
    if (text.length <= maxResponseChars) return text;
    return text.slice(0, maxResponseChars) + "\n…";
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName("ai")
        .setDescription("Talk to the AI")
        .setIntegrationTypes(0, 1)
        .setContexts(0, 1, 2)
        .addStringOption((option) =>
            option.setName("message").setDescription("The message to send to the AI").setRequired(true)
        ),
    async execute(interaction) {
        const client = interaction.client;

        if (isRateLimited(interaction.user.id)) {
            const clock = interaction.client.customEmojis.clock;
            const container = [
                new ContainerBuilder().addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        `${clock} Please wait a few seconds before using this command again.`
                    )
                ),
            ];
            return interaction.reply({
                components: container,
                flags: [MessageFlags.IsComponentsV2, MessageFlags.Ephemeral],
            });
        }

        if (!client.aiProviders || client.aiProviders.length === 0) {
            await refreshProviders(client);
        }

        const providers = orderedProviders(client);
        if (providers.length === 0) {
            const container = [
                new ContainerBuilder().addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        "No AI providers are configured. Set the provider API keys first."
                    )
                ),
            ];
            return interaction.reply({
                components: container,
                flags: [MessageFlags.IsComponentsV2, MessageFlags.Ephemeral],
            });
        }

        const message = interaction.options.getString("message");

        await interaction.deferReply();

        let convo = await AiConvo.findOne({
            isChannel: false,
            id: interaction.user.id,
        });

        if (convo && convo.expiresAt < Math.floor(Date.now() / 1000)) {
            convo.messageArray = [];
        }

        if (!convo) {
            convo = new AiConvo({
                isChannel: false,
                id: interaction.user.id,
                messageArray: [],
                expiresAt: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7,
            });
        }

        convo.messageArray.push({
            role: "user",
            content: message,
        });

        const recentMessages = convo.messageArray.slice(-10);

        let aiResponse = "";
        let usedProvider = null;
        let lastError = null;

        const requestMessages = [{
                role: "system",
                content: `You are a helpful assistant. Keep every response under ${maxResponseChars} characters. Be concise, no filler.`,
            },
            ...recentMessages,
        ];

        for (const provider of providers) {
            const model = provider.models?.[0];
            if (!model) continue;
            try {
                aiResponse = await complete(provider, model, requestMessages, maxResponseTokens);
                usedProvider = provider;
                break;
            } catch (err) {
                lastError = err;
                signale.warn(`${provider.id} failed: ${err.message}`);
            }
        }

        if (!usedProvider) {
            const warning = interaction.client.customEmojis.warning;
            const container = [
                new ContainerBuilder().addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        `${warning} **Error talking to the AI**\n-# ${sanitize(lastError?.message || "No providers responded.")}`
                    )
                ),
            ];
            return interaction.editReply({
                components: container,
                flags: MessageFlags.IsComponentsV2,
                allowedMentions: {
                    parse: []
                },
            });
        }

        aiResponse = enforceLength(aiResponse);

        convo.messageArray.push({
            role: "assistant",
            content: aiResponse,
        });
        await convo.save();

        aiResponse = sanitize(aiResponse);

        const container = [
            new ContainerBuilder().addTextDisplayComponents(new TextDisplayBuilder().setContent(aiResponse)),
        ];
        return interaction.editReply({
            components: container,
            flags: MessageFlags.IsComponentsV2,
            allowedMentions: {
                parse: []
            },
        });
    },
};