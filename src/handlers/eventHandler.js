const fs = require("fs");
const path = require("path");
const signale = require("signale");

module.exports = (client) => {
    if (!client._eventListeners) client._eventListeners = new Map();

    for (const [event, listeners] of client._eventListeners) {
        for (const {
                fn,
                once
            } of listeners) {
            if (once) client.removeListener(event, fn);
            else client.removeListener(event, fn);
        }
    }
    client._eventListeners.clear();

    const eventsPath = path.join(__dirname, "..", "events");
    const eventFiles = fs.readdirSync(eventsPath).filter((f) => f.endsWith(".js"));

    let loaded = 0;

    for (const file of eventFiles) {
        try {
            const event = require(path.join(eventsPath, file));
            const fn = (...args) => event.execute(...args);

            if (event.once) {
                client.once(event.name, fn);
            } else {
                client.on(event.name, fn);
            }

            if (!client._eventListeners.has(event.name)) client._eventListeners.set(event.name, []);
            client._eventListeners.get(event.name).push({
                fn,
                once: !!event.once,
            });
            loaded++;
        } catch (err) {
            signale.error(`${file}: ${err.message}`);
        }
    }

    signale.success(`Loaded ${loaded}/${eventFiles.length} events`);
};