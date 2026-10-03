"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type WheelEvent as ReactWheelEvent,
} from "react";
import { Maximize2, Minus, Plus, RotateCcw } from "lucide-react";

export interface DetectionPoint {
  x: number;
  y: number;
}

interface Props {
  src: string;
  alt?: string;
  points?: DetectionPoint[];
  /** Quando true, os pontos já estão desenhados na imagem (annotated). */
  pointsEmbedded?: boolean;
}

const MIN_SCALE = 1;
const MAX_SCALE = 6;
const ZOOM_STEP = 0.35;

export default function AnnotatedImageViewer({
  src,
  alt = "Imagem processada",
  points = [],
  pointsEmbedded = false,
}: Props) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const [naturalSize, setNaturalSize] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);

  const shouldOverlay =
    !pointsEmbedded && points.length > 0 && naturalSize !== null;
  const canPan = scale > 1;

  const resetView = useCallback(() => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  }, []);

  useEffect(() => {
    resetView();
    setNaturalSize(null);
  }, [src, resetView]);

  const clampOffset = useCallback((nextScale: number, x: number, y: number) => {
    const viewport = viewportRef.current;
    if (!viewport || nextScale <= 1) {
      return { x: 0, y: 0 };
    }

    const { clientWidth, clientHeight } = viewport;
    const maxX = ((nextScale - 1) * clientWidth) / 2;
    const maxY = ((nextScale - 1) * clientHeight) / 2;

    return {
      x: Math.min(maxX, Math.max(-maxX, x)),
      y: Math.min(maxY, Math.max(-maxY, y)),
    };
  }, []);

  const zoomTo = useCallback(
    (nextScale: number, originX?: number, originY?: number) => {
      const viewport = viewportRef.current;
      const clamped = Math.min(MAX_SCALE, Math.max(MIN_SCALE, nextScale));

      if (!viewport || clamped === scale) {
        if (clamped === 1) setOffset({ x: 0, y: 0 });
        return;
      }

      if (clamped === 1) {
        setScale(1);
        setOffset({ x: 0, y: 0 });
        return;
      }

      const rect = viewport.getBoundingClientRect();
      // Com transform-origin no centro, o pivot deve ser relativo ao centro do viewport.
      const pivotX = (originX ?? rect.width / 2) - rect.width / 2;
      const pivotY = (originY ?? rect.height / 2) - rect.height / 2;
      const ratio = clamped / scale;

      const nextOffset = clampOffset(
        clamped,
        pivotX - ratio * (pivotX - offset.x),
        pivotY - ratio * (pivotY - offset.y),
      );

      setScale(clamped);
      setOffset(nextOffset);
    },
    [clampOffset, offset.x, offset.y, scale],
  );

  const handleWheel = (event: ReactWheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    const rect = event.currentTarget.getBoundingClientRect();
    const direction = event.deltaY > 0 ? -1 : 1;
    zoomTo(
      scale + direction * ZOOM_STEP,
      event.clientX - rect.left,
      event.clientY - rect.top,
    );
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!canPan || event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: offset.x,
      originY: offset.y,
    };
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    setOffset(
      clampOffset(
        scale,
        drag.originX + (event.clientX - drag.startX),
        drag.originY + (event.clientY - drag.startY),
      ),
    );
  };

  const endDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (dragRef.current?.pointerId === event.pointerId) {
      dragRef.current = null;
    }
  };

  const zoomPercent = Math.round(scale * 100);

  return (
    <div className="flex min-h-[320px] flex-col rounded-3xl bg-slate-900/5 p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-medium text-slate-600">
          Zoom {zoomPercent}%
          {canPan ? " · arraste para mover" : " · use a roda do mouse ou os botões"}
        </p>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => zoomTo(scale - ZOOM_STEP)}
            disabled={scale <= MIN_SCALE}
            aria-label="Diminuir zoom"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Minus size={16} />
          </button>
          <button
            type="button"
            onClick={() => zoomTo(scale + ZOOM_STEP)}
            disabled={scale >= MAX_SCALE}
            aria-label="Aumentar zoom"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Plus size={16} />
          </button>
          <button
            type="button"
            onClick={resetView}
            disabled={scale === 1 && offset.x === 0 && offset.y === 0}
            aria-label="Resetar zoom"
            className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <RotateCcw size={14} />
            100%
          </button>
          <button
            type="button"
            onClick={() => zoomTo(2)}
            aria-label="Zoom 200%"
            className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
          >
            <Maximize2 size={14} />
            200%
          </button>
        </div>
      </div>

      <div
        ref={viewportRef}
        className={`relative flex min-h-[320px] items-center justify-center overflow-hidden rounded-2xl bg-slate-950/5 ${
          canPan ? "cursor-grab active:cursor-grabbing" : "cursor-zoom-in"
        }`}
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onDoubleClick={() =>
          scale > 1 ? resetView() : zoomTo(Math.min(MAX_SCALE, scale + 1))
        }
      >
        <div
          className="relative inline-block max-w-full will-change-transform"
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
            transformOrigin: "center center",
          }}
        >
          <img
            src={src}
            alt={alt}
            draggable={false}
            className="block max-h-[520px] max-w-full select-none object-contain"
            onLoad={(event) => {
              setNaturalSize({
                width: event.currentTarget.naturalWidth,
                height: event.currentTarget.naturalHeight,
              });
            }}
          />

          {shouldOverlay && naturalSize && (
            <>
              {points.map((point, index) => (
                <span
                  key={`${point.x}-${point.y}-${index}`}
                  className="pointer-events-none absolute h-1 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#F97316] shadow ring-1 ring-white"
                  style={{
                    left: `${(point.x / naturalSize.width) * 100}%`,
                    top: `${(point.y / naturalSize.height) * 100}%`,
                  }}
                  title={`Detecção ${index + 1}`}
                />
              ))}
            </>
          )}
        </div>
      </div>

      {!pointsEmbedded && points.length > 0 && (
        <p className="mt-3 text-center text-xs font-medium text-slate-600">
          {points.length.toLocaleString("pt-BR")} marcações detectadas
        </p>
      )}
    </div>
  );
}
