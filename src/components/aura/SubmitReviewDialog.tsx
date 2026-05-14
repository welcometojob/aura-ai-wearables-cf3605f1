import { useState } from "react";
import { Star, Loader2, Upload, X, ImagePlus, ShieldCheck, Sparkles } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { createReview, uploadReviewImage, type Review } from "@/lib/reviews";

const MAX_IMAGES = 4;
const MAX_SIZE_MB = 5;

export function SubmitReviewDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (review: Review) => void;
}) {
  const { user, profile } = useAuth();
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [variant, setVariant] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setRating(5);
    setHoverRating(0);
    setTitle("");
    setText("");
    setVariant("");
    previews.forEach((url) => URL.revokeObjectURL(url));
    setFiles([]);
    setPreviews([]);
  };

  const onPickFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (!picked.length) return;
    const remaining = MAX_IMAGES - files.length;
    const accepted: File[] = [];
    for (const f of picked.slice(0, remaining)) {
      if (!f.type.startsWith("image/")) {
        toast.error(`${f.name} is not an image`);
        continue;
      }
      if (f.size > MAX_SIZE_MB * 1024 * 1024) {
        toast.error(`${f.name} is larger than ${MAX_SIZE_MB}MB`);
        continue;
      }
      accepted.push(f);
    }
    setFiles((prev) => [...prev, ...accepted]);
    setPreviews((prev) => [...prev, ...accepted.map((f) => URL.createObjectURL(f))]);
  };

  const removeFile = (idx: number) => {
    URL.revokeObjectURL(previews[idx]);
    setFiles((prev) => prev.filter((_, i) => i !== idx));
    setPreviews((prev) => prev.filter((_, i) => i !== idx));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Please sign in to write a review");
      return;
    }
    if (!title.trim() || !text.trim()) {
      toast.error("Please fill in both title and review text");
      return;
    }
    if (title.length > 120) {
      toast.error("Title must be under 120 characters");
      return;
    }
    if (text.length > 2000) {
      toast.error("Review must be under 2000 characters");
      return;
    }
    setSubmitting(true);
    try {
      const uploaded: string[] = [];
      for (const f of files) {
        const url = await uploadReviewImage(f, user.id);
        uploaded.push(url);
      }
      const review = await createReview({
        userId: user.id,
        authorName: profile?.display_name || user.email?.split("@")[0] || "Anonymous",
        title: title.trim(),
        text: text.trim(),
        rating,
        variant: variant.trim() || undefined,
        images: uploaded,
      });
      toast.success("Thanks for your review!");
      onCreated(review);
      reset();
      onOpenChange(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to submit review";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) reset();
        onOpenChange(o);
      }}
    >
      <DialogContent className="max-w-2xl overflow-hidden border-border/60 bg-background p-0">
        {/* Hero */}
        <div className="relative overflow-hidden border-b border-border/60 bg-gradient-to-br from-gold/15 via-gold/5 to-transparent px-7 py-6">
          <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-gold/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-10 h-40 w-40 rounded-full bg-gold/10 blur-3xl" />
          <div className="relative">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-gold/40 bg-gold/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-gold">
              <ShieldCheck className="h-3 w-3" />
              Verified buyer
            </div>
            <DialogHeader className="mt-3 space-y-1.5 text-left">
              <DialogTitle className="text-2xl font-bold tracking-tight">
                Share your experience
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Tell other creators what you loved about your TommyMeow piece — print, fit, fabric, delivery.
              </DialogDescription>
            </DialogHeader>
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-5 px-7 py-6 max-h-[70vh] overflow-y-auto">
          {/* Rating */}
          <div className="rounded-2xl border border-border/60 bg-card/40 p-5">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Your rating
            </Label>
            <div className="mt-3 flex items-center gap-1.5">
              {[1, 2, 3, 4, 5].map((n) => {
                const filled = (hoverRating || rating) >= n;
                return (
                  <button
                    key={n}
                    type="button"
                    aria-label={`${n} star${n > 1 ? "s" : ""}`}
                    onClick={() => setRating(n)}
                    onMouseEnter={() => setHoverRating(n)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 transition-transform hover:scale-115 active:scale-95"
                  >
                    <Star
                      className={`h-9 w-9 transition-colors ${
                        filled
                          ? "fill-gold text-gold drop-shadow-[0_0_8px_var(--gold)]"
                          : "text-muted-foreground/30"
                      }`}
                    />
                  </button>
                );
              })}
              <span className="ml-3 text-sm font-semibold tabular-nums text-foreground">
                {hoverRating || rating}<span className="text-muted-foreground">/5</span>
              </span>
            </div>
          </div>

          <div>
            <Label htmlFor="r-title" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Review title
            </Label>
            <Input
              id="r-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Sum it up in one line"
              maxLength={120}
              className="mt-2 h-11"
              required
            />
          </div>

          <div>
            <Label htmlFor="r-text" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Your review
            </Label>
            <Textarea
              id="r-text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="What did you like? How was the print quality, fit, and delivery?"
              maxLength={2000}
              rows={6}
              className="mt-2 resize-none"
              required
            />
            <div className="mt-1 text-right text-[11px] tabular-nums text-muted-foreground">
              {text.length} / 2000
            </div>
          </div>

          <div>
            <Label htmlFor="r-variant" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Product · variant <span className="font-normal normal-case">(optional)</span>
            </Label>
            <Input
              id="r-variant"
              value={variant}
              onChange={(e) => setVariant(e.target.value)}
              placeholder="e.g. Black · Large"
              maxLength={80}
              className="mt-2 h-11"
            />
          </div>

          {/* Images */}
          <div>
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Photos <span className="font-normal normal-case">(up to {MAX_IMAGES})</span>
            </Label>
            <div className="mt-2 grid grid-cols-4 gap-2">
              {previews.map((src, i) => (
                <div key={i} className="group relative aspect-square overflow-hidden rounded-xl border border-border/60">
                  <img src={src} alt={`upload preview ${i + 1}`} className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeFile(i)}
                    aria-label="Remove image"
                    className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full border border-border bg-background/90 opacity-0 transition group-hover:opacity-100 hover:text-destructive"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              {files.length < MAX_IMAGES && (
                <label className="grid aspect-square cursor-pointer place-items-center rounded-xl border-2 border-dashed border-border text-muted-foreground transition hover:border-gold/60 hover:bg-gold/5 hover:text-gold">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={onPickFiles}
                    className="hidden"
                  />
                  <div className="text-center">
                    <ImagePlus className="h-5 w-5 mx-auto" />
                    <span className="mt-1 block text-[10px] font-medium">Add</span>
                  </div>
                </label>
              )}
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground">JPG / PNG · max {MAX_SIZE_MB}MB each</p>
          </div>
        </form>

        <div className="flex flex-col-reverse items-stretch gap-2 border-t border-border/60 bg-card/30 px-7 py-4 sm:flex-row sm:justify-between sm:items-center">
          <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Sparkles className="h-3 w-3 text-gold" />
            Reviews are public and tied to your verified order.
          </p>
          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="button" onClick={onSubmit as unknown as React.MouseEventHandler<HTMLButtonElement>} variant="hero" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Submitting…
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Post review
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}