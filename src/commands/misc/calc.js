const {
    SlashCommandBuilder,
    MessageFlags,
    TextDisplayBuilder
} = require("discord.js");
const {
    evaluate
} = require("mathjs");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("calc")
        .setDescription("Calculate a math expression")
        .setIntegrationTypes(0, 1)
        .setContexts(0, 1, 2)
        .addStringOption((option) =>
            option.setName("expression").setDescription("The expression to calculate").setRequired(true)
        ),
    async execute(interaction) {
        const expression = interaction.options.getString("expression");

        try {
            const result = evaluate(expression);
            const emoji = interaction.client.customEmojis.calc;
            const container = [new TextDisplayBuilder().setContent(`## ${emoji} **${expression} = ${result}**`)];
            return interaction.reply({
                components: container,
                flags: MessageFlags.IsComponentsV2,
            });
        } catch (error) {
            const warning = interaction.client.customEmojis.warning;
            const container = [
                new TextDisplayBuilder().setContent(`${warning} **Invalid expression**\n-# ${error.message}`),
            ];
            return interaction.reply({
                components: container,
                flags: [MessageFlags.IsComponentsV2, MessageFlags.Ephemeral],
            });
        }
    },
};