//modules
import express from "express";
import multer from "multer";
import fs from "fs";
// models
import { Activity } from "../Models/activitiesModel.js";
import { Video } from "../Models/videosModel.js";
// controllers
import {
    createSection,
    deleteSection,
    deleteVideo,
    getSections,
    getVideo,
    getVidoes,
    updateSection,
    updateVideo,
    uploadVideo,
    updateAchievments,
} from "../Controllers/videosControlers.js";
//middlewares
import { verifyToken } from "../middlewares/verifyToken.js";
import { verifyRefreshToken } from "../middlewares/verifyRefreshToken.js";
//utils
import { allowedTo } from "../middlewares/allowedTo.js";
import { userRoles } from "../utils/userRols.js";
import { appError } from "../utils/appError.js";

//routes
const router = express.Router();

//recieve videos
const videosDiskStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, `uploads/videos/${req.body.section}`);
    },
    filename: async function (req, file, cb) {
        let videoSection = await Activity.findOne({
            title: req.body.section,
        });
        let video = await Video.findOne({ title: req.body.title });
        if (!videoSection || video) {
            req.body.status = false;
            return cb(appError.create("Invalid Data", 400), false);
        }

        const ext = file.mimetype.split("/")[1];
        const fileName = `${req.body.title}.${ext}`;
        req.body.fileName = fileName;
        req.body.status = true;
        req.body.videoSection = videoSection;
        cb(null, fileName);
    },
});

const videosFileFilter = function (req, file, cb) {
    const videoType = file.mimetype.split("/")[0];
    if (videoType == "video") {
        return cb(null, true);
    } else {
        const error = appError.create("file must be an video", 400);
        return cb(error, false);
    }
};

const videosUpload = multer({
    storage: videosDiskStorage,
    fileFilter: videosFileFilter,
});

// receive images
const imagesDiskStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, `uploads/images/${req.body.title}`);
    },
    filename: async function (req, file, cb) {
        let videoSection = await Activity.findOne({
            title: req.body.title,
        });
        if (videoSection) {
            req.body.status = false;
            return;
        }

        fs.mkdirSync(`uploads/images/${req.body.title}`, { recursive: true });

        const ext = file.mimetype.split("/")[1];
        const fileName = `${req.body.title}.${ext}`;
        req.body.fileName = fileName;
        req.body.status = true;
        cb(null, fileName);
    },
});

const imagesFileFilter = function (req, file, cb) {
    const videoType = file.mimetype.split("/")[0];
    if (videoType == "image") {
        return cb(null, true);
    } else {
        const error = appError.create("file must be an image", 400);
        return cb(error, false);
    }
};

const imagesUpload = multer({
    storage: imagesDiskStorage,
    fileFilter: imagesFileFilter,
});

// routes
router
    .route("/video")
    .get(getVidoes)
    .post(
        verifyToken,
        verifyRefreshToken,
        allowedTo(userRoles.ADMIN),
        videosUpload.single("video"),
        uploadVideo
    );

router.route("/video/delete").post(deleteVideo);

router.route("/video/:id").get(getVideo).patch(updateVideo);

router
    .route("/sections")
    .get(getSections)
    .post(
        verifyToken,
        verifyRefreshToken,
        allowedTo(userRoles.ADMIN),
        imagesUpload.single("image"),
        createSection
    );

router.route("/sections/achievments/:activity").patch(updateAchievments);

router.route("/sections/:id").delete(deleteSection).patch(updateSection);

export const videoRouter = router;
