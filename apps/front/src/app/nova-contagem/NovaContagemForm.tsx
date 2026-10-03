"use client";

import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import StepHeader from "@/src/components/stepHeader/stepHeader";
import type { Contagem } from "@/src/types/IContagem";
import RocketSvg from "./image/rocket.svg";
import { NovaContagemFields } from "./NovaContagemFields";
import {
  createReport,
  formatEventDate,
  fromIsoEventDate,
  redirectAfterSave,
  updateExisting,
} from "./novaContagemSubmit";

export function NovaContagemForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const analysisId = searchParams.get("analysisId");
  const isEditMode = Boolean(analysisId);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [eventName, setEventName] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventType, setEventType] = useState("");
  const [address, setAddress] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [existingImagePath, setExistingImagePath] = useState<string | null>(
    null,
  );
  const [isFinalizada, setIsFinalizada] = useState(false);
  const [isLoading, setIsLoading] = useState(isEditMode);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!analysisId) return;

    const loadContagem = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/contagem?analysisId=${encodeURIComponent(analysisId)}`,
          { cache: "no-store" },
        );

        if (!response.ok) {
          const payload = await response.json();
          throw new Error(payload?.error || "Falha ao carregar o cadastro.");
        }

        const data = (await response.json()) as Contagem;
        setEventName(data.eventName ?? "");
        setEventDate(fromIsoEventDate(data.eventDate));
        setEventType(data.eventType ?? "");
        setAddress(data.location?.address ?? "");
        setExistingImagePath(data.imagePath ?? null);
        setIsFinalizada(Boolean(data.finalizada));
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Erro inesperado ao carregar o cadastro.",
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadContagem();
  }, [analysisId]);

  const validateBaseFields = () => {
    if (!eventName.trim()) return "Informe o nome do evento.";
    if (!address.trim()) return "Informe o local do evento.";
    if (!eventDate.trim()) return "Informe a data do evento.";
    if (!eventType) return "Selecione o tipo de evento.";
    if (!isEditMode && !imageFile) {
      return "É necessário fazer upload de uma imagem.";
    }
    return null;
  };

  const handleSave = () => {
    setError(null);
    setMessage(null);

    const validationError = validateBaseFields();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSaving(true);

    if (isEditMode && analysisId) {
      void updateExisting({
        id: analysisId,
        eventName,
        eventDate,
        eventType,
        address,
      })
        .then(() => {
          setMessage("Cadastro atualizado com sucesso!");
          redirectAfterSave(router.push, analysisId, isFinalizada);
        })
        .catch((err) => {
          setError(
            err instanceof Error
              ? err.message
              : "Erro inesperado ao atualizar o cadastro.",
          );
        })
        .finally(() => setIsSaving(false));
      return;
    }

    if (!imageFile) {
      setIsSaving(false);
      setError("É necessário fazer upload de uma imagem.");
      return;
    }

    const reader = new FileReader();

    reader.onload = async () => {
      try {
        const result = await createReport({
          eventName,
          eventDate,
          eventType,
          address,
          imageName: imageFile.name,
          imageBase64: reader.result as string,
        });

        setMessage("Dados salvos com sucesso!");
        redirectAfterSave(router.push, result.id, false);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Erro inesperado ao enviar o formulário.",
        );
      } finally {
        setIsSaving(false);
      }
    };

    reader.onerror = () => {
      setError("Não foi possível ler o arquivo enviado.");
      setIsSaving(false);
    };

    reader.readAsDataURL(imageFile);
  };

  const handleCancel = () => {
    if (isEditMode && analysisId) {
      router.push(
        isFinalizada
          ? `/relatorios/${analysisId}`
          : `/nova-contagem/analise?analysisId=${analysisId}`,
      );
      return;
    }

    router.push("/relatorios");
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 py-[30px] px-[60px]">
        <StepHeader />
        <div className="rounded-xl border border-blue-200 bg-blue-50 px-5 py-4 text-sm text-blue-700">
          Carregando cadastro do evento...
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 py-[30px] px-[60px]">
      <StepHeader />
      <NovaContagemFields
        isEditMode={isEditMode}
        eventName={eventName}
        setEventName={setEventName}
        eventDate={eventDate}
        onEventDateChange={(value) => setEventDate(formatEventDate(value))}
        eventType={eventType}
        setEventType={setEventType}
        address={address}
        setAddress={setAddress}
        imageFile={imageFile}
        setImageFile={setImageFile}
        existingImagePath={existingImagePath}
        fileInputRef={fileInputRef}
      />

      <div className="bg-[#F8FAFC] border-t p-6">
        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}
        {message && (
          <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {message}
          </div>
        )}

        <div className="flex justify-end gap-6">
          <button className="text-sm text-[#64748B]" type="button" onClick={handleCancel}>
            Cancelar
          </button>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-[#137FEC] disabled:cursor-not-allowed disabled:opacity-60 text-white px-8 py-2.5 rounded-lg flex items-center gap-2"
            type="button"
          >
            {isSaving
              ? "Salvando..."
              : isEditMode
                ? "Salvar cadastro"
                : "Criar análise"}
            <Image
              src={RocketSvg}
              alt="Salvar"
              width={12}
              height={12}
              style={{ height: "auto" }}
            />
          </button>
        </div>
      </div>
    </div>
  );
}
