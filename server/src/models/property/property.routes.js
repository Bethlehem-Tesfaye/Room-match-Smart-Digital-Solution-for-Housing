import { Router } from "express";
import authMiddleware from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/validate.js";
import * as creatorController from "./controllers/creator.controller.js";
import {
  createPropertySchema,
  propertyParamsSchema,
  updatePropertySchema
} from "./validation.js";

const propertyRouter = Router();

propertyRouter.post(
  "/",
  authMiddleware,
  validate(createPropertySchema),
  creatorController.createPropertyHandler
);
propertyRouter.get(
  "/:id",
  authMiddleware,
  validate(propertyParamsSchema, "params"),
  creatorController.getPropertyByIdHandler
);
propertyRouter.patch(
  "/:id",
  authMiddleware,
  validate(propertyParamsSchema, "params"),
  validate(updatePropertySchema),
  creatorController.updatePropertyHandler
);
propertyRouter.delete(
  "/:id",
  authMiddleware,
  validate(propertyParamsSchema, "params"),
  creatorController.deletePropertyHandler
);

export default propertyRouter;
