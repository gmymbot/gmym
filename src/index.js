require("dotenv").config({
    quiet: true,
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
    });
    signale.info("Sentry initialized");
}

const client = new Client({
    intents: [GatewayIntentBits.Guilds],
});

signale.info(`give me your money - v${version}`);
signale.info("--------------------------------");

if (!process.env.TOKEN || !process.env.MONGOURI || !process.env.HASH_KEY) {
    signale.error(
        "You are missing 3 of the required variables for the bot to start. Ensure they are set correctly before trying again."
    );
    process.exit(1);
}

if (process.env.HASH_KEY.length < 16) {
    signale.error("Your hash key is too short. Please re-generate it and ensure it's above 16 characters long.");
    process.exit(1);
}

client.slashCommands = new Collection();
client.pingHistory = [];

require("./handlers/commandHandler")(client);
require("./handlers/eventHandler")(client);

mongoose
    .connect(process.env.MONGOURI)
    .then(() => {
        signale.success("Connected to MongoDB");
        client.db = mongoose.connection.db;

        if (process.env.HOST_HTTP_CONNECTIONS === "true" || process.env.HOST_HTTP_CONNECTIONS === "1") {
            require("./http")(client);
            try {
                client.login(process.env.TOKEN);
            } catch (err) {
                Sentry.withScope((scope) => {
                    scope.setLevel("error");
                    Sentry.captureException(err);
                });
                throw err;
            }
        } else {
            try {
                client.login(process.env.TOKEN);
            } catch (err) {
                Sentry.withScope((scope) => {
                    scope.setLevel("error");
                    Sentry.captureException(err);
                });
                throw err;
            }
        }
    })
    .catch((err) => {
        signale.error(`MongoDB failed to connect. ${err.message}`);
        process.exit(1);
    });