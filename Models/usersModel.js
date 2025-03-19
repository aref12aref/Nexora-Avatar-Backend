import mongoose from "mongoose";
import { userRoles } from "../utils/userRols.js";

const UsersSchema = mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
    },
    role: {
        type: String,
        enum: [userRoles.ADMIN, userRoles.USER],
        default: userRoles.USER,
    },
    achievments: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Achievment",
        },
    ],
    token: {
        type: String,
        unique: true,
    },
    refreshToken: {
        type: String,
        unique: true,
    },
});

export const User = mongoose.model("User", UsersSchema);
