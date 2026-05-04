import { useState } from "react";
import { Coins, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

type Props = {
  credits: number;
  onTopUp?: (amount: number) => Promise<void> | void;
};

const PRESETS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export function CreditsTopUp({ credits, onTopUp }: Props) {
  const [open, setOpen] = useState(false);
  const [custom, setCustom] = useState("");
  const [busy, setBusy] = useState(false);

  const handle = async (amount: number) => {
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    setBusy(true);
    try {
      if (onTopUp) {
        await onTopUp(amount);
      } else {
        toast.success(`Top-up of ${amount} credit${amount > 1 ? "s" : ""} requested`);
      }
      setOpen(false);
      setCustom("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Top up failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Credits — top up"
          title="Top up credits"
          className="inline-flex h-9 items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 pl-2.5 pr-1 text-xs font-semibold text-primary transition hover:border-primary hover:bg-primary/20"
        >
          <Coins className="h-3.5 w-3.5" />
          <span className="tabular-nums">{credits.toLocaleString()}</span>
          <span className="ml-1 grid h-6 w-6 place-items-center rounded-full bg-primary text-primary-foreground">
            <Plus className="h-3 w-3" />
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 p-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Top up credits</p>
          <span className="text-[10px] text-muted-foreground">Balance: {credits}</span>
        </div>
        <div className="mt-2 grid grid-cols-5 gap-1.5">
          {PRESETS.map((n) => (
            <button
              key={n}
              type="button"
              disabled={busy}
              onClick={() => handle(n)}
              className="h-8 rounded-md border border-border bg-background/40 text-xs font-semibold transition hover:border-primary hover:bg-primary/10 hover:text-primary disabled:opacity-50"
            >
              {n}
            </button>
          ))}
        </div>
        <div className="mt-3">
          <label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Custom amount</label>
          <div className="mt-1 flex gap-1.5">
            <input
              type="number"
              min={1}
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              placeholder="e.g. 25"
              className="h-8 w-full rounded-md border border-border bg-background/60 px-2 text-xs focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <button
              type="button"
              disabled={busy || !custom}
              onClick={() => handle(parseInt(custom, 10))}
              className="inline-flex h-8 shrink-0 items-center justify-center gap-1 rounded-md bg-primary px-3 text-xs font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
            >
              {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : "Buy"}
            </button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}