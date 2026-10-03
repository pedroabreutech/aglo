"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import type { CountingMethod } from "@/src/types/IContagem";
import {
  COUNTING_METHODS,
  COUNTING_METHOD_DESCRIPTIONS,
  COUNTING_METHOD_LABELS,
  COUNTING_METHOD_REFERENCE_IMAGES,
  type CountingMethodReferenceImage,
} from "@/src/lib/countingMethod";

type CountingMethodSelectorProps = {
  value: CountingMethod;
  onChange: (value: CountingMethod) => void;
  disabled?: boolean;
};

export function CountingMethodSelector({
  value,
  onChange,
  disabled = false,
}: CountingMethodSelectorProps) {
  const [preview, setPreview] = useState<CountingMethodReferenceImage | null>(
    null,
  );

  useEffect(() => {
    if (!preview) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPreview(null);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [preview]);

  return (
    <div className="px-6 pb-6">
      <h3 className="text-sm font-semibold text-[#334155] mb-1">
        Modo da contagem automática
      </h3>
      <p className="text-xs text-[#64748B] font-light mb-3">
        Escolha o modo mais adequado à densidade da multidão na imagem.
      </p>
      <div className="grid grid-cols-1 gap-2">
        {COUNTING_METHODS.map((option) => {
          const selected = value === option;
          const reference = COUNTING_METHOD_REFERENCE_IMAGES[option];

          return (
            <label
              key={option}
              className={`flex cursor-pointer gap-3 rounded-lg border px-3 py-3 transition ${
                selected
                  ? "border-[#137FEC] bg-[#137FEC0D]"
                  : "border-slate-200 bg-white hover:border-slate-300"
              } ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
            >
              <input
                type="radio"
                name="countingMethod"
                value={option}
                checked={selected}
                disabled={disabled}
                onChange={() => onChange(option)}
                className="mt-1 shrink-0"
              />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-[#0F172A]">
                  {COUNTING_METHOD_LABELS[option]}
                </span>
                <span className="mt-1 block text-xs text-[#64748B]">
                  {COUNTING_METHOD_DESCRIPTIONS[option]}
                </span>

                {reference && (
                  <span className="mt-3 block">
                    <button
                      type="button"
                      className="group relative block h-[88px] w-full overflow-hidden rounded-md border border-slate-200 bg-slate-100 text-left"
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        setPreview(reference);
                      }}
                      aria-label={`Ampliar ${reference.caption}`}
                    >
                      <Image
                        src={reference.src}
                        alt={reference.alt}
                        fill
                        sizes="320px"
                        className="object-cover transition group-hover:scale-[1.02]"
                      />
                      <span className="absolute inset-x-0 bottom-0 bg-black/55 px-2 py-1 text-[10px] font-medium text-white">
                        Clique para ampliar
                      </span>
                    </button>
                    <span className="mt-1.5 block text-[10px] uppercase tracking-wide text-[#94A3B8]">
                      {reference.caption}
                    </span>
                  </span>
                )}
              </span>
            </label>
          );
        })}
      </div>

      {preview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={preview.alt}
          onClick={() => setPreview(null)}
        >
          <div
            className="relative flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-lg bg-white shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-[#0F172A]">
                  {preview.caption}
                </p>
                <p className="text-xs text-[#64748B]">{preview.alt}</p>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={preview.src}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-md border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-[#137FEC] hover:bg-slate-50"
                >
                  Abrir original
                </a>
                <button
                  type="button"
                  onClick={() => setPreview(null)}
                  className="rounded-md border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Fechar
                </button>
              </div>
            </div>
            <div className="relative min-h-[240px] flex-1 overflow-auto bg-slate-950 p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={preview.src}
                alt={preview.alt}
                className="mx-auto max-h-[80vh] w-auto max-w-full object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
