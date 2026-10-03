import { HttpStatus } from "../utils/httpStatus";
import { GlobalErrorException } from "./globalError.exception";

export class NotFoundException extends GlobalErrorException {
  constructor(message: string = "Not found") {
    super(message, HttpStatus.NOT_FOUND);
  }
}
