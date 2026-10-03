"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Contagem } from "@/src/types/IContagem";
import {
  RelatoriosFilters,
  type DateRangeFilter,
  type ReportStatusFilter,
} from "./RelatoriosFilters";
import { RelatoriosTable } from "./RelatoriosTable";

interface ReportsListResponse {
  items: Contagem[];
  page: number;
  pageSize: number;
  total: number;
}

const DEFAULT_PAGE_SIZE = 10;

function toIsoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function getDateRangeParams(dateRange: DateRangeFilter) {
  if (dateRange === "todos") {
    return {};
  }

  const now = new Date();
  const from = new Date(now);

  if (dateRange === "ultimos-30") {
    from.setDate(now.getDate() - 30);
  } else if (dateRange === "ultimos-90") {
    from.setDate(now.getDate() - 90);
  } else {
    from.setFullYear(now.getFullYear() - 1);
  }

  return { dateFrom: toIsoDate(from), dateTo: toIsoDate(now) };
}

function buildReportsQuery(input: {
  searchTerm: string;
  dateRange: DateRangeFilter;
  eventType: string;
  status: ReportStatusFilter;
  currentPage: number;
  itemsPerPage: number;
}) {
  const params = new URLSearchParams();
  const { dateFrom, dateTo } = getDateRangeParams(input.dateRange);

  if (input.searchTerm.trim()) params.set("search", input.searchTerm.trim());
  if (input.eventType !== "todos") params.set("eventType", input.eventType);
  if (input.status !== "todos") params.set("status", input.status);

  if (dateFrom) params.set("dateFrom", dateFrom);
  if (dateTo) params.set("dateTo", dateTo);
  params.set("page", String(input.currentPage));
  params.set("pageSize", String(input.itemsPerPage));

  return params;
}

export default function Relatorios() {
  const router = useRouter();
  const [contagens, setContagens] = useState<Contagem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState<DateRangeFilter>("ultimos-30");
  const [eventType, setEventType] = useState("todos");
  const [status, setStatus] = useState<ReportStatusFilter>("todos");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(DEFAULT_PAGE_SIZE);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let ignore = false;

    const loadReports = async () => {
      setLoading(true);
      setError(null);

      const params = buildReportsQuery({
        searchTerm,
        dateRange,
        eventType,
        status,
        currentPage,
        itemsPerPage,
      });

      try {
        const response = await fetch(`/api/contagens?${params.toString()}`, {
          cache: "no-store",
        });
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload?.error || "Falha ao carregar relatórios.");
        }

        const data = payload as ReportsListResponse;
        if (!ignore) {
          setContagens(data.items);
          setTotalItems(data.total);
        }
      } catch (err) {
        if (!ignore) {
          setError(err instanceof Error ? err.message : "Erro desconhecido.");
          setContagens([]);
          setTotalItems(0);
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    void loadReports();

    return () => {
      ignore = true;
    };
  }, [
    searchTerm,
    dateRange,
    eventType,
    status,
    currentPage,
    itemsPerPage,
    reloadKey,
  ]);

  const resetToFirstPage = () => setCurrentPage(1);

  const handleDelete = async (id: string) => {
    if (!confirm("Deseja excluir este relatório?")) return;

    try {
      const response = await fetch(
        `/api/contagem?analysisId=${encodeURIComponent(id)}`,
        { method: "DELETE" },
      );
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error || "Falha ao excluir o relatório.");
      }

      setReloadKey((prev) => prev + 1);
    } catch (err) {
      console.error(err);
      alert(
        err instanceof Error
          ? err.message
          : "Erro inesperado ao excluir o relatório.",
      );
    }
  };

  const deleteReportById = async (id: string) => {
    const response = await fetch(
      `/api/contagem?analysisId=${encodeURIComponent(id)}`,
      { method: "DELETE" },
    );
    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(payload?.error || `Falha ao excluir o relatório ${id}.`);
    }
  };

  const handleDeleteMany = async (ids: string[]) => {
    const failures: string[] = [];

    for (const id of ids) {
      try {
        await deleteReportById(id);
      } catch (err) {
        console.error(err);
        failures.push(id);
      }
    }

    setReloadKey((prev) => prev + 1);

    if (failures.length > 0) {
      const deleted = ids.length - failures.length;
      alert(
        deleted > 0
          ? `${deleted} relatório(s) excluído(s). ${failures.length} falharam.`
          : "Não foi possível excluir os relatórios selecionados.",
      );
    }
  };

  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <div className="bg-white border-b border-slate-200 px-8 py-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900">Relatórios</h1>
          <button
            onClick={() => router.push("/nova-contagem")}
            className="bg-[#137FEC] text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-600 transition flex items-center gap-2"
          >
            + Nova análise
          </button>
        </div>
      </div>

      <div className="flex-1 bg-slate-50 px-8 py-6">
        <RelatoriosFilters
          searchTerm={searchTerm}
          dateRange={dateRange}
          eventType={eventType}
          status={status}
          onSearchTermChange={(value) => {
            setSearchTerm(value);
            resetToFirstPage();
          }}
          onDateRangeChange={(value) => {
            setDateRange(value);
            resetToFirstPage();
          }}
          onEventTypeChange={(value) => {
            setEventType(value);
            resetToFirstPage();
          }}
          onStatusChange={(value) => {
            setStatus(value);
            resetToFirstPage();
          }}
          onExportAll={() => console.log("Exportando todos os relatórios...")}
        />

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <RelatoriosTable
          contagens={contagens}
          loading={loading}
          totalItems={totalItems}
          currentPage={currentPage}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onPageSizeChange={(value) => {
            setItemsPerPage(value);
            resetToFirstPage();
          }}
          onDelete={handleDelete}
          onDeleteMany={handleDeleteMany}
        />
      </div>
    </div>
  );
}
