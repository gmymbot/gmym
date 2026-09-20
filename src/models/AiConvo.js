const {
    Schema,
    model
} = require("mongoose");

const aiConvoSchema = new Schema({
    isChannel: {
        type: Boolean,
        default: false,
    },
    id: {
        type: String,
        required: true,
    },
    messageArray: [{
        role: String,
        content: String,
        _id: false,
    }, ],
    expiresAt: Number,
});

module.exports = model("AiConvo", aiConvoSchema, "ai_convos");