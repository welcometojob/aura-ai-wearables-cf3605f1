import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { useEffect, useState, type ReactNode } from "react";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import brandLogo from "@/assets/tommymeow-logo.png";
import brandMark from "@/assets/tommymeow-mark.png";
import {
  Sparkles,
  Wand2,
  Eye,
  Package,
  Scissors,
  Upload,
  ArrowRight,
  Check,
  Zap,
  Image as ImageIcon,
  Printer,
  Truck,
  MapPin,
  MessageCircle,
  Search,
  Instagram,
  Facebook,
  Youtube,
  HelpCircle,
  X,
  Send,
  Sun,
  Moon,
  Apple,
  Smartphone,
  CreditCard,
  LogOut,
  User as UserIcon,
  Coins,
  Shield,
  Star,
  Quote,
  Loader2,
  PenSquare,
  ArrowDownNarrowWide,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import tshirt1 from "@/assets/tshirt-hero-1.jpg";
import tshirt2 from "@/assets/tshirt-hero-2.jpg";
import tshirt3 from "@/assets/tshirt-hero-3.jpg";
import tshirt4 from "@/assets/tshirt-hero-4.jpg";
import tshirt5 from "@/assets/tshirt-hero-5.jpg";
import tshirt6 from "@/assets/tshirt-hero-6.jpg";
import tshirt7 from "@/assets/tshirt-hero-7.jpg";
import tshirt8 from "@/assets/tshirt-hero-8.jpg";
import tshirt9 from "@/assets/tshirt-hero-9.jpg";
import tshirt10 from "@/assets/tshirt-hero-10.jpg";
import trend1 from "@/assets/trend-1.jpg";
import trend2 from "@/assets/trend-2.jpg";
import trend3 from "@/assets/trend-3.jpg";
import trend4 from "@/assets/trend-4.jpg";
import { fetchProducts, type AdminProduct } from "@/lib/admin-products";
import { useAuth } from "@/hooks/use-auth";
import { fetchReviews, type Review } from "@/lib/reviews";
import { lookupOrder, ORDER_STAGES, type Order } from "@/lib/orders";
import { SubmitReviewDialog } from "@/components/aura/SubmitReviewDialog";
import { ImageLightbox } from "@/components/aura/ImageLightbox";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const Route = createFileRoute("/")({
  component: Landing,
});

const heroMockups = [tshirt1, tshirt2, tshirt3, tshirt4, tshirt5, tshirt6, tshirt7, tshirt8, tshirt9, tshirt10];

function Nav() {
  const { user, profile, isAdmin, signOut } = useAuth();
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  useEffect(() => {
    const saved = (typeof localStorage !== "undefined" && localStorage.getItem("aura-theme")) as
      | "dark"
      | "light"
      | null;
    const initial = saved ?? "dark";
    setTheme(initial);
    document.documentElement.classList.toggle("light", initial === "light");
    document.documentElement.classList.toggle("dark", initial === "dark");
  }, []);
  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.classList.toggle("light", next === "light");
    document.documentElement.classList.toggle("dark", next === "dark");
    try {
      localStorage.setItem("aura-theme", next);
    } catch {}
  };
  return (
    <header className="fixed top-0 inset-x-0 z-50">
      <div className="mx-auto max-w-7xl px-6 py-4">
        <div className="glass rounded-2xl px-5 py-3 flex items-center justify-between">
          <a href="#" className="flex items-center gap-2">
            <img src={brandMark} alt="TommyMeow" className="h-9 w-auto md:hidden" />
            <img src={brandLogo} alt="TommyMeow" className="hidden h-9 w-auto md:block" />
          </a>
          <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
            <a href="#trending" className="hover:text-foreground transition">Gallery</a>
            <a href="#pricing" className="hover:text-foreground transition">Pricing</a>
            <a href="#shipping" className="hover:text-foreground transition">Shipping</a>
            <a href="#reviews" className="hover:text-foreground transition">Reviews</a>
            <a href="#track" className="hover:text-foreground transition">Track</a>
            <a href="#faq" className="hover:text-foreground transition">FAQ</a>
          </nav>
          <div className="flex items-center gap-2">
            <LanguageSwitcher variant="compact" />
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
              className="h-9 w-9 grid place-items-center rounded-lg border border-border/60 bg-background/40 hover:border-primary/60 hover:text-primary transition"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <Button variant="hero" size="sm" asChild>
              <Link to="/ai-studio">Start Free Designing</Link>
            </Button>
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="h-9 px-3 inline-flex items-center gap-2 rounded-lg border border-border/60 bg-background/40 hover:border-primary/60 transition text-sm"
                  >
                    <UserIcon className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline max-w-[100px] truncate">
                      {profile?.display_name || user.email}
                    </span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="font-normal">
                    <div className="text-sm font-medium truncate">
                      {profile?.display_name || user.email}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">{user.email}</div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Coins className="h-3.5 w-3.5 text-primary" />
                      Credits
                    </span>
                    <span className="font-semibold text-primary">
                      {profile?.credits_remaining ?? 0}
                    </span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="flex items-center justify-between">
                    <span>Plan</span>
                    <span className="text-xs uppercase tracking-wider px-2 py-0.5 rounded-full border border-primary/40 text-primary bg-primary/10">
                      {profile?.plan ?? "free"}
                    </span>
                  </DropdownMenuItem>
                  {isAdmin && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link to="/admin" className="flex items-center gap-2 cursor-pointer">
                          <Shield className="h-3.5 w-3.5" />
                          Admin dashboard
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => void signOut()} className="cursor-pointer">
                    <LogOut className="h-3.5 w-3.5" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button variant="ghostNeon" size="sm" asChild>
                <Link to="/auth" search={{ redirect: "/", plan: undefined }}>Sign in</Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  const [active, setActive] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setActive((a) => (a + 1) % heroMockups.length), 3500);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="relative pt-36 pb-24 overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-40 [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]" />
      <div className="relative mx-auto max-w-7xl px-6 grid lg:grid-cols-2 gap-12 items-center">
        <div className="animate-fade-up">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.05]">
            Design Your <br />
            <span className="text-gradient">Identity With AI</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-xl">
            Transform your wildest thoughts into premium wearable art in seconds.
            No design skills required.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Button variant="hero" size="lg" className="group" asChild>
              <Link to="/ai-studio">
                Start Free Designing
                <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button variant="ghostNeon" size="lg" asChild>
              <a href="#reviews">Customer Reviews</a>
            </Button>
          </div>
          <div className="mt-10 flex items-center gap-8 text-sm text-muted-foreground">
            <div>
              <div className="text-2xl font-bold text-foreground">50K+</div>
              designs created
            </div>
            <div className="h-10 w-px bg-border" />
            <div>
              <div className="text-2xl font-bold text-foreground">4.9★</div>
              creator rating
            </div>
            <div className="h-10 w-px bg-border" />
            <div>
              <div className="text-2xl font-bold text-foreground">120+</div>
              countries
            </div>
          </div>
        </div>

        {/* Mockup */}
        <div className="relative aspect-square max-w-[560px] mx-auto w-full">
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/30 via-accent/20 to-transparent blur-3xl" />
          <div className="absolute inset-8 rounded-3xl glass animate-pulse-glow" />
          <div className="relative h-full w-full grid place-items-center">
            <div className="relative h-[88%] w-[88%] animate-float">
              {heroMockups.map((src, i) => (
                <img
                  key={src}
                  src={src}
                  alt={`AI generated t-shirt design ${i + 1}`}
                  width={1024}
                  height={1024}
                  loading={i === 0 ? "eager" : "lazy"}
                  className="absolute inset-0 h-full w-full object-contain rounded-3xl transition-all duration-1000"
                  style={{
                    opacity: active === i ? 1 : 0,
                    transform: active === i ? "scale(1) rotate(0deg)" : "scale(0.92) rotate(-4deg)",
                  }}
                />
              ))}
            </div>
          </div>
          {/* Floating chips */}
          <div className="absolute top-6 left-2 glass rounded-xl px-3 py-2 text-xs flex items-center gap-2 animate-float" style={{ animationDelay: "1s" }}>
            <Wand2 className="h-3.5 w-3.5 text-primary" />
            Prompt: "neon koi fish"
          </div>
          <div className="absolute bottom-10 right-0 glass rounded-xl px-3 py-2 text-xs flex items-center gap-2 animate-float" style={{ animationDelay: "2s" }}>
            <Zap className="h-3.5 w-3.5 text-primary" />
            Rendered in 2.4s
          </div>
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    { icon: Wand2, title: "Prompt", desc: "Describe your vision in our AI editor — a sentence is all it takes." },
    { icon: Eye, title: "Preview", desc: "Watch your design come to life on a high-quality, photoreal mockup." },
    { icon: Package, title: "Order", desc: "Get your custom apparel printed and delivered to your doorstep." },
  ];
  return (
    <section id="how" className="py-24 relative">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-primary text-sm font-semibold tracking-widest uppercase">How It Works</p>
          <h2 className="mt-3 text-4xl md:text-5xl font-bold tracking-tight">
            From Idea To Apparel In <span className="text-gradient">Three Steps</span>
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6 relative">
          {steps.map((s, i) => (
            <div key={s.title} className="relative glass rounded-2xl p-8 hover:border-primary/40 transition-all hover:-translate-y-1">
              <div className="flex items-center justify-between mb-6">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 grid place-items-center ring-glow">
                  <s.icon className="h-5 w-5 text-primary" />
                </div>
                <span
                  aria-hidden
                  className="text-6xl font-black leading-none text-gradient drop-shadow-[0_0_18px_oklch(0.62_0.21_264/0.45)]"
                >
                  0{i + 1}
                </span>
              </div>
              <h3 className="text-xl font-semibold">{s.title}</h3>
              <p className="mt-2 text-muted-foreground text-sm leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Features() {
  return (
    <section id="features" className="py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <p className="text-primary text-sm font-semibold tracking-widest uppercase">Our Features</p>
          <h2 className="mt-3 text-4xl md:text-5xl font-bold tracking-tight">
            Everything You Need, <span className="text-gradient">Beautifully Crafted</span>
          </h2>
          <p className="mt-4 text-muted-foreground">
            Six powerful tools that take you from idea to delivery — without breaking a sweat.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <FeatureCard
            icon={Wand2}
            title="Generate with AI"
            desc="Simply describe the design you want using text, and our advanced AI system will create a high-quality, unique design tailored exactly to your vision."
          />
          <FeatureCard
            icon={ImageIcon}
            title="Upload a Photo"
            desc="With this feature, you can upload any image and easily place a custom order using your own photo."
          />
          <FeatureCard
            icon={Scissors}
            title="Background Removal"
            desc="Remove the background from your created design or uploaded image with just one click — fast, simple, and precise."
          />
          <FeatureCard
            icon={Printer}
            title="Print Quality"
            desc="We offer premium-quality printing with sharp details and vibrant colors. Our goal is to ensure every product delivers 100% customer satisfaction."
          />
          <FeatureCard
            icon={Truck}
            title="Shipping Subscription"
            desc="We ship to USA, UK, EU, and International destinations. Choose from three subscription plans to enjoy free shipping and fast delivery with ease."
          />
          <FeatureCard
            icon={MapPin}
            title="Order Tracking"
            desc="Track your order effortlessly and stay updated on shipping status and delivery progress — all in one place."
          />
        </div>
      </div>
    </section>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  desc,
  className = "",
}: {
  icon: LucideIcon;
  title: string;
  desc: string;
  className?: string;
}) {
  return (
    <div className={`group relative overflow-hidden glass rounded-2xl p-7 hover:border-primary/50 hover:-translate-y-1 transition-all duration-300 ${className}`}>
      <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-primary/20 via-accent/10 to-transparent opacity-0 group-hover:opacity-100 transition pointer-events-none" />
      <div className="absolute -top-16 -right-16 h-40 w-40 rounded-full bg-primary/10 blur-3xl opacity-0 group-hover:opacity-100 transition" />
      <div className="relative h-full flex flex-col">
        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/10 ring-1 ring-primary/30 grid place-items-center mb-5 group-hover:scale-110 group-hover:ring-primary/60 transition">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <h3 className="font-semibold text-lg">{title}</h3>
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

function Trending() {
  const items = [
    { src: trend1, name: "Liquid Chrome", price: "$34" },
    { src: trend2, name: "Neon Koi", price: "$36" },
    { src: trend3, name: "Synthwave Sunset", price: "$32" },
    { src: trend4, name: "Cyber Skull", price: "$38" },
  ];
  const [expanded, setExpanded] = useState(false);
  const [adminProducts, setAdminProducts] = useState<AdminProduct[]>([]);
  const { user } = useAuth();
  const navigate = useNavigate();
  const handleBuy = (productName: string) => {
    if (!user) {
      toast.info("Sign in to purchase this product.");
      navigate({ to: "/auth", search: { redirect: "/#trending", plan: productName } });
      return;
    }
    toast.info(`Checkout for "${productName}" coming soon — payment integration pending.`);
  };
  useEffect(() => {
    let cancelled = false;
    const refresh = () => {
      fetchProducts()
        .then((p) => { if (!cancelled) setAdminProducts(p); })
        .catch(() => {});
    };
    refresh();
    return () => { cancelled = true; };
  }, [expanded]);
  return (
    <section id="trending" className="py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex items-end justify-between mb-12 flex-wrap gap-4">
          <div>
            <p className="text-primary text-sm font-semibold tracking-widest uppercase">Trending now</p>
            <h2 className="mt-3 text-4xl md:text-5xl font-bold tracking-tight">Hot off the AI press</h2>
          </div>
          <Button variant="ghostNeon" onClick={() => setExpanded((v) => !v)}>
            {expanded ? "Hide Gallery" : "Browse Gallery"}
          </Button>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {items.map((it) => (
            <div
              key={it.name}
              className="group relative glass rounded-2xl overflow-hidden hover:border-primary/60 hover:-translate-y-1 hover:shadow-[0_0_40px_-8px_hsl(var(--primary)/0.5)] transition-all duration-500"
            >
              <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-primary/30 via-accent/15 to-transparent opacity-0 group-hover:opacity-100 transition pointer-events-none" />
              <div className="relative aspect-[4/5] overflow-hidden bg-secondary">
                <img
                  src={it.src}
                  alt={it.name}
                  loading="lazy"
                  width={768}
                  height={896}
                  className="h-full w-full object-cover group-hover:scale-110 transition duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/0 to-background/0 opacity-0 group-hover:opacity-100 transition" />
                <div className="absolute bottom-3 left-3 right-3 translate-y-2 opacity-0 group-hover:opacity-100 group-hover:translate-y-0 transition duration-500">
                  <Button variant="hero" size="sm" className="w-full" onClick={() => handleBuy(it.name)}>
                    {user ? "Buy now" : "Sign in to buy"}
                  </Button>
                </div>
              </div>
              <div className="relative p-4 flex items-center justify-between">
                <div>
                  <div className="font-medium group-hover:text-primary transition">{it.name}</div>
                  <div className="text-xs text-muted-foreground">AI Original</div>
                </div>
                <div className="text-primary font-semibold">{it.price}</div>
              </div>
            </div>
          ))}
        </div>
        {expanded && (
          <div className="mt-12 animate-fade-up">
            <div className="flex items-end justify-between mb-6 flex-wrap gap-3">
              <div>
                <p className="text-primary text-xs font-semibold tracking-widest uppercase">Full Gallery</p>
                <h3 className="mt-1 text-2xl md:text-3xl font-bold tracking-tight">All products</h3>
              </div>
              <Link to="/admin" className="text-xs text-muted-foreground hover:text-primary transition">
                Manage products →
              </Link>
            </div>
            {adminProducts.length === 0 ? (
              <div className="glass rounded-2xl p-10 text-center">
                <p className="text-muted-foreground">
                  No products yet. Add some from the{" "}
                  <Link to="/admin" className="text-primary hover:underline">
                    admin dashboard
                  </Link>
                  .
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                {adminProducts.map((p) => (
                  <Link
                    key={p.id}
                    to="/product/$id"
                    params={{ id: p.id }}
                    className="group relative glass rounded-2xl overflow-hidden hover:border-primary/60 hover:-translate-y-1 hover:shadow-[0_0_40px_-8px_hsl(var(--primary)/0.5)] transition-all duration-500 block"
                  >
                    <div className="relative aspect-[4/5] overflow-hidden bg-secondary">
                      <img
                        src={p.image}
                        alt={p.name}
                        loading="lazy"
                        className="h-full w-full object-cover group-hover:scale-110 transition duration-700"
                      />
                      {p.category && (
                        <span className="absolute top-3 left-3 text-[10px] uppercase tracking-wider px-2 py-1 rounded-full bg-background/70 backdrop-blur border border-primary/30 text-primary">
                          {p.category}
                        </span>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/0 to-background/0 opacity-0 group-hover:opacity-100 transition" />
                      <div className="absolute bottom-3 left-3 right-3 translate-y-2 opacity-0 group-hover:opacity-100 group-hover:translate-y-0 transition duration-500">
                        <Button variant="hero" size="sm" className="w-full pointer-events-none">
                          View details
                        </Button>
                      </div>
                    </div>
                    <div className="relative p-4">
                      <div className="flex items-center justify-between gap-2">
                        <div className="font-medium group-hover:text-primary transition truncate">
                          {p.name}
                        </div>
                        <div className="text-primary font-semibold shrink-0">{p.price}</div>
                      </div>
                      {p.description && (
                        <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                          {p.description}
                        </p>
                      )}
                      {p.tags.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {p.tags.slice(0, 3).map((t) => (
                            <span
                              key={t}
                              className="text-[10px] px-2 py-0.5 rounded-full border border-border/60 text-muted-foreground"
                            >
                              #{t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

function Pricing() {
  const [selected, setSelected] = useState("Pro");
  const { user } = useAuth();
  const navigate = useNavigate();
  const handleContinue = async (planName: string) => {
    if (planName === "Free") {
      if (!user) {
        navigate({ to: "/auth", search: { redirect: "/", plan: "Free" } });
        return;
      }
      toast.success("You're on the Free plan. Start creating!");
      navigate({ to: "/ai-studio" });
      return;
    }
    if (!user) {
      navigate({ to: "/auth", search: { redirect: "/#pricing", plan: planName } });
      return;
    }
    try {
      toast.loading(`Opening secure checkout for ${planName}…`, { id: "checkout" });
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { plan: planName },
      });
      if (error) throw error;
      if (!data?.url) throw new Error("No checkout URL returned");
      toast.dismiss("checkout");
      window.location.href = data.url;
    } catch (e) {
      toast.dismiss("checkout");
      toast.error((e as Error).message || "Could not start checkout");
    }
  };
  const tiers = [
    {
      name: "Free",
      price: "$0",
      tagline: "Dip your toes in.",
      features: [
        "15 free AI credits / month",
        "Powered by RunPod image engine",
        "Standard resolution",
        "Community gallery & email support",
      ],
      cta: "Get Started",
      highlight: false,
    },
    {
      name: "Pro",
      price: "$19",
      tagline: "For serious creators.",
      features: [
        "50 AI credits / month",
        "Direct AI image generation (ChatGPT / Anthropic API)",
        "4K print-ready exports & background remover",
        "Priority support",
      ],
      cta: "Go Pro",
      highlight: true,
    },
    {
      name: "Business",
      price: "$79",
      tagline: "Built for POD sellers.",
      features: [
        "500 AI credits / month",
        "Direct AI image generation (ChatGPT / Anthropic API)",
        "Commercial license, bulk export & API",
        "Dedicated account manager",
      ],
      cta: "Contact Sales",
      highlight: false,
    },
  ];
  return (
    <section id="pricing" className="py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <p className="text-primary text-sm font-semibold tracking-widest uppercase">Plans & Credits</p>
          <h2 className="mt-3 text-4xl md:text-5xl font-bold tracking-tight">
            Pick The Plan That <span className="text-gradient">Fits Your Flow</span>
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {tiers.map((t) => (
            <button
              type="button"
              key={t.name}
              onClick={() => setSelected(t.name)}
              className={`relative text-left rounded-3xl p-8 flex flex-col transition-all duration-300 hover:-translate-y-1 ${
                selected === t.name
                  ? "glass ring-glow bg-gradient-to-b from-primary/15 to-transparent border-primary/60 shadow-[0_0_40px_-8px_hsl(var(--primary)/0.5)]"
                  : "glass hover:border-primary/40"
              }`}
            >
              {t.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-semibold px-3 py-1 rounded-full bg-gradient-to-r from-primary to-accent text-primary-foreground">
                  Most Popular
                </div>
              )}
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">{t.name}</div>
                {selected === t.name && (
                  <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border border-primary/40 text-primary bg-primary/10">
                    Selected
                  </span>
                )}
              </div>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-5xl font-extrabold tracking-tight">{t.price}</span>
                <span className="text-muted-foreground text-sm">/mo</span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{t.tagline}</p>
              <ul className="mt-6 space-y-3 text-sm flex-1">
                {t.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Button
                variant={selected === t.name ? "hero" : "ghostNeon"}
                className="mt-8 w-full"
                onClick={(e) => { e.stopPropagation(); handleContinue(t.name); }}
              >
                {selected === t.name ? `Continue with ${t.name}` : t.cta}
              </Button>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  return _CTASection();
}

function Shipping() {
  const zones = [
    { code: "UK", region: "United Kingdom", time: "3–5 business days", color: "from-primary/30 to-accent/10" },
    { code: "EU", region: "Europe", time: "5–8 business days", color: "from-accent/30 to-primary/10" },
    { code: "USA", region: "United States", time: "3–5 business days", color: "from-primary/30 to-accent/20" },
    { code: "International", region: "International", time: "15–30 business days", color: "from-accent/20 to-primary/20" },
  ];
  return (
    <section id="shipping" className="py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <p className="text-primary text-sm font-semibold tracking-widest uppercase">Shipping</p>
          <h2 className="mt-3 text-4xl md:text-5xl font-bold tracking-tight">
            Worldwide Delivery, <span className="text-gradient">On Time</span>
          </h2>
          <p className="mt-4 text-muted-foreground">
            We ship from our partner facilities to over 120 countries. Estimated delivery times below.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {zones.map((z) => (
            <div
              key={z.code}
              className="group relative overflow-hidden glass rounded-2xl p-6 hover:border-primary/50 hover:-translate-y-1 transition-all duration-300"
            >
              <div className={`absolute -top-16 -right-16 h-40 w-40 rounded-full bg-gradient-to-br ${z.color} blur-3xl opacity-60`} />
              <div className="relative">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/10 ring-1 ring-primary/30 grid place-items-center">
                    <Truck className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-2xl font-extrabold tracking-tight text-gradient">{z.code}</span>
                </div>
                <h3 className="mt-5 font-semibold text-lg">{z.region}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{z.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${i < Math.round(rating) ? "fill-gold text-gold" : "text-muted-foreground/30"}`}
        />
      ))}
    </div>
  );
}

type SortMode = "newest" | "helpful" | "highest" | "lowest";
type RatingFilter = 0 | 1 | 2 | 3 | 4 | 5;

function Reviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<RatingFilter>(0);
  const [sort, setSort] = useState<SortMode>("newest");
  const [submitOpen, setSubmitOpen] = useState(false);
  const [lightbox, setLightbox] = useState<{ images: string[]; index: number } | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [canReview, setCanReview] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const refresh = () => {
    setLoading(true);
    fetchReviews()
      .then((r) => {
        setReviews(r);
        setError(null);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load reviews"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    refresh();
  }, []);

  useEffect(() => {
    if (!user) { setCanReview(false); return; }
    supabase.rpc("can_user_review", { _user_id: user.id })
      .then(({ data, error }) => {
        if (error) { setCanReview(false); return; }
        setCanReview(Boolean(data));
      });
  }, [user]);

  const total = reviews.length;
  const avg = total ? reviews.reduce((s, r) => s + r.rating, 0) / total : 0;
  const dist = [5, 4, 3, 2, 1].map((star) => {
    const count = reviews.filter((r) => Math.round(r.rating) === star).length;
    return { star, count, pct: total ? Math.round((count / total) * 100) : 0 };
  });

  const filtered = reviews
    .filter((r) => (filter === 0 ? true : Math.round(r.rating) === filter))
    .sort((a, b) => {
      if (sort === "newest") return +new Date(b.createdAt) - +new Date(a.createdAt);
      if (sort === "helpful") return b.helpfulCount - a.helpfulCount;
      if (sort === "highest") return b.rating - a.rating;
      return a.rating - b.rating;
    });

  const PREVIEW_COUNT = 6;
  const visible = expanded ? filtered : filtered.slice(0, PREVIEW_COUNT);
  const hiddenCount = Math.max(0, filtered.length - visible.length);

  const onWriteReview = () => {
    if (!user) {
      toast.info("Sign in to write a review");
      navigate({ to: "/auth", search: { redirect: "/#reviews", plan: undefined } });
      return;
    }
    if (!canReview) {
      toast.error("Only verified buyers can write a review. Place an order and we'll unlock this for you after delivery.");
      return;
    }
    setSubmitOpen(true);
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  return (
    <section id="reviews" className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-30 [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] aspect-square rounded-full bg-gradient-to-br from-primary/20 via-accent/10 to-transparent blur-3xl pointer-events-none" />
      <div className="relative mx-auto max-w-7xl px-6">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <p className="text-primary text-sm font-semibold tracking-widest uppercase">Customer Reviews</p>
          <h2 className="mt-3 text-4xl md:text-5xl font-bold tracking-tight">
            Loved By <span className="text-gradient">Creators Worldwide</span>
          </h2>
          <p className="mt-4 text-muted-foreground">
            Real stories from real customers — wearing their AI-crafted designs every day.
          </p>
        </div>

        {/* Summary card */}
        <div className="grid lg:grid-cols-3 gap-6 mb-10">
          <div className="lg:col-span-1 glass rounded-3xl p-8 ring-glow flex flex-col items-center justify-center text-center">
            <div className="text-6xl font-extrabold text-gradient leading-none">
              {total ? avg.toFixed(1) : "—"}
            </div>
            <div className="mt-3"><Stars rating={avg} /></div>
            <p className="mt-3 text-sm text-muted-foreground">
              Based on <span className="text-foreground font-semibold">{total.toLocaleString()}</span> verified review{total === 1 ? "" : "s"}
            </p>
            <Button variant="hero" size="sm" onClick={onWriteReview} className="mt-5">
              <PenSquare className="h-4 w-4" />
              Write a review
            </Button>
          </div>
          <div className="lg:col-span-2 glass rounded-3xl p-8">
            <div className="space-y-3">
              {dist.map((d) => (
                <button
                  key={d.star}
                  type="button"
                  onClick={() => setFilter((prev) => (prev === d.star ? 0 : (d.star as RatingFilter)))}
                  className={`w-full flex items-center gap-3 text-sm rounded-lg p-2 -m-2 transition ${
                    filter === d.star ? "bg-primary/10" : "hover:bg-muted/30"
                  }`}
                >
                  <span className={`w-10 flex items-center gap-1 ${filter === d.star ? "text-primary font-semibold" : "text-muted-foreground"}`}>
                    {d.star}<Star className="h-3 w-3 fill-gold text-gold" />
                  </span>
                  <div className="flex-1 h-2 rounded-full bg-muted/40 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-amber-400 via-gold to-amber-600 transition-all"
                      style={{ width: `${d.pct}%` }}
                    />
                  </div>
                  <span className="w-12 text-right text-muted-foreground tabular-nums text-xs">
                    {d.count} · {d.pct}%
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Filter + Sort toolbar */}
        <div className="glass rounded-2xl p-4 mb-8 flex flex-wrap items-center gap-3 justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-muted-foreground uppercase tracking-wider mr-1">Filter:</span>
            {([0, 5, 4, 3, 2, 1] as RatingFilter[]).map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setFilter(n)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition flex items-center gap-1 ${
                  filter === n
                    ? "bg-gold text-gold-foreground border-gold"
                    : "border-border/60 text-muted-foreground hover:border-gold/60 hover:text-gold"
                }`}
              >
                {n === 0 ? "All" : (
                  <>
                    {n}<Star className="h-3 w-3 fill-current" />
                  </>
                )}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <ArrowDownNarrowWide className="h-4 w-4 text-muted-foreground" />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortMode)}
              className="bg-background/60 border border-border/60 rounded-lg px-3 py-1.5 text-xs hover:border-primary/60 focus:border-primary focus:outline-none transition cursor-pointer"
              aria-label="Sort reviews"
            >
              <option value="newest">Newest first</option>
              <option value="helpful">Most helpful</option>
              <option value="highest">Highest rated</option>
              <option value="lowest">Lowest rated</option>
            </select>
          </div>
        </div>

        {/* Reviews grid */}
        {loading ? (
          <div className="py-16 grid place-items-center text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="py-16 text-center text-destructive">{error}</div>
        ) : visible.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground">
            No reviews match this filter yet. Be the first to share your experience!
          </div>
        ) : (
          <div className="columns-1 md:columns-2 lg:columns-3 gap-5 [column-fill:_balance]">
            {visible.map((r) => (
              <article
                key={r.id}
                className="group relative break-inside-avoid mb-5 glass rounded-2xl p-6 hover:border-primary/50 hover:-translate-y-1 transition-all duration-300"
              >
                <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-primary/15 via-accent/10 to-transparent opacity-0 group-hover:opacity-100 transition pointer-events-none" />
                <Quote className="absolute top-5 right-5 h-6 w-6 text-primary/20 group-hover:text-primary/40 transition" />
                <div className="relative">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-accent grid place-items-center text-primary-foreground text-sm font-bold ring-2 ring-primary/30">
                      {r.authorName.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-sm truncate">{r.authorName}</div>
                      <div className="text-xs text-muted-foreground">{formatDate(r.createdAt)}</div>
                    </div>
                  </div>
                  <Stars rating={r.rating} />
                  <h3 className="mt-3 font-semibold text-base leading-snug">{r.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{r.text}</p>
                  {r.images.length > 0 && (
                    <div className={`mt-4 grid gap-2 ${r.images.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
                      {r.images.slice(0, 4).map((src, i) => (
                        <button
                          key={src}
                          type="button"
                          onClick={() => setLightbox({ images: r.images, index: i })}
                          className="block overflow-hidden rounded-xl border border-border/60 relative group/img"
                          aria-label={`View image ${i + 1} from ${r.authorName}'s review`}
                        >
                          <img
                            src={src}
                            alt={`Photo ${i + 1} from ${r.authorName}'s review`}
                            loading="lazy"
                            className="w-full h-32 object-cover group-hover/img:scale-110 transition-transform duration-500"
                          />
                          {i === 3 && r.images.length > 4 && (
                            <div className="absolute inset-0 bg-black/60 grid place-items-center text-white font-semibold">
                              +{r.images.length - 4}
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="mt-4 flex items-center gap-2 text-xs flex-wrap">
                    <span className="px-2 py-0.5 rounded-full border border-primary/30 bg-primary/10 text-primary">
                      Verified
                    </span>
                    {r.variant && <span className="text-muted-foreground truncate">{r.variant}</span>}
                    {r.helpfulCount > 0 && (
                      <span className="ml-auto text-muted-foreground">
                        👍 {r.helpfulCount}
                      </span>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {filtered.length > PREVIEW_COUNT && (
          <div className="mt-10 flex justify-center">
            <Button
              variant="ghostNeon"
              size="lg"
              onClick={() => setExpanded((v) => !v)}
            >
              {expanded
                ? "Show fewer reviews"
                : `Show all reviews (${hiddenCount} more)`}
            </Button>
          </div>
        )}

        {/* CTA buttons intentionally removed per user request */}
      </div>

      <SubmitReviewDialog
        open={submitOpen}
        onOpenChange={setSubmitOpen}
        onCreated={(r) => setReviews((prev) => [r, ...prev])}
      />
      <ImageLightbox
        open={lightbox !== null}
        onClose={() => setLightbox(null)}
        images={(lightbox?.images ?? []).map((src) => ({ src }))}
        startIndex={lightbox?.index ?? 0}
      />
    </section>
  );
}

function OrderTracking() {
  const [orderId, setOrderId] = useState("");
  const [status, setStatus] = useState<Order | null>(null);
  const [tracking, setTracking] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const stages = ORDER_STAGES;

  const onTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId.trim()) return;
    setTracking(true);
    setNotFound(false);
    setStatus(null);
    try {
      const order = await lookupOrder(orderId);
      if (!order) {
        setNotFound(true);
      } else {
        setStatus(order);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to look up order");
    } finally {
      setTracking(false);
    }
  };

  return (
    <section id="track" className="py-24">
      <div className="mx-auto max-w-5xl px-6">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <p className="text-primary text-sm font-semibold tracking-widest uppercase">Order Tracking</p>
          <h2 className="mt-3 text-4xl md:text-5xl font-bold tracking-tight">
            Track Your <span className="text-gradient">TommyMeow Order</span>
          </h2>
          <p className="mt-4 text-muted-foreground">
            Enter your order ID to see real-time shipping progress and estimated delivery.
          </p>
        </div>
        <div className="glass rounded-3xl p-8 md:p-10">
          <form onSubmit={onTrack} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                placeholder="e.g. TM-2026-XXXX"
                className="h-12 pl-9 bg-background/40 border-border/60"
              />
            </div>
            <Button type="submit" variant="hero" size="lg" disabled={tracking}>
              {tracking ? (<><Loader2 className="h-4 w-4 animate-spin" /> Tracking…</>) : "Track Order"}
            </Button>
          </form>

          {notFound && (
            <div className="mt-6 text-center text-sm text-muted-foreground">
              No order found with that number. Double-check your confirmation email.
            </div>
          )}

          {status && (
            <div className="mt-10 animate-fade-up">
              <div className="flex items-center justify-between mb-4 text-sm">
                <div className="text-muted-foreground">
                  Order <span className="text-foreground font-semibold">#{status.orderNumber}</span>
                </div>
                <div className="text-primary font-medium">{stages[status.stage]}</div>
              </div>
              <div className="relative h-2 rounded-full bg-secondary overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-accent transition-all duration-700"
                  style={{ width: `${((status.stage + 1) / stages.length) * 100}%` }}
                />
              </div>
              <ol className="mt-6 grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
                {stages.map((s, i) => (
                  <li
                    key={s}
                    className={`rounded-lg px-3 py-2 text-center border ${
                      i <= status.stage
                        ? "border-primary/40 bg-primary/10 text-foreground"
                        : "border-border/60 text-muted-foreground"
                    }`}
                  >
                    {s}
                  </li>
                ))}
              </ol>
              {(status.itemSummary || status.notes) && (
                <div className="mt-6 grid sm:grid-cols-2 gap-4 text-sm">
                  {status.itemSummary && (
                    <div className="glass rounded-xl p-4">
                      <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Item</div>
                      <div>{status.itemSummary}</div>
                    </div>
                  )}
                  {status.notes && (
                    <div className="glass rounded-xl p-4">
                      <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Latest update</div>
                      <div className="whitespace-pre-line">{status.notes}</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function FAQ() {
  const items = [
    {
      q: "How does the AI design generator work?",
      a: "Just describe what you imagine — a phrase, mood, or style. Our AI creates a unique, print-ready design in seconds. You can refine, regenerate, or upload your own image at any time.",
    },
    {
      q: "What apparel do you print on?",
      a: "Premium cotton and cotton-blend t-shirts, hoodies, sweatshirts and more. Every piece is printed with high-quality DTG/DTF for sharp details and vibrant colors that last wash after wash.",
    },
    {
      q: "How long does shipping take?",
      a: "USA & UK: 3–5 business days. EU: 5–8 business days. International: 15–30 business days. You'll get a tracking link the moment your order ships.",
    },
    {
      q: "Can I use my own photo or logo?",
      a: "Yes — use the Upload a Photo feature to print any image. Our one-click background remover makes it easy to isolate logos, portraits, or product shots.",
    },
    {
      q: "What is your return policy?",
      a: "Because every item is custom-made for you, we accept returns only for defects or printing errors. Reach out within 14 days of delivery and we'll make it right.",
    },
    {
      q: "Do you offer commercial / POD licensing?",
      a: "Absolutely. Our Business plan includes a commercial license, bulk export, and API access — perfect for print-on-demand sellers and small brands.",
    },
    {
      q: "How are AI credits counted?",
      a: "One credit equals one AI generation. Regenerations and variations each consume a credit. Background removal and edits to an existing design are free.",
    },
    {
      q: "Is my design private and owned by me?",
      a: "Yes. You retain ownership of every design you create. Pro and Business plans include private mode so your prompts and outputs stay off the public gallery.",
    },
  ];
  return (
    <section id="faq" className="py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <p className="text-primary text-sm font-semibold tracking-widest uppercase">FAQ</p>
          <h2 className="mt-3 text-4xl md:text-5xl font-bold tracking-tight">
            Frequently Asked <span className="text-gradient">Questions</span>
          </h2>
          <p className="mt-4 text-muted-foreground">
            Everything you need to know before creating your first AI design.
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-5">
          {[items.slice(0, Math.ceil(items.length / 2)), items.slice(Math.ceil(items.length / 2))].map((col, ci) => (
            <div key={ci} className="glass rounded-3xl p-4 sm:p-6">
              <Accordion type="single" collapsible className="w-full">
                {col.map((it, i) => (
                  <AccordionItem
                    key={it.q}
                    value={`item-${ci}-${i}`}
                    className="border-b border-border/60 last:border-b-0 px-3"
                  >
                    <AccordionTrigger className="text-left text-base font-medium hover:no-underline py-5">
                      <span className="flex items-start gap-3">
                        <HelpCircle className="h-4 w-4 text-primary mt-1 shrink-0" />
                        {it.q}
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground text-sm leading-relaxed pl-7">
                      {it.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function _CTASection() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-5xl px-6">
        <div className="relative overflow-hidden rounded-3xl glass p-12 md:p-16 text-center">
          <div className="absolute inset-0 bg-grid opacity-30 [mask-image:radial-gradient(ellipse,black,transparent_70%)]" />
          <div className="relative">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
              Your Next Favorite Shirt Is <span className="text-gradient">One Prompt Away</span>
            </h2>
            <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
              Join 50,000+ creators turning ideas into apparel. Start with 2 free credits — no card required.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Button variant="hero" size="lg" asChild>
                <Link to="/ai-studio">Start Free Designing</Link>
              </Button>
              <Button variant="ghostNeon" size="lg">View Gallery</Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="relative mt-24 border-t border-border/60">
      <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
      <div className="mx-auto max-w-7xl px-6 pt-16 pb-10 grid lg:grid-cols-12 gap-10">
        {/* Brand + live chat card */}
        <div className="lg:col-span-4">
          <div className="relative overflow-hidden rounded-2xl p-5 border border-primary/30 bg-gradient-to-br from-primary/15 via-background/40 to-accent/15 backdrop-blur-xl">
            <div className="absolute -top-12 -right-12 h-32 w-32 rounded-full bg-primary/30 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-12 -left-12 h-32 w-32 rounded-full bg-accent/30 blur-3xl pointer-events-none" />
            <div className="relative flex items-start gap-3">
              <div className="relative">
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary to-accent grid place-items-center shadow-lg shadow-primary/30">
                  <MessageCircle className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-emerald-400 ring-2 ring-background">
                  <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-75" />
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <div className="text-sm font-semibold">Live chat support</div>
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Online
                  </span>
                </div>
                <div className="mt-0.5 text-xs text-muted-foreground">Avg. reply in under 2 minutes</div>
                <button
                  type="button"
                  onClick={() => window.dispatchEvent(new CustomEvent("aura:open-chat"))}
                  className="group mt-3 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-accent px-3.5 py-2 text-xs font-semibold text-primary-foreground shadow-md shadow-primary/30 hover:shadow-primary/50 transition"
                >
                  Chat with an agent
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </button>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <div className="text-[11px] uppercase tracking-widest text-muted-foreground mb-3">Follow us</div>
            <div className="flex items-center gap-3">
              <a
                href="#"
                aria-label="Instagram"
                className="group relative h-11 w-11 grid place-items-center rounded-xl overflow-hidden text-white transition-transform hover:-translate-y-0.5"
                style={{ background: "linear-gradient(135deg,#feda75 0%,#fa7e1e 25%,#d62976 50%,#962fbf 75%,#4f5bd5 100%)" }}
              >
                <Instagram className="h-5 w-5 relative z-10" />
                <span className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition" />
              </a>
              <a
                href="#"
                aria-label="YouTube"
                className="group h-11 w-11 grid place-items-center rounded-xl bg-[#FF0000] text-white shadow-md shadow-red-500/30 transition-transform hover:-translate-y-0.5 hover:bg-[#e60000]"
              >
                <Youtube className="h-5 w-5" />
              </a>
              <a
                href="#"
                aria-label="Facebook"
                className="group h-11 w-11 grid place-items-center rounded-xl bg-[#1877F2] text-white shadow-md shadow-blue-500/30 transition-transform hover:-translate-y-0.5 hover:bg-[#1467d4]"
              >
                <Facebook className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="text-sm font-semibold mb-4">Help</div>
          <ul className="space-y-2.5 text-sm text-muted-foreground">
            <li><Link to="/p/$slug" params={{ slug: "about" }} className="hover:text-foreground transition">About Us</Link></li>
            <li><Link to="/p/$slug" params={{ slug: "contact" }} className="hover:text-foreground transition">Contact Us</Link></li>
            <li><Link to="/p/$slug" params={{ slug: "privacy" }} className="hover:text-foreground transition">Privacy Policy</Link></li>
            <li><Link to="/p/$slug" params={{ slug: "terms" }} className="hover:text-foreground transition">Terms &amp; Conditions</Link></li>
          </ul>
        </div>

        <div className="lg:col-span-3">
          <div className="text-sm font-semibold mb-4">Useful Links</div>
          <ul className="space-y-2.5 text-sm text-muted-foreground">
            <li><Link to="/ai-studio" className="hover:text-foreground transition">Our AI generator</Link></li>
            <li><Link to="/orders/track" className="hover:text-foreground transition">Order Tracking</Link></li>
            <li><Link to="/p/$slug" params={{ slug: "returns" }} className="hover:text-foreground transition">Returns Policy</Link></li>
            <li><Link to="/p/$slug" params={{ slug: "shipping" }} className="hover:text-foreground transition">Shipping Policy</Link></li>
          </ul>
        </div>

        <div className="lg:col-span-3">
          <div className="text-sm font-semibold mb-4 flex items-center gap-2">
            Get the App
            <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-primary/15 text-primary border border-primary/30">
              coming
            </span>
          </div>
          <div className="flex flex-col gap-2.5">
            <button
              type="button"
              disabled
              className="group flex items-center gap-3 rounded-xl glass px-3.5 py-2.5 text-left opacity-90 hover:border-primary/50 transition cursor-not-allowed"
            >
              <Apple className="h-6 w-6 text-foreground" />
              <div className="leading-tight">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Coming soon</div>
                <div className="text-sm font-semibold">App Store</div>
              </div>
            </button>
            <button
              type="button"
              disabled
              className="group flex items-center gap-3 rounded-xl glass px-3.5 py-2.5 text-left opacity-90 hover:border-primary/50 transition cursor-not-allowed"
            >
              <Smartphone className="h-6 w-6 text-foreground" />
              <div className="leading-tight">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Coming soon</div>
                <div className="text-sm font-semibold">Google Play</div>
              </div>
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 pb-10 pt-6 border-t border-border/60 flex flex-wrap items-center justify-between gap-4 text-xs text-muted-foreground">
        <div>© {new Date().getFullYear()} TommyMeow. All rights reserved.</div>
        <div className="flex items-center gap-2.5">
          <span className="mr-1 hidden sm:inline">Secure payments via Stripe</span>
          <PayBadge brand="visa" />
          <PayBadge brand="mastercard" />
          <PayBadge brand="amex" />
          <PayBadge brand="paypal" />
          <PayBadge brand="applepay" />
          <PayBadge brand="googlepay" />
          <PayBadge brand="stripe" />
        </div>
      </div>
    </footer>
  );
}

function PayBadge({ brand }: { brand: "visa" | "mastercard" | "amex" | "paypal" | "applepay" | "googlepay" | "stripe" }) {
  const wrap = "inline-flex items-center justify-center h-8 w-12 rounded-md bg-white border border-border/60 shadow-sm overflow-hidden";
  const map: Record<typeof brand, { label: string; svg: ReactNode }> = {
    visa: {
      label: "Visa",
      svg: (
        <svg viewBox="0 0 48 16" className="h-3.5 w-auto" xmlns="http://www.w3.org/2000/svg">
          <text x="0" y="13" fontFamily="Arial, sans-serif" fontWeight="900" fontStyle="italic" fontSize="14" fill="#1A1F71" letterSpacing="0.5">VISA</text>
        </svg>
      ),
    },
    mastercard: {
      label: "Mastercard",
      svg: (
        <svg viewBox="0 0 32 20" className="h-5 w-auto" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="10" r="8" fill="#EB001B" />
          <circle cx="20" cy="10" r="8" fill="#F79E1B" />
          <path d="M16 4.2a8 8 0 010 11.6 8 8 0 010-11.6z" fill="#FF5F00" />
        </svg>
      ),
    },
    amex: {
      label: "American Express",
      svg: (
        <svg viewBox="0 0 48 20" className="h-4 w-auto" xmlns="http://www.w3.org/2000/svg">
          <rect width="48" height="20" rx="2" fill="#1F72CD" />
          <text x="24" y="9" textAnchor="middle" fontFamily="Arial, sans-serif" fontWeight="700" fontSize="5" fill="#fff" letterSpacing="0.3">AMERICAN</text>
          <text x="24" y="15" textAnchor="middle" fontFamily="Arial, sans-serif" fontWeight="700" fontSize="5" fill="#fff" letterSpacing="0.3">EXPRESS</text>
        </svg>
      ),
    },
    paypal: {
      label: "PayPal",
      svg: (
        <svg viewBox="0 0 48 14" className="h-3.5 w-auto" xmlns="http://www.w3.org/2000/svg">
          <text x="0" y="11" fontFamily="Arial, sans-serif" fontWeight="900" fontStyle="italic" fontSize="11" fill="#003087">Pay</text>
          <text x="17" y="11" fontFamily="Arial, sans-serif" fontWeight="900" fontStyle="italic" fontSize="11" fill="#009CDE">Pal</text>
        </svg>
      ),
    },
    applepay: {
      label: "Apple Pay",
      svg: (
        <svg viewBox="0 0 48 18" className="h-4 w-auto" xmlns="http://www.w3.org/2000/svg">
          <path d="M8.5 5.4c.5-.6.8-1.4.7-2.2-.7 0-1.5.4-2 1-.5.5-.9 1.4-.7 2.2.8.1 1.6-.4 2-1zM9.2 6.6c-1.1-.1-2 .6-2.5.6-.5 0-1.3-.6-2.2-.6-1.1 0-2.2.7-2.7 1.7-1.2 2-.3 5 .8 6.6.6.8 1.2 1.7 2.1 1.6.8 0 1.2-.5 2.2-.5s1.3.5 2.2.5c.9 0 1.5-.8 2.1-1.6.7-.9 1-1.8 1-1.9-.1-.1-1.9-.7-1.9-2.9 0-1.8 1.5-2.7 1.6-2.7-.9-1.3-2.2-1.4-2.7-1.4z" fill="#000" />
          <text x="14" y="13" fontFamily="-apple-system, Helvetica, Arial, sans-serif" fontWeight="600" fontSize="9" fill="#000">Pay</text>
        </svg>
      ),
    },
    googlepay: {
      label: "Google Pay",
      svg: (
        <svg viewBox="0 0 48 18" className="h-4 w-auto" xmlns="http://www.w3.org/2000/svg">
          <text x="0" y="13" fontFamily="Arial, sans-serif" fontWeight="500" fontSize="9" fill="#4285F4">G</text>
          <text x="6" y="13" fontFamily="Arial, sans-serif" fontWeight="500" fontSize="9" fill="#EA4335">o</text>
          <text x="12" y="13" fontFamily="Arial, sans-serif" fontWeight="500" fontSize="9" fill="#FBBC04">o</text>
          <text x="18" y="13" fontFamily="Arial, sans-serif" fontWeight="500" fontSize="9" fill="#4285F4">g</text>
          <text x="24" y="13" fontFamily="Arial, sans-serif" fontWeight="500" fontSize="9" fill="#34A853">l</text>
          <text x="27" y="13" fontFamily="Arial, sans-serif" fontWeight="500" fontSize="9" fill="#EA4335">e</text>
          <text x="34" y="13" fontFamily="Arial, sans-serif" fontWeight="600" fontSize="9" fill="#5F6368">Pay</text>
        </svg>
      ),
    },
    stripe: {
      label: "Stripe",
      svg: (
        <svg viewBox="0 0 48 20" className="h-4 w-auto" xmlns="http://www.w3.org/2000/svg">
          <rect width="48" height="20" rx="3" fill="#635BFF" />
          <text x="24" y="14" textAnchor="middle" fontFamily="Arial, sans-serif" fontWeight="800" fontSize="10" fill="#fff" letterSpacing="0.3">stripe</text>
        </svg>
      ),
    },
  };
  const item = map[brand];
  return (
    <span className={wrap} title={item.label} aria-label={item.label}>
      {item.svg}
    </span>
  );
}

function LiveChatWidget() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener("aura:open-chat", handler);
    return () => window.removeEventListener("aura:open-chat", handler);
  }, []);

  return (
    <>
      <button
        type="button"
        aria-label="Open live chat"
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-[0_0_40px_oklch(0.85_0.18_210/0.55)] grid place-items-center hover:scale-110 transition active:scale-95"
      >
        {open ? <X className="h-5 w-5" /> : <MessageCircle className="h-6 w-6" />}
        {!open && (
          <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-emerald-400 ring-2 ring-background animate-pulse" />
        )}
      </button>

      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-[92vw] max-w-sm rounded-2xl glass shadow-[0_20px_60px_-10px_oklch(0_0_0/0.6)] overflow-hidden animate-fade-up">
          <div className="flex items-center gap-3 p-4 border-b border-border/60 bg-gradient-to-r from-primary/15 to-accent/10">
            <div className="relative">
              <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary to-accent grid place-items-center">
                <Sparkles className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-background" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold">TommyMeow Support</div>
              <div className="text-[11px] text-muted-foreground">Typically replies in a few minutes</div>
            </div>
            <button
              type="button"
              aria-label="Close chat"
              onClick={() => setOpen(false)}
              className="h-8 w-8 grid place-items-center rounded-lg hover:bg-secondary transition"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="p-4 space-y-3 max-h-72 overflow-y-auto">
            <div className="flex gap-2">
              <div className="h-7 w-7 rounded-full bg-gradient-to-br from-primary to-accent shrink-0" />
              <div className="rounded-2xl rounded-tl-sm bg-secondary/60 px-3 py-2 text-sm max-w-[80%]">
                Hey! 👋 How can we help you with your TommyMeow design today?
              </div>
            </div>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
            }}
            className="p-3 border-t border-border/60 flex items-center gap-2"
          >
            <Input
              placeholder="Type your message…"
              className="h-10 bg-background/40 border-border/60"
            />
            <Button type="submit" size="icon" variant="hero" className="h-10 w-10 rounded-xl">
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      )}
    </>
  );
}

function Landing() {
  return (
    <div className="min-h-screen">
      <Nav />
      <main>
        <Hero />
        <HowItWorks />
        <Features />
        <Trending />
        <Pricing />
        <Shipping />
      <Reviews />
        <OrderTracking />
        <FAQ />
        <CTASection />
      </main>
      <Footer />
      <LiveChatWidget />
    </div>
  );
}
