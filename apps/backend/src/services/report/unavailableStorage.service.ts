import { IStorageService } from "../../domain/interfaces/services/IStorageService";
import { GlobalErrorException } from "../../exceptions/globalError.exception";
import { HttpStatus } from "../../utils/httpStatus";

export class UnavailableStorageService implements IStorageService {
  public async upload(): Promise<void> {
    throw this.storageUnavailable();
  }

  public async download(): Promise<Buffer> {
    throw this.storageUnavailable();
  }

  public async getSignedReadUrl(): Promise<string> {
    throw this.storageUnavailable();
  }

  public async delete(): Promise<void> {
    throw this.storageUnavailable();
  }

  private storageUnavailable(): GlobalErrorException {
    return new GlobalErrorException(
      "Storage service is not configured. Configure the S3-compatible Magalu Cloud Object Storage environment variables.",
      HttpStatus.SERVICE_UNAVAILABLE,
    );
  }
}
