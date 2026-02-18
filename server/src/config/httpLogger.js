import pinoHttp from "pino-http";
import { logger } from "./logger.js";

export const httpLogger = pinoHttp({
  logger,
  /* eslint-disable no-unused-vars */
  customLogLevel: (_res, _err) => "info",
  customSuccessMessage: (req, res) =>
    `${req.method} ${req.url} completed with ${res.statusCode}`,
  serializers: {
    req: (req) => ({ method: req.method, url: req.url }),
    res: (res) => ({ statusCode: res.statusCode })
  }
});
