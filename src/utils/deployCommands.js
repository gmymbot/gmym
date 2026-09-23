const {
    REST,
    Routes
} = require("discord.js");
const signale = require("signale");

module.exports = async (client, force = false) => {
    const rest = new REST({
        version: "10"
    }).setToken(process.env.TOKEN);

    try {
        const existing = await rest.get(Routes.applicationCommands(client.user.id));
        const commands = client.slashCommands.map((cmd) => cmd.data.toJSON());

        const existingNames = new Set(existing.map((cmd) => cmd.name));
        const localNames = new Set(commands.map((cmd) => cmd.name));

        const missing = commands.filter((cmd) => !existingNames.has(cmd.name));
        const removed = [...existingNames].filter((name) => !localNames.has(name));

        if (!force && missing.length === 0 && removed.length === 0) {
            return 0;
        }

        await rest.put(Routes.applicationCommands(client.user.id), {
            body: commands,
        });

        return commands.length;
    } catch (err) {
        signale.error(`Failed to deploy commands: ${err.message}`);
        return null;
    }
};