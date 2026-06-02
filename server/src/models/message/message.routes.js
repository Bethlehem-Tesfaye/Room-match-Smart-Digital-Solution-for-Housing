import { Router } from "express";
import { sendMessage, fetchMessages } from "./message.controller.js";
import authMiddleware from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/validate.js";
import {
  getMessagesQuerySchema,
  messageParamsSchema,
  sendMessageSchema
} from "./validation.js";

const messageRouter = Router();

messageRouter.post(
  "/",
  authMiddleware,
  validate(sendMessageSchema),
  sendMessage
);

messageRouter.get(
  "/:conversationId",
  authMiddleware,
  validate(messageParamsSchema, "params"),
  validate(getMessagesQuerySchema, "query"),
  fetchMessages
);

export default messageRouter;
