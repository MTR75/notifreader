/**
 * Parses Dexcom CGM notifications and converts them into a clean spoken sentence.
 * Handles Unicode trend arrows and Dexcom's text-based trend names.
 *
 * Dexcom notification formats (G6/G7):
 *   "120 ↑"   "↓ 85"   "95 →"   "85 ↓↓"   "120 ↗"
 *   Title may be "Dexcom G6", "Dexcom G7", "Dexcom CGM"
 *   Text may contain trend as text: "SingleUp", "Flat", "DoubleDown" etc.
 */

export type TrendDirection =
  | "rapidly increasing"
  | "increasing"
  | "slowly increasing"
  | "stable"
  | "slowly decreasing"
  | "decreasing"
  | "rapidly decreasing"
  | null;

const DEXCOM_PACKAGES = [
  "com.dexcom.g6",
  "com.dexcom.g7",
  "com.dexcom.cgm",
  "com.dexcom.share2",
  "com.dexcom.clarity",
  "com.dexcom.one",
  "com.dexcom.oneplus",
  "com.dexcom.dexcomone",
];

export function isDexcomPackage(packageName: string): boolean {
  return DEXCOM_PACKAGES.some(
    (p) => packageName === p || packageName.startsWith("com.dexcom")
  );
}

function parseTrendFromArrow(text: string): TrendDirection {
  // Double arrows first (order matters)
  if (/↑↑/.test(text)) return "rapidly increasing";
  if (/↓↓/.test(text)) return "rapidly decreasing";
  // Diagonal arrows
  if (/↗/.test(text)) return "slowly increasing";
  if (/↘/.test(text)) return "slowly decreasing";
  // Single arrows
  if (/↑/.test(text)) return "increasing";
  if (/↓/.test(text)) return "decreasing";
  if (/→/.test(text)) return "stable";
  // Dexcom text trend names (sometimes appear in notification extras)
  if (/DoubleUp/i.test(text)) return "rapidly increasing";
  if (/SingleUp/i.test(text)) return "increasing";
  if (/FortyFiveUp/i.test(text)) return "slowly increasing";
  if (/Flat/i.test(text)) return "stable";
  if (/FortyFiveDown/i.test(text)) return "slowly decreasing";
  if (/SingleDown/i.test(text)) return "decreasing";
  if (/DoubleDown/i.test(text)) return "rapidly decreasing";
  return null;
}

function parseGlucoseValue(text: string): string | null {
  // Match a glucose number: 2-3 digits (40–400 range covers all CGM values)
  const match = text.match(/\b([4-9]\d|[1-3]\d{2}|400)\b/);
  return match ? match[1] : null;
}

interface GlucoseReading {
  value: string | null;
  trend: TrendDirection;
  spokenText: string;
}

/**
 * Given the title + body of a Dexcom notification, returns a natural spoken sentence.
 * Falls back to a plain reading if no glucose pattern is detected.
 */
export function buildDexcomSpeech(title: string, text: string): GlucoseReading {
  const combined = `${title} ${text}`.trim();

  const trend = parseTrendFromArrow(combined);
  const value = parseGlucoseValue(combined);

  let spokenText: string;

  if (value && trend) {
    spokenText = `${value} and ${trend}`;
  } else if (value) {
    spokenText = `Glucose ${value}`;
  } else if (trend) {
    spokenText = `Glucose is ${trend}`;
  } else {
    // No pattern recognised — fall back to raw text, stripping arrows
    const clean = combined
      .replace(/[↑↓→↗↘]/g, "")
      .replace(/\s+/g, " ")
      .trim();
    spokenText = clean || "Dexcom notification";
  }

  return { value, trend, spokenText };
}
