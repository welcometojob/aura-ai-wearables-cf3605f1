import { useState } from "react";
import { Coins, Plus, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

type Props = {
  credits: number;
  onTopUp?: (amount: number) => Promise<void> | void;
};

const PRESETS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const PRICE_PER_CREDIT = 3;

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
        toast.info(
          `Checkout for ${amount} credit${amount > 1 ? "s" : ""} ($${amount * PRICE_PER_CREDIT}) — payment integration coming soon.`,
        );
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
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
      </DialogTrigger>
      <DialogContent className="max-w-2xl overflow-hidden border-border/60 bg-background p-0">
        {/* Hero */}
        <div className="relative overflow-hidden border-b border-border/60 bg-gradient-to-br from-primary/20 via-primary/5 to-transparent px-8 py-7">
          <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-10 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
          <div className="relative flex items-start justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary">
                <Sparkles className="h-3 w-3" />
                Top up credits
              </div>
              <h2 className="mt-3 text-2xl font-bold tracking-tight">Power up your creations</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Each credit generates one AI image. ${PRICE_PER_CREDIT} per credit, no subscription.
              </p>
            </div>
            <div className="shrink-0 rounded-xl border border-border/60 bg-background/70 px-4 py-3 text-right backdrop-blur">
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Balance</p>
              <p className="mt-0.5 flex items-center justify-end gap-1.5 text-xl font-bold tabular-nums">
                <Coins className="h-4 w-4 text-primary" />
                {credits.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-8 py-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Choose a pack</p>
          <div className="mt-3 grid grid-cols-5 gap-2">
            {PRESETS.map((n) => {
              const popular = n === 5;
              return (
                <button
                  key={n}
                  type="button"
                  disabled={busy}
                  onClick={() => handle(n)}
                  className={`group relative flex flex-col items-center justify-center rounded-xl border bg-card/40 px-2 py-3 transition hover:-translate-y-0.5 hover:border-primary hover:bg-primary/10 hover:shadow-[0_8px_24px_-12px_hsl(var(--primary)/0.5)] disabled:opacity-50 ${
                    popular ? "border-primary/60 bg-primary/5" : "border-border"
                  }`}
                >
                  {popular && (
                    <span className="absolute -top-2 rounded-full bg-primary px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-primary-foreground">
                      Popular
                    </span>
                  )}
                  <span className="text-lg font-bold tabular-nums">{n}</span>
                  <span className="text-[10px] text-muted-foreground">credit{n > 1 ? "s" : ""}</span>
                  <span className="mt-1 text-[11px] font-semibold text-primary">${n * PRICE_PER_CREDIT}</span>
                </button>
              );
            })}
          </div>

          <div className="mt-6 rounded-xl border border-border/60 bg-card/30 p-4">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Custom amount
            </label>
            <div className="mt-2 flex items-center gap-2">
              <div className="relative flex-1">
                <Coins className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="number"
                  min={1}
                  value={custom}
                  onChange={(e) => setCustom(e.target.value)}
                  placeholder="Enter credits (e.g. 25)"
                  className="h-11 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <button
                type="button"
                disabled={busy || !custom || Number(custom) <= 0}
                onClick={() => handle(parseInt(custom, 10))}
                className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-[0_8px_20px_-8px_hsl(var(--primary)/0.6)] transition hover:opacity-90 disabled:opacity-50"
              >
                {busy ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    Buy {custom && Number(custom) > 0 ? `· $${Number(custom) * PRICE_PER_CREDIT}` : ""}
                  </>
                )}
              </button>
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground">
              Secure checkout. Credits are added instantly to your balance.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}