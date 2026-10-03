import z from "zod";

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  error?: unknown;
}

export const ApiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) => {
  return z.object({
    success: z.boolean().openapi({ example: true }),
    message: z.string().openapi({ example: "Operação realizada com sucesso" }),
    data: dataSchema,
    error: z.any().nullable().optional(),
  });
};
