//modules
import express from "express";
//controlers
import * as authControlers from "../Controllers/authControlers.js";

//routes
const router = express.Router();

router.route("/register").post(authControlers.register);

router.route("/login").post(authControlers.login);

export const authRouter = router;
