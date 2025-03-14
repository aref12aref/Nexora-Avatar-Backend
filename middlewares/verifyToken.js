import jwt from "jsonwebtoken";
import * as httpResponse from "../utils/httpRespone.js";

export const verifyToken = (req, res, next) => {
    const authHeader =
        req.headers["Authorization"] || req.headers["authorization"];

    if (!authHeader) {
        return res
            .status(401)
            .json(httpResponse.badResponse(401, "Unauthorized"));
    }

    const token = authHeader.split(" ")[1];

    try {
        const currentUser = jwt.verify(token, process.env.jwt_secret_key);
        req.currentUser = currentUser;
        next();
    } catch (err) {
        req.currentUser = "Unauthorized";
        next();
    }
};
