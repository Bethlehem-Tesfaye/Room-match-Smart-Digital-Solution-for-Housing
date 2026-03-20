import { Router } from "express";
import authMiddleware from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/validate.js";
import { setPasswordForCurrentUser } from "./setting.controllers.js";
import { setPasswordSchema } from "./validation.js";

const settingRouter = Router();

settingRouter.use(authMiddleware);

settingRouter.post(
  "/set-password",
  validate(setPasswordSchema),
  setPasswordForCurrentUser
);

export default settingRouter;
