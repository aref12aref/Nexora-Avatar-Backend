//modules
import bcrypt from "bcryptjs";
//models
import { User } from "../Models/usersModel.js";
import { Activity } from "../Models/activitiesModel.js";
import { Achievment } from "../Models/achievmentsModel.js";
//middlewares
import { asyncWrapper } from "../middlewares/asyncWrapper.js";
//utils
import * as httpResponse from "../utils/httpRespone.js";
import * as generateToken from "../utils/generateJWT.js";
import { userRoles } from "../utils/userRols.js";

//get all users
export const getAllUsers = asyncWrapper(async (req, res) => {
    const query = req.query;

    const limit = query.limit || 10;
    const page = query.page || 1;
    const skip = (page - 1) * limit;

    const users = await User.find({}, { __v: false })
        .populate("achievments")
        .limit(limit)
        .skip(skip);

    let newToken = null;
    if (req.currentUser.newAccessToken) {
        newToken = req.currentUser.newAccessToken;
    }

    res.status(200).json(httpResponse.goodResponse(200, users, "", newToken));
});

//get one user
export const getOneUser = asyncWrapper(async (req, res) => {
    const userID = req.params.id;
    if (!userID) {
        return res
            .status(400)
            .json(httpResponse.badResponse(400, "Invalid data"));
    }

    const user = await User.findById(userID, { __v: false }).populate(
        "achievments"
    );

    let newToken = null;
    if (req.currentUser.newAccessToken) {
        newToken = req.currentUser.newAccessToken;
    }

    res.status(200).json(
        httpResponse.goodResponse(200, { user }, "", newToken)
    );
});

//create user
export const createUser = asyncWrapper(async (req, res) => {
    const { username, email, password, role } = req.body;

    const oldUser = await User.findOne({ email: email });
    if (oldUser) {
        return res
            .status(400)
            .json(httpResponse.badResponse(400, "user already exists"));
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const activities = await Activity.find({});

    let achievments = [];

    activities.forEach(async (a) => {
        const achievment = new Achievment({
            title: a.title,
            activity: a.title,
            percent: 0,
            status: false,
        });

        await achievment.save();

        achievments.push(achievment._id);
    });

    const newUser = new User({
        username,
        email,
        password: hashedPassword,
        role,
        achievments: achievments,
    });

    const token = await generateToken.generateAccessToken({
        email: newUser.email,
        id: newUser._id,
        role: newUser.role,
    });

    const refreshToken = await generateToken.generateRefreshToken({
        email: newUser.email,
        id: newUser._id,
        role: newUser.role,
    });

    newUser.token = token;
    newUser.refreshToken = refreshToken;

    await newUser.save();

    let newToken = null;
    if (req.currentUser.newAccessToken) {
        newToken = req.currentUser.newAccessToken;
    }

    res.status(201).json(
        httpResponse.goodResponse(201, newUser, "user has been saved", newToken)
    );
});

//delete user
export const deleteUser = asyncWrapper(async (req, res) => {
    const users = req.body.users;

    if (!users) {
        return res
            .status(400)
            .json(httpResponse.badResponse(400, "Invalid data"));
    }

    await users.forEach(async (u) => {
        const user = await User.findById(u).populate("achievments");

        user.achievments.forEach(async (ach) => {
            await Achievment.deleteOne({ _id: ach });
        });

        await User.deleteOne({ _id: u });
    });

    let newToken = null;
    if (req.currentUser.newAccessToken) {
        newToken = req.currentUser.newAccessToken;
    }

    res.status(200).json(
        httpResponse.goodResponse(200, users, "user deleted", newToken)
    );
});

//edit || update user
export const editUser = asyncWrapper(async (req, res) => {
    const userID = req.params.id;

    if (!userID) {
        return res
            .status(400)
            .json(httpResponse.badResponse(400, "Invalid data"));
    }

    let oldUser = await User.findById(userID);

    if (req.body.username) {
        const newUserName = req.body.username;
        if (oldUser.username !== newUserName) {
            oldUser.username = newUserName;
        }
    }

    if (req.body.email) {
        const newEmail = req.body.email;
        if (req.currentUser.email === oldUser.email) {
            oldUser.email = newEmail;
        }
    }

    if (req.body.password) {
        if (req.currentUser.email === oldUser.email) {
            const newPassword = req.body.password;
            const matchedPassord = await bcrypt.compare(
                newPassword,
                oldUser.password
            );
            if (!matchedPassord) {
                const hashedPassword = await bcrypt.hash(newPassword, 10);
                oldUser.password = hashedPassword;
            }
        }
    }

    if (req.body.role) {
        const newRole = req.body.role;

        if (newRole !== oldUser.role) {
            if (req.currentUser.role === userRoles.USER) {
                oldUser.role = newRole;
            } else {
                return res
                    .status(400)
                    .json(
                        httpResponse.badResponse(
                            400,
                            "You Can't Edit Your Role!"
                        )
                    );
            }
        }
    }

    const user = await User.findByIdAndUpdate(userID, {
        $set: {
            username: oldUser.username,
            email: oldUser.email,
            password: oldUser.password,
            role: oldUser.role,
        },
    });

    let newToken = null;
    if (req.currentUser.newAccessToken) {
        newToken = req.currentUser.newAccessToken;
    }

    res.status(200).json(
        httpResponse.goodResponse(201, user, "user updated", newToken)
    );
});
