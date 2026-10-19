import "server-only";
import path from "node:path";
import { readFile } from "node:fs/promises";
import type { SupabaseClient } from "@supabase/supabase-js";
import { Document, Font, Image, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer";
import type { Branding } from "@/lib/branding";
import { OPINION_SURVEY } from "@/lib/opinions";
import { formatAvg, type NpsStats, type OpinionReport, type ScaleStats } from "@/lib/opinionsReport";
import { fetchPartnerLogo } from "./repo/events";

/**
 * Raport z opinii jako plik PDF (A4) – generowany na serwerze, bez okna drukowania przeglądarki.
 * Kolory i fonty jak w aplikacji (Caladea w nagłówkach, Carlito w treści).
 */

const FONTS = path.join(process.cwd(), "src/assets/fonts");
Font.register({
  family: "Caladea",
  fonts: [
    { src: path.join(FONTS, "Caladea-Regular.ttf") },
    { src: path.join(FONTS, "Caladea-Bold.ttf"), fontWeight: 700 },
  ],
});
Font.register({
  family: "Carlito",
  fonts: [
    { src: path.join(FONTS, "Carlito-Regular.ttf") },
    { src: path.join(FONTS, "Carlito-Bold.ttf"), fontWeight: 700 },
  ],
});
// Domyślne dzielenie wyrazów jest angielskie – po polsku lepiej nie dzielić wcale.
Font.registerHyphenationCallback((word) => [word]);

const C = {
  green: "#1F4A42",
  greenSoft: "#E6EEEB",
  gold: "#A97A3E",
  goldSoft: "#FBF5EA",
  ink: "#14231f",
  muted: "#5a6b66",
  line: "#E3EBE8",
  track: "#F2F5F4",
  // Rozbieżna skala jak w report.css: czerwień – szarość – błękit.
  scale: ["#c93a3a", "#f0a3a0", "#dcd9d2", "#8fb9ea", "#2a78d6"],
  scaleInk: ["#fff", "#14231f", "#14231f", "#14231f", "#fff"],
};
const NPS_GROUPS = [
  { key: "detractors", label: "krytycy (1–6)", color: C.scale[0]!, ink: "#fff" },
  { key: "passives", label: "neutralni (7–8)", color: C.scale[2]!, ink: C.ink },
  { key: "promoters", label: "polecający (9–10)", color: C.scale[4]!, ink: "#fff" },
] as const;

const s = StyleSheet.create({
  page: { fontFamily: "Carlito", fontSize: 10, color: C.ink, paddingTop: 36, paddingBottom: 56, paddingHorizontal: 40 },
  cover: { marginTop: -36, marginHorizontal: -40, backgroundColor: C.green, paddingTop: 34, paddingBottom: 26, paddingHorizontal: 40, flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  coverRule: { marginHorizontal: -40, height: 4, backgroundColor: C.gold },
  kicker: { fontSize: 9, fontWeight: 700, letterSpacing: 1.6, color: "#E3C48F", textTransform: "uppercase", marginBottom: 6 },
  title: { fontFamily: "Caladea", fontWeight: 700, fontSize: 26, lineHeight: 1.15, color: "#fff" },
  sub: { marginTop: 8, fontSize: 11, color: "#CFE0DA" },
  logos: { flexDirection: "row", gap: 8, marginLeft: 16 },
  logoWrap: { width: 54, height: 54, borderRadius: 27, backgroundColor: "#fff", alignItems: "center", justifyContent: "center", overflow: "hidden" },

  kpis: { flexDirection: "row", gap: 10, marginTop: 22 },
  kpi: { flex: 1, backgroundColor: C.greenSoft, borderRadius: 8, paddingVertical: 12, paddingHorizontal: 12, borderTopWidth: 3, borderTopColor: C.green },
  kpiAccent: { backgroundColor: C.goldSoft, borderTopColor: C.gold },
  kpiValue: { fontFamily: "Caladea", fontWeight: 700, fontSize: 24, color: C.green },
  kpiUnit: { fontFamily: "Carlito", fontWeight: 400, fontSize: 11, color: C.muted },
  kpiLabel: { marginTop: 2, fontSize: 9, color: C.muted, lineHeight: 1.25 },

  block: { marginTop: 24 },
  h2Row: { flexDirection: "row", alignItems: "flex-start", marginBottom: 10 },
  h2Mark: { width: 4, height: 15, backgroundColor: C.gold, borderRadius: 2, marginRight: 8, marginTop: 2 },
  h2: { flex: 1, fontFamily: "Caladea", fontWeight: 700, fontSize: 16, lineHeight: 1.2, color: C.green },
  note: { fontSize: 9, color: C.muted, marginTop: -4, marginBottom: 10, lineHeight: 1.35 },

  area: { flexDirection: "row", alignItems: "center", paddingVertical: 4 },
  areaLabel: { width: 170, fontSize: 10.5 },
  areaTrack: { flex: 1, height: 12, backgroundColor: C.track, borderRadius: 6, overflow: "hidden" },
  areaFill: { height: 12, backgroundColor: C.green, borderRadius: 6 },
  areaValue: { width: 46, textAlign: "right", fontFamily: "Caladea", fontWeight: 700, fontSize: 14, color: C.green },

  legend: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 6 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 4, fontSize: 8.5, color: C.muted },
  swatch: { width: 8, height: 8, borderRadius: 2 },

  section: { marginTop: 8 },
  h3: { fontFamily: "Caladea", fontWeight: 700, fontSize: 12, color: C.green, marginBottom: 2 },
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 3.5, borderTopWidth: 0.75, borderTopColor: C.line },
  rowText: { width: "44%", paddingRight: 10, fontSize: 9.5, lineHeight: 1.2 },
  bar: { flex: 1, flexDirection: "row", height: 14, borderRadius: 3, overflow: "hidden", backgroundColor: C.track },
  barSeg: { height: 14, alignItems: "center", justifyContent: "center", borderRightWidth: 1, borderRightColor: "#fff" },
  barPct: { fontSize: 7, fontWeight: 700 },
  rowAvg: { width: 62, textAlign: "right" },
  rowAvgValue: { fontFamily: "Caladea", fontWeight: 700, fontSize: 13, color: C.green },
  rowAvgMeta: { fontSize: 7.5, color: C.muted },

  npsWrap: { flexDirection: "row", gap: 16, alignItems: "stretch" },
  npsScore: { width: 120, backgroundColor: C.green, borderRadius: 10, alignItems: "center", justifyContent: "center", paddingVertical: 14 },
  npsScoreValue: { fontFamily: "Caladea", fontWeight: 700, fontSize: 34, color: "#fff" },
  npsScoreLabel: { fontSize: 8.5, color: "#CFE0DA", marginTop: 2, textAlign: "center" },
  npsRight: { flex: 1, justifyContent: "center", gap: 8 },
  cols: { flexDirection: "row", gap: 6, marginTop: 14, alignItems: "flex-end" },
  col: { flex: 1, alignItems: "center" },
  colPlot: { height: 80, width: "100%", justifyContent: "flex-end" },
  colCount: { fontSize: 8, color: C.muted, textAlign: "center", marginBottom: 2 },
  colBar: { borderTopLeftRadius: 3, borderTopRightRadius: 3 },
  colAxis: { width: "100%", borderTopWidth: 0.75, borderTopColor: C.muted, paddingTop: 2, fontSize: 8, color: C.muted, textAlign: "center" },

  quote: { backgroundColor: C.goldSoft, borderLeftWidth: 3, borderLeftColor: C.gold, paddingVertical: 6, paddingHorizontal: 10, marginBottom: 6, fontSize: 9.5, lineHeight: 1.4 },

  foot: { position: "absolute", left: 40, right: 40, bottom: 24, flexDirection: "row", justifyContent: "space-between", borderTopWidth: 0.75, borderTopColor: C.line, paddingTop: 6, fontSize: 8, color: C.muted },
});

