import { Response } from "express";
import { HttpStatus } from "./httpStatus";
import { ApiResponse } from "../domain/DTOs/common/ApiResponse";

export class ResponseHandler {
  static success<T>(
    res: Response,
    data: T,
    statusCode: number = HttpStatus.OK,
    message: string = "Operation completed with success",
  ): Response {
    const response: ApiResponse<T> = {
      success: true,
      message,
      data,
    };

    return res.status(statusCode).json(response);
  }

  static error<T>(
    res: Response,
    data: T,
    statusCode: number = HttpStatus.INTERNAL_SERVER_ERROR,
    error: unknown = null,
    message: string = "Failed process",
  ): Response {
    const response: ApiResponse<T> = {
      success: false,
      message,
      data,
      error,
    };

    return res.status(statusCode).json(response);
  }
}
