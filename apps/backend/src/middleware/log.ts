import { NextFunction, Request, Response } from "express";
import { createLogger } from "../utils/logger";

export const logRequest = (handlerName: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const logger = createLogger(handlerName);
    const xForwardedFor = req.headers["x-forwarded-for"];
    const ip = Array.isArray(xForwardedFor)
      ? xForwardedFor[0]
      : typeof xForwardedFor === "string"
        ? xForwardedFor.split(",")[0].trim()
        : req.socket.remoteAddress || req.ip;

    const auditFields = {
      path: req.originalUrl,
      method: req.method,
      ip,
      userAgent: req.headers["user-agent"],
    };

    logger.info("start", auditFields);

    let finished = false;

    const logSuccessOrFail = () => {
      if (finished) return;
      finished = true;
      const logFields = {
        ...auditFields,
        statusCode: res.statusCode,
      };
      if (res.statusCode >= 400) {
        const err = res.locals.error;
        logger.error("fail", err, logFields);
      } else {
        logger.info("success", logFields);
      }
    };

    res.on("finish", logSuccessOrFail);
    res.on("close", () => {
      if (finished) return;
      finished = true;
      const logFields = {
        ...auditFields,
        statusCode: res.statusCode,
      };
      const err = res.locals.error;
      logger.error("fail", err, logFields);
    });

    try {
      await next();
    } catch (error) {
      if (!finished) {
        finished = true;
        const logFields = {
          ...auditFields,
          statusCode: res.statusCode || 500,
        };
        logger.error("fail", error, logFields);
      }
      throw error;
    }
  };
};