const pct = (n: number, total: number) => (total === 0 ? 0 : (n / total) * 100);
const share = (n: number, total: number) => `${Math.round(pct(n, total))}%`;

type LogoImage = { data: Buffer; format: "png" | "jpg" };
interface ReportPdfProps {
  report: OpinionReport;
  branding: Branding;
  logos: LogoImage[];
  subtitle: string;
  withOpen: boolean;
}

function H2({ children }: { children: string }) {
  return (
    <View style={s.h2Row} minPresenceAhead={60}>
      <View style={s.h2Mark} />
      <Text style={s.h2}>{children}</Text>
    </View>
  );
}

function Kpi({ value, unit, label, accent }: { value: string; unit?: string; label: string; accent?: boolean }) {
  return (
    <View style={accent ? [s.kpi, s.kpiAccent] : s.kpi}>
      <Text style={s.kpiValue}>{value}{unit && <Text style={s.kpiUnit}> {unit}</Text>}</Text>
      <Text style={s.kpiLabel}>{label}</Text>
    </View>
  );
}

function StackedBar({ parts, height }: { parts: { n: number; color: string; ink: string }[]; height?: number }) {
  const total = parts.reduce((sum, p) => sum + p.n, 0);
  const visible = parts.filter((p) => p.n > 0);
  return (
    <View style={height ? [s.bar, { height }] : s.bar}>
      {visible.map((p, i) => (
        <View key={i} style={[s.barSeg, { width: `${pct(p.n, total)}%`, backgroundColor: p.color, ...(height ? { height } : {}) }, i === visible.length - 1 ? { borderRightWidth: 0 } : {}]}>
          {pct(p.n, total) >= 10 && <Text style={[s.barPct, { color: p.ink }, height ? { fontSize: 9 } : {}]}>{share(p.n, total)}</Text>}
        </View>
      ))}
    </View>
  );
}

