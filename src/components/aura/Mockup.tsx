import { useState, type WheelEvent } from "react";
import { ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import type { ColorSwatch, View } from "@/lib/aura-config";

type Props = {
  view: View;
  setView: (v: View) => void;
  color: ColorSwatch;
  artwork: string | null;
  styleName: string;
  fabric: string;
};

const clamp = (v: number) => Math.max(0.72, Math.min(1.9, v));

export function Mockup({ view, setView, color, artwork }: Props) {
  const [zoom, setZoom] = useState(1);
  const [tilt, setTilt] = useState({ x: -7, y: view === "back" ? 180 : 0 });

  const reset = () => {
    setZoom(1);
    setTilt({ x: -7, y: view === "back" ? 180 : 0 });
  };

  const handleWheel = (event: WheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    setZoom((z) => clamp(z + (event.deltaY < 0 ? 0.1 : -0.1)));
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.buttons !== 1) return;
    setTilt((t) => ({ x: Math.max(-18, Math.min(10, t.x - event.movementY * 0.18)), y: t.y + event.movementX * 0.35 }));
  };

  const switchView = (v: View) => {
    setView(v);
    setTilt((t) => ({ ...t, y: v === "back" ? 180 : 0 }));
  };

  return (
    <div className="relative flex h-full w-full flex-col">
      <div className="relative flex items-center justify-center gap-3 px-2 pb-4">
        <div className="inline-flex rounded-full border border-border bg-card p-1">
          {(["front", "back"] as View[]).map((v) => (
            <button
              key={v}
              onClick={() => switchView(v)}
              className={`rounded-full px-4 py-1.5 text-xs font-medium uppercase tracking-wider transition-all ${
                view === v ? "bg-primary text-primary-foreground neon-glow" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {v} View
            </button>
          ))}
        </div>
        <div className="absolute right-2 flex items-center gap-1">
          <button onClick={() => setZoom((z) => clamp(z + 0.12))} className="grid h-9 w-9 place-items-center rounded-lg border border-border bg-card text-muted-foreground transition hover:border-primary hover:text-primary" aria-label="Zoom in">
            <ZoomIn className="h-4 w-4" />
          </button>
          <button onClick={() => setZoom((z) => clamp(z - 0.12))} className="grid h-9 w-9 place-items-center rounded-lg border border-border bg-card text-muted-foreground transition hover:border-primary hover:text-primary" aria-label="Zoom out">
            <ZoomOut className="h-4 w-4" />
          </button>
          <button onClick={reset} className="grid h-9 w-9 place-items-center rounded-lg border border-border bg-card text-muted-foreground transition hover:border-primary hover:text-primary" aria-label="Reset view">
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div
        className="relative flex-1 overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-muted via-background to-muted"
        onWheel={handleWheel}
        onPointerMove={handlePointerMove}
      >
        <div className="absolute inset-0 grid place-items-center [perspective:900px]">
          <div
            className="relative aspect-[5/6] w-[min(62vh,58%)] min-w-72 select-none transition-transform duration-200 ease-out"
            style={{ transform: `scale(${zoom}) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)` }}
          >
            <svg viewBox="0 0 520 620" className="absolute inset-0 h-full w-full drop-shadow-2xl" aria-label="3D T-shirt mockup">
              <defs>
                <clipPath id="shirt-print-area">
                  <path d="M170 190 C205 215 315 215 350 190 L374 496 C338 518 182 518 146 496 Z" />
                </clipPath>
                <linearGradient id="shirtShade" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="white" stopOpacity="0.24" />
                  <stop offset="0.5" stopColor="white" stopOpacity="0.03" />
                  <stop offset="1" stopColor="black" stopOpacity="0.22" />
                </linearGradient>
                <radialGradient id="bodyLight" cx="50%" cy="18%" r="72%">
                  <stop offset="0" stopColor="white" stopOpacity="0.2" />
                  <stop offset="0.55" stopColor="white" stopOpacity="0.02" />
                  <stop offset="1" stopColor="black" stopOpacity="0.18" />
                </radialGradient>
                <filter id="softDepth" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="28" stdDeviation="22" floodOpacity="0.32" />
                </filter>
              </defs>

              <path d="M164 82 L76 136 L40 236 L112 282 L145 232 L132 548 C184 576 336 576 388 548 L375 232 L408 282 L480 236 L444 136 L356 82 C333 121 187 121 164 82 Z" fill={color.hex} filter="url(#softDepth)" />
              <path d="M164 82 L76 136 L40 236 L112 282 L145 232 L132 548 C184 576 336 576 388 548 L375 232 L408 282 L480 236 L444 136 L356 82 C333 121 187 121 164 82 Z" fill="url(#shirtShade)" />
              <path d="M164 82 C196 146 324 146 356 82 C326 116 194 116 164 82 Z" fill="none" stroke="currentColor" strokeOpacity="0.28" strokeWidth="18" className="text-background" />
              <path d="M145 232 C185 205 335 205 375 232" fill="none" stroke="currentColor" strokeOpacity="0.14" strokeWidth="3" className="text-background" />
              <path d="M132 548 C184 576 336 576 388 548" fill="none" stroke="currentColor" strokeOpacity="0.18" strokeWidth="10" className="text-background" />

              <g clipPath="url(#shirt-print-area)">
                {artwork && <image href={artwork} x="155" y="185" width="210" height="245" preserveAspectRatio="xMidYMid meet" />}
                <path d="M145 182 C190 222 330 222 375 182 L388 512 C330 544 190 544 132 512 Z" fill="url(#bodyLight)" pointerEvents="none" />
              </g>
            </svg>
          </div>
        </div>
        <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70">
          Drag to rotate · Scroll to zoom
        </div>
      </div>
    </div>
  );
}
