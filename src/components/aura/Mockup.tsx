import { useState, type WheelEvent } from "react";
import { ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import type { ColorSwatch, View } from "@/lib/aura-config";
import tshirtFront from "@/assets/tshirt-front-cut.png";
import tshirtBack from "@/assets/tshirt-back-cut.png";

type Props = {
  view: View;
  setView: (v: View) => void;
  color: ColorSwatch;
  artwork: string | null;
  styleName: string;
  fabric: string;
};

const clamp = (v: number) => Math.max(0.6, Math.min(2.2, v));

export function Mockup({ view, setView, color, artwork }: Props) {
  const [zoom, setZoom] = useState(1);

  const reset = () => setZoom(1);

  const handleWheel = (event: WheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    setZoom((z) => clamp(z + (event.deltaY < 0 ? 0.1 : -0.1)));
  };

  const shirtSrc = view === "back" ? tshirtBack : tshirtFront;
  const isWhite = color.hex.toLowerCase() === "#f5f5f5" || color.hex.toLowerCase() === "#ffffff";

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
        className="relative flex-1 overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-muted/40 via-background to-muted/40"
        onWheel={handleWheel}
      >
        <div className="absolute inset-0 grid place-items-center">
          <div
            className="relative aspect-[260/340] h-[88%] max-h-[640px] select-none transition-transform duration-200 ease-out"
            style={{ transform: `scale(${zoom})` }}
          >
            {/* Base shirt photo (provides realistic shading) */}
            <img
              src={shirtSrc}
              alt="T-shirt mockup"
              className="absolute inset-0 h-full w-full object-contain"
              draggable={false}
            />

            {/* Color tint layer — multiplies color into the white shirt while preserving shading */}
            {!isWhite && (
              <div
                className="pointer-events-none absolute inset-0"
                style={{
                  backgroundColor: color.hex,
                  mixBlendMode: "multiply",
                  WebkitMaskImage: `url(${shirtSrc})`,
                  maskImage: `url(${shirtSrc})`,
                  WebkitMaskSize: "contain",
                  maskSize: "contain",
                  WebkitMaskRepeat: "no-repeat",
                  maskRepeat: "no-repeat",
                  WebkitMaskPosition: "center",
                  maskPosition: "center",
                }}
              />
            )}

            {/* Artwork on chest area */}
            {artwork && (
              <img
                src={artwork}
                alt="Artwork"
                draggable={false}
                className="pointer-events-none absolute object-contain"
                style={{
                  top: "26%",
                  left: "50%",
                  width: "42%",
                  height: "38%",
                  transform: "translateX(-50%)",
                  mixBlendMode: color.id === "black" || color.id === "blue" || color.id === "red" ? "screen" : "multiply",
                  filter: "drop-shadow(0 1px 1px rgba(0,0,0,0.2))",
                }}
              />
            )}
          </div>
        </div>
        <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70">
          Scroll to zoom
        </div>
      </div>
    </div>
  );
}
