
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const http = require("http");
const jwt = require("jsonwebtoken");
const { Server } = require("socket.io");

const connectDB = require("./config/db");
const userRoutes = require("./routes/userRoutes");
const messageRoutes = require("./routes/messageRoutes");
const Message = require("./model/Message");
const User = require("./model/User");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

connectDB();

app.get("/", (req, res) => {
    res.send("Chat Application Backend is Running");
});

app.use("/api/user", userRoutes);
app.use("/api/message", messageRoutes);

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: ["http://localhost:3000",
                "https://chat-app-1-9bsk.onrender.com"],

        methods: ["GET", "POST"]
    }
});

io.use((socket, next) => {
    
    const token = socket.handshake.auth.token;

    if (token) {

        try {

            const decoded = jwt.verify(
                token,
                process.env.JWT_SECRET
            );

            socket.userId = decoded.userId;

            next();

        } catch (error) {

            next(new Error("Invalid token"));

        }

    } else {

        next(new Error("Token not provided"));

    }

});

io.on("connection", (socket) => {

    console.log("User connected:", socket.id);

    socket.on("join", async () => {

        try {

            const userId = socket.userId;

            socket.join(userId);

            await User.findByIdAndUpdate(userId, {
                isOnline: true
            });

            io.emit("userStatus", {
                userId: userId,
                isOnline: true
            });

            const offlineMessages = await Message.find({
                receiverId: userId,
                delivered: false
            }).sort({ createdAt: 1 });

            await Message.updateMany(
                {
                    receiverId: userId,
                    delivered: false
                },
                {
                    delivered: true
                }
            );

            socket.emit("offlineMessages", offlineMessages);

            offlineMessages.forEach((item) => {

                io.to(item.senderId.toString()).emit("messageDelivered", {
                    messageId: item._id.toString()
                });

            });

            console.log("User is Online");
            console.log("Offline messages delivered");

        } catch (error) {

            console.log("Online status update failed:", error);

        }

    });

    socket.on("sendMessage", async (data) => {

        try {

            if (data.message && data.receiverId) {

                const newMessage = new Message({
                    senderId: socket.userId,
                    receiverId: data.receiverId,
                    message: data.message
                });

                await newMessage.save();

                const receiver = await User.findById(data.receiverId);

                if (receiver && receiver.isOnline === true) {

                    newMessage.delivered = true;

                    await newMessage.save();

                    io.to(data.receiverId).emit("receiveMessage", newMessage);

                    socket.emit("messageDelivered", {
                        messageId: newMessage._id.toString()
                    });

                }

                socket.emit("messageSent", newMessage);
            } else {

                socket.emit("messageError", {
                    message: "Message and receiver are required"
                });

            }

        } catch (error) {

            console.log("Message sending failed:", error);

            socket.emit("messageError", {
                message: "Message sending failed"
            });

        }

    });

    socket.on("typing", (data) => {

        io.to(data.receiverId).emit("userTyping", {
            userId: socket.userId,
            isTyping: true
        });

    });

    socket.on("stopTyping", (data) => {

        io.to(data.receiverId).emit("userTyping", {
            userId: socket.userId,
            isTyping: false
        });

    });

    socket.on("markMessagesRead", async (data) => {

        try {

            await Message.updateMany(
                {
                    senderId: data.senderId,
                    receiverId: socket.userId,
                    read: false
                },
                {
                    delivered: true,
                    read: true
                }
            );

            io.to(data.senderId).emit("messagesRead", {
                senderId: socket.userId
            });

            console.log("Messages marked as read");

        } catch (error) {

            console.log("Message read update failed:", error);

        }

    });

  socket.on("disconnect", async () => {
    try {
        const activeSockets = await io.in(socket.userId).fetchSockets();

        if (activeSockets.length === 0) {
            await User.findByIdAndUpdate(socket.userId, {
                isOnline: false
            });

            io.emit("userStatus", {
                userId: socket.userId,
                isOnline: false
            });
        }

        console.log("User disconnected:", socket.id);

    } catch (error) {
        console.log("Offline status update failed:", error);
    }
});

});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {

    console.log("Server is running on port " + PORT);

});
