
const express = require("express");

const router = express.Router();

const { registerUser, loginUser,getUserProfile,getAllUsers } = require("../controllers/userController");
const verifyToken = require("../middleware/verifyToken");

router.post("/register", registerUser);

router.post("/login", loginUser);

router.get("/profile", verifyToken, getUserProfile);

router.get("/all", verifyToken, getAllUsers);



module.exports = router;
