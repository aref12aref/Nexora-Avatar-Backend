//modules
import express from "express";
//controlers
import * as aiControlers from "../Controllers/aiControlers.js";
// middlewares
import { verifyToken } from "../middlewares/verifyToken.js";
import { verifyRefreshToken } from "../middlewares/verifyRefreshToken.js";
//utils
import { allowedTo } from "../middlewares/allowedTo.js";
import { userRoles } from "../utils/userRols.js";

//routes
const router = express.Router();

router
    .route("/command")
    .get(verifyToken, verifyRefreshToken, aiControlers.getAllCommands)
    .post(
        verifyToken,
        verifyRefreshToken,
        allowedTo(userRoles.ADMIN),
        aiControlers.createCommand
    );

router
    .route("/command/:activity")
    .get(verifyToken, verifyRefreshToken, aiControlers.getCommand)
    .patch(
        verifyToken,
        verifyRefreshToken,
        allowedTo(userRoles.ADMIN),
        aiControlers.editCommand
    )
    .delete(
        verifyToken,
        verifyRefreshToken,
        allowedTo(userRoles.ADMIN),
        aiControlers.deleteCommand
    );

router
    .route("/check/time")
    .get(verifyToken, verifyRefreshToken, aiControlers.checkTimeExpiring);

router
    .route("/chat")
    .post(
        verifyToken,
        verifyRefreshToken,
        aiControlers.chat
    );

export const aiRouter = router;
