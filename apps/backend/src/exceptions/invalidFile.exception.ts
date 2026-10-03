import { HttpStatus } from "../utils/httpStatus";
import { GlobalErrorException } from "./globalError.exception";

export class InvalidFileException extends GlobalErrorException {
  constructor(message: string = "Invalid file") {
    super(message, HttpStatus.BAD_REQUEST);
  }
}
