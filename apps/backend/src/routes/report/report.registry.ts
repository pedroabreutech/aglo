import { z } from "zod";
import { registry } from "../../config/zod/registry";
import { ApiResponseSchema } from "../../domain/DTOs/common/ApiResponse";
import { InputCreateReportDTOSchema } from "../../domain/DTOs/report/InputCreateReportDTO";
import { InputListReportsDTOSchema } from "../../domain/DTOs/report/InputListReportsDTO";
import { InputProcessReportDTOSchema } from "../../domain/DTOs/report/InputProcessReportDTO";
import { InputUpdateReportDTOSchema } from "../../domain/DTOs/report/InputUpdateReportDTO";
import { OutputListReportsDTOSchema } from "../../domain/DTOs/report/OutputListReportsDTO";
import { OutputReportDetailDTOSchema } from "../../domain/DTOs/report/OutputReportDetailDTO";
import { OutputReportSummaryDTOSchema } from "../../domain/DTOs/report/OutputReportSummaryDTO";

const V1_PREFIX = "/api/v1/reports";
const REPORT_TAG = ["Reports"];

const ReportIdParamsSchema = z.object({
  id: z.string().uuid().openapi({
    description: "ID do relatorio",
    example: "f7dbf78b-04e7-44f8-bb9a-2c0c49dbe814",
  }),
});

const ReportSummaryResponse = ApiResponseSchema(OutputReportSummaryDTOSchema);
const ReportListResponse = ApiResponseSchema(OutputListReportsDTOSchema);
const ReportDetailResponse = ApiResponseSchema(OutputReportDetailDTOSchema);
const ReportDeleteResponse = ApiResponseSchema(z.boolean());

registry.register("ReportIdParams", ReportIdParamsSchema);
registry.register("ReportSummaryResponse", ReportSummaryResponse);
registry.register("ReportListResponse", ReportListResponse);
registry.register("ReportDetailResponse", ReportDetailResponse);
registry.register("ReportDeleteResponse", ReportDeleteResponse);

registry.registerPath({
  method: "post",
  path: V1_PREFIX,
  summary: "Create report",
  tags: REPORT_TAG,
  request: {
    body: {
      content: {
        "application/json": { schema: InputCreateReportDTOSchema },
      },
    },
  },
  responses: {
    201: response("Report created successfully", ReportSummaryResponse),
    400: { description: "Validation error or invalid image" },
    503: { description: "Storage service is not configured yet" },
  },
});

registry.registerPath({
  method: "get",
  path: V1_PREFIX,
  summary: "List reports",
  tags: REPORT_TAG,
  request: { query: InputListReportsDTOSchema },
  responses: {
    200: response("Reports retrieved successfully", ReportListResponse),
  },
});

registry.registerPath({
  method: "get",
  path: `${V1_PREFIX}/{id}`,
  summary: "Get report by ID",
  tags: REPORT_TAG,
  request: { params: ReportIdParamsSchema },
  responses: {
    200: response("Report retrieved successfully", ReportDetailResponse),
    404: { description: "Report or original image not found" },
    503: { description: "Storage service is not configured yet" },
  },
});

registry.registerPath({
  method: "patch",
  path: `${V1_PREFIX}/{id}`,
  summary: "Update report metadata",
  tags: REPORT_TAG,
  request: {
    params: ReportIdParamsSchema,
    body: {
      content: {
        "application/json": { schema: InputUpdateReportDTOSchema },
      },
    },
  },
  responses: {
    200: response("Report updated successfully", ReportSummaryResponse),
    400: { description: "Validation error or completed report" },
    404: { description: "Report not found" },
  },
});

registry.registerPath({
  method: "delete",
  path: `${V1_PREFIX}/{id}`,
  summary: "Delete report",
  tags: REPORT_TAG,
  request: { params: ReportIdParamsSchema },
  responses: {
    200: response("Report deleted successfully", ReportDeleteResponse),
    404: { description: "Report not found" },
    503: { description: "Storage service is not configured yet" },
  },
});

registry.registerPath({
  method: "post",
  path: `${V1_PREFIX}/{id}/process`,
  summary: "Process report with automatic counting (P2Pnet)",
  tags: REPORT_TAG,
  request: {
    params: ReportIdParamsSchema,
    body: {
      content: {
        "application/json": { schema: InputProcessReportDTOSchema },
      },
    },
  },
  responses: {
    200: response("Report processed successfully", ReportDetailResponse),
    400: { description: "Validation error" },
    404: { description: "Report or original image not found" },
    500: { description: "P2Pnet processing failed" },
    503: { description: "Storage service is not configured yet" },
  },
});

function response(description: string, schema: z.ZodTypeAny) {
  return {
    description,
    content: {
      "application/json": { schema },
    },
  };
}
