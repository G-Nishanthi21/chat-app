
const express = require("express");

const router = express.Router();

const { sendMessage,getMessages} = require("../controllers/messageController");

const verifyToken = require("../middleware/verifyToken");

router.post("/send", verifyToken, sendMessage);

router.get("/:receiverId", verifyToken, getMessages);


module.exports = router;
