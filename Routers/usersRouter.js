//modules
import express from "express";
//controlers
import * as userControlers from "../Controllers/usersCotrolers.js";
//middlewares
import { verifyToken } from "../middlewares/verifyToken.js";
import { verifyRefreshToken } from "../middlewares/verifyRefreshToken.js";
import { verifyEmail } from "../middlewares/verifyEmail.js";
//utils
import { allowedTo } from "../middlewares/allowedTo.js";
import { userRoles } from "../utils/userRols.js";

//routes
const router = express.Router();

router
    .route("/")
    .get(
        verifyToken,
        verifyRefreshToken,
        allowedTo(userRoles.ADMIN),
        userControlers.getAllUsers
    )
    .post(
        verifyToken,
        verifyRefreshToken,
        allowedTo(userRoles.ADMIN),
        verifyEmail,
        userControlers.createUser
    );

router
    .route("/delete")
    .post(
        verifyToken,
        verifyRefreshToken,
        allowedTo(userRoles.ADMIN),
        userControlers.deleteUser
    );

router
    .route("/:id")
    .get(verifyToken, verifyRefreshToken, userControlers.getOneUser)
    .patch(verifyToken, verifyRefreshToken, userControlers.editUser);

export const usersRouter = router;
