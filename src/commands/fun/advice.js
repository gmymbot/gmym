const {
    SlashCommandBuilder,
    MessageFlags,
    TextDisplayBuilder,
    ContainerBuilder,
    SeparatorBuilder,
    SeparatorSpacingSize
} = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("advice")
        .setDescription("Get a random piece of advice")
        .setIntegrationTypes(0, 1)
        .setContexts(0, 1, 2),
    async execute(interaction) {
        const dot = interaction.client.customEmojis.dot;
        const warning = interaction.client.customEmojis.warning;
        const eightball = interaction.client.customEmojis.eightball;

        let slip = null;
        try {
            const response = await fetch("https://api.adviceslip.com/advice");
            const data = await response.json();
            slip = data.slip;
        } catch (err) {
            signale.warn(`Failed to fetch advice: ${err.message}`);
        }

        if (!slip || !slip.advice) {
            const failure = new ContainerBuilder().addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `## ${warning} **Something went wrong**\nThe advice service is not responding right now. Try again in a moment.`
                )
            );

            return interaction.reply({
                components: [failure],
                flags: [MessageFlags.IsComponentsV2, MessageFlags.Ephemeral],
            });
        }

        const container = new ContainerBuilder()
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(`## ${eightball} **Advice**\n${slip.advice}`)
            )
            .addSeparatorComponents(
                new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
            )
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(`-# ${dot} advice slip #${slip.id}`)
            );

        return interaction.reply({
            components: [container],
            flags: MessageFlags.IsComponentsV2,
        });
    },
};
