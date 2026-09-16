const { Schema, model } = require("mongoose");

const schema = new Schema({
    _id: String,
    prefix: { type: String, default: ">" },
});

module.exports = model("Settings", schema, "settings");
