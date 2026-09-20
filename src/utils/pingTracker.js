async function recordPing(client) {
    const wsPing = client.ws.ping;

    let restPing = 0;
    try {
        const start = Date.now();
        await client.rest.get("/users/@me");
        restPing = Date.now() - start;
    } catch {}

    let dbPing = 0;
    try {
        const start = Date.now();
        await client.db.command({
            ping: 1
        });
        dbPing = Date.now() - start;
    } catch {}

    const now = Date.now();
    client.pingHistory.push({
        ws: wsPing,
        rest: restPing,
        db: dbPing,
        timestamp: now
    });

    const threeHoursAgo = now - 3 * 60 * 60 * 1000;
    client.pingHistory = client.pingHistory.filter((e) => e.timestamp > threeHoursAgo);
}

async function trackPings(client) {
    await recordPing(client);
    setInterval(() => recordPing(client), 60 * 1000);
}

module.exports = {
    trackPings,
    recordPing
};