import { useEffect, useState, useCallback } from "react";
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";

export type LightboxImage = { src: string; alt?: string };

export function ImageLightbox({
  images,
  startIndex = 0,
  open,
  onClose,
}: {
  images: LightboxImage[];
  startIndex?: number;
  open: boolean;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(startIndex);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (open) {
      setIndex(startIndex);
      setZoom(1);
      setOffset({ x: 0, y: 0 });
    }
  }, [open, startIndex]);

  const reset = useCallback(() => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  }, []);

  const next = useCallback(() => {
    setIndex((i) => (i + 1) % images.length);
    reset();
  }, [images.length, reset]);

  const prev = useCallback(() => {
    setIndex((i) => (i - 1 + images.length) % images.length);
    reset();
  }, [images.length, reset]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") prev();
      else if (e.key === "+" || e.key === "=") setZoom((z) => Math.min(4, z + 0.25));
      else if (e.key === "-") setZoom((z) => Math.max(1, z - 0.25));
      else if (e.key === "0") reset();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, next, prev, onClose, reset]);

  if (!open || !images.length) return null;

  const img = images[index];

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setZoom((z) => Math.max(1, Math.min(4, z + (e.deltaY < 0 ? 0.2 : -0.2))));
  };

  const onMouseDown = (e: React.MouseEvent) => {
    if (zoom <= 1) return;
    setDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragging) return;
    setOffset({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };
  const onMouseUp = () => setDragging(false);

  const onDoubleClick = () => {
    if (zoom === 1) setZoom(2);
    else reset();
  };

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex items-center justify-center animate-in fade-in-0 duration-200"
      onClick={onClose}
    >
      {/* Top bar */}
      <div className="absolute top-0 inset-x-0 p-4 flex items-center justify-between text-white/90 z-10">
        <div className="text-sm tabular-nums">
          {index + 1} / {images.length}
        </div>
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setZoom((z) => Math.max(1, z - 0.25))}
            aria-label="Zoom out"
            className="h-9 w-9 grid place-items-center rounded-lg hover:bg-white/10 transition"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <span className="text-xs tabular-nums w-12 text-center">{Math.round(zoom * 100)}%</span>
          <button
            onClick={() => setZoom((z) => Math.min(4, z + 0.25))}
            aria-label="Zoom in"
            className="h-9 w-9 grid place-items-center rounded-lg hover:bg-white/10 transition"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          <button
            onClick={reset}
            aria-label="Reset zoom"
            className="h-9 w-9 grid place-items-center rounded-lg hover:bg-white/10 transition"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
          <button
            onClick={onClose}
            aria-label="Close lightbox"
            className="h-9 w-9 grid place-items-center rounded-lg hover:bg-white/10 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Prev */}
      {images.length > 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            prev();
          }}
          aria-label="Previous image"
          className="absolute left-4 z-10 h-12 w-12 grid place-items-center rounded-full bg-white/10 hover:bg-white/20 text-white transition"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
      )}

      {/* Image */}
      <div
        className="relative max-w-[92vw] max-h-[80vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        onWheel={onWheel}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onDoubleClick={onDoubleClick}
        style={{ cursor: zoom > 1 ? (dragging ? "grabbing" : "grab") : "zoom-in" }}
      >
        <img
          src={img.src}
          alt={img.alt ?? `Image ${index + 1}`}
          draggable={false}
          className="max-w-[92vw] max-h-[80vh] object-contain select-none transition-transform duration-150"
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
          }}
        />
      </div>

      {/* Next */}
      {images.length > 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            next();
          }}
          aria-label="Next image"
          className="absolute right-4 z-10 h-12 w-12 grid place-items-center rounded-full bg-white/10 hover:bg-white/20 text-white transition"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      )}

      {/* Thumbnails */}
      {images.length > 1 && (
        <div
          className="absolute bottom-4 inset-x-0 flex justify-center gap-2 px-4 overflow-x-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {images.map((im, i) => (
            <button
              key={i}
              onClick={() => {
                setIndex(i);
                reset();
              }}
              aria-label={`View image ${i + 1}`}
              className={`h-14 w-14 shrink-0 rounded-lg overflow-hidden border-2 transition ${
                i === index ? "border-primary scale-105" : "border-white/20 hover:border-white/60"
              }`}
            >
              <img src={im.src} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}