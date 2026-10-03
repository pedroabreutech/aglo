import { NextResponse } from "next/server";
import { backendError, backendFetch } from "../backendProxy";
import {
  mapBackendReportListToContagens,
  mapBackendReportToContagem,
} from "./reportMapper";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const analysisId = url.searchParams.get("analysisId");

    if (!analysisId) {
      const query = url.searchParams.toString();
      const { response, payload } = await backendFetch(
        `/api/v1/reports${query ? `?${query}` : ""}`,
      );

      if (!response?.ok || !payload?.data) {
        return backendError(
          payload,
          "Falha ao carregar os relatórios.",
          response?.status ?? 500,
        );
      }

      return NextResponse.json(mapBackendReportListToContagens(payload.data));
    }

    const { response, payload } = await backendFetch(
      `/api/v1/reports/${encodeURIComponent(analysisId)}`,
    );

    if (!response?.ok || !payload?.data) {
      return backendError(payload, "Falha ao carregar a análise.", response?.status ?? 500);
    }

    return NextResponse.json(mapBackendReportToContagem(payload.data));
  } catch (error) {
    console.error("Erro ao buscar contagem:", error);
    return NextResponse.json(
      { error: "Falha ao buscar a contagem." },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { eventName, eventDate, eventType, location, imageName, imageBase64 } =
      body;

    const address = normalizeAddress(location);

    if (
      !eventName ||
      !eventDate ||
      !eventType ||
      !address ||
      !imageName ||
      !imageBase64
    ) {
      return NextResponse.json(
        { error: "Campos obrigatórios não preenchidos." },
        { status: 400 },
      );
    }

    const { response, payload } = await backendFetch(
      "/api/v1/reports",
      {
        method: "POST",
        body: JSON.stringify({
          eventName,
          eventDate,
          eventType,
          location: { address },
          imageName,
          imageBase64,
        }),
      },
    );

    if (!response?.ok || !payload?.data) {
      return backendError(payload, "Falha ao salvar a contagem.", response?.status ?? 500);
    }

    return NextResponse.json(payload.data, { status: 201 });
  } catch (error) {
    console.error("Erro ao salvar contagem:", error);
    const message = error instanceof Error ? error.message : "";
    if (
      message.includes("Unterminated string") ||
      message.includes("Unexpected end of JSON") ||
      message.includes("Unexpected token")
    ) {
      return NextResponse.json(
        {
          error:
            "A imagem é muito grande para o upload. Reduza o arquivo ou tente novamente.",
        },
        { status: 413 },
      );
    }
    return NextResponse.json(
      { error: "Falha ao salvar a contagem." },
      { status: 500 },
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const url = new URL(req.url);
    const analysisId = url.searchParams.get("analysisId");

    if (!analysisId) {
      return NextResponse.json(
        { error: "analysisId é obrigatório para atualização." },
        { status: 400 },
      );
    }

    const body = await req.json();
    const requestBody = buildReportUpdate(body);

    if (!requestBody) {
      return NextResponse.json(
        {
          error:
            "Informe ao menos um campo para atualizar (eventName, eventDate, eventType, location ou countingMethod).",
        },
        { status: 400 },
      );
    }

    const { response, payload } = await backendFetch(
      `/api/v1/reports/${encodeURIComponent(analysisId)}`,
      {
        method: "PATCH",
        body: JSON.stringify(requestBody),
      },
    );

    if (!response?.ok || !payload?.data) {
      return backendError(payload, "Falha ao atualizar a contagem.", response?.status ?? 500);
    }

    return NextResponse.json(payload.data);
  } catch (error) {
    console.error("Erro ao atualizar contagem:", error);
    return NextResponse.json(
      { error: "Falha ao atualizar a contagem." },
      { status: 500 },
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url);
    const analysisId = url.searchParams.get("analysisId");

    if (!analysisId) {
      return NextResponse.json(
        { error: "analysisId é obrigatório para exclusão." },
        { status: 400 },
      );
    }

    const { response, payload } = await backendFetch(
      `/api/v1/reports/${encodeURIComponent(analysisId)}`,
      { method: "DELETE" },
    );

    if (!response?.ok) {
      return backendError(payload, "Falha ao excluir a contagem.", response?.status ?? 500);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao excluir contagem:", error);
    return NextResponse.json(
      { error: "Falha ao excluir a contagem." },
      { status: 500 },
    );
  }
}

function buildReportUpdate(body: any) {
  const updates: Record<string, unknown> = {};

  if (typeof body.eventName === "string" && body.eventName.trim()) {
    updates.eventName = body.eventName.trim();
  }
  if (typeof body.eventDate === "string" && body.eventDate.trim()) {
    updates.eventDate = body.eventDate.trim();
  }
  if (typeof body.eventType === "string" && body.eventType.trim()) {
    updates.eventType = body.eventType.trim();
  }
  if (
    body.countingMethod === "automatic" ||
    body.countingMethod === "automatic_conservative"
  ) {
    updates.countingMethod = body.countingMethod;
  }
  const address = normalizeAddress(body.location);
  if (address) {
    updates.location = { address };
  }

  return Object.keys(updates).length > 0 ? updates : null;
}

function normalizeAddress(location: any): string | null {
  if (typeof location?.address !== "string") return null;
  const address = location.address.trim();
  return address || null;
}
