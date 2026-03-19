import express from "express";
import profileRouter from "../models/profile/profile.routes.js";
import propertyRouter from "../models/property/property.routes.js";
import amenityRouter from "../models/amenity/amenity.routes.js";

export const router = express.Router();

router.use("/profile", profileRouter);
router.use("/properties", propertyRouter);
router.use("/amenities", amenityRouter);
