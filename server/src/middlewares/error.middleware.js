import { logger } from "../config/logger.js";

function isErrWithStatus(e) {
  return (
    typeof e === "object" &&
    e !== null &&
    "statusCode" in e &&
    typeof e.statusCode === "number"
  );
}

function extractMessage(e) {
  if (typeof e === "string") return e;

  if (
    typeof e === "object" &&
    e !== null &&
    "message" in e &&
    typeof e.message === "string"
  ) {
    return e.message;
  }

  return "Internal Server Error";
}

export function errorHandler(err, _req, res, _next) {
  const statusCode = isErrWithStatus(err) ? err.statusCode : 500;

  logger.error({ err });

  res.status(statusCode).json({
    message: extractMessage(err),
    stack:
      process.env.NODE_ENV === "development" &&
      err &&
      typeof err === "object" &&
      "stack" in err
        ? err.stack
        : undefined,
  });
}
