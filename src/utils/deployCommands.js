const {
    REST,
    Routes
} = require("discord.js");
const signale = require("signale");

module.exports = async (client) => {
    const rest = new REST({
        version: "10"
    }).setToken(process.env.TOKEN);

    try {
        const existing = await rest.get(Routes.applicationCommands(client.user.id));

        if (existing.length > 0) {
            return;
        }

        const commands = client.slashCommands.map((cmd) => cmd.data.toJSON());
        await rest.put(Routes.applicationCommands(client.user.id), {
            body: commands
        });
    } catch (err) {
        signale.error(`Failed to deploy commands: ${err.message}`);
    }
};