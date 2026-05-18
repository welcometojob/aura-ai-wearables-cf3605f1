export type Language = {
  code: string; // BCP-47-ish (e.g. "en", "pt-BR", "zh-CN")
  name: string; // English name
  native: string; // Native name
  flag: string; // Emoji flag
  region: "Europe" | "Americas" | "Asia" | "MENA" | "Africa" | "Oceania";
};

export const LANGUAGES: Language[] = [
  // Europe
  { code: "en", name: "English", native: "English", flag: "🇬🇧", region: "Europe" },
  { code: "fr", name: "French", native: "Français", flag: "🇫🇷", region: "Europe" },
  { code: "de", name: "German", native: "Deutsch", flag: "🇩🇪", region: "Europe" },
  { code: "es", name: "Spanish", native: "Español", flag: "🇪🇸", region: "Europe" },
  { code: "it", name: "Italian", native: "Italiano", flag: "🇮🇹", region: "Europe" },
  { code: "pt", name: "Portuguese", native: "Português", flag: "🇵🇹", region: "Europe" },
  { code: "nl", name: "Dutch", native: "Nederlands", flag: "🇳🇱", region: "Europe" },
  { code: "pl", name: "Polish", native: "Polski", flag: "🇵🇱", region: "Europe" },
  { code: "ro", name: "Romanian", native: "Română", flag: "🇷🇴", region: "Europe" },
  { code: "el", name: "Greek", native: "Ελληνικά", flag: "🇬🇷", region: "Europe" },
  { code: "cs", name: "Czech", native: "Čeština", flag: "🇨🇿", region: "Europe" },
  { code: "sk", name: "Slovak", native: "Slovenčina", flag: "🇸🇰", region: "Europe" },
  { code: "hu", name: "Hungarian", native: "Magyar", flag: "🇭🇺", region: "Europe" },
  { code: "sv", name: "Swedish", native: "Svenska", flag: "🇸🇪", region: "Europe" },
  { code: "no", name: "Norwegian", native: "Norsk", flag: "🇳🇴", region: "Europe" },
  { code: "da", name: "Danish", native: "Dansk", flag: "🇩🇰", region: "Europe" },
  { code: "fi", name: "Finnish", native: "Suomi", flag: "🇫🇮", region: "Europe" },
  { code: "is", name: "Icelandic", native: "Íslenska", flag: "🇮🇸", region: "Europe" },
  { code: "bg", name: "Bulgarian", native: "Български", flag: "🇧🇬", region: "Europe" },
  { code: "hr", name: "Croatian", native: "Hrvatski", flag: "🇭🇷", region: "Europe" },
  { code: "sr", name: "Serbian", native: "Српски", flag: "🇷🇸", region: "Europe" },
  { code: "sl", name: "Slovenian", native: "Slovenščina", flag: "🇸🇮", region: "Europe" },
  { code: "lt", name: "Lithuanian", native: "Lietuvių", flag: "🇱🇹", region: "Europe" },
  { code: "lv", name: "Latvian", native: "Latviešu", flag: "Latviešu", region: "Europe" },
  { code: "et", name: "Estonian", native: "Eesti", flag: "🇪🇪", region: "Europe" },
  { code: "ga", name: "Irish", native: "Gaeilge", flag: "🇮🇪", region: "Europe" },
  { code: "ru", name: "Russian", native: "Русский", flag: "🇷🇺", region: "Europe" },
  { code: "uk", name: "Ukrainian", native: "Українська", flag: "🇺🇦", region: "Europe" },
  { code: "tr", name: "Turkish", native: "Türkçe", flag: "🇹🇷", region: "Europe" },

  // Americas
  { code: "pt-BR", name: "Portuguese (Brazil)", native: "Português (Brasil)", flag: "🇧🇷", region: "Americas" },
  { code: "es-MX", name: "Spanish (Mexico)", native: "Español (México)", flag: "🇲🇽", region: "Americas" },
  { code: "fr-CA", name: "French (Canada)", native: "Français (Canada)", flag: "🇨🇦", region: "Americas" },

  // Asia & developed
  { code: "zh-CN", name: "Chinese (Simplified)", native: "简体中文", flag: "🇨🇳", region: "Asia" },
  { code: "zh-TW", name: "Chinese (Traditional)", native: "繁體中文", flag: "🇹🇼", region: "Asia" },
  { code: "ja", name: "Japanese", native: "日本語", flag: "🇯🇵", region: "Asia" },
  { code: "ko", name: "Korean", native: "한국어", flag: "🇰🇷", region: "Asia" },
  { code: "hi", name: "Hindi", native: "हिन्दी", flag: "🇮🇳", region: "Asia" },
  { code: "bn", name: "Bengali", native: "বাংলা", flag: "🇧🇩", region: "Asia" },
  { code: "ur", name: "Urdu", native: "اردو", flag: "🇵🇰", region: "Asia" },
  { code: "id", name: "Indonesian", native: "Bahasa Indonesia", flag: "🇮🇩", region: "Asia" },
  { code: "ms", name: "Malay", native: "Bahasa Melayu", flag: "🇲🇾", region: "Asia" },
  { code: "vi", name: "Vietnamese", native: "Tiếng Việt", flag: "🇻🇳", region: "Asia" },
  { code: "th", name: "Thai", native: "ไทย", flag: "🇹🇭", region: "Asia" },
  { code: "fil", name: "Filipino", native: "Filipino", flag: "🇵🇭", region: "Asia" },

  // MENA
  { code: "ar", name: "Arabic", native: "العربية", flag: "🇸🇦", region: "MENA" },
  { code: "he", name: "Hebrew", native: "עברית", flag: "🇮🇱", region: "MENA" },
  { code: "fa", name: "Persian", native: "فارسی", flag: "🇮🇷", region: "MENA" },

  // Africa / Oceania
  { code: "sw", name: "Swahili", native: "Kiswahili", flag: "🇰🇪", region: "Africa" },
  { code: "af", name: "Afrikaans", native: "Afrikaans", flag: "🇿🇦", region: "Africa" },
];

