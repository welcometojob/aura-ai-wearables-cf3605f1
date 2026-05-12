import { Sparkles, Upload, Wand2, Scissors, Trash2, X, Loader2, WandSparkles, Shirt, Search, Check } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { enhancePrompt } from "@/server/ai.functions";
import { fetchReadyDesigns, type ReadyDesign } from "@/lib/ready-designs";

type Props = {
  prompt: string;
  setPrompt: (p: string) => void;
  onGenerate: () => void;
  generating: boolean;
  selectedStyle: string;
  setSelectedStyle: (s: string) => void;
  onUploadImage: (dataUrl: string) => void;
  artwork: string | null;
  onDeleteArtwork: () => void;
};

export function LeftSidebar({
  prompt, setPrompt, onGenerate, generating,
  selectedStyle, setSelectedStyle,
  onUploadImage, artwork, onDeleteArtwork,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploads, setUploads] = useState<string[]>([]);
  const [removingBg, setRemovingBg] = useState(false);
  const [enhancing, setEnhancing] = useState(false);
  const [readyDesigns, setReadyDesigns] = useState<ReadyDesign[]>([]);
  const [loadingDesigns, setLoadingDesigns] = useState(true);
  const [designQuery, setDesignQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("All");

  const isSelectedArtwork = (image: string) => artwork === image;

  const categories = useMemo(() => {
    const set = new Set<string>();
    readyDesigns.forEach((d) => d.category && set.add(d.category));
    return ["All", ...Array.from(set).sort()];
  }, [readyDesigns]);

  const filteredDesigns = useMemo(() => {
    const q = designQuery.trim().toLowerCase();
    return readyDesigns.filter((d) => {
      if (activeCategory !== "All" && d.category !== activeCategory) return false;
      if (!q) return true;
      if (d.name.toLowerCase().includes(q)) return true;
      if (d.category?.toLowerCase().includes(q)) return true;
      if (d.tags.some((t) => t.toLowerCase().includes(q))) return true;
      return false;
    });
  }, [readyDesigns, designQuery, activeCategory]);

  useEffect(() => {
    fetchReadyDesigns()
      .then(setReadyDesigns)
      .catch(() => {})
      .finally(() => setLoadingDesigns(false));
  }, []);

  const handleEnhance = async () => {
    if (!prompt.trim() || enhancing) return;
    setEnhancing(true);
    try {
      const res = await enhancePrompt({ data: { prompt: prompt.trim(), style: selectedStyle } });
      setPrompt(res.prompt);
      toast.success("Prompt enhanced with AI");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to enhance prompt";
      toast.error(msg);
    } finally {
      setEnhancing(false);
    }
  };

  const handleRemoveBg = async () => {
    if (!artwork || removingBg) return;
    setRemovingBg(true);
    try {
      const { removeBackground } = await import("@imgly/background-removal");
      const blob = await removeBackground(artwork, {
        model: "isnet",
        output: { format: "image/png", quality: 1 },
      });
      const reader = new FileReader();
      reader.onload = () => onUploadImage(reader.result as string);
      reader.onerror = () => console.error("Failed to read processed image");
      reader.readAsDataURL(blob);
    } catch (err) {
      console.error("Background removal failed", err);
      alert("Background removal failed. Please try a different image.");
    } finally {
      setRemovingBg(false);
    }
  };

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const url = reader.result as string;
      setUploads((u) => [url, ...u].slice(0, 6));
      onUploadImage(url);
    };
    reader.readAsDataURL(file);
  };

  return (
    <aside className="flex h-full w-80 shrink-0 flex-col border-r border-border bg-card/40">
      <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
        <section>
          <div className="flex items-center justify-between">
            <SectionTitle icon={Sparkles} label="AI Text-to-Image" />
            <button
              type="button"
              onClick={handleEnhance}
              disabled={!prompt.trim() || enhancing}
              title="Enhance prompt with AI"
              aria-label="Enhance prompt with AI"
              className="grid h-6 w-6 place-items-center rounded-md border border-primary/40 bg-primary/10 text-primary transition hover:bg-primary/20 hover:border-primary disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {enhancing ? <Loader2 className="h-3 w-3 animate-spin" /> : <WandSparkles className="h-3 w-3" />}
            </button>
          </div>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="A neon koi swimming through clouds, vintage Japanese woodblock style..."
            className="mt-2 h-24 w-full resize-none rounded-lg border border-border bg-background/60 p-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <button
            onClick={onGenerate}
            disabled={generating || !prompt.trim()}
            className="mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-semibold text-primary-foreground transition hover:opacity-90 neon-glow disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Wand2 className={`h-4 w-4 ${generating ? "animate-spin" : ""}`} />
            {generating ? "Generating…" : "Generate Artwork"}
          </button>

          {artwork && (
            <div className="mt-3 group relative aspect-square w-full overflow-hidden rounded-lg border border-primary/40 bg-background/40">
              <img src={artwork} alt="Current artwork" className="h-full w-full object-contain" />
              <button
                onClick={onDeleteArtwork}
                aria-label="Delete artwork"
                className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-md border border-border bg-background/80 text-muted-foreground backdrop-blur transition hover:border-destructive hover:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
              <span className="absolute bottom-2 left-2 rounded-md bg-background/80 px-2 py-0.5 text-[10px] uppercase tracking-wider text-primary backdrop-blur">
                Current
              </span>
            </div>
          )}
        </section>

        <section>
          <SectionTitle icon={Upload} label="Assets" />
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
          <button
            onClick={() => fileRef.current?.click()}
            className="mt-2 flex h-20 w-full flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border bg-background/30 text-xs text-muted-foreground transition hover:border-primary hover:text-primary"
          >
            <Upload className="h-4 w-4" />
            Drop or upload high-res image
          </button>
          {uploads.length > 0 && (
            <div className="mt-3 grid grid-cols-3 gap-2">
              {uploads.map((u, i) => (
                <div
                  key={i}
                  className="group relative aspect-square overflow-hidden rounded-md border border-border hover:border-primary"
                >
                  <button onClick={() => onUploadImage(u)} className="block h-full w-full">
                    <img src={u} alt="" className="h-full w-full object-cover" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setUploads((arr) => arr.filter((_, idx) => idx !== i));
                      if (artwork === u) onDeleteArtwork();
                    }}
                    aria-label="Delete upload"
                    className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded bg-background/80 text-muted-foreground opacity-0 backdrop-blur transition group-hover:opacity-100 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <SectionTitle icon={Scissors} label="Background Remover" />
          <button
            type="button"
            onClick={handleRemoveBg}
            disabled={!artwork || removingBg}
            className="mt-2 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-primary/50 bg-primary/10 text-xs font-semibold text-primary transition hover:bg-primary/20 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {removingBg ? <Loader2 className="h-4 w-4 animate-spin" /> : <Scissors className="h-4 w-4" />}
            {removingBg ? "Removing background…" : "Remove Background"}
          </button>
          <p className="mt-1.5 text-[10px] text-muted-foreground">
            {artwork ? "Click to isolate subject from current artwork" : "Upload or generate artwork first"}
          </p>
        </section>

        <section>
          <SectionTitle icon={Shirt} label="Ready Designs" />

          {readyDesigns.length > 0 && (
            <>
              <div className="relative mt-2">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={designQuery}
                  onChange={(e) => setDesignQuery(e.target.value)}
                  placeholder="Search designs or tags…"
                  className="h-8 w-full rounded-md border border-border bg-background/60 pl-8 pr-7 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
                {designQuery && (
                  <button
                    type="button"
                    onClick={() => setDesignQuery("")}
                    aria-label="Clear search"
                    className="absolute right-1.5 top-1/2 grid h-5 w-5 -translate-y-1/2 place-items-center rounded text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
              {categories.length > 1 && (
                <div className="mt-2 -mx-1 flex gap-1 overflow-x-auto px-1 pb-0.5 [scrollbar-width:thin]">
                  {categories.map((c) => {
                    const active = activeCategory === c;
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setActiveCategory(c)}
                        className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-medium transition ${
                          active
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border bg-background/40 text-muted-foreground hover:border-muted-foreground"
                        }`}
                      >
                        {c}
                      </button>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {loadingDesigns ? (
            <div className="mt-2 flex h-20 items-center justify-center rounded-lg border border-border bg-background/30">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          ) : readyDesigns.length === 0 ? (
            <div className="mt-2 flex h-20 items-center justify-center rounded-lg border border-dashed border-border bg-background/30 px-3 text-center text-[10px] text-muted-foreground">
              No ready designs uploaded yet
            </div>
          ) : filteredDesigns.length === 0 ? (
            <div className="mt-2 flex h-20 items-center justify-center rounded-lg border border-dashed border-border bg-background/30 px-3 text-center text-[10px] text-muted-foreground">
              No designs match your search
            </div>
          ) : (
            <div className="mt-2 grid grid-cols-3 gap-2">
              {filteredDesigns.map((d) => (
                <button
                  key={d.id}
                  onClick={() => {
                    onUploadImage(d.image);
                    toast.success(`Applied "${d.name}"`);
                  }}
                  title={d.name}
                  className={`group relative aspect-square w-full overflow-hidden rounded-lg border bg-background/40 transition hover:border-primary ${
                    isSelectedArtwork(d.image) ? "border-primary ring-1 ring-primary/40" : "border-border"
                  }`}
                >
                  <img src={d.image} alt={d.name} className="h-full w-full object-contain" />
                  {isSelectedArtwork(d.image) && (
                    <span className="absolute right-1.5 top-1.5 grid h-5 w-5 place-items-center rounded-full bg-primary text-primary-foreground">
                      <Check className="h-3 w-3" />
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </section>

      </div>
    </aside>
  );
}

function SectionTitle({ icon: Icon, label }: { icon: React.ComponentType<{ className?: string }>; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-3.5 w-3.5 text-primary" />
      <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</h3>
    </div>
  );
}
