import express from "express";
import profileRouter from "../models/profile/profile.routes.js";
import propertyRouter from "../models/property/property.routes.js";
import amenityRouter from "../models/amenity/amenity.routes.js";
import settingRouter from "../models/setting/setting.routes.js";
import conversationRouter from "../models/conversation/conversation.routes.js";
import messageRouter from "../models/message/message.routes.js";
import notificationRouter from "../models/notification/notification.routes.js";

export const router = express.Router();

router.use("/profile", profileRouter);
router.use("/properties", propertyRouter);
router.use("/amenities", amenityRouter);
router.use("/settings", settingRouter);
router.use("/conversations", conversationRouter);
router.use("/messages", messageRouter);
router.use("/notifications", notificationRouter);
