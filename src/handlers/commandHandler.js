const fs = require("fs");
const path = require("path");
const signale = require("signale");

function getCommandFiles(dir) {
    const files = [];
    for (const entry of fs.readdirSync(dir, {
            withFileTypes: true
        })) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            files.push(...getCommandFiles(fullPath));
        } else if (entry.name.endsWith(".js")) {
            files.push(fullPath);
        }
    }
    return files;
}

module.exports = (client) => {
    const commandsPath = path.join(__dirname, "..", "commands");
    const commandFiles = getCommandFiles(commandsPath);

    let loaded = 0;

    for (const file of commandFiles) {
        try {
            const command = require(file);
            if (command.data) {
                client.slashCommands.set(command.data.name, command);
            }
            loaded++;
        } catch (err) {
            signale.error(`${path.relative(commandsPath, file)}: ${err.message}`);
        }
    }

    signale.success(`Loaded ${loaded}/${commandFiles.length} commands`);
};