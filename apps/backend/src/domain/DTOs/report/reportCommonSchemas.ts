import { z } from "zod";

export const ReportStatusSchema = z.enum(["ready", "completed", "failed"]);

export const CountingMethodSchema = z.enum([
  "automatic",
  "automatic_conservative",
]);

export const MediaKindSchema = z.enum(["original_image", "processed_image"]);

export const LocationDTOSchema = z.object({
  lat: z.number().min(-90).max(90).optional().openapi({
    description: "Latitude do local do evento",
    example: -23.55052,
  }),
  lng: z.number().min(-180).max(180).optional().openapi({
    description: "Longitude do local do evento",
    example: -46.633308,
  }),
  address: z.string().min(1).optional().openapi({
    description: "Endereco do local do evento",
    example: "Praca da Se, Sao Paulo - SP",
  }),
});
