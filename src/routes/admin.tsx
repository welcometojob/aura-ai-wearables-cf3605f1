import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ArrowLeft, Plus, Trash2, Upload, Sparkles, Lock, Loader2, Shirt, Package, ClipboardList, Check, FileText, Settings as SettingsIcon, Save, ArrowUp, ArrowDown, X, MessageCircle, Tag, Download, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  addProduct,
  deleteProduct,
  fetchProducts,
  uploadProductImage,
  type AdminProduct,
} from "@/lib/admin-products";
import brandIcon from "@/assets/tommymeow-icon.png";
import {
  addReadyDesign,
  deleteReadyDesign,
  fetchReadyDesigns,
  uploadReadyDesignImage,
  type ReadyDesign,
} from "@/lib/ready-designs";
import { useAuth } from "@/hooks/use-auth";
import {
  ORDER_STAGES,
  createOrder,
  deleteOrder,
  fetchOrders,
  updateOrderStage,
  type Order,
  type OrderItemDetail,
  type OrderShippingAddress,
} from "@/lib/orders";
import { listSitePages, upsertSitePage, type SitePage } from "@/lib/cms";
import { getShippingRates, setShippingRates } from "@/lib/site-settings";
import { getSocialLinks, setSocialLinks, type SocialLinks } from "@/lib/social-links";
import { createCoupon, deleteCoupon, fetchAllCoupons, updateCoupon, type Coupon } from "@/lib/coupons";
import { listProductStyles, updateProductStyle, addProductStyle, deleteProductStyle, type ProductStyleRow } from "@/lib/product-styles";
import { COLORS } from "@/lib/aura-config";
import { LiveChatInbox } from "@/components/admin/LiveChatInbox";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin Dashboard — TommyMeow" },
      { name: "description", content: "Manage gallery products for TommyMeow." },
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
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isAdmin) return;
    fetchProducts()
      .then(setProducts)
      .catch((e) => toast.error(e instanceof Error ? e.message : "Failed to load products"));
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

  const onFiles = (files: FileList | null) => {
    const nextFiles = Array.from(files ?? []);
    if (nextFiles.length === 0) return;
    setImageFiles((prev) => [...prev, ...nextFiles]);
    nextFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => setImagePreviews((prev) => [...prev, String(reader.result)]);
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const moveImage = (index: number, direction: -1 | 1) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= imageFiles.length) return;
    setImageFiles((prev) => {
      const next = [...prev];
      [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
      return next;
    });
    setImagePreviews((prev) => {
      const next = [...prev];
      [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
      return next;
    });
  };

  const reset = () => {
    setName("");
    setPrice("");
    setDescription("");
    setCategory("T-Shirt");
    setTags("");
    setImageFiles([]);
    setImagePreviews([]);
    setSelectedColors([]);
    setSeoTitle("");
    setSeoDescription("");
    if (fileRef.current) fileRef.current.value = "";
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !price.trim() || imageFiles.length === 0 || !user) return;
    setSubmitting(true);
    try {
      const images = await Promise.all(imageFiles.map((file) => uploadProductImage(file, user.id)));
      const created = await addProduct({
        name: name.trim(),
        price: price.trim(),
        description: description.trim(),
        category: category.trim(),
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
        colors: selectedColors,
        images,
        seo_title: seoTitle.trim(),
        seo_description: seoDescription.trim(),
      });
      setProducts((prev) => [created, ...prev]);
      toast.success("Product added");
      reset();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add product");
    } finally {
      setSubmitting(false);
    }
  };

  const onDelete = async (id: string) => {
    try {
      await deleteProduct(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
      toast.success("Deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    }
  };

  return (
    <div className="min-h-screen pb-20">
      <header className="border-b border-border/60">
        <div className="mx-auto max-w-7xl px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={brandIcon} alt="TommyMeow" className="h-9 w-9" />
            <div>
              <div className="font-bold tracking-tight">TommyMeow Admin</div>
              <div className="text-xs text-muted-foreground">Gallery products</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher variant="compact" />
            <Button variant="ghostNeon" size="sm" asChild>
              <Link to="/">
                <ArrowLeft className="h-4 w-4" />
                Back to site
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 mt-8">
        <Tabs defaultValue="products">
          <TabsList className="mb-6">
            <TabsTrigger value="products">
              <Package className="h-4 w-4" /> Products
            </TabsTrigger>
            <TabsTrigger value="designs">
              <Shirt className="h-4 w-4" /> Ready Designs
            </TabsTrigger>
            <TabsTrigger value="orders">
              <ClipboardList className="h-4 w-4" /> Orders
            </TabsTrigger>
            <TabsTrigger value="coupons">
              <Tag className="h-4 w-4" /> Coupons
            </TabsTrigger>
            <TabsTrigger value="chat">
              <MessageCircle className="h-4 w-4" /> Live Chat
            </TabsTrigger>
            <TabsTrigger value="styles">
              <Shirt className="h-4 w-4" /> Product Styles
            </TabsTrigger>
            <TabsTrigger value="pages">
              <FileText className="h-4 w-4" /> Pages
            </TabsTrigger>
            <TabsTrigger value="settings">
              <SettingsIcon className="h-4 w-4" /> Settings
            </TabsTrigger>
          </TabsList>
          <TabsContent value="products" className="grid lg:grid-cols-5 gap-8">
        <section className="lg:col-span-2">
          <div className="glass rounded-2xl p-6">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Plus className="h-4 w-4 text-primary" />
              Add new product
            </h2>
            <form onSubmit={onSubmit} className="mt-5 space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Images</label>
                <div
                  className="mt-1.5 relative rounded-xl border border-dashed border-border/60 bg-background/40 hover:border-primary/60 transition min-h-40 overflow-hidden grid place-items-center cursor-pointer p-4"
                  onClick={() => fileRef.current?.click()}
                >
                  <div className="text-center text-muted-foreground text-sm">
                    <Upload className="h-6 w-6 mx-auto mb-2" />
                    Click to upload product images
                  </div>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => onFiles(e.target.files)}
                  />
                </div>
                {imagePreviews.length > 0 && (
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    {imagePreviews.map((src, index) => (
                      <div key={`${src}-${index}`} className="relative rounded-xl border border-border/60 bg-background/40 overflow-hidden">
                        <div className="aspect-square">
                          <img src={src} alt={`Product preview ${index + 1}`} className="h-full w-full object-cover" />
                        </div>
                        <div className="absolute top-2 left-2 rounded-full bg-background/80 px-2 py-0.5 text-[10px] font-medium text-foreground">
                          {index + 1}
                        </div>
                        <div className="absolute top-2 right-2 flex gap-1">
                          <button
                            type="button"
                            aria-label="Move image up"
                            onClick={() => moveImage(index, -1)}
                            disabled={index === 0}
                            className="grid h-7 w-7 place-items-center rounded-full bg-background/80 text-foreground transition hover:text-primary disabled:opacity-40"
                          >
                            <ArrowUp className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            aria-label="Move image down"
                            onClick={() => moveImage(index, 1)}
                            disabled={index === imagePreviews.length - 1}
                            className="grid h-7 w-7 place-items-center rounded-full bg-background/80 text-foreground transition hover:text-primary disabled:opacity-40"
                          >
                            <ArrowDown className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            aria-label="Remove image"
                            onClick={() => removeImage(index)}
                            className="grid h-7 w-7 place-items-center rounded-full bg-background/80 text-foreground transition hover:text-destructive"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
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
              <div className="rounded-xl border border-border/60 bg-background/30 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-semibold uppercase tracking-widest text-primary">Product color variants</div>
                  <div className="text-[10px] text-muted-foreground">{selectedColors.length} selected</div>
                </div>
                <p className="text-[11px] text-muted-foreground">Pick which colors customers can choose on this product page. Leave empty to hide the color picker entirely.</p>
                <div className="flex flex-wrap gap-2">
                  {COLORS.map((c) => {
                    const active = selectedColors.includes(c.id);
                    return (
                      <button
                        key={c.id}
                        type="button"
                        aria-label={c.name}
                        aria-pressed={active}
                        title={c.name}
                        onClick={() => setSelectedColors((prev) => active ? prev.filter((x) => x !== c.id) : [...prev, c.id])}
                        className={`h-8 w-8 rounded-full border-2 transition ${active ? "border-primary scale-110 ring-2 ring-primary/40" : "border-border hover:border-primary/60"}`}
                        style={{ backgroundColor: c.hex }}
                      />
                    );
                  })}
                </div>
              </div>
              <div className="rounded-xl border border-border/60 bg-background/30 p-4 space-y-3">
                <div className="text-xs font-semibold uppercase tracking-widest text-primary">SEO (optional)</div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">SEO title</label>
                  <Input
                    value={seoTitle}
                    onChange={(e) => setSeoTitle(e.target.value)}
                    placeholder="Neon Koi T-Shirt — Premium Streetwear | TommyMeow"
                    className="mt-1.5"
                    maxLength={70}
                  />
                  <div className="text-[10px] text-muted-foreground mt-1">{seoTitle.length}/70 — shown in browser tab & Google results</div>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">SEO description</label>
                  <Textarea
                    value={seoDescription}
                    onChange={(e) => setSeoDescription(e.target.value)}
                    placeholder="Soft cotton tee with a vibrant neon koi print. Free shipping & returns."
                    className="mt-1.5"
                    rows={2}
                    maxLength={160}
                  />
                  <div className="text-[10px] text-muted-foreground mt-1">{seoDescription.length}/160 — shown in Google results & link previews</div>
                </div>
              </div>
              <Button type="submit" variant="hero" className="w-full" disabled={imageFiles.length === 0 || submitting}>
                {submitting ? (<><Loader2 className="h-4 w-4 animate-spin" /> Saving…</>) : "Add product"}
              </Button>
            </form>
          </div>
        </section>

        <section className="lg:col-span-3">
          <div className="flex items-end justify-between mb-5">
            <div>
              <h2 className="text-lg font-semibold">Products ({products.length})</h2>
              <p className="text-xs text-muted-foreground">
                Synced live to all visitors via Supabase.
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
          </TabsContent>
          <TabsContent value="designs">
            <ReadyDesignsManager userId={user.id} />
          </TabsContent>
          <TabsContent value="orders">
            <OrdersManager />
          </TabsContent>
          <TabsContent value="coupons">
            <CouponsManager />
          </TabsContent>
          <TabsContent value="chat">
            <LiveChatInbox />
          </TabsContent>
          <TabsContent value="styles">
            <ProductStylesManager />
          </TabsContent>
          <TabsContent value="pages">
            <SitePagesManager />
          </TabsContent>
          <TabsContent value="settings">
            <SiteSettingsManager />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function ReadyDesignsManager({ userId }: { userId: string }) {
  const [designs, setDesigns] = useState<ReadyDesign[]>([]);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchReadyDesigns()
      .then(setDesigns)
      .catch((e) => toast.error(e instanceof Error ? e.message : "Failed to load designs"));
  }, []);

  const onFile = (f: File) => {
    setFile(f);
    const reader = new FileReader();
    reader.onload = () => setPreview(String(reader.result));
    reader.readAsDataURL(f);
  };

  const reset = () => {
    setName(""); setCategory(""); setTags(""); setFile(null); setPreview("");
    if (fileRef.current) fileRef.current.value = "";
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !file) return;
    setSubmitting(true);
    try {
      const image_url = await uploadReadyDesignImage(file, userId);
      const created = await addReadyDesign({
        name: name.trim(),
        category: category.trim(),
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
        image_url,
      });
      setDesigns((prev) => [created, ...prev]);
      toast.success("Design uploaded");
      reset();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to upload design");
    } finally {
      setSubmitting(false);
    }
  };

  const onDelete = async (id: string) => {
    try {
      await deleteReadyDesign(id);
      setDesigns((prev) => prev.filter((d) => d.id !== id));
      toast.success("Deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    }
  };

  return (
    <div className="grid lg:grid-cols-5 gap-8">
      <section className="lg:col-span-2">
        <div className="glass rounded-2xl p-6">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Shirt className="h-4 w-4 text-primary" /> Upload ready design
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            PNG with transparent background works best (these appear in the editor's Style Library).
          </p>
          <form onSubmit={onSubmit} className="mt-5 space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground">PNG file</label>
              <div
                className="mt-1.5 relative rounded-xl border border-dashed border-border/60 bg-background/40 hover:border-primary/60 transition aspect-square overflow-hidden grid place-items-center cursor-pointer"
                onClick={() => fileRef.current?.click()}
              >
                {preview ? (
                  <img src={preview} alt="preview" className="h-full w-full object-contain" />
                ) : (
                  <div className="text-center text-muted-foreground text-sm">
                    <Upload className="h-6 w-6 mx-auto mb-2" /> Click to upload PNG
                  </div>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/png,image/*"
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }}
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Name</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Neon Tiger" className="mt-1.5" required />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Category</label>
              <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Streetwear" className="mt-1.5" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Tags (comma separated)</label>
              <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="anime, neon, bold" className="mt-1.5" />
            </div>
            <Button type="submit" variant="hero" className="w-full" disabled={!file || submitting}>
              {submitting ? (<><Loader2 className="h-4 w-4 animate-spin" /> Uploading…</>) : "Upload design"}
            </Button>
          </form>
        </div>
      </section>

      <section className="lg:col-span-3">
        <div className="flex items-end justify-between mb-5">
          <div>
            <h2 className="text-lg font-semibold">Ready Designs ({designs.length})</h2>
            <p className="text-xs text-muted-foreground">Visible to all users in the editor's Style Library.</p>
          </div>
        </div>
        {designs.length === 0 ? (
          <div className="glass rounded-2xl p-10 text-center text-muted-foreground">
            No designs yet. Upload your first PNG on the left.
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {designs.map((d) => (
              <div key={d.id} className="group glass rounded-2xl overflow-hidden">
                <div className="relative aspect-square overflow-hidden bg-secondary/40">
                  <img src={d.image} alt={d.name} className="h-full w-full object-contain" />
                  <button
                    type="button"
                    onClick={() => onDelete(d.id)}
                    aria-label="Delete"
                    className="absolute top-2 right-2 h-8 w-8 grid place-items-center rounded-lg bg-background/80 backdrop-blur border border-border/60 hover:border-destructive hover:text-destructive transition"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="p-3">
                  <div className="font-medium text-sm truncate">{d.name}</div>
                  {d.category && (
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">
                      {d.category}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function httpsUrls(urls: string[]) {
  return urls.filter((url) => /^https?:\/\//.test(url));
}

function addressLines(address: OrderShippingAddress | null, order: Order) {
  if (!address) return [];
  return [
    address.name || order.customerName || "",
    address.phone || order.customerPhone || "",
    address.email || order.customerEmail || "",
    [address.address1, address.address2].filter(Boolean).join(", "),
    [address.city, address.state, address.zip].filter(Boolean).join(", "),
    address.country || "",
  ].filter(Boolean);
}

async function copyAddress(address: OrderShippingAddress | null, order: Order) {
  const text = addressLines(address, order).join("\n");
  if (!text) return toast.error("No address to copy");
  await navigator.clipboard.writeText(text);
  toast.success("Address copied");
}

async function downloadArtwork(url: string, filename: string) {
  const response = await fetch(url);
  if (!response.ok) throw new Error("Failed to download image");
  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
}

async function downloadAllArtwork(order: Order, urls: string[]) {
  try {
    for (const [index, url] of urls.entries()) {
      await downloadArtwork(url, `${order.orderNumber}-design-${index + 1}.png`);
    }
    toast.success("Artwork downloads started");
  } catch (err) {
    toast.error(err instanceof Error ? err.message : "Failed to download artwork");
  }
}

function OrdersManager() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [orderNumber, setOrderNumber] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [itemSummary, setItemSummary] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders()
      .then(setOrders)
      .catch((e) => toast.error(e instanceof Error ? e.message : "Failed to load orders"))
      .finally(() => setLoading(false));
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderNumber.trim()) return;
    setSubmitting(true);
    try {
      const created = await createOrder({
        orderNumber: orderNumber,
        customerName,
        customerEmail,
        itemSummary,
        notes,
      });
      setOrders((prev) => [created, ...prev]);
      toast.success("Order created");
      setOrderNumber(""); setCustomerName(""); setCustomerEmail(""); setItemSummary(""); setNotes("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create order");
    } finally {
      setSubmitting(false);
    }
  };

  const onSetStage = async (id: string, stage: number) => {
    setUpdating(id);
    try {
      await updateOrderStage(id, stage);
      setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, stage } : o)));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update stage");
    } finally {
      setUpdating(null);
    }
  };

  const onDelete = async (id: string) => {
    try {
      await deleteOrder(id);
      setOrders((prev) => prev.filter((o) => o.id !== id));
      toast.success("Order deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    }
  };

  return (
    <div className="grid lg:grid-cols-5 gap-8">
      <section className="lg:col-span-2">
        <div className="glass rounded-2xl p-6">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Plus className="h-4 w-4 text-primary" /> Create order
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Issue an order number to give your customer for tracking.
          </p>
          <form onSubmit={onSubmit} className="mt-5 space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Order number</label>
              <Input value={orderNumber} onChange={(e) => setOrderNumber(e.target.value)} placeholder="TM-2026-0001" className="mt-1.5" required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Customer name</label>
                <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="mt-1.5" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Email</label>
                <Input type="email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} className="mt-1.5" />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Item summary</label>
              <Input value={itemSummary} onChange={(e) => setItemSummary(e.target.value)} placeholder="Black Tee · L · Neon Koi" className="mt-1.5" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Notes</label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="mt-1.5" />
            </div>
            <Button type="submit" variant="hero" className="w-full" disabled={submitting}>
              {submitting ? (<><Loader2 className="h-4 w-4 animate-spin" /> Saving…</>) : "Create order"}
            </Button>
          </form>
        </div>
      </section>

      <section className="lg:col-span-3">
        <div className="flex items-end justify-between mb-5">
          <div>
            <h2 className="text-lg font-semibold">Orders ({orders.length})</h2>
            <p className="text-xs text-muted-foreground">Tick the next stage to update what the customer sees.</p>
          </div>
        </div>
        {loading ? (
          <div className="py-16 grid place-items-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : orders.length === 0 ? (
          <div className="glass rounded-2xl p-10 text-center text-muted-foreground">
            No orders yet. Create your first order on the left.
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((o) => {
              const address = o.shippingAddress;
              const items = o.itemDetails;
              const images = httpsUrls(o.artworkUrls);
              const invalidArtworkCount = o.artworkUrls.length - images.length;
              return (
              <div key={o.id} className="glass rounded-2xl p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-semibold text-sm">#{o.orderNumber}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {o.customerName || "—"}{o.customerEmail ? ` · ${o.customerEmail}` : ""}{o.customerPhone ? ` · ${o.customerPhone}` : ""}
                    </div>
                    {o.itemSummary && (
                      <div className="mt-1 text-xs text-muted-foreground truncate">{o.itemSummary}</div>
                    )}
                    <div className="mt-1 text-xs font-semibold text-foreground">
                      Total ${o.totalAmount.toFixed(2)}
                      {o.couponCode ? ` · Coupon ${o.couponCode} (-$${o.discountAmount.toFixed(2)})` : ""}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onDelete(o.id)}
                    className="h-8 w-8 grid place-items-center rounded-lg bg-background/60 border border-border/60 hover:border-destructive hover:text-destructive transition shrink-0"
                    aria-label="Delete order"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <details className="mt-4 rounded-xl border border-border/60 bg-card/40 p-4 text-xs">
                  <summary className="cursor-pointer font-semibold text-foreground">Details</summary>
                  <div className="mt-4 grid gap-4">
                  <div>
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <div className="font-semibold text-foreground">Shipping address</div>
                      <button
                        type="button"
                        onClick={() => copyAddress(address, o)}
                        className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[11px] text-muted-foreground hover:border-primary hover:text-primary"
                      >
                        <Copy className="h-3 w-3" /> Copy address
                      </button>
                    </div>
                    {address ? (
                      <div className="space-y-0.5 text-muted-foreground">
                        <div>{address.name || o.customerName || "—"}</div>
                        <div>
                          {(address.phone || o.customerPhone) ? <a className="hover:text-primary" href={`tel:${address.phone || o.customerPhone}`}>{address.phone || o.customerPhone}</a> : "—"}
                          {(address.email || o.customerEmail) ? <> · <a className="hover:text-primary" href={`mailto:${address.email || o.customerEmail}`}>{address.email || o.customerEmail}</a></> : null}
                        </div>
                        <div>{[address.address1, address.address2].filter(Boolean).join(", ") || "—"}</div>
                        <div>{[address.city, address.state, address.zip, address.country].filter(Boolean).join(", ") || "—"}</div>
                      </div>
                    ) : (
                      <div className="text-muted-foreground">No shipping address saved.</div>
                    )}
                  </div>
                  {items.length > 0 && (
                    <div>
                      <div className="mb-1 font-semibold text-foreground">Items</div>
                      <div className="overflow-x-auto rounded-lg border border-border/60">
                        <table className="w-full min-w-[420px] text-left">
                          <thead className="bg-background/40 text-[10px] uppercase tracking-wider text-muted-foreground">
                            <tr>
                              <th className="px-3 py-2">Item</th>
                              <th className="px-3 py-2 text-right">Qty</th>
                              <th className="px-3 py-2 text-right">Unit</th>
                              <th className="px-3 py-2 text-right">Line total</th>
                            </tr>
                          </thead>
                          <tbody>
                        {items.map((item, index) => (
                          <tr key={`${item.name}-${index}`} className="border-t border-border/60 text-muted-foreground">
                            <td className="px-3 py-2">{item.name}</td>
                            <td className="px-3 py-2 text-right">{item.quantity}</td>
                            <td className="px-3 py-2 text-right">${item.unitPrice.toFixed(2)}</td>
                            <td className="px-3 py-2 text-right">${(item.unitPrice * item.quantity).toFixed(2)}</td>
                          </tr>
                        ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                  <div className="flex items-end justify-between rounded-lg border border-border/60 bg-background/30 p-3">
                    <span className="text-muted-foreground">Total paid</span>
                    <span className="text-2xl font-bold text-foreground">${o.totalAmount.toFixed(2)}</span>
                  </div>
                  {(images.length > 0 || invalidArtworkCount > 0) && (
                    <div>
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <div className="font-semibold text-foreground">Design artwork</div>
                        {images.length > 0 && (
                          <button
                            type="button"
                            onClick={() => downloadAllArtwork(o, images)}
                            className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[11px] text-muted-foreground hover:border-primary hover:text-primary"
                          >
                            <Download className="h-3 w-3" /> Download all
                          </button>
                        )}
                      </div>
                      {invalidArtworkCount > 0 && (
                        <div className="mb-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-[11px] text-destructive">
                          {invalidArtworkCount} artwork image skipped because it is not a public HTTPS URL.
                        </div>
                      )}
                      <div className="flex flex-wrap gap-3">
                        {images.map((url, index) => (
                          <div key={url} className="w-24 overflow-hidden rounded-xl border border-border bg-background/40">
                            <a href={url} target="_blank" rel="noopener noreferrer" aria-label={`Open artwork ${index + 1}`}>
                              <img src={url} alt={`Artwork ${index + 1}`} className="h-20 w-full object-cover" />
                            </a>
                            <button
                              type="button"
                              onClick={() => downloadArtwork(url, `${o.orderNumber}-design-${index + 1}.png`).catch((err) => toast.error(err instanceof Error ? err.message : "Failed to download artwork"))}
                              className="block w-full border-t border-border px-2 py-1 text-center text-[11px] text-primary hover:bg-primary/10"
                            >
                              Download
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {o.customerNote && (
                    <div>
                      <div className="mb-1 font-semibold text-foreground">Customer note</div>
                      <div className="text-muted-foreground">{o.customerNote}</div>
                    </div>
                  )}
                  {o.stripeSessionId && (
                    <div className="break-all border-t border-border/60 pt-3 text-[10px] text-muted-foreground">
                      Stripe session: {o.stripeSessionId}
                    </div>
                  )}
                  </div>
                </details>
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {ORDER_STAGES.map((label, i) => {
                    const reached = i <= o.stage;
                    const isCurrent = i === o.stage;
                    return (
                      <button
                        key={label}
                        type="button"
                        disabled={updating === o.id}
                        onClick={() => onSetStage(o.id, i)}
                        className={`text-[11px] rounded-lg px-2 py-2 border flex items-center justify-center gap-1 transition ${
                          reached
                            ? "border-primary/50 bg-primary/15 text-foreground"
                            : "border-border/60 text-muted-foreground hover:border-primary/40"
                        } ${isCurrent ? "ring-1 ring-primary" : ""}`}
                      >
                        {reached && <Check className="h-3 w-3 text-primary" />}
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
function ProductStylesManager() {
  const [styles, setStyles] = useState<ProductStyleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [newSlug, setNewSlug] = useState("");
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newPrice, setNewPrice] = useState("");

  const load = () => {
    setLoading(true);
    listProductStyles().then(setStyles).catch((e) => toast.error(e.message)).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const onSave = async (s: ProductStyleRow) => {
    try {
      await updateProductStyle(s.id, { name: s.name, description: s.description, price: s.price, active: s.active, sort_order: s.sortOrder });
      toast.success("Saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    }
  };

  const onAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSlug.trim() || !newName.trim() || !newPrice.trim()) return;
    try {
      await addProductStyle({ slug: newSlug.trim(), name: newName.trim(), description: newDesc.trim(), price: Number(newPrice), sort_order: styles.length + 1 });
      toast.success("Style added");
      setNewSlug(""); setNewName(""); setNewDesc(""); setNewPrice("");
      load();
    } catch (err) { toast.error(err instanceof Error ? err.message : "Add failed"); }
  };

  const onDelete = async (id: string) => {
    if (!confirm("Delete this style?")) return;
    try { await deleteProductStyle(id); load(); } catch (e) { toast.error(e instanceof Error ? e.message : "Delete failed"); }
  };

  if (loading) return <Loader2 className="h-5 w-5 animate-spin text-primary" />;

  return (
    <div className="grid lg:grid-cols-5 gap-8">
      <section className="lg:col-span-2">
        <div className="glass rounded-2xl p-6">
          <h2 className="text-lg font-semibold flex items-center gap-2"><Plus className="h-4 w-4 text-primary" /> Add product style</h2>
          <form onSubmit={onAdd} className="mt-5 space-y-3">
            <div><label className="text-xs text-muted-foreground">Slug (unique key)</label><Input value={newSlug} onChange={(e) => setNewSlug(e.target.value)} placeholder="longsleeve" className="mt-1.5" /></div>
            <div><label className="text-xs text-muted-foreground">Name</label><Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Long Sleeve" className="mt-1.5" /></div>
            <div><label className="text-xs text-muted-foreground">Description</label><Input value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="Premium long sleeve" className="mt-1.5" /></div>
            <div><label className="text-xs text-muted-foreground">Price (USD)</label><Input value={newPrice} onChange={(e) => setNewPrice(e.target.value)} placeholder="42" type="number" step="0.01" className="mt-1.5" /></div>
            <Button type="submit" variant="hero" className="w-full">Add style</Button>
          </form>
        </div>
      </section>
      <section className="lg:col-span-3 space-y-3">
        {styles.map((s, idx) => (
          <div key={s.id} className="glass rounded-2xl p-5 grid sm:grid-cols-[1fr_120px_100px_auto_auto] gap-3 items-end">
            <div>
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Name</label>
              <Input value={s.name} onChange={(e) => setStyles((arr) => arr.map((x, i) => i === idx ? { ...x, name: e.target.value } : x))} className="mt-1" />
              <Input value={s.description} onChange={(e) => setStyles((arr) => arr.map((x, i) => i === idx ? { ...x, description: e.target.value } : x))} placeholder="Description" className="mt-2 text-xs" />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Price</label>
              <Input type="number" step="0.01" value={s.price} onChange={(e) => setStyles((arr) => arr.map((x, i) => i === idx ? { ...x, price: Number(e.target.value) } : x))} className="mt-1" />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Order</label>
              <Input type="number" value={s.sortOrder} onChange={(e) => setStyles((arr) => arr.map((x, i) => i === idx ? { ...x, sortOrder: Number(e.target.value) } : x))} className="mt-1" />
            </div>
            <Button size="sm" variant="hero" onClick={() => onSave(s)}><Save className="h-4 w-4" /> Save</Button>
            <Button size="sm" variant="ghostNeon" onClick={() => onDelete(s.id)}><Trash2 className="h-4 w-4" /></Button>
          </div>
        ))}
      </section>
    </div>
  );
}

function SitePagesManager() {
  const [pages, setPages] = useState<SitePage[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSlug, setActiveSlug] = useState<string>("");

  useEffect(() => {
    listSitePages().then((p) => { setPages(p); setActiveSlug(p[0]?.slug ?? ""); }).catch((e) => toast.error(e.message)).finally(() => setLoading(false));
  }, []);

  const active = pages.find((p) => p.slug === activeSlug);

  const onSave = async () => {
    if (!active) return;
    try {
      await upsertSitePage({ slug: active.slug, title: active.title, content: active.content });
      toast.success("Page saved");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Save failed"); }
  };

  if (loading) return <Loader2 className="h-5 w-5 animate-spin text-primary" />;

  return (
    <div className="grid lg:grid-cols-[220px_1fr] gap-6">
      <aside className="glass rounded-2xl p-3 h-max">
        <ul className="space-y-1">
          {pages.map((p) => (
            <li key={p.slug}>
              <button onClick={() => setActiveSlug(p.slug)} className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${activeSlug === p.slug ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-card/60"}`}>
                {p.title}
                <div className="text-[10px] text-muted-foreground/70">/p/{p.slug}</div>
              </button>
            </li>
          ))}
        </ul>
      </aside>
      {active && (
        <section className="glass rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Edit: {active.title}</h2>
            <Button variant="hero" size="sm" onClick={onSave}><Save className="h-4 w-4" /> Save</Button>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Title</label>
            <Input value={active.title} onChange={(e) => setPages((arr) => arr.map((p) => p.slug === active.slug ? { ...p, title: e.target.value } : p))} className="mt-1.5" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Content (Markdown supported)</label>
            <Textarea value={active.content} onChange={(e) => setPages((arr) => arr.map((p) => p.slug === active.slug ? { ...p, content: e.target.value } : p))} rows={20} className="mt-1.5 font-mono text-xs" />
          </div>
          <p className="text-[11px] text-muted-foreground">Use <code>#</code> for headings, <code>**bold**</code>, <code>- item</code> for lists. Page lives at <code>/p/{active.slug}</code>.</p>
        </section>
      )}
    </div>
  );
}

function CouponsManager() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    code: "",
    type: "percent" as "percent" | "fixed",
    value: "",
    expiresAt: "",
    maxUses: "",
    note: "",
    active: true,
  });

  const loadCoupons = async () => {
    setLoading(true);
    try {
      setCoupons(await fetchAllCoupons());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load coupons");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadCoupons();
  }, []);

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    const value = Number(form.value);
    const maxUses = form.maxUses.trim() ? Number(form.maxUses) : null;
    if (!form.code.trim()) { toast.error("Enter a coupon code"); return; }
    if (!Number.isFinite(value) || value <= 0) { toast.error("Enter a valid coupon value"); return; }
    if (form.type === "percent" && value > 100) { toast.error("Percent coupon cannot exceed 100"); return; }
    if (maxUses !== null && (!Number.isFinite(maxUses) || maxUses < 1)) { toast.error("Enter a valid max uses value"); return; }
    setCreating(true);
    try {
      await createCoupon({
        code: form.code,
        type: form.type,
        value,
        expiresAt: form.expiresAt || null,
        maxUses,
        note: form.note || null,
        active: form.active,
      });
      toast.success("Coupon created");
      setForm({ code: "", type: "percent", value: "", expiresAt: "", maxUses: "", note: "", active: true });
      await loadCoupons();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create coupon");
    } finally {
      setCreating(false);
    }
  };

  const toggleCoupon = async (coupon: Coupon, active: boolean) => {
    try {
      await updateCoupon(coupon.id, { active });
      setCoupons((prev) => prev.map((item) => item.id === coupon.id ? { ...item, active } : item));
      toast.success(active ? "Coupon activated" : "Coupon deactivated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update coupon");
    }
  };

  const removeCoupon = async (coupon: Coupon) => {
    try {
      await deleteCoupon(coupon.id);
      setCoupons((prev) => prev.filter((item) => item.id !== coupon.id));
      toast.success("Coupon deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete coupon");
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-card/60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Tag className="h-5 w-5 text-primary" /> Create Coupon</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="coupon-code">Code</Label>
              <Input id="coupon-code" value={form.code} onChange={(e) => setForm((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))} placeholder="WELCOME10" className="mt-1.5" />
            </div>
            <div>
              <Label>Type</Label>
              <Select value={form.type} onValueChange={(type: "percent" | "fixed") => setForm((prev) => ({ ...prev, type }))}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percent">Percent</SelectItem>
                  <SelectItem value="fixed">Fixed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="coupon-value">Value</Label>
              <Input id="coupon-value" type="number" min="0" step="0.01" value={form.value} onChange={(e) => setForm((prev) => ({ ...prev, value: e.target.value }))} placeholder={form.type === "percent" ? "10" : "5"} className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="coupon-expires">Expires At</Label>
              <Input id="coupon-expires" type="date" value={form.expiresAt} onChange={(e) => setForm((prev) => ({ ...prev, expiresAt: e.target.value }))} className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="coupon-max-uses">Max Uses</Label>
              <Input id="coupon-max-uses" type="number" min="1" step="1" value={form.maxUses} onChange={(e) => setForm((prev) => ({ ...prev, maxUses: e.target.value }))} placeholder="Optional" className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="coupon-note">Note</Label>
              <Input id="coupon-note" value={form.note} onChange={(e) => setForm((prev) => ({ ...prev, note: e.target.value }))} placeholder="Optional internal note" className="mt-1.5" />
            </div>
            <div className="flex items-center gap-3 md:col-span-2">
              <Switch checked={form.active} onCheckedChange={(active) => setForm((prev) => ({ ...prev, active }))} id="coupon-active" />
              <Label htmlFor="coupon-active">Active</Label>
            </div>
            <div className="md:col-span-2">
              <Button type="submit" variant="hero" disabled={creating}>
                {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Create Coupon
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="bg-card/60">
        <CardHeader>
          <CardTitle>Existing Coupons</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          ) : coupons.length === 0 ? (
            <p className="text-sm text-muted-foreground">No coupons yet.</p>
          ) : coupons.map((coupon) => (
            <div key={coupon.id} className="flex flex-col gap-3 rounded-xl border border-border bg-background/40 p-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground">{coupon.code}</span>
                  <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">{coupon.type}</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {coupon.type === "percent" ? `${coupon.value}% off` : `$${coupon.value.toFixed(2)} off`} · Used {coupon.uses}{coupon.maxUses != null ? `/${coupon.maxUses}` : ""}{coupon.expiresAt ? ` · Expires ${coupon.expiresAt}` : ""}
                </p>
                {coupon.note && <p className="mt-1 text-xs text-muted-foreground">{coupon.note}</p>}
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Switch checked={coupon.active} onCheckedChange={(active) => void toggleCoupon(coupon, active)} id={`coupon-active-${coupon.id}`} />
                  <Label htmlFor={`coupon-active-${coupon.id}`} className="text-xs">Active</Label>
                </div>
                <Button type="button" variant="destructive" size="sm" onClick={() => void removeCoupon(coupon)}>
                  <Trash2 className="h-4 w-4" /> Delete
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function SiteSettingsManager() {
  const [rates, setRates] = useState<Record<string, string>>({ US: "4", UK: "5", EU: "7", INTL: "10" });
  const [newCountryCode, setNewCountryCode] = useState("");
  const [newCountryRate, setNewCountryRate] = useState("");
  const [socialLinks, setSocialLinksState] = useState<SocialLinks>({ instagram: "", facebook: "", youtube: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingSocial, setSavingSocial] = useState(false);

  useEffect(() => {
    Promise.all([getShippingRates(), getSocialLinks()])
      .then(([loadedRates, loadedSocialLinks]) => {
        setRates(Object.fromEntries(Object.entries(loadedRates).map(([code, rate]) => [code, String(rate)])));
        setSocialLinksState(loadedSocialLinks);
      })
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false));
  }, []);

  const setRateValue = (code: string, value: string) => {
    setRates((prev) => ({ ...prev, [code]: value }));
  };

  const addCountry = () => {
    const code = newCountryCode.trim().toUpperCase();
    const rate = Number(newCountryRate);
    if (!/^[A-Z]{2}$/.test(code)) { toast.error("Enter a valid 2-letter country code"); return; }
    if (!Number.isFinite(rate) || rate < 0) { toast.error("Enter a valid non-negative rate"); return; }
    setRates((prev) => ({ ...prev, [code]: String(rate) }));
    setNewCountryCode("");
    setNewCountryRate("");
  };

  const onSave = async () => {
    const parsed: Record<string, number> = {};
    for (const [code, value] of Object.entries(rates)) {
      const rate = Number(value);
      if (!Number.isFinite(rate) || rate < 0) { toast.error(`Enter a valid non-negative rate for ${code}`); return; }
      parsed[code] = rate;
    }
    setSaving(true);
    try {
      await setShippingRates(parsed);
      toast.success("Shipping rates saved");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Save failed"); }
    finally { setSaving(false); }
  };

  const onSaveSocialLinks = async () => {
    for (const [platform, value] of Object.entries(socialLinks)) {
      if (!value.trim()) continue;
      try {
        new URL(value);
      } catch {
        toast.error(`Enter a valid ${platform} URL`);
        return;
      }
    }
    setSavingSocial(true);
    try {
      await setSocialLinks({
        instagram: socialLinks.instagram.trim(),
        facebook: socialLinks.facebook.trim(),
        youtube: socialLinks.youtube.trim(),
      });
      toast.success("Social links updated");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Save failed"); }
    finally { setSavingSocial(false); }
  };

  if (loading) return <Loader2 className="h-5 w-5 animate-spin text-primary" />;

  return (
    <div className="max-w-2xl space-y-6">
      <div className="glass rounded-2xl p-6 space-y-5">
      <h2 className="text-lg font-semibold flex items-center gap-2"><SettingsIcon className="h-4 w-4 text-primary" /> Shipping rates</h2>
      <div className="grid sm:grid-cols-2 gap-4">
        {[
          ["US", "United States"],
          ["UK", "United Kingdom"],
          ["EU", "Europe"],
          ["INTL", "International / others"],
        ].map(([code, label]) => (
          <div key={code}>
            <label className="text-xs text-muted-foreground">{code} ({label})</label>
            <Input type="number" step="0.01" min="0" value={rates[code] ?? ""} onChange={(e) => setRateValue(code, e.target.value)} className="mt-1.5" />
          </div>
        ))}
      </div>
      {Object.keys(rates).filter((code) => !["US", "UK", "EU", "INTL"].includes(code)).length > 0 && (
        <div className="space-y-3">
          <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Additional countries</div>
          <div className="grid sm:grid-cols-2 gap-4">
            {Object.keys(rates).filter((code) => !["US", "UK", "EU", "INTL"].includes(code)).sort().map((code) => (
              <div key={code}>
                <label className="text-xs text-muted-foreground">{code}</label>
                <Input type="number" step="0.01" min="0" value={rates[code] ?? ""} onChange={(e) => setRateValue(code, e.target.value)} className="mt-1.5" />
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="rounded-xl border border-border/60 bg-background/30 p-4 space-y-3">
        <div className="text-xs font-semibold uppercase tracking-widest text-primary">Add country</div>
        <div className="grid sm:grid-cols-[1fr_1fr_auto] gap-3">
          <Input value={newCountryCode} onChange={(e) => setNewCountryCode(e.target.value.toUpperCase())} placeholder="CA" maxLength={2} />
          <Input type="number" step="0.01" min="0" value={newCountryRate} onChange={(e) => setNewCountryRate(e.target.value)} placeholder="8" />
          <Button type="button" variant="ghostNeon" onClick={addCountry}>Add country</Button>
        </div>
      </div>
      <Button variant="hero" onClick={onSave} disabled={saving}>
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save
      </Button>
      </div>

      <Card className="bg-card/60">
        <CardHeader>
          <CardTitle>Social Links</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="instagram-url">Instagram URL</Label>
            <Input
              id="instagram-url"
              value={socialLinks.instagram}
              onChange={(e) => setSocialLinksState((prev) => ({ ...prev, instagram: e.target.value }))}
              placeholder="https://instagram.com/yourhandle"
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="facebook-url">Facebook URL</Label>
            <Input
              id="facebook-url"
              value={socialLinks.facebook}
              onChange={(e) => setSocialLinksState((prev) => ({ ...prev, facebook: e.target.value }))}
              placeholder="https://facebook.com/yourpage"
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="youtube-url">YouTube URL</Label>
            <Input
              id="youtube-url"
              value={socialLinks.youtube}
              onChange={(e) => setSocialLinksState((prev) => ({ ...prev, youtube: e.target.value }))}
              placeholder="https://youtube.com/@yourchannel"
              className="mt-1.5"
            />
          </div>
          <Button variant="hero" onClick={onSaveSocialLinks} disabled={savingSocial}>
            {savingSocial ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
