// modules
import axios from "axios";
import moment from "moment";
import { promises as fs } from "fs";
//models
import { Ai } from "../Models/aiModel.js";
import { User } from "../Models/usersModel.js";
import { Achievment } from "../Models/achievmentsModel.js";
//middlewares
import { asyncWrapper } from "../middlewares/asyncWrapper.js";
//utils
import * as httpResponse from "../utils/httpRespone.js";
const AI_API = "https://aibot.alem-mojeeb.online/flaskpy/teacher";
// const AI_API = "https://fd6c-213-139-63-106.ngrok-free.app/flaskpy/teacher";

let chatStartedTime = null;
let chatStartedTimePlus15Min = null;
let startOfChatDay = null;
let sentEndToPython = false;
let user = null;
let currentUserAch = null;
let currentActivity = null;

// helpers functions
async function editAchievment(
    chatSummary,
    activity,
    status,
    achievmentPercentage,
    chatStartedTime
) {
    const userAchs = await User.findById(user._id).populate("achievments");

    let userAchievment = null;
    userAchs.achievments.forEach((a) => {
        if (a.activity === activity) {
            userAchievment = a;
        }
    });

    if (userAchievment !== null) {
        await Achievment.findByIdAndUpdate(userAchievment._id, {
            $set: {
                title: userAchievment.title,
                activity: userAchievment.activity,
                percent: Number(achievmentPercentage),
                status: status,
                chatSummary: chatSummary,
                date: chatStartedTime,
            },
        });
    }
}

async function axiosRequest(data) {
    try {
        const response = await axios.post(`${AI_API}`, data);

        return response.data;
    } catch (e) {
        console.log("Error fetching data from AI: ", e);
        return false;
    }
}

export const getAllCommands = asyncWrapper(async (req, res) => {
    const commands = await Ai.find({}, { __v: false });

    let newToken = null;
    if (req.currentUser.newAccessToken) {
        newToken = req.currentUser.newAccessToken;
    }

    res.status(200).json(
        httpResponse.goodResponse(200, { commands: commands }, "", newToken)
    );
});

export const getCommand = asyncWrapper(async (req, res) => {
    const activity = req.params.activity;

    if (!activity) {
        return res
            .status(400)
            .json(httpResponse.badResponse(400, "Invalid data"));
    }

    const aiCommand = await Ai.findOne({
        activity: activity,
    });

    if (!aiCommand) {
        return res
            .status(400)
            .json(httpResponse.badResponse(400, "Invalid data"));
    }

    let newToken = null;
    if (req.currentUser.newAccessToken) {
        newToken = req.currentUser.newAccessToken;
    }

    res.status(200).json(
        httpResponse.goodResponse(200, { command: aiCommand }, "", newToken)
    );
});

export const editCommand = asyncWrapper(async (req, res) => {
    const {
        educationalUnitTopic,
        activityType,
        ActivityDescription,
        childrenAge,
    } = req.body;
    const activity = req.params.activity;

    if (
        !activity ||
        !educationalUnitTopic ||
        !activityType ||
        !ActivityDescription ||
        !childrenAge
    ) {
        return res
            .status(400)
            .json(httpResponse.badResponse(400, "Invalid data"));
    }

    let oldAiCommand = await Ai.findOne({
        activity: activity,
    });

    if (!oldAiCommand) {
        return res
            .status(400)
            .json(httpResponse.badResponse(400, "Invalid data"));
    }

    const command = `educationalUnitTopic: ${educationalUnitTopic}\n
    activityType: ${activityType}\n
    ActivityDescription: ${ActivityDescription}\n
    childrenAge: ${childrenAge}`;

    const aiCommand = await Ai.findByIdAndUpdate(oldAiCommand._id, {
        $set: {
            activity: activity,
            educationalUnitTopic: educationalUnitTopic,
            activityType: activityType,
            ActivityDescription: ActivityDescription,
            childrenAge: childrenAge,
            command: command,
        },
    });

    let newToken = null;
    if (req.currentUser.newAccessToken) {
        newToken = req.currentUser.newAccessToken;
    }

    res.status(201).json(
        httpResponse.goodResponse(
            201,
            { commandEngineering: aiCommand },
            "command set succesfully",
            newToken
        )
    );
});

