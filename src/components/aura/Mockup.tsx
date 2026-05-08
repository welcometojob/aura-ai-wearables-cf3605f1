import { useEffect, useId, useState, type WheelEvent } from "react";
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

const SHIRT_PATH = `M 180 132
  L 114 176
  L 78 248
  L 112 286
  L 165 264
  L 165 620
  Q 165 644 189 644
  L 411 644
  Q 435 644 435 620
  L 435 264
  L 488 286
  L 522 248
  L 486 176
  L 420 132
  Q 386 170 300 170
  Q 214 170 180 132 Z`;

const FRONT_COLLAR_PATH = `M 221 132
  Q 300 207 379 132
  Q 377 162 356 178
  Q 300 199 244 178
  Q 223 162 221 132 Z`;

const BACK_COLLAR_PATH = `M 236 132
  Q 300 165 364 132
  Q 363 149 354 157
  Q 300 173 246 157
  Q 237 149 236 132 Z`;

const FRONT_PRINT_PATH = `M 220 216
  Q 300 203 380 216
  L 370 430
  Q 300 446 230 430 Z`;

const BACK_PRINT_PATH = `M 228 206
  Q 300 195 372 206
  L 364 416
  Q 300 430 236 416 Z`;

const clampZoom = (value: number) => Math.max(0.7, Math.min(1.9, value));

async function prepareArtwork(src: string): Promise<string> {
  return new Promise((resolve) => {
    const image = new Image();
    image.crossOrigin = "anonymous";

    image.onload = () => {
      const canvas = document.createElement("canvas");
      const width = image.naturalWidth || image.width;
      const height = image.naturalHeight || image.height;

      canvas.width = width;
      canvas.height = height;

      const context = canvas.getContext("2d", { willReadFrequently: true });
      if (!context) {
        resolve(src);
        return;
      }

      context.drawImage(image, 0, 0, width, height);
      const frame = context.getImageData(0, 0, width, height);
      const data = frame.data;

      const samplePoints = [
        0,
        width - 1,
        (height - 1) * width,
        height * width - 1,
        Math.floor(width / 2),
        Math.floor((height - 1) * width + width / 2),
        Math.floor((Math.floor(height / 2) * width)),
        Math.floor((Math.floor(height / 2) * width) + width - 1),
      ];

      let red = 0;
      let green = 0;
      let blue = 0;
      let count = 0;

      for (const point of samplePoints) {
        const index = point * 4;
        if (data[index + 3] < 12) continue;
        red += data[index];
        green += data[index + 1];
        blue += data[index + 2];
        count += 1;
      }

      const base = count
        ? { r: red / count, g: green / count, b: blue / count }
        : { r: 255, g: 255, b: 255 };

      const distanceLimit = 58;
      for (let index = 0; index < data.length; index += 4) {
        const alpha = data[index + 3];
        if (alpha < 12) {
          data[index + 3] = 0;
          continue;
        }

        const distance = Math.hypot(data[index] - base.r, data[index + 1] - base.g, data[index + 2] - base.b);
        if (distance < distanceLimit) {
          data[index + 3] = Math.max(0, alpha - 230);
        }
      }

      context.putImageData(frame, 0, 0);

      let minX = width;
      let minY = height;
      let maxX = 0;
      let maxY = 0;
      let hasOpaquePixel = false;

      for (let y = 0; y < height; y += 1) {
        for (let x = 0; x < width; x += 1) {
          const index = (y * width + x) * 4;
          if (data[index + 3] < 24) continue;
          hasOpaquePixel = true;
          minX = Math.min(minX, x);
          minY = Math.min(minY, y);
          maxX = Math.max(maxX, x);
          maxY = Math.max(maxY, y);
        }
      }

      if (!hasOpaquePixel) {
        resolve(src);
        return;
      }

      const pad = 18;
      const cropX = Math.max(0, minX - pad);
      const cropY = Math.max(0, minY - pad);
      const cropWidth = Math.min(width - cropX, maxX - minX + pad * 2);
      const cropHeight = Math.min(height - cropY, maxY - minY + pad * 2);

      const croppedCanvas = document.createElement("canvas");
      croppedCanvas.width = cropWidth;
      croppedCanvas.height = cropHeight;

      const croppedContext = croppedCanvas.getContext("2d");
      if (!croppedContext) {
        resolve(src);
        return;
      }

      croppedContext.drawImage(canvas, cropX, cropY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);
      resolve(croppedCanvas.toDataURL("image/png"));
    };

    image.onerror = () => resolve(src);
    image.src = src;
  });
}

