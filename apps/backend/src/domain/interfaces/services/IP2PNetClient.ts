export interface P2PNetPredictionResult {
  estimatedCount: number;
  annotatedImageBase64?: string;
  rawResponse: unknown;
}

export interface IP2PNetClient {
  predict(params: {
    imageBuffer: Buffer;
    contentType: string;
    threshold: number;
    weightPath: string;
  }): Promise<P2PNetPredictionResult>;
}
