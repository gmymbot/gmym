const {
    SlashCommandBuilder,
    MessageFlags,
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    SeparatorSpacingSize,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    SectionBuilder,
    ThumbnailBuilder,
} = require("discord.js");
const Consent = require("../../models/Consent");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("consent")
        .setDescription("Manage your privacy and consent settings")
        .setIntegrationTypes(0, 1)
        .setContexts(0, 1, 2),
    async execute(interaction) {
        const userId = interaction.user.id;

        let consent = await Consent.findOne({ isChannel: false, id: userId });
        if (!consent) {
            consent = await Consent.create({ isChannel: false, id: userId, aiConversations: true });
        }

        const enabled = !!consent.aiConversations;
        const emoji = enabled ? interaction.client.customEmojis.check : interaction.client.customEmojis.cross;

        const button = new ButtonBuilder()
            .setCustomId(`consent:ai:${userId}`)
            .setLabel("AI Conversations")
            .setStyle(enabled ? ButtonStyle.Success : ButtonStyle.Danger);
        if (emoji) button.setEmoji({ name: emoji.name, id: emoji.id, animated: !!emoji.animated });

        const container = new ContainerBuilder()
            .addSectionComponents(
                new SectionBuilder()
                    .addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(
                            "**give me your money** puts your privacy first. You can customize your privacy settings below to your liking. Disabling an option will destroy any data previously saved. We still record basic telemtary data, command data (ONLY the name of the command you ran), and error data (what command you ran + its payload that caused the error, automatically deletes after 3d of the issue being resolved)."
                        )
                    )
                    .setThumbnailAccessory(
                        new ThumbnailBuilder().setURL(
                            "https://raw.githubusercontent.com/gmymbot/gmym/main/assets/logo.png"
                        )
                    )
            )
            .addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small))
            .addActionRowComponents(new ActionRowBuilder().addComponents(button));

        return interaction.reply({
            components: [container],
            flags: MessageFlags.IsComponentsV2,
        });
    },
    async handleButton(interaction, client, res = null) {
        const customId = interaction.customId || interaction.data?.custom_id || "";
        if (!customId.startsWith("consent:")) return null;
        const parts = customId.split(":");
        if (parts[1] !== "ai") return null;
        const ownerId = parts[2];
        const user = interaction.user || interaction.member?.user || interaction.member?.user;
        if (ownerId !== user?.id) {
            const cross = client.customEmojis.cross;
            if (res) {
                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(
                    JSON.stringify({
                        type: 4,
                        data: {
                            content: `${cross} You do not have permission to interact with this button.`,
                            flags: 64,
                        },
                    })
                );
            } else {
                await interaction.reply({
                    content: `${cross} You do not have permission to interact with this button.`,
                    flags: 64,
                });
            }
            return { handled: true };
        }

        const userId = user.id;
        let consent = await Consent.findOne({ isChannel: false, id: userId });
        if (!consent) {
            consent = await Consent.create({ isChannel: false, id: userId, aiConversations: true });
        }
        consent.aiConversations = !consent.aiConversations;
        await consent.save();
        if (!consent.aiConversations) {
            const AiConvo = require("../../models/AiConvo");
            await AiConvo.deleteOne({ isChannel: false, id: userId });
        }

        const enabled = !!consent.aiConversations;
        const emoji = enabled ? client.customEmojis.check : client.customEmojis.cross;

        const button = new ButtonBuilder()
            .setCustomId(`consent:ai:${userId}`)
            .setLabel("AI Conversations")
            .setStyle(enabled ? ButtonStyle.Success : ButtonStyle.Danger);
        if (emoji) button.setEmoji({ name: emoji.name, id: emoji.id, animated: !!emoji.animated });

        const container = new ContainerBuilder()
            .addSectionComponents(
                new SectionBuilder()
                    .addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(
                            "**give me your money** puts your privacy first. You can customize your privacy settings below to your liking. Disabling an option will destroy any data previously saved. We still record basic telemtary data, command data (ONLY the name of the command you ran), and error data (what command you ran + its payload that caused the error, automatically deletes after 3d of the issue being resolved)."
                        )
                    )
                    .setThumbnailAccessory(
                        new ThumbnailBuilder().setURL(
                            "https://raw.githubusercontent.com/gmymbot/gmym/main/assets/logo.png"
                        )
                    )
            )
            .addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small))
            .addActionRowComponents(new ActionRowBuilder().addComponents(button));

        if (res) {
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(
                JSON.stringify({
                    type: 7,
                    data: {
                        components: [container.toJSON()],
                        flags: 32768,
                    },
                })
            );
        } else {
            await interaction.update({
                components: [container],
                flags: MessageFlags.IsComponentsV2,
            });
        }
        return { handled: true };
    },
};
