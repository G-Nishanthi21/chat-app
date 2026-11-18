
const User = require("../model/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const registerUser = async (req, res) => {
    try {
        const username = req.body.username;
        const email = req.body.email;
        const password = req.body.password;

        if (username === "") {
            return res.status(400).json({
                message: "Username is required"
            });
        }
        else if (email === "") {
            return res.status(400).json({
                message: "Email is required"
            });
        }
        else if (password === "") {
            return res.status(400).json({
                message: "Password is required"
            });
        }

        const existingUser = await User.findOne({
            email: email
        });

        if (existingUser) {
            return res.status(400).json({
                message: "Email already exists"
            });
        }
        else {
            const hashedPassword = await bcrypt.hash(password, 10);

            const newUser = new User({
                username: username,
                email: email,
                password: hashedPassword
            });

            await newUser.save();

            res.status(201).json({
                message: "User registered successfully"
            });
        }
    }
    catch (error) {
        res.status(500).json({
            message: "Registration failed"
        });
    }
};


const loginUser = async (req, res) => {
    try {
        const email = req.body.email;
        const password = req.body.password;

        if (email === "") {
            return res.status(400).json({
                message: "Email is required"
            });
        }
        else if (password === "") {
            return res.status(400).json({
                message: "Password is required"
            });
        }

        const user = await User.findOne({
            email: email
        });

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }
        else {
            const isPasswordCorrect = await bcrypt.compare(
                password,
                user.password
            );

            if (!isPasswordCorrect) {
                return res.status(400).json({
                    message: "Invalid password"
                });
            }
            else {
                const token = jwt.sign(
                    { userId: user._id },
                    process.env.JWT_SECRET,
                    { expiresIn: "1d" }
                );

                res.status(200).json({
                    message: "Login successful",
                    token: token,
                    user: {
                        userId: user._id,
                        username: user.username,
                        email: user.email
                    }
                });
            }
        }
    }
   catch (error) {
    console.log("Login Error:", error);

    res.status(500).json({
        message: "Login failed"
    });
}
};


const getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.userId);

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }
        else {
            res.status(200).json({
                user: {
                    userId: user._id,
                    username: user.username,
                    email: user.email,
                    isOnline: user.isOnline
                }
            });
        }
    }
    catch (error) {
        res.status(500).json({
            message: "Failed to get user profile"
        });
    }
};



const getAllUsers = async (req, res) => {
    try {

        const allUsers = await User.find({
            _id: { $ne: req.userId }
        });

        const users = allUsers.map((user) => ({
            _id: user._id,
            username: user.username,
            email: user.email,
            isOnline: user.isOnline
        }));

        res.status(200).json({
            users: users
        });

    }
    catch (error) {

        res.status(500).json({
            message: "Failed to get users"
        });

    }
};



module.exports = {
    registerUser,
    loginUser,
    getUserProfile,
    getAllUsers
};
