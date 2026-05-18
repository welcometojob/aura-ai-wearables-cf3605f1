-- Add per-product admin-selected color variants to products table.
-- Each entry stores a ColorSwatch id (from src/lib/aura-config.ts COLORS).
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS colors TEXT[] NOT NULL DEFAULT '{}';
