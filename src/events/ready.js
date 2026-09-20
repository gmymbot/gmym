const {
    Events,
    ActivityType
} = require("discord.js");
const loadEmojis = require("../handlers/emojiHandler");
const {
    trackPings
} = require("../utils/pingTracker");
const deployCommands = require("../utils/deployCommands");

module.exports = {
    name: Events.ClientReady,
    once: true,
    async execute(client) {
        await loadEmojis(client);
        trackPings(client);
        await deployCommands(client);

        client.user.setPresence({
            activities: [{
                name: "your money",
                type: ActivityType.Watching
            }],
            status: "online",
        });
    },
};