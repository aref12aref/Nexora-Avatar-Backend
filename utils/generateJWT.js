import jwt from "jsonwebtoken";

export const generateAccessToken = async (payload) => {
    const token = await jwt.sign(payload, process.env.jwt_secret_key, {
        expiresIn: "5m",
    });
    return token;
};

export const generateRefreshToken = async (payload) => {
    const token = await jwt.sign(payload, process.env.jwt_secret_refresh_key, {
        expiresIn: "1y",
    });
    return token;
};
