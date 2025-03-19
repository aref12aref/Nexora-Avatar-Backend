//models
import { User } from "../Models/usersModel.js";
import { Activity } from "../Models/activitiesModel.js";
import { Achievment } from "../Models/achievmentsModel.js";
//middlewares
import { asyncWrapper } from "../middlewares/asyncWrapper.js";
//utils
import * as httpResponse from "../utils/httpRespone.js";
import * as generateToken from "../utils/generateJWT.js";

//register
export const register = asyncWrapper(async (req, res) => {
    const { username } = req.body;

    if (!username) {
        return res
            .status(400)
            .json(httpResponse.badResponse(400, "data missing"));
    }

    const oldUser = await User.findOne({ username: username });
    if (oldUser) {
        return res
            .status(400)
            .json(httpResponse.badResponse(400, "user already exists"));
    }

    const activities = await Activity.find({});

    let achievments = [];

    await activities.forEach(async (a) => {
        const achievment = new Achievment({
            title: a.title,
            activity: a.title,
            percent: 0,
            status: false,
        });

        achievments.push(achievment._id);

        await achievment.save();
    });

    let newUser = new User({
        username,
        achievments: achievments,
    });

    const accessToken = await generateToken.generateAccessToken({
        username: newUser.username,
        id: newUser._id,
        role: newUser.role,
    });

    const refreshToken = await generateToken.generateRefreshToken({
        username: newUser.username,
        id: newUser._id,
        role: newUser.role,
    });

    newUser.token = accessToken;
    newUser.refreshToken = refreshToken;

    await newUser.save();

    res.status(201).json(
        httpResponse.goodResponse(201, newUser, "user has been saved")
    );
});

//login
export const login = asyncWrapper(async (req, res) => {
    const { username } = req.body;

    if (!username) {
        return res
            .status(400)
            .json(httpResponse.badResponse(400, "data missing"));
    }

    const oldUser = await User.findOne({ username: username });

    if (!oldUser) {
        return res
            .status(400)
            .json(httpResponse.badResponse(400, "user not exists"));
    }

    const accessToken = await generateToken.generateAccessToken({
        username: oldUser.username,
        id: oldUser._id,
        role: oldUser.role,
    });

    const refreshToken = await generateToken.generateRefreshToken({
        username: oldUser.username,
        id: oldUser._id,
        role: oldUser.role,
    });

    oldUser.token = accessToken;
    oldUser.refreshToken = refreshToken;

    res.status(200).json(
        httpResponse.goodResponse(200, oldUser, "user logged in successfully")
    );
});
