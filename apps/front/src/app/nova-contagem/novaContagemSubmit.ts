type UpdateExistingInput = {
  id: string;
  eventName: string;
  eventDate: string;
  eventType: string;
  address: string;
};

type CreateReportInput = {
  eventName: string;
  eventDate: string;
  eventType: string;
  address: string;
  imageName: string;
  imageBase64: string;
};

export function formatEventDate(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  let formatted = "";

  if (digits.length >= 1) formatted += digits.slice(0, 2);
  if (digits.length >= 3) {
    formatted += "/" + digits.slice(2, 4);
  } else if (digits.length > 2) {
    formatted += "/" + digits.slice(2);
  }
  if (digits.length >= 5) {
    formatted += "/" + digits.slice(4, 8);
  } else if (digits.length > 4) {
    formatted += "/" + digits.slice(4);
  }

  return formatted;
}

export function toIsoEventDate(value: string) {
  const normalized = value.replace(/\s/g, "");
  const match = normalized.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);

  if (!match) return null;

  const [, day, month, year] = match;
  const date = new Date(`${year}-${month}-${day}T00:00:00.000Z`);
  const isValid =
    date.getUTCFullYear() === Number(year) &&
    date.getUTCMonth() + 1 === Number(month) &&
    date.getUTCDate() === Number(day);

  return isValid ? `${year}-${month}-${day}` : null;
}

export function fromIsoEventDate(value?: string | null) {
  if (!value) return "";

  const match = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})(?:T.*)?$/);
  if (!match) return value;

  const [, year, month, day] = match;
  const date = new Date(`${year}-${month}-${day}T00:00:00.000Z`);
  const isValid =
    date.getUTCFullYear() === Number(year) &&
    date.getUTCMonth() + 1 === Number(month) &&
    date.getUTCDate() === Number(day);

  return isValid ? `${day}/${month}/${year}` : value;
}

export function redirectAfterSave(
  push: (href: string) => void,
  id: string,
  finalizada: boolean,
) {
  setTimeout(() => {
    push(
      finalizada
        ? `/relatorios/${id}`
        : `/nova-contagem/analise?analysisId=${id}`,
    );
  }, 900);
}

export async function updateExisting({
  id,
  eventName,
  eventDate,
  eventType,
  address,
}: UpdateExistingInput) {
  const isoEventDate = toIsoEventDate(eventDate);

  if (!isoEventDate) {
    throw new Error("Informe uma data válida no formato dd/mm/aaaa.");
  }

  const response = await fetch(`/api/contagem?analysisId=${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      eventName: eventName.trim(),
      eventDate: isoEventDate,
      eventType,
      location: { address: address.trim() },
    }),
  });

  if (!response.ok) {
    const payload = await response.json();
    throw new Error(payload?.error || "Falha ao atualizar o cadastro.");
  }
}

export async function createReport({
  eventName,
  eventDate,
  eventType,
  address,
  imageName,
  imageBase64,
}: CreateReportInput) {
  const isoEventDate = toIsoEventDate(eventDate);

  if (!isoEventDate) {
    throw new Error("Informe uma data válida no formato dd/mm/aaaa.");
  }

  const response = await fetch("/api/contagem", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      eventName: eventName.trim(),
      eventDate: isoEventDate,
      eventType,
      location: { address: address.trim() },
      imageName,
      imageBase64,
    }),
  });

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload?.error || "Falha ao salvar os dados.");
  }

  return payload as { id: string };
}
