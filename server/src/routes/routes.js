import express from "express";
import profileRouter from "../models/profile/profile.routes.js";

export const router = express.Router();

router.use("/profile", profileRouter);
