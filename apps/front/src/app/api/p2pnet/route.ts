import { NextResponse } from "next/server";
import { backendError, backendFetch } from "../backendProxy";
import { mapBackendReportToContagem } from "../contagem/reportMapper";

/** Permite processamento longo (imagens grandes / P2Pnet). */
export const maxDuration = 300;

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const analysisId = url.searchParams.get("analysisId");

    if (!analysisId) {
      return NextResponse.json(
        { error: "analysisId é obrigatório." },
        { status: 400 },
      );
    }

    const { response, payload } = await backendFetch(
      `/api/v1/reports/${encodeURIComponent(analysisId)}/process`,
      { method: "POST", body: "{}" },
    );

    if (!response?.ok || !payload?.data) {
      return backendError(payload, "Falha ao processar a contagem.", response?.status ?? 500);
    }

    return NextResponse.json(mapBackendReportToContagem(payload.data));
  } catch (error) {
    console.error("Erro ao processar contagem:", error);
    return NextResponse.json(
      { error: "Erro interno ao processar a imagem." },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const url = new URL(req.url);
    const analysisId = url.searchParams.get("analysisId");

    if (!analysisId) {
      return NextResponse.json(
        { error: "analysisId é obrigatório." },
        { status: 400 },
      );
    }

    const body = await req.json().catch(() => ({}));

    const { response, payload } = await backendFetch(
      `/api/v1/reports/${encodeURIComponent(analysisId)}/process`,
      {
        method: "POST",
        body: JSON.stringify(body),
      },
    );

    if (!response?.ok || !payload?.data) {
      return backendError(payload, "Falha ao processar a contagem.", response?.status ?? 500);
    }

    return NextResponse.json(mapBackendReportToContagem(payload.data));
  } catch (error) {
    console.error("Erro ao processar contagem:", error);
    return NextResponse.json(
      { error: "Erro interno ao processar a imagem." },
      { status: 500 },
    );
  }
}
