import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, LogOut, Mail, User as UserIcon, Sparkles, Package, Coins, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";
import { useGenerationHistory } from "@/hooks/use-generation-history";

type Tx = {
  id: string;
  amount: number;
  type: string;
  note: string | null;
  created_at: string;
};

type OrderRow = {
  id: string;
  order_number: string;
  item_summary: string | null;
  stage: number;
  created_at: string;
};

const STAGES = [
  "Order placed",
  "In production",
  "Shipped",
  "Out for delivery",
  "Delivered",
];

export function ProfileDialog({
  open,
  onOpenChange,
  onPickArtwork,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onPickArtwork?: (url: string) => void;
}) {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [txs, setTxs] = useState<Tx[]>([]);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const { items: generations, remove: removeGen, clear: clearGen } = useGenerationHistory();

  useEffect(() => {
    if (!open || !user) return;
    setLoading(true);
    Promise.all([
      supabase
        .from("credit_transactions")
        .select("id,amount,type,note,created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20),
      user.email
        ? supabase
            .from("orders")
            .select("id,order_number,item_summary,stage,created_at")
            .eq("customer_email", user.email)
            .order("created_at", { ascending: false })
            .limit(20)
        : Promise.resolve({ data: [] as OrderRow[], error: null }),
    ])
      .then(([t, o]) => {
        setTxs(((t.data ?? []) as Tx[]) || []);
        setOrders(((o.data ?? []) as OrderRow[]) || []);
      })
      .finally(() => setLoading(false));
  }, [open, user]);

  const handleSignOut = async () => {
    await signOut();
    onOpenChange(false);
    toast.success("Signed out");
    void navigate({ to: "/" });
  };

  const generations = txs.filter((t) => t.type === "generation");

  if (!user) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Your Account</SheetTitle>
        </SheetHeader>

        <div className="space-y-5">
          {/* Identity */}
          <div className="flex items-center gap-3 rounded-lg border border-border bg-card/40 p-3">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-primary to-accent text-primary-foreground">
              <UserIcon className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">
                {profile?.display_name || user.email?.split("@")[0]}
              </p>
              <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                <Mail className="h-3 w-3" /> {user.email}
              </p>
            </div>
            <button
              type="button"
              onClick={handleSignOut}
              className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1 text-[11px] text-muted-foreground hover:border-destructive hover:text-destructive"
            >
              <LogOut className="h-3 w-3" /> Sign out
            </button>
          </div>

          {/* Plan + Credits */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-border bg-card/40 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Plan</p>
              <p className="mt-1 text-sm font-bold capitalize">{profile?.plan ?? "free"}</p>
              {profile?.plan_renews_at && (
                <p className="mt-0.5 text-[10px] text-muted-foreground">
                  Renews {new Date(profile.plan_renews_at).toLocaleDateString()}
                </p>
              )}
            </div>
            <div className="rounded-lg border border-border bg-card/40 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Credits</p>
              <p className="mt-1 inline-flex items-center gap-1 text-sm font-bold">
                <Coins className="h-3.5 w-3.5 text-primary" />
                {profile?.credits_remaining ?? 0}
              </p>
            </div>
          </div>

          {/* Generated images gallery (localStorage) */}
          <section>
            <div className="mb-2 flex items-center justify-between">
              <h4 className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                <Sparkles className="h-3 w-3 text-primary" /> Your generations ({generations.length})
              </h4>
              {generations.length > 0 && (
                <button
                  type="button"
                  onClick={() => clearGen()}
                  className="text-[10px] text-muted-foreground hover:text-destructive"
                >
                  Clear all
                </button>
              )}
            </div>
            {generations.length === 0 ? (
              <p className="rounded-md border border-dashed border-border bg-background/30 p-3 text-center text-[11px] text-muted-foreground">
                Your AI-generated images will appear here
              </p>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {generations.map((g) => (
                  <div
                    key={g.url}
                    className="group relative aspect-square overflow-hidden rounded-md border border-border bg-background/40 hover:border-primary"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        onPickArtwork?.(g.url);
                        onOpenChange(false);
                        toast.success("Applied to mockup");
                      }}
                      title={g.prompt}
                      className="block h-full w-full"
                    >
                      <img src={g.url} alt={g.prompt} className="h-full w-full object-cover" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeGen(g.url);
                      }}
                      aria-label="Remove"
                      className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded bg-background/80 text-muted-foreground opacity-0 backdrop-blur transition group-hover:opacity-100 hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {loading ? (
            <div className="flex h-20 items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {/* Orders */}
              <section>
                <h4 className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <Package className="h-3 w-3 text-primary" /> Order history
                </h4>
                {orders.length === 0 ? (
                  <p className="rounded-md border border-dashed border-border bg-background/30 p-3 text-center text-[11px] text-muted-foreground">
                    No orders yet
                  </p>
                ) : (
                  <ul className="divide-y divide-border rounded-md border border-border">
                    {orders.map((o) => (
                      <li key={o.id} className="p-2.5 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-semibold">{o.order_number}</span>
                          <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] text-primary">
                            {STAGES[o.stage] ?? "Unknown"}
                          </span>
                        </div>
                        {o.item_summary && (
                          <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{o.item_summary}</p>
                        )}
                        <p className="mt-0.5 text-[10px] text-muted-foreground">
                          {new Date(o.created_at).toLocaleString()}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}