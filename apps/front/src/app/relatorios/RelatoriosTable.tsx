"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MoreVertical, Trash2 } from "lucide-react";
import {
  COUNTING_METHOD_LABELS,
  getAutomaticCount,
  resolveCountingMethod,
} from "@/src/lib/countingMethod";
import type { Contagem } from "@/src/types/IContagem";
import { RelatoriosPagination } from "./RelatoriosPagination";
import { ReportActions } from "./ReportActions";

function getVisiblePages(currentPage: number, totalPages: number): number[] {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const start = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
  return Array.from({ length: 5 }, (_, index) => start + index);
}

function getStatusMeta(item: Contagem) {
  if (item.status === "failed") {
    return { label: "Falha", className: "bg-red-100 text-red-700" };
  }

  if (item.finalizada) {
    return { label: "Finalizada", className: "bg-green-100 text-green-700" };
  }

  return { label: "Pendente", className: "bg-yellow-100 text-yellow-700" };
}

interface RelatoriosTableProps {
  contagens: Contagem[];
  loading: boolean;
  totalItems: number;
  currentPage: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onDelete: (id: string) => void;
  onDeleteMany: (ids: string[]) => Promise<void> | void;
}

export function RelatoriosTable({
  contagens,
  loading,
  totalItems,
  currentPage,
  itemsPerPage,
  onPageChange,
  onPageSizeChange,
  onDelete,
  onDeleteMany,
}: RelatoriosTableProps) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const selectAllRef = useRef<HTMLInputElement | null>(null);
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const safePage = Math.min(currentPage, totalPages);
  const pageStart = totalItems === 0 ? 0 : (safePage - 1) * itemsPerPage + 1;
  const pageEnd = Math.min(safePage * itemsPerPage, totalItems);
  const visiblePages = getVisiblePages(safePage, totalPages);
  const pageIds = useMemo(
    () => contagens.map((item) => item.id),
    [contagens],
  );
  const selectedOnPageCount = pageIds.filter((id) => selectedIds.has(id)).length;
  const allPageSelected =
    pageIds.length > 0 && selectedOnPageCount === pageIds.length;
  const somePageSelected =
    selectedOnPageCount > 0 && selectedOnPageCount < pageIds.length;

  useEffect(() => {
    setSelectedIds(new Set());
    setOpenMenuId(null);
  }, [currentPage, itemsPerPage, contagens]);

  useEffect(() => {
    if (!selectAllRef.current) return;
    selectAllRef.current.indeterminate = somePageSelected;
  }, [somePageSelected]);

  useEffect(() => {
    if (!openMenuId) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openMenuId]);

  const toggleOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAllOnPage = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allPageSelected) {
        pageIds.forEach((id) => next.delete(id));
      } else {
        pageIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0 || bulkDeleting) return;

    const label =
      ids.length === 1
        ? "Deseja excluir o relatório selecionado?"
        : `Deseja excluir os ${ids.length} relatórios selecionados?`;
    if (!confirm(label)) return;

    setBulkDeleting(true);
    try {
      await onDeleteMany(ids);
      setSelectedIds(new Set());
    } finally {
      setBulkDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-slate-600">
        Carregando relatórios...
      </div>
    );
  }

  if (contagens.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-slate-600">
        Não há contagens registradas no momento.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      {selectedIds.size > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-sm text-slate-700">
            <span className="font-semibold text-slate-900">
              {selectedIds.size}
            </span>{" "}
            {selectedIds.size === 1
              ? "relatório selecionado"
              : "relatórios selecionados"}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedIds(new Set())}
              disabled={bulkDeleting}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Limpar seleção
            </button>
            <button
              type="button"
              onClick={() => void handleBulkDelete()}
              disabled={bulkDeleting}
              className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Trash2 size={16} />
              {bulkDeleting
                ? "Excluindo..."
                : `Excluir selecionados (${selectedIds.size})`}
            </button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px]">
          <thead>
            <tr className="border-b border-slate-200 bg-white">
              <th className="w-12 px-4 py-4">
                <input
                  ref={selectAllRef}
                  type="checkbox"
                  checked={allPageSelected}
                  onChange={toggleAllOnPage}
                  aria-label="Selecionar todos os relatórios desta página"
                  className="h-4 w-4 cursor-pointer rounded border-slate-300 text-[#137FEC] focus:ring-[#137FEC]"
                />
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-slate-700">
                Nome do Relatório
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-slate-700">
                Evento Localização
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-slate-700">
                Data da Análise
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-slate-700">
                Contagem Automática
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-slate-700">
                Status
              </th>
              <th className="w-14 px-4 py-4">
                <span className="sr-only">Ações</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {contagens.map((item) => {
              const finalizada = item.finalizada ?? false;
              const method = resolveCountingMethod(item.countingMethod);
              const statusMeta = getStatusMeta(item);
              const automaticCountValue = getAutomaticCount(item);
              const isMenuOpen = openMenuId === item.id;
              const isSelected = selectedIds.has(item.id);

              return (
                <tr
                  key={item.id}
                  className={`border-b border-slate-100 hover:bg-slate-50 ${
                    isSelected ? "bg-blue-50/60" : ""
                  }`}
                >
                  <td className="px-4 py-4">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleOne(item.id)}
                      aria-label={`Selecionar relatório ${item.eventName}`}
                      className="h-4 w-4 cursor-pointer rounded border-slate-300 text-[#137FEC] focus:ring-[#137FEC]"
                    />
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-slate-900">
                    <div>{item.eventName}</div>
                    <div className="mt-1 text-xs font-medium text-[#137FEC]">
                      {COUNTING_METHOD_LABELS[method]}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {item.location.address}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600 whitespace-nowrap">
                    {new Date(item.createdAt).toLocaleString("pt-BR", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-slate-900 whitespace-nowrap">
                    {automaticCountValue !== undefined
                      ? automaticCountValue.toLocaleString("pt-BR")
                      : "-"}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusMeta.className}`}
                    >
                      {statusMeta.label}
                    </span>
                  </td>
                  <td className="relative px-4 py-4">
                    <div
                      className="flex justify-end"
                      ref={isMenuOpen ? menuRef : undefined}
                    >
                      <button
                        type="button"
                        aria-label="Abrir ações"
                        aria-expanded={isMenuOpen}
                        onClick={() => setOpenMenuId(isMenuOpen ? null : item.id)}
                        className="rounded-lg p-2 text-slate-600 transition hover:bg-slate-100"
                      >
                        <MoreVertical size={18} />
                      </button>

                      {isMenuOpen && (
                        <div className="absolute right-4 top-12 z-20 min-w-[200px] rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
                          <ReportActions
                            item={item}
                            finalizada={finalizada}
                            onClose={() => setOpenMenuId(null)}
                            onDelete={onDelete}
                          />
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <RelatoriosPagination
        pageStart={pageStart}
        pageEnd={pageEnd}
        totalItems={totalItems}
        itemsPerPage={itemsPerPage}
        safePage={safePage}
        totalPages={totalPages}
        visiblePages={visiblePages}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
      />
    </div>
  );
}