export const createCommand = asyncWrapper(async (req, res) => {
    const {
        activity,
        educationalUnitTopic,
        activityType,
        ActivityDescription,
        childrenAge,
    } = req.body;

    if (
        !activity ||
        !educationalUnitTopic ||
        !activityType ||
        !ActivityDescription ||
        !childrenAge
    ) {
        return res
            .status(400)
            .json(httpResponse.badResponse(400, "Invalid data"));
    }

    let oldAiCommand = await Ai.findOne({
        activity: activity,
    });

    if (oldAiCommand) {
        return res
            .status(400)
            .json(httpResponse.badResponse(400, "Invalid data"));
    }

    const command = `موضوع الوحدة التعليمية: ${educationalUnitTopic}\n
    نوع النشاط: ${activityType}\n
    وصف النشاط: ${ActivityDescription}\n
    عمر الاطفال: ${childrenAge}`;

    const newAiCommand = new Ai({
        activity: activity,
        educationalUnitTopic: educationalUnitTopic,
        activityType: activityType,
        ActivityDescription: ActivityDescription,
        childrenAge: childrenAge,
        command: command,
    });

    await newAiCommand.save();

    let newToken = null;
    if (req.currentUser.newAccessToken) {
        newToken = req.currentUser.newAccessToken;
    }

    res.status(201).json(
        httpResponse.goodResponse(
            201,
            { commandEngineering: newAiCommand },
            "",
            newToken
        )
    );
});

export const deleteCommand = asyncWrapper(async (req, res) => {
    const activity = req.params.activity;

    if (!activity) {
        return res
            .status(400)
            .json(httpResponse.badResponse(400, "Invalid data"));
    }

    const aiCommand = await Ai.findOne({
        activity: activity,
    });

    if (!aiCommand) {
        return res
            .status(400)
            .json(httpResponse.badResponse(400, "Invalid data"));
    }

    await Ai.deleteOne({ _id: aiCommand._id });

    let newToken = null;
    if (req.currentUser.newAccessToken) {
        newToken = req.currentUser.newAccessToken;
    }

    res.status(200).json(
        httpResponse.goodResponse(200, aiCommand, "", newToken)
    );
});

export const checkTimeExpiring = asyncWrapper(async (req, res) => {
    if (chatStartedTime !== null) {
        const currentTime = moment();
        if (
            currentTime.isSameOrAfter(
                chatStartedTime.clone().add(15, "minutes")
            )
        ) {
            return res
                .status(200)
                .json(httpResponse.goodResponse(200, { status: false }));
        }
    }

    return res
        .status(200)
        .json(httpResponse.goodResponse(200, { status: true }));
});

