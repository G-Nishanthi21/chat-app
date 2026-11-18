
const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {

    const token = req.headers.authorization;

    if (token === undefined) {
        return res.status(401).json({
            message: "Token not provided"
        });
    }
    else {

        const actualToken = token.split(" ")[1];

        try {

            const userData = jwt.verify(
                actualToken,
                process.env.JWT_SECRET
            );

            req.userId = userData.userId;

            next();

        }
        catch (error) {

            res.status(401).json({
                message: "Invalid token"
            });

        }
    }
};

module.exports = verifyToken;
