const fs = require("fs");
const path = require("path");
const signale = require("signale");

const emojisPath = path.join(__dirname, "..", "..", "assets", "emojis");

module.exports = async (client) => {
    const files = fs.readdirSync(emojisPath).filter((f) => f.endsWith(".png"));
    await client.application.emojis.fetch();
    const existing = client.application.emojis.cache;

    client.customEmojis = {};

    for (const file of files) {
        const name = path.parse(file).name;
        const filePath = path.join(emojisPath, file);
        const found = existing.find((e) => e.name === name);

        if (found) {
            client.customEmojis[name] = found;
        } else {
            try {
                const uploaded = await client.application.emojis.create({
                    attachment: filePath,
                    name: name,
                });
                client.customEmojis[name] = uploaded;
            } catch (err) {
                signale.error(`Failed to upload emoji :${name}: ${err.message}`);
            }
        }
    }

    signale.success(`Loaded ${Object.keys(client.customEmojis).length} emojis`);
};