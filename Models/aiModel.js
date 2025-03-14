import mongoose from "mongoose";

const AiSchema = mongoose.Schema({
    activity: {
        type: String,
    },
    educationalUnitTopic: {
        type: String,
        required: true,
    },
    activityType: {
        type: String,
        required: true,
    },
    ActivityDescription: {
        type: String,
        required: true,
    },
    childrenAge: {
        type: Number,
        required: true,
    },
    command: {
        type: String,
        required: true,
    },
});

export const Ai = mongoose.model("Ai", AiSchema);
