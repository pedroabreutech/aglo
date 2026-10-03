import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { GlobalErrorException } from "../exceptions/globalError.exception";
import { ResponseHandler } from "../utils/responseHandler";
import { createLogger } from "../utils/logger";
import { HttpStatus } from "../utils/httpStatus";
import { env } from "../config/env";

const logger = createLogger("errorHandler");

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
) => {
  res.locals.error = err;

  if (err instanceof GlobalErrorException) {
    return ResponseHandler.error(
      res,
      null,
      err.statusCode,
      { code: err.constructor.name, message: err.message },
      err.message,
    );
  }

  if (err instanceof ZodError) {
    const issues = err.issues.map((issue) => ({
      path: issue.path.join("."),
      message: issue.message,
    }));
    return ResponseHandler.error(
      res,
      null,
      HttpStatus.BAD_REQUEST,
      issues,
      "Validation error",
    );
  }

  if (
    err.name === "PayloadTooLargeError" ||
    (err as { type?: string }).type === "entity.too.large" ||
    err.message === "request entity too large"
  ) {
    return ResponseHandler.error(
      res,
      null,
      HttpStatus.PAYLOAD_TOO_LARGE,
      { code: "PayloadTooLargeError" },
      "A imagem é muito grande. Reduza a resolução ou o tamanho do arquivo e tente novamente.",
    );
  }

  logger.error("internal server error", err);

  return ResponseHandler.error(
    res,
    null,
    HttpStatus.INTERNAL_SERVER_ERROR,
    env.app.environment === "development"
      ? { message: err.message, stack: err.stack }
      : null,
    "Internal server error",
  );
};
