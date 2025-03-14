import mongoose from "mongoose";
import moment from "moment";

const AchievmentsSchema = mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    activity: {
        type: String,
        required: true,
    },
    percent: {
        type: Number,
        default: 0,
    },
    status: {
        type: Boolean,
    },
    chatSummary: {
        type: String,
    },
    date: {
        type: String,
        set: (v) => moment(v).format("YYYY-MM-DD"),
    },
});

export const Achievment = mongoose.model("Achievment", AchievmentsSchema);
