export type Fit = "Men" | "Women" | "Kids";
export type View = "front" | "back";

export type ProductStyle = {
  id: string;
  name: string;
  price: number;
  description: string;
};

export const PRODUCT_STYLES: ProductStyle[] = [
  { id: "standard", name: "Standard", price: 32, description: "Unisex T-shirt" },
  { id: "hoodie", name: "Hoodie", price: 58, description: "Fleece-Lined Premium" },
];

export type ColorSwatch = {
  id: string;
  name: string;
  hex: string;
  filter: string;
};

export const COLORS: ColorSwatch[] = [
  { id: "white", name: "White", hex: "#F5F5F5", filter: "none" },
  { id: "black", name: "Black", hex: "#0E0E0E", filter: "brightness(0.12) contrast(1.4)" },
  { id: "grey",  name: "Grey",  hex: "#7A7A7A", filter: "brightness(0.55) saturate(0)" },
  { id: "blue",  name: "Blue",  hex: "#1E5BFF", filter: "brightness(0.55) sepia(1) hue-rotate(190deg) saturate(6)" },
  { id: "red",   name: "Red",   hex: "#D7263D", filter: "brightness(0.6) sepia(1) hue-rotate(-25deg) saturate(7)" },
  { id: "yellow",name: "Yellow",hex: "#F5C518", filter: "brightness(0.95) sepia(1) hue-rotate(-15deg) saturate(5)" },
];

export const SIZES = ["S", "M", "L", "XL", "XXL"] as const;
export type Size = (typeof SIZES)[number];

export const STYLE_PRESETS = [
  { id: "vintage", name: "Vintage", hint: "Faded, grainy, retro palette" },
  { id: "minimal", name: "Minimal", hint: "Mono-line, lots of whitespace" },
  { id: "cyberpunk", name: "Cyberpunk", hint: "Neon glow, futuristic" },
  { id: "anime", name: "Anime", hint: "Cel-shaded illustration" },
  { id: "streetwear", name: "Streetwear", hint: "Graffiti & bold type" },
  { id: "abstract", name: "Abstract", hint: "Geometric, flowing forms" },
];