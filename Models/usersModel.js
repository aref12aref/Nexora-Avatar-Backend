import mongoose from "mongoose";
import validator from "validator";
import { userRoles } from "../utils/userRols.js";

const UsersSchema = mongoose.Schema({
    username: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        validate: [validator.isEmail, "field must be a valid email address"],
    },
    password: {
        type: String,
        required: true,
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
