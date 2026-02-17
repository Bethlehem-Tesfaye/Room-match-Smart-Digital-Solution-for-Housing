import { Router } from "express";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./auth.js";

const authRouter = Router();

authRouter.use("/", toNodeHandler(auth));

export default authRouter;
