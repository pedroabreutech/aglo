export class GlobalErrorException extends Error {
  public readonly statusCode: number;

  constructor(message: string, statusCode: number = 500) {
    super(message);

    Object.setPrototypeOf(this, new.target.prototype);

    this.statusCode = statusCode;

    Error.captureStackTrace(this, this.constructor);
  }
}
