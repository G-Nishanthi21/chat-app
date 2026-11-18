import { io } from "socket.io-client";

const socket = io("https://chat-app-vvw1.onrender.com", {
    autoConnect: false
});

export default socket;