import { useState } from "react";
import { Star, Loader2, Upload, X, ImagePlus } from "lucide-react";
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
      <DialogContent className="max-w-2xl glass border-primary/30">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            Share your <span className="text-gradient">experience</span>
          </DialogTitle>
          <DialogDescription>
            Help other creators discover what you loved. Verified reviews build trust.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-5 mt-2">
          {/* Rating */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Your rating</Label>
            <div className="flex items-center gap-2">
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
                    className="p-1 hover:scale-110 transition-transform"
                  >
                    <Star
                      className={`h-7 w-7 transition-colors ${
                        filled ? "fill-primary text-primary" : "text-muted-foreground/40"
                      }`}
                    />
                  </button>
                );
              })}
              <span className="ml-2 text-sm text-muted-foreground">
                {rating} of 5
              </span>
            </div>
          </div>

          <div>
            <Label htmlFor="r-title" className="text-sm font-medium">Review title</Label>
            <Input
              id="r-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Sum it up in one line"
              maxLength={120}
              className="mt-1.5"
              required
            />
          </div>

          <div>
            <Label htmlFor="r-text" className="text-sm font-medium">Your review</Label>
            <Textarea
              id="r-text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="What did you like? How was the print quality, fit, and delivery?"
              maxLength={2000}
              rows={5}
              className="mt-1.5 resize-none"
              required
            />
            <div className="text-xs text-muted-foreground mt-1 text-right">
              {text.length}/2000
            </div>
          </div>

          <div>
            <Label htmlFor="r-variant" className="text-sm font-medium">
              Product / variant <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Input
              id="r-variant"
              value={variant}
              onChange={(e) => setVariant(e.target.value)}
              placeholder="e.g. Black · Large"
              maxLength={80}
              className="mt-1.5"
            />
          </div>

          {/* Images */}
          <div>
            <Label className="text-sm font-medium mb-2 block">
              Photos <span className="text-muted-foreground font-normal">(up to {MAX_IMAGES})</span>
            </Label>
            <div className="grid grid-cols-4 gap-2">
              {previews.map((src, i) => (
                <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-border/60 group">
                  <img src={src} alt={`upload preview ${i + 1}`} className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeFile(i)}
                    aria-label="Remove image"
                    className="absolute top-1 right-1 h-6 w-6 grid place-items-center rounded-full bg-background/90 border border-border opacity-0 group-hover:opacity-100 hover:text-destructive transition"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              {files.length < MAX_IMAGES && (
                <label className="aspect-square rounded-lg border-2 border-dashed border-border hover:border-primary/60 hover:bg-primary/5 transition cursor-pointer grid place-items-center text-muted-foreground hover:text-primary">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={onPickFiles}
                    className="hidden"
                  />
                  <div className="text-center">
                    <ImagePlus className="h-5 w-5 mx-auto" />
                    <span className="text-[10px] mt-1 block">Add</span>
                  </div>
                </label>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-2">JPG / PNG, max {MAX_SIZE_MB}MB each</p>
          </div>

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" variant="hero" disabled={submitting}>
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
        </form>
      </DialogContent>
    </Dialog>
  );
}