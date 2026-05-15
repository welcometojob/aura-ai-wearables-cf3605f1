
-- site_pages
CREATE TABLE public.site_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.site_pages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "site_pages public read" ON public.site_pages FOR SELECT USING (true);
CREATE POLICY "site_pages admin insert" ON public.site_pages FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "site_pages admin update" ON public.site_pages FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "site_pages admin delete" ON public.site_pages FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER site_pages_updated_at BEFORE UPDATE ON public.site_pages FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.site_pages (slug, title, content) VALUES
('about', 'About Us', E'# About TommyMeow\n\nTommyMeow is an AI-powered apparel studio where anyone can design, generate, and order premium custom clothing in minutes. We blend cutting-edge generative AI with high-quality on-demand manufacturing so your imagination becomes a wearable piece.\n\n## Our mission\nMake creative self-expression effortless and accessible — whether you''re a designer, an entrepreneur, or just someone who loves unique apparel.\n\n## What we do\n- AI-generated artwork tailored to your prompts and styles\n- Premium printed t-shirts, hoodies and more\n- Worldwide on-demand shipping\n- Verified buyer reviews you can trust\n\nThank you for being part of the journey.'),
('contact', 'Contact Us', E'# Contact Us\n\nWe''d love to hear from you. Reach our team via any of the channels below — we typically respond within a few hours during business days.\n\n## Email\nsupport@tommymeow.com\n\n## Live chat\nClick the **Live chat support** card on our footer to chat with an agent. Average reply time is under 2 minutes.\n\n## Press & partnerships\npartnerships@tommymeow.com'),
('privacy', 'Privacy Policy', E'# Privacy Policy\n\nLast updated: 2026.\n\nWe respect your privacy and are committed to protecting your personal data. This policy explains what we collect, how we use it, and your rights.\n\n## Information we collect\n- Account information (name, email, profile)\n- Order and shipping details\n- Generated artwork and prompts\n- Usage analytics (anonymized)\n\n## How we use it\n- To fulfill orders and provide customer support\n- To improve our AI generation and product offerings\n- To send transactional emails (order confirmations, shipping updates)\n\n## Your rights\nYou may request access, correction, or deletion of your personal data at any time by emailing privacy@tommymeow.com.\n\n## Cookies\nWe use essential cookies for authentication and analytics cookies to improve the experience. You can disable non-essential cookies in your browser.'),
('terms', 'Terms & Conditions', E'# Terms & Conditions\n\nLast updated: 2026.\n\nBy using TommyMeow you agree to the following terms. Please read them carefully.\n\n## Use of the service\nYou must be at least 13 years old to use TommyMeow. You agree not to use the service to generate or order content that is illegal, hateful, infringing, or sexually explicit involving minors.\n\n## Intellectual property\nYou retain rights to the prompts you submit. AI-generated artwork is licensed to you for personal and commercial apparel use, subject to our content policy.\n\n## Orders & payments\nAll prices are in USD and payments are processed securely via Stripe. Orders are made on demand and can''t be modified after entering production.\n\n## Liability\nTo the maximum extent permitted by law, TommyMeow is not liable for indirect or consequential damages arising from use of the service.\n\nFor questions email legal@tommymeow.com.'),
('returns', 'Returns Policy', E'# Returns Policy\n\nWe stand behind every TommyMeow order. If your item arrives damaged, defective, or significantly different from what was ordered, we''ll make it right.\n\n## Eligibility\n- Report within **14 days** of delivery\n- Item must be unworn, unwashed and in original packaging\n- Custom AI-designed items can only be returned for quality issues, not personal preference\n\n## How to start a return\n1. Email returns@tommymeow.com with your order number and photos of the issue\n2. We''ll review within 24 hours and email you a prepaid return label if eligible\n3. Refund is issued to your original payment method within 5–7 business days of receipt\n\n## Exchanges\nWe gladly exchange for a different size if available. Color and design changes require a new order.'),
('shipping', 'Shipping Policy', E'# Shipping Policy\n\nWe ship worldwide via trusted carriers. Production typically takes **2–4 business days**, then your order ships.\n\n## Delivery times\n- **United States:** 3–6 business days\n- **Europe & UK:** 5–9 business days\n- **Rest of world:** 7–14 business days\n\n## Shipping rates\nA flat shipping rate is calculated at checkout and shown on your cart total. Free-shipping promotions are announced via email and on the homepage.\n\n## Tracking\nYou''ll receive a tracking link by email as soon as your order ships. You can also track from your account dashboard.\n\n## Lost or delayed shipments\nIf your order hasn''t arrived within the expected window, email support@tommymeow.com with your order number and we''ll investigate immediately.');

-- site_settings
CREATE TABLE public.site_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "site_settings public read" ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "site_settings admin insert" ON public.site_settings FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "site_settings admin update" ON public.site_settings FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "site_settings admin delete" ON public.site_settings FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER site_settings_updated_at BEFORE UPDATE ON public.site_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.site_settings (key, value) VALUES
  ('shipping_rate', '5.00'::jsonb);

-- product_styles
CREATE TABLE public.product_styles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.product_styles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "product_styles public read" ON public.product_styles FOR SELECT USING (true);
CREATE POLICY "product_styles admin insert" ON public.product_styles FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "product_styles admin update" ON public.product_styles FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "product_styles admin delete" ON public.product_styles FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER product_styles_updated_at BEFORE UPDATE ON public.product_styles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.product_styles (slug, name, description, price, sort_order) VALUES
  ('standard', 'Standard', 'Unisex T-shirt', 32.00, 1),
  ('hoodie', 'Hoodie', 'Fleece-Lined Premium', 58.00, 2);