export const chat = asyncWrapper(async (req, res) => {
    const audioAsFile = req.body.audio;
    const command = req.body.command;
    const activity = req.body.activity;
    const currentUser = req.currentUser;
    const currentTime = moment();

    if (!activity || !command) {
        return res.status(200).json(
            httpResponse.goodResponse(200, {
                audioMessage: null,
                status: "error",
                percent: Number(currentUserAch ? currentUserAch.percent : 0),
            })
        );
    }

    if (user === null) {
        user = await User.findOne({ username: currentUser.username });
    }

    if (!currentUserAch || !currentActivity || currentActivity !== activity) {
        const userAchs = await User.findById(user._id).populate("achievments");

        userAchs.achievments.forEach((a) => {
            if (a.activity === activity) {
                currentUserAch = a;
            }
        });

        currentActivity = activity;
    }

    if (audioAsFile === null) {
        const startResponse = await axiosRequest({
            user: user.username,
            question: null,
            status: "start",
            command: command,
            achievmentPercentage: JSON.stringify(currentUserAch.percent),
        });

        if (!startResponse) {
            return res.status(200).json(
                httpResponse.goodResponse(200, {
                    audioMessage: null,
                    status: "error",
                    percent: Number(
                        currentUserAch ? currentUserAch.percent : 0
                    ),
                })
            );
        }

        return res.status(200).json(
            httpResponse.goodResponse(200, {
                audioMessage: startResponse.audio,
                status: "ok",
                percent: Number(startResponse.achievmentPercentage),
            })
        );
    }

    if (chatStartedTime === null) {
        chatStartedTime = moment();
        chatStartedTimePlus15Min = chatStartedTime.clone().add(15, "minutes");
        startOfChatDay = chatStartedTime.clone().startOf("day");
        sentEndToPython = false;

        const startResponse = await axiosRequest({
            user: user.username,
            question: null,
            status: "start",
            command: command,
            achievmentPercentage: JSON.stringify(currentUserAch.percent),
        });

        if (!startResponse) {
            return res.status(200).json(
                httpResponse.goodResponse(200, {
                    audioMessage: null,
                    status: "error",
                    percent: Number(
                        currentUserAch ? currentUserAch.percent : 0
                    ),
                })
            );
        }

        return res.status(200).json(
            httpResponse.goodResponse(200, {
                audioMessage: startResponse.audio,
                status: "ok",
                percent: Number(startResponse.achievmentPercentage),
            })
        );
    }

    if (currentTime.isSameOrAfter(chatStartedTimePlus15Min)) {
        if (!sentEndToPython) {
            sentEndToPython = true;

            const endingResponse = await axiosRequest({
                user: user.username,
                question: null,
                status: "end",
                command: command,
                achievmentPercentage: JSON.stringify(currentUserAch.percent),
            });

            if (!endingResponse) {
                return res.status(200).json(
                    httpResponse.goodResponse(200, {
                        audioMessage: null,
                        status: "error",
                        percent: Number(
                            currentUserAch ? currentUserAch.percent : 0
                        ),
                    })
                );
            }

            await editAchievment(
                endingResponse.summary,
                currentActivity,
                endingResponse.status,
                endingResponse.achievmentPercentage,
                chatStartedTime
            );

            return res.status(200).json(
                httpResponse.goodResponse(200, {
                    audioMessage: null,
                    status: "timeout",
                    percent: Number(endingResponse.achievmentPercentage),
                })
            );
        }

        const startOfCurrentDay = moment().startOf("day");
        if (startOfCurrentDay.isAfter(startOfChatDay)) {
            if (audioAsFile !== null) {
                chatStartedTime = moment();
                chatStartedTimePlus15Min = chatStartedTime
                    .clone()
                    .add(15, "minutes");
                startOfChatDay = chatStartedTime.clone().startOf("day");
                sentEndToPython = false;
            }

            const startResponse = await axiosRequest({
                user: user.username,
                question: null,
                status: "start",
                command: command,
                achievmentPercentage: JSON.stringify(currentUserAch.percent),
            });

            if (!startResponse) {
                return res.status(200).json(
                    httpResponse.goodResponse(200, {
                        audioMessage: null,
                        status: "error",
                        percent: Number(
                            currentUserAch ? currentUserAch.percent : 0
                        ),
                    })
                );
            }

            return res.status(200).json(
                httpResponse.goodResponse(200, {
                    audioMessage: startResponse.audio,
                    status: "ok",
                    percent: Number(startResponse.achievmentPercentage),
                })
            );
        } else {
            return res.status(200).json(
                httpResponse.goodResponse(200, {
                    audioMessage: null,
                    status: "timeout",
                    percent: JSON.stringify(currentUserAch.percent),
                })
            );
        }
    }

    const talkResponse = await axiosRequest({
        user: user.username,
        question: audioAsFile,
        status: "talk",
        achievmentPercentage: null,
    });

    if (!talkResponse) {
        return res.status(200).json(
            httpResponse.goodResponse(200, {
                audioMessage: null,
                status: "error",
                percent: Number(currentUserAch ? currentUserAch.percent : 0),
            })
        );
    }

    await editAchievment(
        talkResponse.summary,
        currentActivity,
        talkResponse.status,
        talkResponse.achievmentPercentage,
        chatStartedTime
    );

    return res.status(200).json(
        httpResponse.goodResponse(200, {
            audioMessage: talkResponse.audio,
            status: "ok",
            percent: Number(talkResponse.achievmentPercentage),
        })
    );
});
