
const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({

    senderId: {
        type: String,
        required: true
    },

    receiverId: {
        type: String,
        required: true
    },

    message: {
        type: String,
        required: true
    },
     delivered: {
        type: Boolean,
        default: false
    },
    read: {
        type: Boolean,
        default: false
    }

}, { timestamps: true });

const Message = mongoose.model("Message", messageSchema);

module.exports = Message;
