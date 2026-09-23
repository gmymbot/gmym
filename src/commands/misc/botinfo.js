const {
    SlashCommandBuilder,
    MessageFlags,
    TextDisplayBuilder,
    ContainerBuilder,
    SectionBuilder,
    ThumbnailBuilder
} = require("discord.js");
const {
    formatDuration
} = require("../../utils/formatDuration");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("botinfo")
        .setDescription("Information about give me your money")
        .setIntegrationTypes(0, 1)
        .setContexts(0, 1, 2),
    async execute(interaction) {
        const client = interaction.client;
        const ai = client.customEmojis.ai;

        const totalUsers = client.guilds.cache.reduce((total, guild) => total + guild.memberCount, 0);

        const container = new ContainerBuilder()
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    [
                        `## ${ai} **Bot Information**`,
                        "give me your money is an all-in-one utility bot, featuring both useful and useless features that you can access anywhere.",
                        "",
                    ].join("\n")
                )
            )
            .addSectionComponents(
                new SectionBuilder()
                    .addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(
                            [
                                `> **Servers**: \`${client.guilds.cache.size}\``,
                                `> **Users**: \`${totalUsers}\``,
                                `> **Commands**: \`${client.slashCommands.size}\``,
                                `> **Shards**: \`${client.ws.shards.size}\``,
                                `> **Uptime**: \`${formatDuration(process.uptime())}\``,
                                `> **Ping**: \`${client.ws.ping}ms\``,
                                `> **Memory**: \`${(process.memoryUsage().heapUsed / 1048576).toFixed(1)} MB\``,
                            ].join("\n")
                        )
                    )
                    .setThumbnailAccessory(
                        new ThumbnailBuilder().setURL(client.user.displayAvatarURL({ extension: "png", size: 128 }))
                    )
            );

        return interaction.reply({
            components: [container],
            flags: MessageFlags.IsComponentsV2,
        });
    },
};
