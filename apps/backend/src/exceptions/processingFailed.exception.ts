import { HttpStatus } from "../utils/httpStatus";
import { GlobalErrorException } from "./globalError.exception";

export class ProcessingFailedException extends GlobalErrorException {
  constructor(message: string = "Processing failed") {
    // 500 e nao 502: o Cloudflare troca o corpo de 502/504 por HTML e esconde a mensagem.
    super(message, HttpStatus.INTERNAL_SERVER_ERROR);
  }
}
