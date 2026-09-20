const {
    Events,
    ActivityType
} = require("discord.js");
const loadEmojis = require("../handlers/emojiHandler");
const {
    trackPings
} = require("../utils/pingTracker");
const deployCommands = require("../utils/deployCommands");
const {
    refreshProviders
} = require("../utils/aiProviders");

module.exports = {
    name: Events.ClientReady,
    once: true,
    async execute(client) {
        await loadEmojis(client);
        trackPings(client);
        await Promise.all([deployCommands(client), refreshProviders(client)]);
        setInterval(() => refreshProviders(client), 24 * 60 * 60 * 1000);

        client.user.setPresence({
            activities: [{
                name: "your money",
                type: ActivityType.Watching
            }],
            status: "online",
        });
    },
};