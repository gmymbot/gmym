const { Schema, model } = require("mongoose");

const consentSchema = new Schema({
    isChannel: {
        type: Boolean,
        default: false,
    },
    id: {
        type: String,
        required: true,
    },
    aiConversations: {
        type: Boolean,
        default: true,
    },
});

module.exports = model("Consent", consentSchema, "consents");
