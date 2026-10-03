import { HttpStatus } from "../utils/httpStatus";
import { GlobalErrorException } from "./globalError.exception";

export class AlreadyExistException extends GlobalErrorException {
  constructor(message: string = "Already Exists") {
    super(message, HttpStatus.CONFLICT);
  }
}
