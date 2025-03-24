// modules
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import mongoose from "mongoose";
dotenv.config();
// routers
import { authRouter } from "./Routers/authRouter.js";
import { usersRouter } from "./Routers/usersRouter.js";
import { videoRouter } from "./Routers/videosRouter.js";
import { aiRouter } from "./Routers/aiRouter.js";
//utils
import { badResponse } from "./utils/httpRespone.js";

//connect to DataBase
const url = process.env.MONGO_URL;
mongoose
    .connect(url)
    .then(() => console.log("connected to mongoBD server"))
    .catch((err) => console.log("unable to connect to mongoDB server", err));

// build the server
const app = express();
app.use(express.json({ limit: 1000000000 }));
app.use(cors());

const PORT = process.env.PORT || 4000;

// APIs
app.use("/api/auth", authRouter);

app.use("/api/users", usersRouter);

app.use("/api/videos", videoRouter);

app.use("/api/ai", aiRouter);

app.use("/api/uploads", express.static("./uploads"));

//global middle ware for not found routes
app.all("*", (req, res, next) => {
    return res.status(404).json(badResponse(404, "page not found"));
});

//global error handler
app.use((error, req, res, next) => {
    console.log("error: ", error);
    res.status(500).json(badResponse(500, `internal server error! ${error}!`));
});

app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`);
});
