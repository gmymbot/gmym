const {
    SlashCommandBuilder,
    MessageFlags,
    TextDisplayBuilder,
    ContainerBuilder,
    MediaGalleryBuilder,
    MediaGalleryItemBuilder,
} = require("discord.js");
const {
    generatePingChart
} = require("../../utils/pingChart");
const {
    recordPing
} = require("../../utils/pingTracker");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("ping")
        .setDescription("Check the bot's latency")
        .setIntegrationTypes(0, 1)
        .setContexts(0, 1, 2),
    async execute(interaction) {
        const client = interaction.client;
        const latest = client.pingHistory[client.pingHistory.length - 1] || {
            ws: 0,
            rest: 0,
            db: 0
        };

        await interaction.deferReply();
        recordPing(client).catch((err) => signale.error(`Background ping failed: ${err.message}`));
        const chart = await generatePingChart(client.pingHistory);

        const container = [
            new ContainerBuilder()
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `**${interaction.guild?.name || "DMs"}**\n> **WS Ping**: ${latest.ws}ms\n> **REST Ping**: ${latest.rest}ms\n> **Database Status**: Connected (${latest.db}ms)`
                )
            )
            .addMediaGalleryComponents(
                new MediaGalleryBuilder().addItems(
                    new MediaGalleryItemBuilder().setURL("attachment://ping-chart.png")
                )
            ),
        ];

        return interaction.editReply({
            components: container,
            files: [chart],
            flags: MessageFlags.IsComponentsV2,
        });
    },
};