function ScaleRow({ stats }: { stats: ScaleStats }) {
  return (
    <View style={s.row} wrap={false}>
      <Text style={s.rowText}>{stats.question.text}</Text>
      <StackedBar parts={stats.counts.map((n, i) => ({ n, color: C.scale[i]!, ink: C.scaleInk[i]! }))} />
      <View style={s.rowAvg}>
        <Text style={s.rowAvgValue}>{formatAvg(stats.avg)}</Text>
        <Text style={s.rowAvgMeta}>/ 5 · {stats.total} odp.</Text>
      </View>
    </View>
  );
}

function Nps({ nps }: { nps: NpsStats }) {
  const max = Math.max(1, ...nps.counts);
  return (
    <View wrap={false}>
      <View style={s.npsWrap}>
        <View style={s.npsScore}>
          <Text style={s.npsScoreValue}>{nps.score === null ? "–" : `${nps.score > 0 ? "+" : ""}${nps.score}`}</Text>
          <Text style={s.npsScoreLabel}>NPS · zakres −100…+100</Text>
        </View>
        <View style={s.npsRight}>
          <StackedBar height={22} parts={NPS_GROUPS.map((g) => ({ n: nps[g.key], color: g.color, ink: g.ink }))} />
          <View style={s.legend}>
            {NPS_GROUPS.map((g) => (
              <View key={g.key} style={s.legendItem}>
                <View style={[s.swatch, { backgroundColor: g.color }]} />
                <Text>{g.label}: {nps[g.key]} ({share(nps[g.key], nps.total)})</Text>
              </View>
            ))}
          </View>
          <Text style={[s.note, { marginTop: 0, marginBottom: 0 }]}>
            NPS = % polecających (9–10) − % krytyków (1–6). Średnia ocena: {formatAvg(nps.avg)} / 10, odpowiedzi: {nps.total}.
          </Text>
        </View>
      </View>
      <View style={s.cols}>
        {nps.counts.map((c, i) => (
          <View key={i} style={s.col}>
            <View style={s.colPlot}>
              {c > 0 && <Text style={s.colCount}>{c}</Text>}
              <View style={[s.colBar, { height: (c / max) * 64, backgroundColor: i >= 8 ? C.scale[4]! : i >= 6 ? C.scale[2]! : C.scale[0]! }]} />
            </View>
            <Text style={s.colAxis}>{i + 1}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function ReportPdf({ report, branding, logos, subtitle, withOpen }: ReportPdfProps) {
  const nps = report.nps;
  const sections = report.sections.filter((sec) => sec.scales.length > 0);
  const texts = withOpen ? report.sections.flatMap((sec) => sec.texts).filter((t) => t.answers.length > 0) : [];
  return (
    <Document title={`Raport – ${OPINION_SURVEY.title}`} author={branding.partners.map((p) => p.name).join(", ")} language="pl">
      <Page size="A4" style={s.page}>
        <View style={s.cover}>
          <View style={{ flex: 1 }}>
            <Text style={s.kicker}>Raport z ankiety uczestników</Text>
            <Text style={s.title}>{OPINION_SURVEY.title}</Text>
            <Text style={s.sub}>{subtitle}</Text>
          </View>
          {logos.length > 0 && (
            <View style={s.logos}>
              {logos.map((logo, i) => (
                <View key={i} style={s.logoWrap}>
                  {/* eslint-disable-next-line jsx-a11y/alt-text -- Image z react-pdf nie ma atrybutu alt */}
                  <Image src={logo} style={{ width: 46, height: 46, objectFit: "contain" }} />
                </View>
              ))}
            </View>
          )}
        </View>
        <View style={s.coverRule} />

        {report.responses === 0 ? <Text style={{ marginTop: 24 }}>Brak opinii.</Text> : (
          <>
            <View style={s.kpis}>
              <Kpi value={String(report.responses)} label="wypełnionych ankiet" />
              <Kpi value={formatAvg(report.overallAvg)} unit="/ 5" label="średnia wszystkich ocen" />
              {nps && <Kpi accent value={nps.score === null ? "–" : `${nps.score > 0 ? "+" : ""}${nps.score}`} label="NPS – skłonność do polecenia" />}
              {nps && nps.total > 0 && <Kpi accent value={share(nps.promoters, nps.total)} label="na pewno poleci (9–10)" />}
            </View>

            <View style={s.block} wrap={false}>
              <H2>Oceny w obszarach</H2>
              {sections.map((sec) => (
                <View key={sec.title} style={s.area}>
                  <Text style={s.areaLabel}>{sec.title}</Text>
                  <View style={s.areaTrack}><View style={[s.areaFill, { width: `${((sec.avg ?? 0) / 5) * 100}%` }]} /></View>
                  <Text style={s.areaValue}>{formatAvg(sec.avg)}</Text>
                </View>
              ))}
            </View>

            {nps && nps.total > 0 && (
              <View style={s.block} wrap={false}>
                <H2>{nps.question.text}</H2>
                <Nps nps={nps} />
              </View>
            )}

            {/* Strona 1 to podsumowanie, szczegóły od nowej strony. */}
            <View style={[s.block, { marginTop: 0 }]} break>
              <H2>Szczegóły ocen</H2>
              <View style={s.legend}>
                {["1 zdecydowanie nie", "2", "3", "4", "5 zdecydowanie tak"].map((label, i) => (
                  <View key={label} style={s.legendItem}>
                    <View style={[s.swatch, { backgroundColor: C.scale[i] }]} />
                    <Text>{label}</Text>
                  </View>
                ))}
              </View>
              {sections.map((sec) => (
                <View key={sec.title} style={s.section}>
                  <Text style={s.h3} minPresenceAhead={40}>{sec.title}</Text>
                  {sec.scales.map((q) => <ScaleRow key={q.question.id} stats={q} />)}
                </View>
              ))}
            </View>

            {texts.map((t) => (
              <View key={t.question.id} style={t === texts[0] ? [s.block, { marginTop: 0 }] : s.block} break={t === texts[0]}>
                <H2>{`${t.question.text} (${t.answers.length})`}</H2>
                {t.answers.map((a, i) => <Text key={i} style={s.quote}>{a}</Text>)}
              </View>
            ))}
          </>
        )}

        <View style={s.foot} fixed>
          <Text>Ankieta anonimowa · {branding.partners.map((p) => p.name).join(" · ")}</Text>
          <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}

const DATA_URL = /^data:image\/(png|jpeg);base64,(.+)$/;
const API_LOGO = /^\/api\/logo\/([0-9a-f-]{36})/;

/** Logo do PDF: plik z /public/logos albo wgrane logo współorganizatora (react-pdf zna tylko PNG i JPG). */
async function loadLogo(db: SupabaseClient, src: string): Promise<LogoImage | null> {
  try {
    const apiId = API_LOGO.exec(src)?.[1];
    const source = apiId ? await fetchPartnerLogo(db, apiId) : src;
    if (!source) return null;
    const data = DATA_URL.exec(source);
    if (data) return { data: Buffer.from(data[2]!, "base64"), format: data[1] === "png" ? "png" : "jpg" };
    const file = /^\/logos\/[a-z0-9-]+\.(png|jpe?g)$/.exec(source);
    if (file) return { data: await readFile(path.join(process.cwd(), "public", source)), format: file[1] === "png" ? "png" : "jpg" };
  } catch (err) {
    console.error("[opinie] logo do PDF", err);
  }
  return null;
}

export async function renderOpinionReportPdf(
  db: SupabaseClient,
  props: Omit<ReportPdfProps, "logos">,
): Promise<Buffer> {
  const logos = (await Promise.all(props.branding.partners.map((p) => loadLogo(db, p.src)))).filter((l) => l !== null);
  return renderToBuffer(<ReportPdf {...props} logos={logos} />);
}
