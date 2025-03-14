import mongoose from "mongoose";

const ActivitiesSchema = mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    image: {
        type: String,
    },
    videos: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Video",
        },
    ],
});

export const Activity = mongoose.model("Activity", ActivitiesSchema);
