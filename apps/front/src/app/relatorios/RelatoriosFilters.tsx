import { Search } from "lucide-react";

export type DateRangeFilter =
  | "todos"
  | "ultimos-30"
  | "ultimos-90"
  | "ultimo-ano";
export type ReportStatusFilter = "todos" | "ready" | "completed" | "failed";

const EVENT_TYPE_OPTIONS = [
  "Manifestação Política",
  "Evento Esportivo",
  "Show / Concerto",
];

interface RelatoriosFiltersProps {
  searchTerm: string;
  dateRange: DateRangeFilter;
  eventType: string;
  status: ReportStatusFilter;
  onSearchTermChange: (value: string) => void;
  onDateRangeChange: (value: DateRangeFilter) => void;
  onEventTypeChange: (value: string) => void;
  onStatusChange: (value: ReportStatusFilter) => void;
  onExportAll: () => void;
}

export function RelatoriosFilters({
  searchTerm,
  dateRange,
  eventType,
  status,
  onSearchTermChange,
  onDateRangeChange,
  onEventTypeChange,
  onStatusChange,
  onExportAll,
}: RelatoriosFiltersProps) {
  return (
    <div className="mb-6 flex flex-wrap items-center gap-3">
      <div className="relative min-w-[220px] flex-1">
        <Search className="absolute left-3 top-3 text-slate-400" size={20} />
        <input
          type="text"
          placeholder="Pesquise eventos, conjuntos de dados ou relatórios..."
          value={searchTerm}
          onChange={(event) => onSearchTermChange(event.target.value)}
          className="w-full rounded-lg border border-slate-300 py-2 pl-10 pr-4 focus:border-[#137FEC] focus:outline-none"
        />
      </div>

      <span className="text-sm font-medium text-slate-700">Filtrar por:</span>

      <div className="flex items-center gap-2">
        <label className="text-sm text-slate-600 whitespace-nowrap">
          Intervalo de datas:
        </label>
        <select
          value={dateRange}
          onChange={(event) =>
            onDateRangeChange(event.target.value as DateRangeFilter)
          }
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#137FEC] focus:outline-none"
        >
          <option value="todos">Todos os períodos</option>
          <option value="ultimos-30">Últimos 30 Dias</option>
          <option value="ultimos-90">Últimos 90 Dias</option>
          <option value="ultimo-ano">Último Ano</option>
        </select>
      </div>

      <div className="flex items-center gap-2">
        <label className="text-sm text-slate-600 whitespace-nowrap">
          Tipo de Evento:
        </label>
        <select
          value={eventType}
          onChange={(event) => onEventTypeChange(event.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#137FEC] focus:outline-none"
        >
          <option value="todos">Todos</option>
          {EVENT_TYPE_OPTIONS.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2">
        <label className="text-sm text-slate-600 whitespace-nowrap">Status:</label>
        <select
          value={status}
          onChange={(event) =>
            onStatusChange(event.target.value as ReportStatusFilter)
          }
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#137FEC] focus:outline-none"
        >
          <option value="todos">Todos</option>
          <option value="ready">Pendente</option>
          <option value="completed">Finalizada</option>
          <option value="failed">Falha</option>
        </select>
      </div>

      <button
        onClick={onExportAll}
        className="ml-auto rounded-lg px-4 py-2 font-medium text-slate-700 transition hover:bg-slate-200"
      >
        Exportar todos
      </button>
    </div>
  );
}
