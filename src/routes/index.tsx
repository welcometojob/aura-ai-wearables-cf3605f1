import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import tshirt1 from "@/assets/tshirt-hero-1.jpg";
import tshirt2 from "@/assets/tshirt-hero-2.jpg";
import tshirt3 from "@/assets/tshirt-hero-3.jpg";
import trend1 from "@/assets/trend-1.jpg";
import trend2 from "@/assets/trend-2.jpg";
import trend3 from "@/assets/trend-3.jpg";
import trend4 from "@/assets/trend-4.jpg";

export const Route = createFileRoute("/")({
  component: Landing,
});

const heroMockups = [tshirt1, tshirt2, tshirt3];

function Nav() {
  return (
    <header className="fixed top-0 inset-x-0 z-50">
      <div className="mx-auto max-w-7xl px-6 py-4">
        <div className="glass rounded-2xl px-5 py-3 flex items-center justify-between">
          <a href="#" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-accent grid place-items-center glow-soft">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-bold tracking-tight text-lg">Aura Wear</span>
          </a>
          <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
            <a href="#how" className="hover:text-foreground transition">How it works</a>
            <a href="#features" className="hover:text-foreground transition">Features</a>
            <a href="#trending" className="hover:text-foreground transition">Trending</a>
            <a href="#pricing" className="hover:text-foreground transition">Pricing</a>
          </nav>
          <Button variant="hero" size="sm">
            Start Designing
          </Button>
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
          <div className="inline-flex items-center gap-2 rounded-full glass px-3 py-1.5 text-xs text-muted-foreground mb-6">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            Powered by next-gen generative AI
          </div>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.05]">
            Design Your <br />
            <span className="text-gradient">Identity with AI</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-xl">
            Transform your wildest thoughts into premium wearable art in seconds.
            No design skills required.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Button variant="hero" size="lg" className="group">
              Start Designing
              <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
            <Button variant="ghostNeon" size="lg">
              View Gallery
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
          <p className="text-primary text-sm font-semibold tracking-widest uppercase">How it works</p>
          <h2 className="mt-3 text-4xl md:text-5xl font-bold tracking-tight">
            From idea to apparel in <span className="text-gradient">three steps</span>
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6 relative">
          <div className="hidden md:block absolute top-16 left-[16%] right-[16%] h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
          {steps.map((s, i) => (
            <div key={s.title} className="relative glass rounded-2xl p-8 hover:border-primary/40 transition-all hover:-translate-y-1">
              <div className="flex items-center justify-between mb-6">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 grid place-items-center ring-glow">
                  <s.icon className="h-5 w-5 text-primary" />
                </div>
                <span className="text-5xl font-extrabold text-foreground/5">0{i + 1}</span>
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
            Everything you need, <span className="text-gradient">beautifully crafted</span>
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
  icon: React.ElementType;
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
        <div className="mt-5 flex items-center gap-1.5 text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition">
          Learn more <ArrowRight className="h-3.5 w-3.5" />
        </div>
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
  return (
    <section id="trending" className="py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex items-end justify-between mb-12 flex-wrap gap-4">
          <div>
            <p className="text-primary text-sm font-semibold tracking-widest uppercase">Trending now</p>
            <h2 className="mt-3 text-4xl md:text-5xl font-bold tracking-tight">Hot off the AI press</h2>
          </div>
          <Button variant="ghostNeon">Browse Gallery</Button>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {items.map((it) => (
            <div key={it.name} className="group relative glass rounded-2xl overflow-hidden hover:border-primary/50 transition">
              <div className="aspect-[4/5] overflow-hidden bg-secondary">
                <img
                  src={it.src}
                  alt={it.name}
                  loading="lazy"
                  width={768}
                  height={896}
                  className="h-full w-full object-cover group-hover:scale-105 transition duration-700"
                />
              </div>
              <div className="p-4 flex items-center justify-between">
                <div>
                  <div className="font-medium">{it.name}</div>
                  <div className="text-xs text-muted-foreground">AI Original</div>
                </div>
                <div className="text-primary font-semibold">{it.price}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Pricing() {
  const tiers = [
    {
      name: "Free",
      price: "$0",
      tagline: "Dip your toes in.",
      features: ["2 AI credits", "Standard resolution", "Community gallery", "Email support"],
      cta: "Get Started",
      highlight: false,
    },
    {
      name: "Pro",
      price: "$19",
      tagline: "For serious creators.",
      features: ["50 AI credits / month", "4K print-ready exports", "Background remover", "Priority support"],
      cta: "Go Pro",
      highlight: true,
    },
    {
      name: "Business",
      price: "$79",
      tagline: "Built for POD sellers.",
      features: ["Unlimited credits", "Commercial license", "Bulk export & API", "Dedicated manager"],
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
            Pick the plan that <span className="text-gradient">fits your flow</span>
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {tiers.map((t) => (
            <div
              key={t.name}
              className={`relative rounded-3xl p-8 flex flex-col ${
                t.highlight
                  ? "glass ring-glow bg-gradient-to-b from-primary/10 to-transparent"
                  : "glass"
              }`}
            >
              {t.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-semibold px-3 py-1 rounded-full bg-gradient-to-r from-primary to-accent text-primary-foreground">
                  Most Popular
                </div>
              )}
              <div className="text-sm text-muted-foreground">{t.name}</div>
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
                variant={t.highlight ? "hero" : "ghostNeon"}
                className="mt-8 w-full"
              >
                {t.cta}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-5xl px-6">
        <div className="relative overflow-hidden rounded-3xl glass p-12 md:p-16 text-center">
          <div className="absolute inset-0 bg-grid opacity-30 [mask-image:radial-gradient(ellipse,black,transparent_70%)]" />
          <div className="relative">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
              Your next favorite shirt is <span className="text-gradient">one prompt away</span>
            </h2>
            <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
              Join 50,000+ creators turning ideas into apparel. Start with 2 free credits — no card required.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Button variant="hero" size="lg">Start Designing</Button>
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
    <footer className="border-t border-border/60 py-12 mt-12">
      <div className="mx-auto max-w-7xl px-6 grid md:grid-cols-4 gap-10">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-accent grid place-items-center">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg">Aura Wear</span>
          </div>
          <p className="mt-4 text-sm text-muted-foreground max-w-sm">
            AI-powered custom apparel. Design, preview, and order premium wearable art in minutes.
          </p>
        </div>
        <div>
          <div className="text-sm font-semibold mb-3">Product</div>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><a href="#how" className="hover:text-foreground transition">How it works</a></li>
            <li><a href="#features" className="hover:text-foreground transition">Features</a></li>
            <li><a href="#pricing" className="hover:text-foreground transition">Pricing</a></li>
          </ul>
        </div>
        <div>
          <div className="text-sm font-semibold mb-3">Company</div>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><a href="#" className="hover:text-foreground transition">Terms</a></li>
            <li><a href="#" className="hover:text-foreground transition">Privacy</a></li>
            <li><a href="#" className="hover:text-foreground transition">Contact Us</a></li>
          </ul>
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-6 mt-10 pt-6 border-t border-border/60 flex flex-wrap items-center justify-between gap-4 text-xs text-muted-foreground">
        <div>© {new Date().getFullYear()} Aura Wear. All rights reserved.</div>
        <div>Crafted with AI, shipped worldwide.</div>
      </div>
    </footer>
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
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
