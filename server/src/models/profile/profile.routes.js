import { Router } from "express";
import authMiddleware from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/validate.js";
import { getMyProfile, updateMyProfile } from "./profile.controllers.js";
import { updateProfileSchema } from "./validation.js";

const profileRouter = Router();

profileRouter.use(authMiddleware);

profileRouter.get("/", getMyProfile);
profileRouter.patch("/", validate(updateProfileSchema), updateMyProfile);

export default profileRouter;
