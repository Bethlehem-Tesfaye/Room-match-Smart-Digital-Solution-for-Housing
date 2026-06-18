import { Router } from "express";
import authMiddleware from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/validate.js";
import {
  blockUserById,
  getBlockStatusForUser,
  listMyBlockedUsers,
  reportListing,
  reportUser,
  unblockUserById
} from "./scam-report.controller.js";
import { blockUserParamsSchema, submitReportSchema } from "./validation.js";

const scamReportRouter = Router();

scamReportRouter.use(authMiddleware);

scamReportRouter.post(
  "/listings/:propertyId",
  validate(submitReportSchema),
  reportListing
);

scamReportRouter.post(
  "/users/:userId",
  validate(blockUserParamsSchema, "params"),
  validate(submitReportSchema),
  reportUser
);

scamReportRouter.post(
  "/blocks/:userId",
  validate(blockUserParamsSchema, "params"),
  blockUserById
);

scamReportRouter.get("/blocks", listMyBlockedUsers);

scamReportRouter.get(
  "/blocks/:userId/status",
  validate(blockUserParamsSchema, "params"),
  getBlockStatusForUser
);

scamReportRouter.delete(
  "/blocks/:userId",
  validate(blockUserParamsSchema, "params"),
  unblockUserById
);

export default scamReportRouter;
