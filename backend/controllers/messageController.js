
const Message = require("../model/Message");

const sendMessage = async (req, res) => {
    try {
        const senderId = req.userId;
        const receiverId = req.body.receiverId;
        const message = req.body.message;

        if (receiverId === "") {
            return res.status(400).json({
                message: "Receiver is required"
            });
        }
        else if (message === "") {
            return res.status(400).json({
                message: "Message is required"
            });
        }
        else {
            const newMessage = new Message({
                senderId: senderId,
                receiverId: receiverId,
                message: message
            });

            await newMessage.save();

            res.status(201).json({
                message: "Message sent successfully",
                data: newMessage
            });
        }
    }
    catch (error) {
        res.status(500).json({
            message: "Failed to send message",
            error: error.message
        });
    }
};


const getMessages = async (req, res) => {
    try {
        const senderId = req.userId;
        const receiverId = req.params.receiverId;

        const allMessages = await Message.find();

        const messages = allMessages.filter((item) => {

            if (
                item.senderId.toString() === senderId.toString() &&
                item.receiverId.toString() === receiverId.toString()
            ) {
                return true;
            }
            else if (
                item.senderId.toString() === receiverId.toString() &&
                item.receiverId.toString() === senderId.toString()
            ) {
                return true;
            }
            else {
                return false;
            }

        });

        res.status(200).json({
            messages: messages
        });
    }
    catch (error) {
        res.status(500).json({
            message: "Failed to get messages",
            error: error.message
        });
    }
};


module.exports = {
    sendMessage,
    getMessages
};
