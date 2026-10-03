"use client";

import { useState, type MouseEvent } from "react";
import Link from "next/link";
import {
  DownloadCloud,
  Eye,
  FilePen,
  LoaderCircle,
  Pencil,
  RefreshCw,
  Trash2,
} from "lucide-react";
import type { Contagem } from "@/src/types/IContagem";
import { downloadReportMedia } from "@/src/lib/downloadFile";

interface ReportActionsProps {
  item: Contagem;
  finalizada: boolean;
  onClose: () => void;
  onDelete: (id: string) => void;
}

export function ReportActions({
  item,
  finalizada,
  onClose,
  onDelete,
}: ReportActionsProps) {
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const handleDownloadProcessed = async (
    event: MouseEvent<HTMLButtonElement>,
  ) => {
    event.preventDefault();
    event.stopPropagation();
    if (downloading || !finalizada) return;

    setDownloadError(null);
    setDownloading(true);

    try {
      await downloadReportMedia({ analysisId: item.id, kind: "processed" });
      onClose();
    } catch (error) {
      setDownloadError(
        error instanceof Error ? error.message : "Falha ao baixar a imagem.",
      );
    } finally {
      setDownloading(false);
    }
  };

  return (
    <>
      <Link
        href={`/relatorios/${item.id}`}
        className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
        onClick={onClose}
      >
        <Eye size={16} />
        Ver relatório
      </Link>
      <Link
        href={`/nova-contagem?analysisId=${encodeURIComponent(item.id)}`}
        className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
        onClick={onClose}
      >
        <FilePen size={16} />
        Editar cadastro
      </Link>
      <button
        type="button"
        disabled={!finalizada || downloading}
        aria-busy={downloading}
        onClick={handleDownloadProcessed}
        className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 ${
          !finalizada || downloading
            ? "cursor-not-allowed opacity-60"
            : "cursor-pointer hover:bg-slate-50"
        }`}
        title={
          finalizada
            ? "Baixar imagem processada"
            : "Disponível após finalizar a contagem"
        }
      >
        {downloading ? (
          <LoaderCircle size={16} className="animate-spin" />
        ) : (
          <DownloadCloud size={16} />
        )}
        {downloading ? "Baixando processada..." : "Baixar processada"}
      </button>
      {downloadError && (
        <p className="px-3 py-2 text-xs text-red-600">{downloadError}</p>
      )}
      <Link
        href={`/nova-contagem/analise?analysisId=${encodeURIComponent(item.id)}`}
        className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
        onClick={onClose}
      >
        {finalizada ? <RefreshCw size={16} /> : <Pencil size={16} />}
        {finalizada ? "Editar e refazer contagem" : "Editar análise"}
      </Link>
      <button
        type="button"
        onClick={() => {
          onClose();
          onDelete(item.id);
        }}
        className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
      >
        <Trash2 size={16} />
        Excluir
      </button>
    </>
  );
}
