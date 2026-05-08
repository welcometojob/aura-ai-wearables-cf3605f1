import { useState } from "react";
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

function TShirtSVG({ color, view }: { color: ColorSwatch; view: View }) {
  // Subtle shading derived from base color
  const isLight = ["white", "yellow"].includes(color.id);
  const shadow = isLight ? "rgba(0,0,0,0.18)" : "rgba(0,0,0,0.45)";
  const highlight = isLight ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.12)";
  const collarShade = isLight ? "rgba(0,0,0,0.10)" : "rgba(0,0,0,0.35)";

  return (
    <svg viewBox="0 0 600 700" className="h-full w-full" preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id="bodyShade" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={highlight} />
          <stop offset="55%" stopColor="transparent" />
          <stop offset="100%" stopColor={shadow} />
        </linearGradient>
        <radialGradient id="centerLight" cx="50%" cy="40%" r="55%">
          <stop offset="0%" stopColor={highlight} stopOpacity="0.7" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="10" />
          <feOffset dx="0" dy="14" result="off" />
          <feComponentTransfer><feFuncA type="linear" slope="0.35" /></feComponentTransfer>
          <feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Drop shadow under shirt */}
      <ellipse cx="300" cy="660" rx="180" ry="14" fill="rgba(0,0,0,0.25)" />

      {/* T-shirt body path */}
      <g filter="url(#softShadow)">
        <path
          d="M 180 130
             L 110 175
             L 60 260
             L 110 305
             L 165 280
             L 165 620
             Q 165 640 185 640
             L 415 640
             Q 435 640 435 620
             L 435 280
             L 490 305
             L 540 260
             L 490 175
             L 420 130
             Q 380 175 300 175
             Q 220 175 180 130 Z"
          fill={color.hex}
          stroke={shadow}
          strokeWidth="1.5"
        />
        {/* Shading overlays */}
        <path
          d="M 180 130
             L 110 175
             L 60 260
             L 110 305
             L 165 280
             L 165 620
             Q 165 640 185 640
             L 415 640
             Q 435 640 435 620
             L 435 280
             L 490 305
             L 540 260
             L 490 175
             L 420 130
             Q 380 175 300 175
             Q 220 175 180 130 Z"
          fill="url(#bodyShade)"
        />
        <path
          d="M 180 130
             L 110 175
             L 60 260
             L 110 305
             L 165 280
             L 165 620
             Q 165 640 185 640
             L 415 640
             Q 435 640 435 620
             L 435 280
             L 490 305
             L 540 260
             L 490 175
             L 420 130
             Q 380 175 300 175
             Q 220 175 180 130 Z"
          fill="url(#centerLight)"
        />

        {/* Collar */}
        {view === "front" ? (
          <path
            d="M 220 130
               Q 300 200 380 130
               Q 380 158 360 172
               Q 300 200 240 172
               Q 220 158 220 130 Z"
            fill={collarShade}
          />
        ) : (
          <path
            d="M 235 130
               Q 300 165 365 130
               Q 365 148 355 156
               Q 300 175 245 156
               Q 235 148 235 130 Z"
            fill={collarShade}
          />
        )}

        {/* Sleeve seams */}
        <path d="M 165 280 Q 175 290 195 290" stroke={shadow} strokeWidth="1.2" fill="none" opacity="0.5" />
        <path d="M 435 280 Q 425 290 405 290" stroke={shadow} strokeWidth="1.2" fill="none" opacity="0.5" />
        {/* Hem */}
        <path d="M 170 632 L 430 632" stroke={shadow} strokeWidth="1" fill="none" opacity="0.4" />
      </g>
    </svg>
  );
}

export function Mockup({ view, setView, color, artwork }: Props) {
  const [zoom, setZoom] = useState(1);

  const reset = () => setZoom(1);

  return (
    <div className="relative flex h-full w-full flex-col">
      <div className="relative flex items-center justify-center gap-3 px-2 pb-4">
        <div className="inline-flex rounded-full border border-border bg-card p-1">
          {(["front", "back"] as View[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`rounded-full px-4 py-1.5 text-xs font-medium uppercase tracking-wider transition-all ${
                view === v ? "bg-primary text-primary-foreground neon-glow" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {v} View
            </button>
          ))}
        </div>
        <div className="absolute right-2 flex items-center gap-1">
          <button
            onClick={() => setZoom((z) => Math.min(1.6, z + 0.1))}
            className="grid h-9 w-9 place-items-center rounded-lg border border-border bg-card text-muted-foreground transition hover:border-primary hover:text-primary"
            aria-label="Zoom in"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          <button
            onClick={() => setZoom((z) => Math.max(0.6, z - 0.1))}
            className="grid h-9 w-9 place-items-center rounded-lg border border-border bg-card text-muted-foreground transition hover:border-primary hover:text-primary"
            aria-label="Zoom out"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <button
            onClick={reset}
            className="grid h-9 w-9 place-items-center rounded-lg border border-border bg-card text-muted-foreground transition hover:border-primary hover:text-primary"
            aria-label="Reset view"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="relative flex-1 overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-muted via-background to-muted">
        <div
          className="absolute inset-0 flex items-center justify-center transition-transform duration-300 ease-out"
          style={{ transform: `scale(${zoom})` }}
        >
          <div className="relative h-[88%] aspect-[6/7]">
            <TShirtSVG color={color} view={view} />
            {artwork && (
              <div
                className="pointer-events-none absolute"
                style={{
                  // Chest print area — same box for front and back
                  left: "32%",
                  top: "32%",
                  width: "36%",
                  height: "38%",
                }}
              >
                <img
                  src={artwork}
                  alt="Custom design"
                  crossOrigin="anonymous"
                  className="h-full w-full object-contain"
                  style={{
                    mixBlendMode: ["white", "yellow"].includes(color.id) ? "multiply" : "normal",
                  }}
                />
              </div>
            )}
          </div>
        </div>

        <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70">
          {view === "front" ? "Front view" : "Back view"} · use zoom buttons
        </div>
      </div>
    </div>
  );
}
