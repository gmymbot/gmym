require('dotenv').config({
    quiet: true
});
const signale = require("signale");
globalThis.signale = signale;
const {
    version
} = require("../package.json");
const {
    Client,
    GatewayIntentBits,
    Collection
} = require("discord.js");
const mongoose = require("mongoose");
const Sentry = require("@sentry/node");

if (process.env.SENTRY_DSN) {
    Sentry.init({
        dsn: process.env.SENTRY_DSN,
        tracesSampleRate: 1.0,
        profileSessionSampleRate: 1.0,
        integrations: [new Sentry.Integrations.Mongo()],
    });
    signale.info("Sentry initialized");
}

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

signale.info(`give me your money - v${version}`);
signale.info("--------------------------------");

if (!process.env.TOKEN || !process.env.MONGOURI || !process.env.HASH_KEY) {
    signale.error("You are missing 3 of the required variables for the bot to start. Ensure they are set correctly before trying again.");
    process.exit(1);
}

if (process.env.HASH_KEY.length < 16) {
    signale.error("Your hash key is too short. Please re-generate it and ensure it's above 16 characters long.");
    process.exit(1);
}

client.prefixCommands = new Collection();
client.slashCommands = new Collection();

require("./handlers/commandHandler")(client);
require("./handlers/eventHandler")(client);

mongoose.connect(process.env.MONGOURI).then(() => {
    signale.success("Connected to MongoDB");
    client.db = mongoose.connection.db.db(process.env.DB_NAME || "gmym");
    try {
        client.login(process.env.TOKEN);
    } catch (err) {
        Sentry.withScope((scope) => {
            scope.setLevel("error");
            Sentry.captureException(err);
        });
        throw err;
    }
}).catch((err) => {
    signale.error(`MongoDB failed to connect. ${err.message}`);
    process.exit(1);
});