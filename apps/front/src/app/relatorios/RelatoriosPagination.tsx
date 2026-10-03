import { ChevronLeft, ChevronRight } from "lucide-react";

const PAGE_SIZE_OPTIONS = [10, 25, 50];

interface RelatoriosPaginationProps {
  pageStart: number;
  pageEnd: number;
  totalItems: number;
  itemsPerPage: number;
  safePage: number;
  totalPages: number;
  visiblePages: number[];
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

export function RelatoriosPagination({
  pageStart,
  pageEnd,
  totalItems,
  itemsPerPage,
  safePage,
  totalPages,
  visiblePages,
  onPageChange,
  onPageSizeChange,
}: RelatoriosPaginationProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 bg-white px-6 py-4">
      <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
        <span>
          Mostrando {pageStart}-{pageEnd} de {totalItems} resultados
        </span>
        <label className="flex items-center gap-2">
          <span className="text-slate-500">Linhas:</span>
          <select
            value={itemsPerPage}
            onChange={(event) => onPageSizeChange(Number(event.target.value))}
            className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm focus:border-[#137FEC] focus:outline-none"
          >
            {PAGE_SIZE_OPTIONS.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, safePage - 1))}
          disabled={safePage === 1}
          aria-label="Página anterior"
          className="rounded-lg p-2 text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft size={18} />
        </button>

        {visiblePages[0] > 1 && (
          <>
            <button
              type="button"
              onClick={() => onPageChange(1)}
              className="min-w-9 rounded-lg px-3 py-1.5 text-sm text-slate-600 transition hover:bg-slate-100"
            >
              1
            </button>
            {visiblePages[0] > 2 && (
              <span className="px-1 text-slate-400">...</span>
            )}
          </>
        )}

        {visiblePages.map((pageNum) => (
          <button
            key={pageNum}
            type="button"
            onClick={() => onPageChange(pageNum)}
            className={`min-w-9 rounded-lg px-3 py-1.5 text-sm transition ${
              safePage === pageNum
                ? "bg-[#137FEC] font-medium text-white"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            {pageNum}
          </button>
        ))}

        {visiblePages[visiblePages.length - 1] < totalPages && (
          <>
            {visiblePages[visiblePages.length - 1] < totalPages - 1 && (
              <span className="px-1 text-slate-400">...</span>
            )}
            <button
              type="button"
              onClick={() => onPageChange(totalPages)}
              className="min-w-9 rounded-lg px-3 py-1.5 text-sm text-slate-600 transition hover:bg-slate-100"
            >
              {totalPages}
            </button>
          </>
        )}

        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, safePage + 1))}
          disabled={safePage === totalPages}
          aria-label="Próxima página"
          className="rounded-lg p-2 text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}
