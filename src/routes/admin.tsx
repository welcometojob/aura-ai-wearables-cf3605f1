import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Plus, Trash2, Upload, Sparkles, Lock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  addAdminProduct,
  deleteAdminProduct,
  loadAdminProducts,
  type AdminProduct,
} from "@/lib/admin-products";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin Dashboard — Aura Wear" },
      { name: "description", content: "Manage gallery products for Aura Wear." },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const { user, isAdmin, loading } = useAuth();
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("T-Shirt");
  const [tags, setTags] = useState("");
  const [image, setImage] = useState<string>("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isAdmin) setProducts(loadAdminProducts());
  }, [isAdmin]);

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen grid place-items-center px-6">
        <div className="glass rounded-3xl p-10 max-w-md text-center">
          <div className="h-12 w-12 mx-auto rounded-xl bg-gradient-to-br from-primary/20 to-accent/10 ring-1 ring-primary/40 grid place-items-center mb-4">
            <Lock className="h-5 w-5 text-primary" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Admin access only</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {user
              ? "Your account doesn't have admin privileges. Contact the site owner to be added."
              : "Please sign in with an admin account to manage products."}
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Button variant="hero" asChild>
              <Link to={user ? "/" : "/auth"}>{user ? "Back to home" : "Sign in"}</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const onFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => setImage(String(reader.result));
    reader.readAsDataURL(file);
  };

  const reset = () => {
    setName("");
    setPrice("");
    setDescription("");
    setCategory("T-Shirt");
    setTags("");
    setImage("");
    if (fileRef.current) fileRef.current.value = "";
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !price.trim() || !image) return;
    addAdminProduct({
      name: name.trim(),
      price: price.trim(),
      description: description.trim(),
      category: category.trim(),
      tags: tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      image,
    });
    setProducts(loadAdminProducts());
    reset();
  };

  const onDelete = (id: string) => {
    deleteAdminProduct(id);
    setProducts(loadAdminProducts());
  };

  return (
    <div className="min-h-screen pb-20">
      <header className="border-b border-border/60">
        <div className="mx-auto max-w-7xl px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-primary to-accent grid place-items-center glow-soft">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <div className="font-bold tracking-tight">Aura Admin</div>
              <div className="text-xs text-muted-foreground">Gallery products</div>
            </div>
          </div>
          <Button variant="ghostNeon" size="sm" asChild>
            <Link to="/">
              <ArrowLeft className="h-4 w-4" />
              Back to site
            </Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 mt-10 grid lg:grid-cols-5 gap-8">
        <section className="lg:col-span-2">
          <div className="glass rounded-2xl p-6">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Plus className="h-4 w-4 text-primary" />
              Add new product
            </h2>
            <form onSubmit={onSubmit} className="mt-5 space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Image</label>
                <div
                  className="mt-1.5 relative rounded-xl border border-dashed border-border/60 bg-background/40 hover:border-primary/60 transition aspect-[4/5] overflow-hidden grid place-items-center cursor-pointer"
                  onClick={() => fileRef.current?.click()}
                >
                  {image ? (
                    <img src={image} alt="preview" className="h-full w-full object-cover" />
                  ) : (
                    <div className="text-center text-muted-foreground text-sm">
                      <Upload className="h-6 w-6 mx-auto mb-2" />
                      Click to upload
                    </div>
                  )}
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) onFile(f);
                    }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Name</label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Neon Koi"
                    className="mt-1.5"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Price</label>
                  <Input
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="$36"
                    className="mt-1.5"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Category</label>
                <Input
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="T-Shirt"
                  className="mt-1.5"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Description</label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Premium cotton tee with neon koi print."
                  className="mt-1.5"
                  rows={3}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">
                  Tags (comma separated)
                </label>
                <Input
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="neon, koi, streetwear"
                  className="mt-1.5"
                />
              </div>
              <Button type="submit" variant="hero" className="w-full" disabled={!image}>
                Add product
              </Button>
            </form>
          </div>
        </section>

        <section className="lg:col-span-3">
          <div className="flex items-end justify-between mb-5">
            <div>
              <h2 className="text-lg font-semibold">Products ({products.length})</h2>
              <p className="text-xs text-muted-foreground">
                Stored locally in this browser. Connect a database later for multi-device sync.
              </p>
            </div>
          </div>
          {products.length === 0 ? (
            <div className="glass rounded-2xl p-10 text-center text-muted-foreground">
              No products yet. Add your first product on the left.
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {products.map((p) => (
                <div key={p.id} className="group glass rounded-2xl overflow-hidden">
                  <div className="relative aspect-[4/5] overflow-hidden bg-secondary">
                    <img src={p.image} alt={p.name} className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => onDelete(p.id)}
                      aria-label="Delete"
                      className="absolute top-2 right-2 h-8 w-8 grid place-items-center rounded-lg bg-background/80 backdrop-blur border border-border/60 hover:border-destructive hover:text-destructive transition"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-medium text-sm truncate">{p.name}</div>
                      <div className="text-primary text-sm font-semibold shrink-0">{p.price}</div>
                    </div>
                    {p.category && (
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">
                        {p.category}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}