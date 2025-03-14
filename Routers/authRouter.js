//modules
import express from "express";
//controlers
import * as authControlers from "../Controllers/authControlers.js";
import { verifyEmail } from "../middlewares/verifyEmail.js";

//routes
const router = express.Router();

router.route("/register").post(verifyEmail, authControlers.register);

router.route("/login").post(authControlers.login);

export const authRouter = router;
