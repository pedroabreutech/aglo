import { NextFunction, Request, Response } from "express";
import { ZodType } from "zod";

export const validate = (schema: ZodType) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = await schema.parseAsync(req.body ?? {});
      req.body = validatedData;
      next();
    } catch (error) {
      next(error);
    }
  };
};
