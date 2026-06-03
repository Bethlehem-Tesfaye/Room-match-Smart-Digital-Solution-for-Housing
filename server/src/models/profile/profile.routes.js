import { Router } from "express";
import authMiddleware from "../../middlewares/auth.middleware.js";
import optionalAuthMiddleware from "../../middlewares/optionalAuth.middleware.js";
import { validate } from "../../middlewares/validate.js";
import {
  attachUploadedProfileImage,
  makeUploader,
  normalizeProfileMultipartBody
} from "../../middlewares/upload.middleware.js";
import {
  getAccountStatus,
  getMyProfile,
  requestUnblock,
  setupBankInfo,
  submitSupport,
  updateMyProfile
} from "./profile.controllers.js";
import {
  setupBankSchema,
  submitSupportSchema,
  updateProfileSchema
} from "./validation.js";

const profileRouter = Router();
const uploader = makeUploader();

profileRouter.get("/account-status", optionalAuthMiddleware, getAccountStatus);
profileRouter.post("/request-unblock", optionalAuthMiddleware, requestUnblock);

profileRouter.use(authMiddleware);

profileRouter.get("/", getMyProfile);
profileRouter.post("/support", validate(submitSupportSchema), submitSupport);
profileRouter.post("/setup-bank", validate(setupBankSchema), setupBankInfo);
profileRouter.patch(
  "/",
  uploader.single("profilePicture"),
  normalizeProfileMultipartBody,
  attachUploadedProfileImage,
  validate(updateProfileSchema),
  updateMyProfile
);

export default profileRouter;
