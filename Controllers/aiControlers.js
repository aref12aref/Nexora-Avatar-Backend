// modules
import axios from "axios";
import moment from "moment";
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
let sentEndToPython = false;
let user = null;
let currentUserAch = null;
let currentActivity = null;
let currentCommand = null;

// helpers functions
async function editAchievment(
    chatSummary,
    activity,
    status,
    achievmentPercentage,
    user
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
                date: moment(),
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

    const command = `موضوع الوحدة التعليمية:: ${educationalUnitTopic}\n
    نوع النشاط: ${activityType}\n
    وصف النشاط: ${ActivityDescription}\n
    عمر الاطفال: ${childrenAge}`;

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
        const now = new Date();
        if (now < chatStartedTime + 15 * 60 * 1000) {
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

    const user = await User.findOne({ username: currentUser.username });

    const userAchs = await User.findById(user._id).populate("achievments");

    let currentUserAch = null;
    userAchs.achievments.forEach((a) => {
        if (a.activity === activity) {
            currentUserAch = a;
        }
    });

    // check data
    if (!activity || !command) {
        return res.status(200).json(
            httpResponse.goodResponse(200, {
                audioMessage: null,
                status: "error",
                percent: Number(currentUserAch ? currentUserAch.percent : 0),
            })
        );
    }

    // send start
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

    const now = new Date();

    if (!user.currentSessionStart || user.currentSessionStart === null) {
        user.currentSessionStart = now;
        await user.save();
    }

    if (!user.lastSessionStart || user.lastSessionStart === null) {
        user.lastSessionStart = new Date();
        await user.save();
    }

    const lastSessionStart = new Date(user.lastSessionStart);
    const currentSessionStart = new Date(user.currentSessionStart);

    console.log("===lastSessionStart1===", lastSessionStart);
    console.log("===currentSessionStart1===", currentSessionStart);
    console.log("===different1===", now - currentSessionStart);
    console.log("===now1===", now, "\n");
    // new day
    if (now.getTime() - lastSessionStart.getTime() >= 24 * 60 * 60 * 1000) {
        user.lastSessionStart = now;
        user.currentSessionStart = now;
        await user.save();
        sentEndToPython = false;
    }

    console.log("===lastSessionStart2===", lastSessionStart);
    console.log("===currentSessionStart2===", currentSessionStart);
    console.log("===different2===", now - currentSessionStart);
    console.log("===now2===", now, "\n");

    // can talk (still in 15 min)
    if (now.getTime() <= currentSessionStart.getTime() + 15 * 60 * 1000) {
        const talkResponse = await axiosRequest({
            user: user.username,
            question: audioAsFile,
            status: "talk",
            achievmentPercentage: null,
            command: command,
        });

        if (!talkResponse) {
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
            talkResponse.summary,
            activity,
            talkResponse.status,
            talkResponse.achievmentPercentage,
            user
        );

        return res.status(200).json(
            httpResponse.goodResponse(200, {
                audioMessage: talkResponse.audio,
                status: "ok",
                percent: Number(talkResponse.achievmentPercentage),
            })
        );
    }

    // 15 min completed
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
            activity,
            endingResponse.status,
            endingResponse.achievmentPercentage,
            user
        );
    }

    return res.status(200).json(
        httpResponse.goodResponse(200, {
            audioMessage: null,
            status: "timeout",
            percent: Number(currentUserAch.percent),
        })
    );
});

// export const chat = asyncWrapper(async (req, res) => {
//     const audioAsFile = req.body.audio;
//     const command = req.body.command;
//     const activity = req.body.activity;
//     const currentUser = req.currentUser;

//     // check data
//     if (!activity || !command) {
//         return res.status(200).json(
//             httpResponse.goodResponse(200, {
//                 audioMessage: null,
//                 status: "error",
//                 percent: Number(currentUserAch ? currentUserAch.percent : 0),
//             })
//         );
//     }

