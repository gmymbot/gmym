const http = require("http");
const nacl = require("tweetnacl");
const {
    REST,
    Routes,
    InteractionResponseType
} = require("discord.js");
const signale = require("signale");

function parseBody(req) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        req.on("data", (c) => chunks.push(c));
        req.on("end", () => resolve(Buffer.concat(chunks).toString()));
        req.on("error", reject);
    });
}

function verifySignature(publicKey, timestamp, body, signature) {
    return nacl.sign.detached.verify(
        new TextEncoder().encode(timestamp + body),
        Uint8Array.from(Buffer.from(signature, "hex")),
        Uint8Array.from(Buffer.from(publicKey, "hex"))
    );
}

module.exports = (client) => {
    const publicKey = process.env.HTTP_PUBLIC_KEY;
    if (!publicKey) {
        signale.error("HTTP_PUBLIC_KEY is required for HTTP interactions");
        process.exit(1);
    }

    const rest = new REST({
        version: "10"
    }).setToken(process.env.TOKEN);
    client.rest = rest;

    const server = http.createServer(async (req, res) => {
        if (req.method !== "POST") {
            signale.info(`Rejected ${req.method} ${req.url}`);
            res.writeHead(405);
            return res.end("Method Not Allowed");
        }

        const timestamp = req.headers["x-signature-timestamp"];
        const signature = req.headers["x-signature-ed25519"];
        const body = await parseBody(req);

        if (!verifySignature(publicKey, timestamp, body, signature)) {
            signale.error(`Invalid request signature from ${req.socket.remoteAddress}`);
            res.writeHead(401);
            return res.end("Invalid request signature");
        }

        const interaction = JSON.parse(body);

        if (interaction.type === 1) {
            res.writeHead(200, {
                "Content-Type": "application/json"
            });
            return res.end(JSON.stringify({
                type: 1
            }));
        }

        if (interaction.type === 2) {
            res.writeHead(200, {
                "Content-Type": "application/json"
            });

            const command = client.slashCommands.get(interaction.data.name);
            if (!command) {
                return res.end(
                    JSON.stringify({
                        type: 4,
                        data: {
                            content: "Unknown command",
                            flags: 64
                        },
                    })
                );
            }

            const author = interaction.member?.user || interaction.user;
            signale.info(`${author?.username} (${author?.id}) ran /${interaction.data.name}`);

            const replyData = {
                sent: false,
                response: null
            };
            let responded = false;

            const respond = (data) => {
                if (responded) return;
                responded = true;
                res.end(JSON.stringify(data));
            };

            const webhookMessageUrl = Routes.webhookMessage(interaction.application_id, interaction.token, "@original");

            const struct = {
                client,
                user: interaction.member?.user || interaction.user,
                member: interaction.member,
                guild: interaction.guild_id ? client.guilds.cache.get(interaction.guild_id) : null,
                channel: client.channels?.cache?.get(interaction.channel_id),
                options: {
                    getString: (name) => interaction.data.options?.find((o) => o.name === name)?.value,
                    getInteger: (name) => interaction.data.options?.find((o) => o.name === name)?.value,
                    getBoolean: (name) => interaction.data.options?.find((o) => o.name === name)?.value,
                    getSubcommand: () => interaction.data.options?.find((o) => o.type === 1)?.name,
                },
                reply: async (payload) => {
                    replyData.sent = true;
                    replyData.response = {
                        type: InteractionResponseType.ChannelMessageWithSource,
                        data: {
                            content: payload.content,
                            components: payload.components?.map((c) => c.toJSON?.() || c),
                            embeds: payload.embeds?.map((e) => e.toJSON?.() || e),
                            flags: typeof payload.flags === "number" ? payload.flags : undefined,
                        },
                    };
                    respond(replyData.response);
                    return replyData.response;
                },
                deferReply: async () => {
                    replyData.sent = true;
                    replyData.response = {
                        type: InteractionResponseType.DeferredChannelMessageWithSource,
                        data: {},
                    };
                    respond(replyData.response);
                    return replyData.response;
                },
                editReply: async (payload) => {
                    const body = {
                        content: payload.content,
                        components: payload.components?.map((c) => c.toJSON?.() || c),
                        embeds: payload.embeds?.map((e) => e.toJSON?.() || e),
                        flags: payload.flags,
                    };
                    const files = payload.files?.map((f) => ({
                        data: f.attachment,
                        name: f.name
                    }));
                    try {
                        return await rest.patch(webhookMessageUrl, {
                            body,
                            files
                        });
                    } catch (err) {
                        signale.error(
                            err
                        );
                        throw err;
                    }
                },
                followUp: async (payload) => {
                    const webhookRoute = Routes.webhook(interaction.application_id, interaction.token);
                    const files = payload.files?.map((f) => ({
                        data: f.attachment,
                        name: f.name
                    }));
                    return rest.post(webhookRoute, {
                        body: payload,
                        files
                    });
                },
            };

            try {
                await command.execute(struct);
            } catch (err) {
                signale.error(`Error executing /${interaction.data.name}: ${err.message}`);
                respond({
                    type: 4,
                    data: {
                        content: "There was an error while executing this command.",
                        flags: 64
                    },
                });
            }

            respond({
                type: 4,
                data: {
                    content: "There was an error while executing this command.",
                    flags: 64
                },
            });
            return;
        }

        res.writeHead(400);
        res.end("Unknown interaction type");
    });

    const port = process.env.PORT || 9999;
    server.listen(port, async () => {
        signale.success(`HTTP interactions listening on port ${port}`);
    });
};