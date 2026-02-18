import { z } from "zod";
import CustomError from "../lib/errors.js";

export const validate =
  (schema, target = "body") =>
  (req, _res, next) => {
    try {
      const data = req[target];
      schema.parse(data);
      next();
    } catch (err) {
      if (err instanceof z.ZodError) {
        const message = err.issues.map((issue) => issue.message).join(", ");
        next(new CustomError(message, 400));
      } else {
        next(new CustomError("Invalid request data", 400));
      }
    }
  };
