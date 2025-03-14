import { badResponse } from "../utils/httpRespone.js";

export const allowedTo = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.currentUser.role)) {
            return res
                .status(401)
                .json(badResponse(401, "this role is not allowed"));
        }
        next();
    };
};
