const fs = require("fs");
const path = require("path");
const signale = require("signale");

module.exports = (client) => {
    const commandsPath = path.join(__dirname, "..", "commands");
    const commandFiles = fs.readdirSync(commandsPath).filter((f) => f.endsWith(".js"));

    let loaded = 0;

    for (const file of commandFiles) {
        try {
            const command = require(path.join(commandsPath, file));
            if (command.prefixData) {
                client.prefixCommands.set(command.prefixData.name, command);
                for (const alias of command.prefixData.aliases || []) {
                    client.prefixCommands.set(alias, command);
                }
            }
            if (command.data) {
                client.slashCommands.set(command.data.name, command);
            }
            loaded++;
        } catch (err) {
            signale.error(`${file}: ${err.message}`);
        }
    }

    signale.success(`Loaded ${loaded}/${commandFiles.length} commands`);
};