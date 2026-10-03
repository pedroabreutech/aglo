export interface IStorageService {
  upload(params: {
    objectKey: string;
    buffer: Buffer;
    contentType: string;
  }): Promise<void>;
  download(objectKey: string): Promise<Buffer>;
  getSignedReadUrl(objectKey: string): Promise<string>;
  delete(objectKey: string): Promise<void>;
}
