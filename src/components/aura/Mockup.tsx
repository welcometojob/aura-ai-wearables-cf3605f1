import { useState } from "react";
import { ZoomIn, ZoomOut } from "lucide-react";
import tshirtFront from "@/assets/tshirt-front.png";
import tshirtBack from "@/assets/tshirt-back.png";
import type { ColorSwatch, View } from "@/lib/aura-config";

type Props = {
  view: View;
  setView: (v: View) => void;
  color: ColorSwatch;
  artwork: string | null;
  styleName: string;
  fabric: string;
};

export function Mockup({ view, setView, color, artwork }: Props) {
  const [zoom, setZoom] = useState(1);
  const src = view === "front" ? tshirtFront : tshirtBack;

  return (
    <div className="relative flex h-full w-full flex-col">
      <div className="flex items-center justify-center gap-3 px-2 pb-4 relative">
        <div className="inline-flex rounded-full border border-border bg-card p-1">
          {(["front", "back"] as View[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-4 py-1.5 text-xs font-medium uppercase tracking-wider rounded-full transition-all ${
                view === v
                  ? "bg-primary text-primary-foreground neon-glow"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {v} View
            </button>
          ))}
        </div>
        <div className="absolute right-2 flex items-center gap-1">
          {[
            { icon: ZoomIn, action: () => setZoom((z) => Math.min(1.6, z + 0.1)) },
            { icon: ZoomOut, action: () => setZoom((z) => Math.max(0.7, z - 0.1)) },
          ].map(({ icon: Icon, action }, i) => (
            <button
              key={i}
              onClick={action}
              className="grid h-9 w-9 place-items-center rounded-lg border border-border bg-card text-muted-foreground transition hover:border-primary hover:text-primary"
            >
              <Icon className="h-4 w-4" />
            </button>
          ))}
        </div>
      </div>

      <div className="relative flex-1 overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-slate-100 via-white to-slate-200 dark:from-slate-200 dark:via-slate-100 dark:to-slate-300">
        <div className="pointer-events-none absolute inset-0 opacity-30">
          <div className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/20 blur-[120px]" />
        </div>

        <div
          className="absolute inset-0 flex items-center justify-center transition-transform duration-500 ease-out"
          style={{ transform: `scale(${zoom})` }}
        >
          <div className="relative drop-shadow-[0_25px_45px_rgba(0,0,0,0.25)]">
            <img
              src={src}
              alt={`T-shirt ${view}`}
              width={620}
              height={620}
              className="h-[min(70vh,620px)] w-auto select-none"
              style={{ filter: `${color.filter}${color.id === "black" ? " drop-shadow(0 0 1px rgba(255,255,255,0.4))" : ""}` }}
              draggable={false}
            />
            {artwork && (
              <img
                src={artwork}
                alt="Artwork"
                className="pointer-events-none absolute left-1/2 top-[38%] -translate-x-1/2 -translate-y-1/2 w-[34%] aspect-square object-contain"
                style={{ mixBlendMode: color.id === "white" ? "multiply" : "screen", opacity: 0.95 }}
                draggable={false}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
