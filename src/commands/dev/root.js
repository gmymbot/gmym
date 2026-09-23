const {
    SlashCommandBuilder,
    MessageFlags,
    TextDisplayBuilder
} = require("discord.js");
const deployCommands = require("../../utils/deployCommands");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("root")
        .setDescription("redacted")
        .setIntegrationTypes(0, 1)
        .setContexts(0, 1, 2),
    async execute(interaction) {
        const check = interaction.client.customEmojis.check;
        const cross = interaction.client.customEmojis.cross;

        if (interaction.user.id !== "730375236197023785") {
            return interaction.reply({
                content: "https://www.stratus.sbs/assets/img/longcat.gif",
            });
        }

        const deployed = await deployCommands(interaction.client, true);
        const result =
            deployed === null
                ? `${cross} Failed to deploy commands, check the logs.`
                : `${check} Redeployed ${deployed} commands.`;

        const container = [
            new TextDisplayBuilder()
                .setContent(result)
        ];

        return interaction.reply({
            components: container,
            flags: MessageFlags.IsComponentsV2,
        });
    },
};
