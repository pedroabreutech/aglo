/**
 * Dispara o download via rota BFF (evita CORS de signed URLs no browser).
 */
export async function downloadReportMedia(params: {
  analysisId: string;
  kind?: "processed";
}): Promise<void> {
  const kind = params.kind ?? "processed";
  const url = `/api/contagem/media?analysisId=${encodeURIComponent(params.analysisId)}&kind=${kind}`;
  const response = await fetch(url, { cache: "no-store" });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as {
      error?: string;
    } | null;
    throw new Error(payload?.error || "Não foi possível baixar a imagem.");
  }

  const blob = await response.blob();
  const disposition = response.headers.get("Content-Disposition") || "";
  const matched = /filename="([^"]+)"/.exec(disposition);
  const filename = matched?.[1] || "relatorio-processada.jpg";

  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = filename;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
}

export function buildMediaFilename(
  eventName: string,
  contentType?: string | null,
): string {
  const base =
    (eventName || "relatorio")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9-_]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80)
      .toLowerCase() || "relatorio";

  return `${base}-processada.${extensionFromContentType(contentType)}`;
}

function extensionFromContentType(contentType?: string | null): string {
  if (!contentType) return "jpg";
  if (contentType.includes("png")) return "png";
  if (contentType.includes("webp")) return "webp";
  if (contentType.includes("jpeg") || contentType.includes("jpg")) return "jpg";
  return "jpg";
}
