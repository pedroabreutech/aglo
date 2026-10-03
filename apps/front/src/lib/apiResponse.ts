type ValidationIssue = { path: string; message: string };

export function getValidationIssues(payload: unknown): ValidationIssue[] {
  if (!payload || typeof payload !== "object") return [];
  const body = payload as Record<string, unknown>;
  const issues = Array.isArray(body.issues) ? body.issues : body.error;
  if (!Array.isArray(issues)) return [];

  return issues
    .filter(
      (issue): issue is ValidationIssue =>
        issue !== null &&
        typeof issue === "object" &&
        typeof issue.path === "string" &&
        typeof issue.message === "string",
    )
    .map(({ path, message }) => ({ path, message }));
}

function validationMessage(issue: ValidationIssue): string {
  if (issue.path === "countingMethod") {
    return "O modo de contagem selecionado não é aceito pelo servidor.";
  }
  if (issue.path === "threshold") {
    return "A confiança da detecção deve ficar entre 5% e 95%.";
  }
  return issue.path ? `${issue.path}: ${issue.message}` : issue.message;
}

export function formatApiError(
  payload: unknown,
  fallback: string,
  status: number,
): string {
  const issues = getValidationIssues(payload);
  if (status === 400 && issues.length > 0) {
    return [...new Set(issues.map(validationMessage))].join(" ");
  }

  if (payload && typeof payload === "object") {
    const body = payload as Record<string, unknown>;
    const message = [body.error, body.message].find(
      (value) => typeof value === "string" && value.trim(),
    );
    if (message === "Validation error") {
      return "Os dados enviados não foram aceitos. Confira o modo de contagem e o limiar de detecção.";
    }
    if (typeof message === "string") return message;
  }

  if ([502, 503, 504].includes(status)) {
    return `${fallback} Falha na comunicação com o serviço (HTTP ${status}). Tente novamente em instantes.`;
  }

  return `${fallback} (HTTP ${status}).`;
}

/** Proxies podem devolver HTML ou um corpo vazio no lugar do JSON da API. */
export async function readApiError(
  response: Response,
  fallback: string,
): Promise<string> {
  const payload: unknown = await response.json().catch(() => null);
  return formatApiError(payload, fallback, response.status);
}

export async function readApiResponse<T>(
  response: Response,
  fallback: string,
): Promise<T> {
  if (!response.ok) {
    throw new Error(await readApiError(response, fallback));
  }

  const payload: unknown = await response.json().catch(() => null);
  if (payload === null) {
    throw new Error(`${fallback} O servidor retornou uma resposta inválida.`);
  }

  return payload as T;
}