function TShirtSVG({ color, view, artwork }: { color: ColorSwatch; view: View; artwork: string | null }) {
  const uid = useId().replace(/:/g, "");
  const isLight = ["white", "yellow"].includes(color.id);
  const isBlack = color.id === "black";
  const artworkBlendMode = isLight ? "multiply" : isBlack ? "screen" : "normal";
  const shadow = isLight ? "rgba(0,0,0,0.12)" : isBlack ? "rgba(0,0,0,0.18)" : "rgba(0,0,0,0.22)";
  const highlight = isLight ? "rgba(255,255,255,0.28)" : isBlack ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.14)";
  const sideShade = isLight ? "rgba(0,0,0,0.06)" : isBlack ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.14)";
  const hemShade = isLight ? "rgba(0,0,0,0.05)" : isBlack ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.12)";
  const outline = isLight ? "rgba(0,0,0,0.12)" : isBlack ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.12)";
  const collarShade = isLight ? "rgba(0,0,0,0.08)" : isBlack ? "rgba(0,0,0,0.50)" : "rgba(0,0,0,0.42)";
  const seam = isLight ? "rgba(0,0,0,0.14)" : isBlack ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.14)";
  const printPath = view === "front" ? FRONT_PRINT_PATH : BACK_PRINT_PATH;
  const printClipId = `print-area-${uid}`;
  const shirtShadowId = `shirt-shadow-${uid}`;
  const topLightId = `top-light-${uid}`;
  const sideShadeId = `side-shade-${uid}`;
  const hemShadeId = `hem-shade-${uid}`;
  const shoulderLightId = `shoulder-light-${uid}`;

  return (
    <svg viewBox="0 0 600 700" className="h-full w-full" preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id={topLightId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={highlight} />
          <stop offset="38%" stopColor="transparent" />
          <stop offset="100%" stopColor="transparent" />
        </linearGradient>
        <linearGradient id={sideShadeId} x1="0" y1="0.5" x2="1" y2="0.5">
          <stop offset="0%" stopColor={sideShade} />
          <stop offset="20%" stopColor="transparent" />
          <stop offset="80%" stopColor="transparent" />
          <stop offset="100%" stopColor={sideShade} />
        </linearGradient>
        <linearGradient id={hemShadeId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="transparent" />
          <stop offset="72%" stopColor="transparent" />
          <stop offset="100%" stopColor={hemShade} />
        </linearGradient>
        <radialGradient id={shoulderLightId} cx="50%" cy="18%" r="36%">
          <stop offset="0%" stopColor={highlight} stopOpacity={isBlack ? "0.45" : "0.75"} />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        <clipPath id={printClipId}>
          <path d={printPath} />
        </clipPath>
        <filter id={shirtShadowId} x="-20%" y="-20%" width="140%" height="150%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="8" />
          <feOffset dx="0" dy="12" result="offset" />
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.24" />
          </feComponentTransfer>
          <feMerge>
            <feMergeNode in="offset" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <ellipse cx="300" cy="656" rx="132" ry="14" fill="rgba(0,0,0,0.18)" />

      <g filter={`url(#${shirtShadowId})`}>
        <path
          d={SHIRT_PATH}
          fill={color.hex}
          stroke={outline}
          strokeWidth="1.4"
        />
        {artwork && (
          <g clipPath={`url(#${printClipId})`}>
            {!isLight && <path d={printPath} fill="rgba(255,255,255,0.045)" />}
            <image
              href={artwork}
              x={194}
              y={view === "front" ? 195 : 188}
              width={212}
              height={260}
              preserveAspectRatio="xMidYMid meet"
              style={{
                mixBlendMode: artworkBlendMode,
                opacity: isBlack ? 0.98 : 1,
                filter: isBlack ? "drop-shadow(0 3px 10px rgba(255,140,0,0.18)) saturate(1.08) contrast(1.05)" : "none",
              }}
            />
          </g>
        )}

        <path d={SHIRT_PATH} fill={`url(#${topLightId})`} opacity={isBlack ? 0.8 : 1} />
        {!isBlack && <path d={SHIRT_PATH} fill={`url(#${shoulderLightId})`} />}
        <path d={SHIRT_PATH} fill={`url(#${sideShadeId})`} />
        <path d={SHIRT_PATH} fill={`url(#${hemShadeId})`} />

        {view === "front" ? (
          <path
            d={FRONT_COLLAR_PATH}
            fill={collarShade}
            stroke={seam}
            strokeWidth="1"
          />
        ) : (
          <path
            d={BACK_COLLAR_PATH}
            fill={collarShade}
            stroke={seam}
            strokeWidth="1"
          />
        )}

        <path d="M 167 264 Q 183 278 202 284" stroke={seam} strokeWidth="1.25" fill="none" opacity="0.56" />
        <path d="M 433 264 Q 417 278 398 284" stroke={seam} strokeWidth="1.25" fill="none" opacity="0.56" />
        <path d="M 178 632 L 422 632" stroke={seam} strokeWidth="1" fill="none" opacity="0.4" />
        {!isBlack && <path d="M 226 224 Q 300 238 374 224" stroke={shadow} strokeWidth="1" fill="none" opacity="0.18" />}
        {!isBlack && <path d="M 210 330 Q 230 350 246 336" stroke={shadow} strokeWidth="1.1" fill="none" opacity="0.18" />}
        {!isBlack && <path d="M 390 330 Q 370 350 354 336" stroke={shadow} strokeWidth="1.1" fill="none" opacity="0.18" />}
      </g>
    </svg>
  );
}

export function Mockup({ view, setView, color, artwork }: Props) {
  const [zoom, setZoom] = useState(1);
  const [preparedArtwork, setPreparedArtwork] = useState<string | null>(artwork);

  useEffect(() => {
    let cancelled = false;

    if (!artwork) {
      setPreparedArtwork(null);
      return;
    }

    void prepareArtwork(artwork).then((result) => {
      if (!cancelled) setPreparedArtwork(result);
    });

    return () => {
      cancelled = true;
    };
  }, [artwork]);

  const reset = () => setZoom(1);
  const handleWheel = (event: WheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    const delta = event.deltaY < 0 ? 0.08 : -0.08;
    setZoom((current) => clampZoom(current + delta));
  };

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
            onClick={() => setZoom((z) => clampZoom(z + 0.1))}
            className="grid h-9 w-9 place-items-center rounded-lg border border-border bg-card text-muted-foreground transition hover:border-primary hover:text-primary"
            aria-label="Zoom in"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          <button
            onClick={() => setZoom((z) => clampZoom(z - 0.1))}
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

      <div
        className="relative flex-1 overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-muted via-background to-muted"
        onWheel={handleWheel}
      >
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: "radial-gradient(circle at center, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0) 58%)" }}
        />
        <div
          className="absolute inset-0 flex items-center justify-center transition-transform duration-300 ease-out"
          style={{ transform: `scale(${zoom})` }}
        >
          <div className="relative h-[88%] aspect-[6/7]">
            <TShirtSVG color={color} view={view} artwork={preparedArtwork} />
          </div>
        </div>

        <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70">
          {view === "front" ? "Front view" : "Back view"} · wheel or buttons to zoom
        </div>
      </div>
    </div>
  );
}
