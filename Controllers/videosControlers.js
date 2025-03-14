// modules
import fs from "fs";
// models
import { Video } from "../Models/videosModel.js";
import { Activity } from "../Models/activitiesModel.js";
import { Ai } from "../Models/aiModel.js";
import { User } from "../Models/usersModel.js";
import { Achievment } from "../Models/achievmentsModel.js";
//middlewares
import { asyncWrapper } from "../middlewares/asyncWrapper.js";
// utils
import * as httpResponse from "../utils/httpRespone.js";

// videos controllers
export const getVideo = asyncWrapper(async (req, res) => {
    const videoID = req.params.id;

    if (!videoID) {
        return res
            .status(400)
            .json(httpResponse.badResponse(400, "Invalid data"));
    }

    const video = await Video.findById(videoID, { __v: false }).populate(
        "section"
    );

    if (!video) {
        return res
            .status(400)
            .json(httpResponse.badResponse(400, "Invalid data"));
    }

    res.status(200).json(httpResponse.goodResponse(200, video));
});

export const getVidoes = asyncWrapper(async (req, res) => {
    const query = req.query;

    const limit = query.limit || 10;
    const page = query.page || 1;
    const skip = (page - 1) * limit;

    const videos = await Video.find({}, { __v: false })
        .populate("section")
        .limit(limit)
        .skip(skip);

    res.status(200).json(httpResponse.goodResponse(200, videos));
});

export const uploadVideo = asyncWrapper(async (req, res) => {
    if (!req.body.status) {
        return res
            .status(400)
            .json(httpResponse.badResponse(400, "Invalid data"));
    }

    const newVideo = new Video({
        title: req.body.fileName,
        description: req.body.description,
        section: req.body.videoSection._id,
    });

    await newVideo.save();

    req.body.videoSection.videos = req.body.videoSection.videos.push(
        newVideo._id
    );

    await Activity.findByIdAndUpdate(req.body.videoSection._id, {
        $set: {
            title: req.body.videoSection.title,
            videos: req.body.videoSection.videos,
        },
    });

    let newToken = null;
    if (req.currentUser.newAccessToken) {
        newToken = req.currentUser.newAccessToken;
    }

    res.status(201).json(
        httpResponse.goodResponse(
            201,
            newVideo,
            "video uploaded successfully",
            newToken
        )
    );
});

export const deleteVideo = asyncWrapper(async (req, res) => {
    const videosIDs = req.body.videos;

    if (!videosIDs) {
        return res
            .status(400)
            .json(httpResponse.badResponse(400, "Invalid data"));
    }

    videosIDs.forEach(async (v) => {
        const video = await Video.findById(v);

        if (!video) {
            return res
                .status(400)
                .json(httpResponse.badResponse(400, "Invalid data"));
        }

        fs.unlink(`uploads/videos/${video.section}/${video.title}`);

        let videoSection = await Activity.findOne({
            title: video.section,
        }).populate("videos");

        videoSection.videos = videoSection.videos.filter((s) => {
            return s !== video._id;
        });

        await Activity.findByIdAndUpdate(videoSection._id, {
            $set: {
                videoSection,
            },
        });

        await Video.findByIdAndDelete(v);
    });

    let newToken = null;
    if (req.currentUser.newAccessToken) {
        newToken = req.currentUser.newAccessToken;
    }

    res.status(200).json(
        httpResponse.goodResponse(201, null, "video deleted", newToken)
    );
});

export const updateVideo = asyncWrapper(async (req, res) => {
    const videoID = req.params.id;

    if (!videoID) {
        return res
            .status(400)
            .json(httpResponse.badResponse(400, "Invalid data"));
    }

    const video = await Video.findById(videoID);

    if (!video) {
        return res
            .status(400)
            .json(httpResponse.badResponse(400, "Invalid data"));
    }

    const newFileName = req.body.title;

    const titleIsNew = await Video.findOne({ title: newFileName });

    if (titleIsNew) {
        return res
            .status(400)
            .json(httpResponse.badResponse(400, "Invalid data"));
    }

    const oldFilePath = `uploads/videos/${video.section}/${video.title}`;

    const newFilePath = `uploads/videos/${video.section}/${newFileName}`;

    fs.rename(oldFilePath, newFilePath);

    video.title = newFileName;

    if (req.body.description) {
        video.description = req.body.description;
    }

    await video.save();

    let newToken = null;
    if (req.currentUser.newAccessToken) {
        newToken = req.currentUser.newAccessToken;
    }

    res.status(200).json(
        httpResponse.goodResponse(201, video, "video updated", newToken)
    );
});

// activities controllers
export const getSections = asyncWrapper(async (req, res) => {
    const query = req.query;

    const limit = query.limit || 10;
    const page = query.page || 1;
    const skip = (page - 1) * limit;

    const activities = await Activity.find({}, { __v: false })
        .populate("videos")
        .limit(limit)
        .skip(skip);

    const achievments = await Achievment.find({});

    res.status(200).json(
        httpResponse.goodResponse(200, {
            activities: activities,
            achievments: achievments,
        })
    );
});

