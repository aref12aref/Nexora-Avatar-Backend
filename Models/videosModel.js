import mongoose from "mongoose";

const VideosSchema = mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    section: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Activity",
    },
});

export const Video = mongoose.model("Video", VideosSchema);
