import { NextResponse } from "next/server";
import { backendError, backendFetch } from "../../backendProxy";
import { buildMediaFilename } from "@/src/lib/downloadFile";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const analysisId = url.searchParams.get("analysisId");
    const kind = url.searchParams.get("kind") || "processed";

    if (!analysisId) {
      return NextResponse.json(
        { error: "analysisId é obrigatório." },
        { status: 400 },
      );
    }

    if (kind !== "processed") {
      return NextResponse.json(
        { error: "Somente o download da imagem processada é suportado." },
        { status: 400 },
      );
    }

    const { response, payload } = await backendFetch(
      `/api/v1/reports/${encodeURIComponent(analysisId)}`,
    );

    if (!response?.ok || !payload?.data) {
      return backendError(
        payload,
        "Falha ao carregar o relatório.",
        response?.status ?? 500,
      );
    }

    const report = payload.data as {
      eventName?: string;
      media?: {
        processed?: { url?: string; contentType?: string };
      };
    };

    const media = report.media?.processed;

    if (!media?.url) {
      return NextResponse.json(
        { error: "Imagem processada não disponível." },
        { status: 404 },
      );
    }

    const imageResponse = await fetch(media.url, { cache: "no-store" });
    if (!imageResponse.ok) {
      return NextResponse.json(
        { error: "Falha ao baixar a imagem do storage." },
        { status: 502 },
      );
    }

    const contentType =
      media.contentType ||
      imageResponse.headers.get("content-type") ||
      "application/octet-stream";
    const filename = buildMediaFilename(
      report.eventName || "relatorio",
      contentType,
    );

    const bytes = await imageResponse.arrayBuffer();

    return new NextResponse(bytes, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Erro ao baixar mídia do relatório:", error);
    return NextResponse.json(
      { error: "Erro interno ao baixar a imagem." },
      { status: 500 },
    );
  }
}
