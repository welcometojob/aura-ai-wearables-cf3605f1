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
  { id: "navy",   name: "Navy",   hex: "#1B2A4E", filter: "brightness(0.25) sepia(1) hue-rotate(190deg) saturate(5)" },
  { id: "olive",  name: "Olive",  hex: "#6B7A3A", filter: "brightness(0.5) sepia(1) hue-rotate(40deg) saturate(2.5)" },
  { id: "forest", name: "Forest", hex: "#1F4D2B", filter: "brightness(0.35) sepia(1) hue-rotate(80deg) saturate(4)" },
  { id: "maroon", name: "Maroon", hex: "#5C1A1B", filter: "brightness(0.3) sepia(1) hue-rotate(-15deg) saturate(5)" },
  { id: "pink",   name: "Pink",   hex: "#F4A6C0", filter: "brightness(0.9) sepia(1) hue-rotate(-50deg) saturate(2)" },
  { id: "purple", name: "Purple", hex: "#6B2FB3", filter: "brightness(0.45) sepia(1) hue-rotate(230deg) saturate(6)" },
  { id: "teal",   name: "Teal",   hex: "#0F8C8C", filter: "brightness(0.55) sepia(1) hue-rotate(140deg) saturate(4)" },
  { id: "orange", name: "Orange", hex: "#F26A21", filter: "brightness(0.75) sepia(1) hue-rotate(-30deg) saturate(6)" },
  { id: "sand",   name: "Sand",   hex: "#D8C9A3", filter: "brightness(0.85) sepia(1) hue-rotate(-10deg) saturate(1.5)" },
  { id: "brown",  name: "Brown",  hex: "#5A3A22", filter: "brightness(0.35) sepia(1) hue-rotate(-25deg) saturate(3)" },
  { id: "mint",   name: "Mint",   hex: "#A8E6CF", filter: "brightness(0.92) sepia(1) hue-rotate(90deg) saturate(1.5)" },
  { id: "lavender", name: "Lavender", hex: "#C5B4E3", filter: "brightness(0.85) sepia(1) hue-rotate(220deg) saturate(1.6)" },
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