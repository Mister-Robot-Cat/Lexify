import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { defaultLocale, isLocale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";

export const alt = "Lexify";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

async function fonts() {
  const dir = join(process.cwd(), "assets/fonts");
  const load = (file: string) => readFile(join(dir, file));
  const sets = ["latin", "latin-ext", "cyrillic"];
  const out: { name: string; data: Buffer; weight: 500 | 700; style: "normal" }[] = [];
  for (const set of sets) {
    out.push({ name: "Manrope", data: await load(`manrope-${set}-700-normal.woff`), weight: 700, style: "normal" });
    out.push({ name: "Manrope", data: await load(`manrope-${set}-500-normal.woff`), weight: 500, style: "normal" });
  }
  return out;
}

export default async function OgImage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const locale = isLocale(raw) ? raw : defaultLocale;
  const m = await getMessages(locale);
  const bars = [0.45, 0.7, 1];

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: "#0f1b3d",
          color: "#fff",
          fontFamily: "Manrope",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 8, width: 64, height: 64, padding: 14, borderRadius: 18, background: "#1c2a55" }}>
            {bars.map((h, i) => (
              <div key={i} style={{ width: 9, height: 36 * h, borderRadius: 3, background: "#f2a33a", opacity: 0.55 + i * 0.22 }} />
            ))}
          </div>
          <span style={{ fontSize: 44, fontWeight: 700 }}>Lexify</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <span style={{ fontSize: 30, fontWeight: 700, color: "#f2a33a", letterSpacing: 2 }}>IELTS ACADEMIC</span>
          <span style={{ fontSize: 76, fontWeight: 700, lineHeight: 1.05, maxWidth: 980 }}>{m.meta.ogTagline}</span>
        </div>
        <div style={{ display: "flex", gap: 14 }}>
          {(["reading", "listening", "writing", "speaking"] as const).map((s) => (
            <span key={s} style={{ fontSize: 26, fontWeight: 500, padding: "10px 22px", borderRadius: 999, border: "2px solid rgba(255,255,255,0.2)" }}>
              {m.common.skills[s]}
            </span>
          ))}
        </div>
      </div>
    ),
    { ...size, fonts: await fonts() },
  );
}