export const createSection = asyncWrapper(async (req, res) => {
    const { title, description } = req.body;

    if (!title || !description || !req.body.status) {
        return res
            .status(400)
            .json(httpResponse.badResponse(400, "Invalid data"));
    }

    const oldVideoSection = await Activity.findOne({ title });

    if (oldVideoSection) {
        return res
            .status(400)
            .json(httpResponse.badResponse(400, "Invalid data"));
    }

    const videoSection = new Activity({
        title,
        description,
        image: req.body.fileName,
    });

    await videoSection.save();

    if (!fs.existsSync(`uploads/videos/${req.body.title}`)) {
        fs.mkdirSync(`uploads/videos/${req.body.title}`, { recursive: true });
    }

    const users = await User.find({});

    users.forEach(async (user) => {
        const achievment = new Achievment({
            title: videoSection.title,
            activity: videoSection.title,
            percent: 0,
            status: false,
        });
        achievment.save();
        user.achievments.push(achievment._id);
    });

    let newToken = null;
    if (req.currentUser.newAccessToken) {
        newToken = req.currentUser.newAccessToken;
    }

    res.status(201).json(
        httpResponse.goodResponse(
            201,
            videoSection,
            "video section created successfully",
            newToken
        )
    );
});

export const deleteSection = asyncWrapper(async (req, res) => {
    const sectionIDs = req.body.sections;

    if (!sectionIDs) {
        return res
            .status(400)
            .json(httpResponse.badResponse(400, "Invalid data"));
    }

    sectionIDs.forEach(async (sectionID) => {
        // delete related videos
        const videoSection = await Activity.findById(sectionID).populate(
            "videos"
        );

        if (!videoSection) {
            return res
                .status(400)
                .json(httpResponse.badResponse(400, "Invalid data"));
        }

        videoSection.videos.forEach((v) => {
            fs.unlink(`uploads/videos/${videoSection.title}/${v.title}`);
        });

        videoSection.videos.forEach(async (v) => {
            await Video.findByIdAndDelete(v._id);
        });

        // delete AI command
        const AiCommand = await Ai.find({ activity: videoSection.title });
        if (AiCommand) {
            await Ai.findByIdAndDelete(AiCommand._id);
        }

        // delete activity
        fs.unlink(`uploads/videos/${videoSection.title}`);

        await Activity.findByIdAndDelete(videoSection._id);
    });

    let newToken = null;
    if (req.currentUser.newAccessToken) {
        newToken = req.currentUser.newAccessToken;
    }

    res.status(200).json(
        httpResponse.goodResponse(
            201,
            videoSection,
            "section deleted",
            newToken
        )
    );
});

export const updateSection = asyncWrapper(async (req, res) => {
    const sectionID = req.params.id;
    const { description, title } = req.body.description;

    if (!sectionID || !title || !description) {
        return res
            .status(400)
            .json(httpResponse.badResponse(400, "Invalid data"));
    }

    const videoSection = await Activity.findById(sectionID);

    if (!videoSection) {
        return res
            .status(400)
            .json(httpResponse.badResponse(400, "Invalid data"));
    }

    const titleIsNew = await Activity.findOne({ title: title });

    if (titleIsNew) {
        return res
            .status(400)
            .json(httpResponse.badResponse(400, "Invalid data"));
    }

    const oldFilePath = `uploads/videos/${videoSection.title}`;

    const newFilePath = `uploads/videos/${title}`;

    fs.rename(oldFilePath, newFilePath);

    videoSection.title = newFileName;
    videoSection.description = description;

    await videoSection.save();

    videoSection.videos.forEach(async (v) => {
        let videoTitle = v.title.split("-");
        videoTitle[1] = videoSection.title;
        videoTitle = videoTitle.join("-");
        await Video.findByIdAndUpdate(v._id, {
            $set: {
                title: videoTitle,
                section: videoSection.title,
            },
        });

        fs.rename(`${oldFilePath}/${v.title}`, `${oldFilePath}/${videoTitle}`);
    });

    let newToken = null;
    if (req.currentUser.newAccessToken) {
        newToken = req.currentUser.newAccessToken;
    }

    res.status(200).json(
        httpResponse.goodResponse(
            201,
            videoSection,
            "section updated",
            newToken
        )
    );
});

export const updateAchievments = asyncWrapper(async (req, res) => {
    const activity = req.params.activity;
    const newTitle = req.body.title;

    if (!activity) {
        return res
            .status(400)
            .json(httpResponse.badResponse(400, "Invalid data"));
    }

    const achievments = Achievment.find({ activity: activity });

    achievments.map(async (achiev) => {
        await achiev.findByIdAndUpdate(achiev._id, {
            $set: {
                title: newTitle,
                activity: achiev.activity,
                percent: achiev.percent,
                status: achiev.status,
                chatSummary: achiev.chatSummary,
                date: achiev.date,
            },
        });
    });

    let newToken = null;
    if (req.currentUser.newAccessToken) {
        newToken = req.currentUser.newAccessToken;
    }

    res.status(201).json(
        httpResponse.goodResponse(
            201,
            null,
            "achievments title updated successfully",
            newToken
        )
    );
});
