import { z } from "zod";
import { registry } from "../../../config/zod/registry";
import { LocationDTOSchema } from "./reportCommonSchemas";

export const InputCreateReportDTOSchema = z.object({
  eventName: z.string().min(1).openapi({
    description: "Nome do evento",
    example: "Show no estadio",
  }),
  eventDate: z.iso.date().openapi({
    description: "Data do evento em formato ISO 8601 YYYY-MM-DD",
    example: "2026-07-07",
  }),
  eventType: z.string().min(1).openapi({
    description: "Tipo do evento",
    example: "show",
  }),
  location: LocationDTOSchema.openapi({
    description: "Localizacao do evento",
  }),
  imageName: z.string().min(1).openapi({
    description: "Nome original do arquivo de imagem enviado",
    example: "foto.jpg",
  }),
  imageBase64: z.string().min(1).openapi({
    description: "Imagem original em base64, com ou sem data URL",
    example: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ...",
  }),
});

export type InputCreateReportDTO = z.infer<typeof InputCreateReportDTOSchema>;

registry.register("InputCreateReportDTO", InputCreateReportDTOSchema);
