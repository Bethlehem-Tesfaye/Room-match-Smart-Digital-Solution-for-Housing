import { Router } from "express";
import authMiddleware from "../../middlewares/auth.middleware.js";
import optionalAuthMiddleware from "../../middlewares/optionalAuth.middleware.js";
import { validate } from "../../middlewares/validate.js";
import * as creatorController from "./controllers/creator.controller.js";
import * as browserController from "./controllers/browser.controller.js";
import {
  browsePropertyQuerySchema,
  createPropertySchema,
  propertyParamsSchema,
  saveFavoriteSchema,
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
  "/my-properties",
  authMiddleware,
  creatorController.listMyPropertiesHandler
);
propertyRouter.get(
  "/browser",
  optionalAuthMiddleware,
  validate(browsePropertyQuerySchema, "query"),
  browserController.listBrowserPropertiesHandler
);
propertyRouter.get(
  "/browser/saved-properties",
  authMiddleware,
  validate(browsePropertyQuerySchema, "query"),
  browserController.listSavedPropertiesHandler
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

propertyRouter.get(
  "/browser/:id",
  optionalAuthMiddleware,
  validate(propertyParamsSchema, "params"),
  browserController.getBrowserPropertyDetailsHandler
);

propertyRouter.post(
  "/browser/:id/save-favorite",
  authMiddleware,
  validate(propertyParamsSchema, "params"),
  validate(saveFavoriteSchema),
  browserController.savePropertyToFavoriteHandler
);

propertyRouter.delete(
  "/browser/:id/save-favorite",
  authMiddleware,
  validate(propertyParamsSchema, "params"),
  browserController.removePropertyFromFavoriteHandler
);

export default propertyRouter;
