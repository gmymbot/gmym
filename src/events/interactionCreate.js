const { Events } = require("discord.js");

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        if (process.env.HOST_HTTP_CONNECTIONS === "true" || process.env.HOST_HTTP_CONNECTIONS === "1") return;

        if (interaction.isAutocomplete()) {
            const command = interaction.client.slashCommands.get(interaction.commandName);
            if (!command?.autocomplete) return;
            try {
                await command.autocomplete(interaction);
            } catch (err) {
                signale.error(`Error handling autocomplete for /${interaction.commandName}: ${err.message}`);
            }
            return;
        }

        if (!interaction.isChatInputCommand()) return;

        const command = interaction.client.slashCommands.get(interaction.commandName);
        if (!command) return;

        try {
            await command.execute(interaction);
        } catch (err) {
            signale.error(`Error executing /${interaction.commandName}: ${err.message}`);

            const reply = {
                content: "There was an error while executing this command.",
                flags: 64,
            };

            if (interaction.replied || interaction.deferred) {
                await interaction.followUp(reply);
            } else {
                await interaction.reply(reply);
            }
        }
    },
};