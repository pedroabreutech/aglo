"use client";

export const DEFAULT_DETECTION_THRESHOLD = 0.5;
export const MIN_DETECTION_THRESHOLD = 0.05;
export const MAX_DETECTION_THRESHOLD = 0.95;
export const DETECTION_THRESHOLD_STEP = 0.05;

type ConfidenceThresholdSliderProps = {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
};

export function ConfidenceThresholdSlider({
  value,
  onChange,
  disabled = false,
}: ConfidenceThresholdSliderProps) {
  const percent = Math.round(value * 100);

  return (
    <div className="px-6 pb-6">
      <div className="flex items-baseline justify-between gap-3 mb-1">
        <h3 className="text-sm font-semibold text-[#334155]">
          Confiança da detecção
        </h3>
        <span className="text-sm font-semibold tabular-nums text-[#137FEC]">
          {percent}%
        </span>
      </div>
      <p className="text-xs text-[#64748B] font-light mb-3">
        Ajuste o limiar do P2Pnet. Valores menores detectam mais pessoas;
        valores maiores exigem maior confiança.
      </p>

      <input
        type="range"
        min={MIN_DETECTION_THRESHOLD}
        max={MAX_DETECTION_THRESHOLD}
        step={DETECTION_THRESHOLD_STEP}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-full disabled:cursor-not-allowed disabled:opacity-60"
        style={{ accentColor: "#137FEC" }}
        aria-label="Confiança da detecção"
      />

      <div className="mt-1.5 flex justify-between text-[10px] uppercase tracking-wide text-[#94A3B8]">
        <span>Mais detecções</span>
        <span>Mais rigoroso</span>
      </div>
    </div>
  );
}
