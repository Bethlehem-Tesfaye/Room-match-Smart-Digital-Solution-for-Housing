import { Router } from "express";
import { validate } from "../../middlewares/validate.js";
import * as amenityController from "./controllers/amenity.controller.js";
import { listAmenitiesQuerySchema } from "./validation.js";

const amenityRouter = Router();

amenityRouter.get(
  "/",
  validate(listAmenitiesQuerySchema, "query"),
  amenityController.listAmenitiesHandler
);

export default amenityRouter;