//     if (user === null || user.username !== currentUser.username) {
//         user = await User.findOne({ username: currentUser.username });
//     }

//     // set helper variables
//     if (
//         !currentUserAch ||
//         !currentActivity ||
//         currentActivity !== activity ||
//         !currentCommand ||
//         currentCommand !== command
//     ) {
//         const userAchs = await User.findById(user._id).populate("achievments");

//         userAchs.achievments.forEach((a) => {
//             if (a.activity === activity) {
//                 currentUserAch = a;
//             }
//         });

//         currentActivity = activity;
//         currentCommand = command;
//     }

//     // send start
//     if (audioAsFile === null) {
//         const startResponse = await axiosRequest({
//             user: user.username,
//             question: null,
//             status: "start",
//             command: currentCommand,
//             achievmentPercentage: JSON.stringify(currentUserAch.percent),
//         });

//         if (!startResponse) {
//             return res.status(200).json(
//                 httpResponse.goodResponse(200, {
//                     audioMessage: null,
//                     status: "error",
//                     percent: Number(
//                         currentUserAch ? currentUserAch.percent : 0
//                     ),
//                 })
//             );
//         }

//         return res.status(200).json(
//             httpResponse.goodResponse(200, {
//                 audioMessage: startResponse.audio,
//                 status: "ok",
//                 percent: Number(startResponse.achievmentPercentage),
//             })
//         );
//     }

//     const now = new Date();

//     if (chatStartedTime === null) {
//         chatStartedTime = now;
//     }

//     if (!user.lastSessionStart) {
//         user.lastSessionStart = new Date();
//         await user.save();
//     }

//     const lastSessionStart = new Date(user.lastSessionStart);

//     // new day
//     if (now - lastSessionStart >= 24 * 60 * 60 * 1000) {
//         user.lastSessionStart = now;
//         await user.save();
//         sentEndToPython = false;
//     }

//     // can talk (still in 15 min)
//     if (now < chatStartedTime + 15 * 60 * 1000) {
//         const talkResponse = await axiosRequest({
//             user: user.username,
//             question: audioAsFile,
//             status: "talk",
//             achievmentPercentage: null,
//             command: currentCommand,
//         });

//         if (!talkResponse) {
//             return res.status(200).json(
//                 httpResponse.goodResponse(200, {
//                     audioMessage: null,
//                     status: "error",
//                     percent: Number(
//                         currentUserAch ? currentUserAch.percent : 0
//                     ),
//                 })
//             );
//         }

//         await editAchievment(
//             talkResponse.summary,
//             currentActivity,
//             talkResponse.status,
//             talkResponse.achievmentPercentage,
//             chatStartedTime
//         );

//         return res.status(200).json(
//             httpResponse.goodResponse(200, {
//                 audioMessage: talkResponse.audio,
//                 status: "ok",
//                 percent: Number(talkResponse.achievmentPercentage),
//             })
//         );
//     }

//     // 15 min completed
//     if (!sentEndToPython) {
//         sentEndToPython = true;

//         const endingResponse = await axiosRequest({
//             user: user.username,
//             question: null,
//             status: "end",
//             command: currentCommand,
//             achievmentPercentage: JSON.stringify(currentUserAch.percent),
//         });

//         if (!endingResponse) {
//             return res.status(200).json(
//                 httpResponse.goodResponse(200, {
//                     audioMessage: null,
//                     status: "error",
//                     percent: Number(
//                         currentUserAch ? currentUserAch.percent : 0
//                     ),
//                 })
//             );
//         }

//         await User.findByIdAndUpdate;

//         await editAchievment(
//             endingResponse.summary,
//             currentActivity,
//             endingResponse.status,
//             endingResponse.achievmentPercentage,
//             chatStartedTime
//         );
//     }

//     return res.status(200).json(
//         httpResponse.goodResponse(200, {
//             audioMessage: null,
//             status: "timeout",
//             percent: Number(currentUserAch.percent),
//         })
//     );
// });
