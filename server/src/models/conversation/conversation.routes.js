import { Router } from "express";
import * as conversationController from "./conversation.controller.js";
import authMiddleware from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/validate.js";
import {
  conversationParamsSchema,
  initiateConversationSchema
} from "./validation.js";

const conversationRouter = Router();

conversationRouter.post(
  "/initiate",
  authMiddleware,
  validate(initiateConversationSchema),
  conversationController.initiateConversation
);

conversationRouter.get(
  "/",
  authMiddleware,
  conversationController.getConversations
);

conversationRouter.get(
  "/:id/participants",
  authMiddleware,
  validate(conversationParamsSchema, "params"),
  conversationController.getParticipants
);

export default conversationRouter;
