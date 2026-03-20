import { Router } from "express";
import authMiddleware from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/validate.js";
import {
  attachUploadedProfileImage,
  makeUploader,
  normalizeProfileMultipartBody
} from "../../middlewares/upload.middleware.js";
import { getMyProfile, updateMyProfile } from "./profile.controllers.js";
import { updateProfileSchema } from "./validation.js";

const profileRouter = Router();
const uploader = makeUploader();

profileRouter.use(authMiddleware);

profileRouter.get("/", getMyProfile);
profileRouter.patch(
  "/",
  uploader.single("profilePicture"),
  normalizeProfileMultipartBody,
  attachUploadedProfileImage,
  validate(updateProfileSchema),
  updateMyProfile
);

export default profileRouter;
