import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Search, Loader2, CheckCircle2, Circle } from "lucide-react";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { lookupOrder, ORDER_STAGES, type Order } from "@/lib/orders";
import { toast } from "sonner";

export const Route = createFileRoute("/orders/track")({
  head: () => ({
    meta: [
      { title: "Order Tracking — TommyMeow" },
      { name: "description", content: "Track your TommyMeow order in real time." },
    ],
  }),
  component: OrderTrackPage,
});

function OrderTrackPage() {
  const [orderNumber, setOrderNumber] = useState("");
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderNumber.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const o = await lookupOrder(orderNumber);
      setOrder(o);
      if (!o) toast.error("Order not found. Double-check the number.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Lookup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pb-20">
      <header className="border-b border-border/60">
        <div className="mx-auto max-w-3xl px-6 py-5 flex items-center justify-between">
          <Button variant="ghostNeon" size="sm" asChild>
            <Link to="/"><ArrowLeft className="h-4 w-4" /> Back to home</Link>
          </Button>
          <LanguageSwitcher variant="compact" />
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-6 mt-10">
        <div className="glass rounded-3xl p-8 sm:p-12">
          <h1 className="text-3xl font-bold tracking-tight">Track your order</h1>
          <p className="mt-2 text-sm text-muted-foreground">Enter the order number from your confirmation email (e.g. ORD-XXXXXXXXXX).</p>
          <form onSubmit={handleSubmit} className="mt-6 flex gap-2">
            <Input value={orderNumber} onChange={(e) => setOrderNumber(e.target.value)} placeholder="ORD-..." className="flex-1" />
            <Button type="submit" variant="hero" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              Track
            </Button>
          </form>

          {searched && !loading && !order && (
            <p className="mt-6 text-sm text-muted-foreground">No order matches that number.</p>
          )}

          {order && (
            <div className="mt-8 space-y-6">
              <div className="rounded-xl border border-border bg-card/40 p-5">
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Order</div>
                <div className="mt-1 text-lg font-semibold">{order.orderNumber}</div>
                {order.itemSummary && <div className="mt-1 text-sm text-muted-foreground">{order.itemSummary}</div>}
                <div className="mt-2 text-xs text-muted-foreground">Placed {new Date(order.createdAt).toLocaleDateString()}</div>
              </div>
              <ol className="space-y-3">
                {ORDER_STAGES.map((stage, i) => {
                  const done = i <= order.stage;
                  const current = i === order.stage;
                  return (
                    <li key={stage} className={`flex items-center gap-3 rounded-lg border p-3 ${current ? "border-primary bg-primary/5" : "border-border"}`}>
                      {done ? <CheckCircle2 className="h-5 w-5 text-primary" /> : <Circle className="h-5 w-5 text-muted-foreground" />}
                      <span className={`text-sm ${done ? "font-semibold text-foreground" : "text-muted-foreground"}`}>{stage}</span>
                    </li>
                  );
                })}
              </ol>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
