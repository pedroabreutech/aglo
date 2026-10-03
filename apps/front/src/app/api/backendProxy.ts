import { NextResponse } from "next/server";
import { formatApiError, getValidationIssues } from "@/src/lib/apiResponse";

export function getBackendApiBaseUrl(): string {
  const url = (
    process.env.BACKEND_API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    "http://localhost:4000"
  ).replace(/\/$/, "");

  return /^https?:\/\//.test(url) ? url : `https://${url}`;
}

export async function backendFetch(path: string, init: RequestInit = {}) {
  const response = await fetch(`${getBackendApiBaseUrl()}${path}`, {
    ...init,
    headers: {
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...init.headers,
    },
    cache: "no-store",
  });
  const payload = await response.json().catch(() => null);

  return { response, payload };
}

export function backendError(payload: unknown, fallback: string, status: number) {
  const issues = status === 400 ? getValidationIssues(payload) : [];
  // O Cloudflare substitui o corpo de 502/503/504 do origin por uma página HTML
  // própria, escondendo a mensagem real. Repassamos como 500 com JSON.
  const responseStatus = status >= 502 && status <= 504 ? 500 : status;
  return NextResponse.json(
    {
      error: formatApiError(payload, fallback, status),
      ...(issues.length > 0 ? { issues } : {}),
    },
    { status: responseStatus },
  );
}
