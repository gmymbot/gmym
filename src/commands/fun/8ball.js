const {
    SlashCommandBuilder,
    MessageFlags,
    TextDisplayBuilder,
    ContainerBuilder,
    SeparatorBuilder,
    SeparatorSpacingSize
} = require("discord.js");

const answers = [
    "Yes, obviously.",
    "No, and don't ask again.",
    "Ask me after lunch.",
    "I'd bet money on it.",
    "Not looking good.",
    "Sure, why not.",
    "Absolutely.",
    "Zero chance.",
    "Everything lines up, so yes.",
    "Depends who's asking.",
    "Only if you say please.",
    "Still thinking... okay, yes.",
    "My sources say never.",
    "You already know the answer.",
    "Do it, I dare you.",
    "Don't do it.",
    "Even odds, flip a coin.",
    "Yes, but not today.",
    "No, but you're close.",
    "Maybe. Try once more.",
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName("8ball")
        .setDescription("Ask the 8ball a question")
        .setIntegrationTypes(0, 1)
        .setContexts(0, 1, 2)
        .addStringOption((option) =>
            option.setName("question").setDescription("The question to ask the 8ball").setRequired(true)
        ),
    async execute(interaction) {
        const dot = interaction.client.customEmojis.dot;
        const eightball = interaction.client.customEmojis.eightball;
        const question = interaction.options.getString("question");
        const answer = answers[Math.floor(Math.random() * answers.length)];

        const container = new ContainerBuilder()
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `## ${eightball} **Magic 8-Ball**\n> ${question}\n\n**Answer:** ${answer}`
                )
            )
            .addSeparatorComponents(
                new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
            )
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(`-# ${dot} asked by ${interaction.user.username}`)
            );

        return interaction.reply({
            components: [container],
            flags: MessageFlags.IsComponentsV2,
            allowedMentions: {
                parse: []
            },
        });
    },
};
