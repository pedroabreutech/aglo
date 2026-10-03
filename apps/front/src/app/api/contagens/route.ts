import { NextResponse } from "next/server";
import { backendError, backendFetch } from "../backendProxy";
import { mapBackendReportListToContagens } from "../contagem/reportMapper";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const query = url.searchParams.toString();
    const path = `/api/v1/reports${query ? `?${query}` : ""}`;
    const { response, payload } = await backendFetch(path);

    if (!response?.ok || !payload?.data) {
      return backendError(
        payload,
        "Falha ao carregar os relatórios.",
        response?.status ?? 500,
      );
    }

    return NextResponse.json(mapBackendReportListToContagens(payload.data));
  } catch (error) {
    console.error("Erro ao buscar relatórios:", error);
    return NextResponse.json(
      { error: "Falha ao buscar os relatórios." },
      { status: 500 },
    );
  }
}