// Map country code (ISO-3166 alpha-2) → preferred language code
export const COUNTRY_TO_LANG: Record<string, string> = {
  US: "en", GB: "en", AU: "en", NZ: "en", IE: "en", CA: "en", ZA: "en",
  FR: "fr", BE: "fr", CH: "fr", LU: "fr",
  DE: "de", AT: "de", LI: "de",
  ES: "es", AR: "es", CL: "es", CO: "es", PE: "es", VE: "es", UY: "es", PY: "es", BO: "es", EC: "es", CR: "es", PA: "es", GT: "es", HN: "es", NI: "es", SV: "es", DO: "es", CU: "es",
  MX: "es-MX",
  BR: "pt-BR", PT: "pt", AO: "pt", MZ: "pt",
  IT: "it", SM: "it", VA: "it",
  NL: "nl",
  PL: "pl",
  RO: "ro", MD: "ro",
  GR: "el", CY: "el",
  CZ: "cs", SK: "sk",
  HU: "hu",
  SE: "sv", NO: "no", DK: "da", FI: "fi", IS: "is",
  BG: "bg", HR: "hr", RS: "sr", SI: "sl",
  LT: "lt", LV: "lv", EE: "et",
  RU: "ru", BY: "ru", KZ: "ru",
  UA: "uk",
  TR: "tr",
  CN: "zh-CN", SG: "zh-CN",
  TW: "zh-TW", HK: "zh-TW", MO: "zh-TW",
  JP: "ja",
  KR: "ko", KP: "ko",
  IN: "hi", LK: "hi", NP: "hi",
  BD: "bn",
  PK: "ur",
  ID: "id",
  MY: "ms", BN: "ms",
  VN: "vi",
  TH: "th",
  PH: "fil",
  SA: "ar", AE: "ar", EG: "ar", IQ: "ar", JO: "ar", KW: "ar", LB: "ar", LY: "ar", MA: "ar", OM: "ar", QA: "ar", SY: "ar", TN: "ar", YE: "ar", DZ: "ar", BH: "ar", SD: "ar",
  IL: "he",
  IR: "fa", AF: "fa", TJ: "fa",
  KE: "sw", TZ: "sw", UG: "sw",
};

export function languageByCode(code: string): Language | undefined {
  return LANGUAGES.find((l) => l.code === code);
}