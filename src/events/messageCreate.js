const {
  Events
} = require("discord.js");

module.exports = {
  name: Events.MessageCreate,
  async execute(message) {
    if (message.author.bot) return;
    if (!message.guild) return;

    const guild = await message.client.db.collection("settings").findOne({
      _id: message.guild.id
    });
    const prefix = guild?.prefix || ">";

    if (!message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();

    const command = message.client.prefixCommands.get(commandName);
    if (!command) return;

    try {
      command.execute(message, args);
    } catch (err) {
      signale.error(`Error executing command: ${err.message}`);
    }
  },
};