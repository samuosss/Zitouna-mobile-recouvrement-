import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useEffect, useState, useCallback } from "react";
import { colors } from "../../src/theme/colors";
import { api } from "../../src/api/client";
import { TrendingUp, BarChart2 } from "lucide-react-native";
import Svg, {
  Path,
  Circle,
  G,
  Text as SvgText,
  Line,
  Rect,
} from "react-native-svg";

// ─── Safe Colors ──────────────────────────────────────────────────────────────

const C = colors as any;

const primary = C.primary ?? "#006747";
const secondary = C.secondary ?? C.accent ?? "#A4C639";
const error = C.error ?? C.danger ?? "#EF4444";
const background = C.background ?? "#F6F8F6";
const surface = C.surfaceContainerLowest ?? C.card ?? "#FFFFFF";
const surfaceContainer = C.surfaceContainer ?? "#EEF3EE";
const surfaceHigh = C.surfaceContainerHigh ?? "#E8EEE8";
const onSurface = C.onSurface ?? C.textPrimary ?? "#0F172A";
const onSurfaceVariant = C.onSurfaceVariant ?? C.textSecondary ?? "#475569";
const outline = C.outline ?? C.textMuted ?? "#94A3B8";
const outlineVariant = C.outlineVariant ?? "#DDE5DD";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Summary {
  total_encours: number;
  montant_recouvre: number;
  taux_recouvrement: number;
  nb_debiteurs_actifs: number;
  risque_moyen: string;
}

interface Secteur {
  secteur: string;
  montant: number;
  pourcentage: number;
  taux_recouvrement: number;
  color?: string;
}

interface Region {
  region: string;
  montant: number;
  pourcentage: number;
  taux_recouvrement: number;
  color?: string;
}

interface Tranche {
  label: string;
  nb: number;
  montant: number;
  color?: string;
}

type Tab = "sector" | "region" | "nlp";

const chartColors = [
  primary,
  secondary,
  "#185FA5",
  "#F97316",
  error,
  "#7C3AED",
  "#0EA5E9",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtMoney = (v: number) => {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
  return `${v.toFixed(0)}`;
};

const RISK_COLOR: Record<string, string> = {
  Faible: secondary,
  Modéré: "#F97316",
  Élevé: error,
};

function normalizeArray<T>(res: any, key: string): T[] {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.[key])) return res[key];
  if (Array.isArray(res?.data)) return res.data;
  return [];
}

// ─── Pie Chart / Donut ────────────────────────────────────────────────────────

function PieChart({
  data,
  centerTop = "Types",
  centerBottom = "de crédit",
}: {
  data: { label: string; value: number; color: string }[];
  centerTop?: string;
  centerBottom?: string;
}) {
  const size = 200;
  const cx = size / 2;
  const cy = size / 2;
  const r = 72;
  const innerR = 42;

  const total = data.reduce((s, d) => s + d.value, 0);

  if (total === 0 || data.length === 0) {
    return <Text style={styles.emptyText}>Aucune donnée</Text>;
  }

  let startAngle = -Math.PI / 2;

  const slices = data.map((d) => {
    const angle = (d.value / total) * 2 * Math.PI;
    const slice = {
      ...d,
      startAngle,
      endAngle: startAngle + angle,
    };
    startAngle += angle;
    return slice;
  });

  const polarToCartesian = (angle: number, radius: number) => ({
    x: cx + radius * Math.cos(angle),
    y: cy + radius * Math.sin(angle),
  });

  const describeSlice = (start: number, end: number) => {
    const s = polarToCartesian(start, r);
    const e = polarToCartesian(end, r);
    const si = polarToCartesian(start, innerR);
    const ei = polarToCartesian(end, innerR);
    const large = end - start > Math.PI ? 1 : 0;

    return [
      `M ${si.x} ${si.y}`,
      `L ${s.x} ${s.y}`,
      `A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`,
      `L ${ei.x} ${ei.y}`,
      `A ${innerR} ${innerR} 0 ${large} 0 ${si.x} ${si.y}`,
      "Z",
    ].join(" ");
  };

  return (
    <View style={{ alignItems: "center" }}>
      <Svg width={size} height={size}>
        {slices.map((s, i) => (
          <Path
            key={i}
            d={describeSlice(s.startAngle, s.endAngle)}
            fill={s.color}
            stroke={background}
            strokeWidth={2}
          />
        ))}

        <Circle cx={cx} cy={cy} r={innerR - 1} fill={surface} />

        <SvgText
          x={cx}
          y={cy - 8}
          textAnchor="middle"
          fontSize={13}
          fontWeight="700"
          fill={onSurface}
        >
          {centerTop}
        </SvgText>

        <SvgText
          x={cx}
          y={cy + 10}
          textAnchor="middle"
          fontSize={10}
          fill={onSurfaceVariant}
        >
          {centerBottom}
        </SvgText>
      </Svg>

      <View style={pieStyles.legend}>
        {data.map((d, i) => (
          <View key={i} style={pieStyles.legendRow}>
            <View
              style={[pieStyles.legendDot, { backgroundColor: d.color }]}
            />
            <Text style={pieStyles.legendLabel} numberOfLines={1}>
              {d.label}
            </Text>
            <Text style={pieStyles.legendValue}>
              {d.value.toFixed(1)}%
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const pieStyles = StyleSheet.create({
  legend: {
    width: "100%",
    gap: 6,
    marginTop: 4,
  },
  legendRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    flexShrink: 0,
  },
  legendLabel: {
    flex: 1,
    fontSize: 12,
    color: onSurface,
    fontWeight: "600",
  },
  legendValue: {
    fontSize: 12,
    fontWeight: "800",
    color: primary,
  },
});

// ─── Bar Chart ────────────────────────────────────────────────────────────────

function BarChart({
  data,
}: {
  data: { label: string; value: number; color: string }[];
}) {
  const W = 320;
  const H = 180;
  const paddingLeft = 48;
  const paddingBottom = 32;
  const paddingTop = 16;
  const chartW = W - paddingLeft - 16;
  const chartH = H - paddingBottom - paddingTop;

  if (data.length === 0) {
    return <Text style={styles.emptyText}>Aucune donnée</Text>;
  }

  const max = Math.max(...data.map((d) => d.value), 100);
  const barW = Math.min(32, chartW / data.length - 10);
  const yLines = [0, 25, 50, 75, 100];

  return (
    <View style={{ alignItems: "center" }}>
      <Svg width={W} height={H}>
        {yLines.map((v) => {
          const y = paddingTop + chartH - (v / 100) * chartH;

          return (
            <G key={v}>
              <Line
                x1={paddingLeft}
                y1={y}
                x2={W - 16}
                y2={y}
                stroke={`${outlineVariant}80`}
                strokeWidth={1}
              />

              <SvgText
                x={paddingLeft - 6}
                y={y + 4}
                textAnchor="end"
                fontSize={9}
                fill={onSurfaceVariant}
              >
                {v}%
              </SvgText>
            </G>
          );
        })}

        {data.map((d, i) => {
          const barH = Math.max((d.value / max) * chartH, 4);
          const x =
            paddingLeft +
            (i * chartW) / data.length +
            (chartW / data.length - barW) / 2;
          const y = paddingTop + chartH - barH;

          return (
            <G key={i}>
              <Rect
                x={x}
                y={y}
                width={barW}
                height={barH}
                fill={d.color}
                rx={6}
              />

              <SvgText
                x={x + barW / 2}
                y={y - 4}
                textAnchor="middle"
                fontSize={9}
                fontWeight="700"
                fill={d.color}
              >
                {d.value.toFixed(0)}%
              </SvgText>

              <SvgText
                x={x + barW / 2}
                y={H - 8}
                textAnchor="middle"
                fontSize={8}
                fill={onSurfaceVariant}
              >
                {d.label.length > 6 ? d.label.slice(0, 6) + "…" : d.label}
              </SvgText>
            </G>
          );
        })}
      </Svg>
    </View>
  );
}

// ─── Donut Summary Card ───────────────────────────────────────────────────────

function RecoveryDonut({ pct }: { pct: number }) {
  const size = 140;
  const cx = size / 2;
  const cy = size / 2;
  const r = 54;
  const strokeW = 14;
  const circumference = 2 * Math.PI * r;
  const safePct = Math.max(0, Math.min(pct, 100));
  const filled = (safePct / 100) * circumference;

  return (
    <View style={{ alignItems: "center" }}>
      <Svg width={size} height={size}>
        <Circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={surfaceContainer}
          strokeWidth={strokeW}
        />

        <Circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={secondary}
          strokeWidth={strokeW}
          strokeDasharray={`${filled} ${circumference - filled}`}
          strokeDashoffset={circumference / 4}
          strokeLinecap="round"
        />

        <SvgText
          x={cx}
          y={cy - 6}
          textAnchor="middle"
          fontSize={20}
          fontWeight="800"
          fill={primary}
        >
          {safePct.toFixed(0)}%
        </SvgText>

        <SvgText
          x={cx}
          y={cy + 12}
          textAnchor="middle"
          fontSize={9}
          fill={onSurfaceVariant}
        >
          Recouvré
        </SvgText>
      </Svg>
    </View>
  );
}

// ─── Analyses Screen ──────────────────────────────────────────────────────────

export default function AnalysesScreen() {
  const [tab, setTab] = useState<Tab>("sector");
  const [summary, setSummary] = useState<Summary | null>(null);
  const [secteurs, setSecteurs] = useState<Secteur[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [aging, setAging] = useState<Tranche[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);

    try {
      const [s, sec, reg, age] = await Promise.allSettled([
        api.get<Summary>("/analytics/portefeuille/summary"),
        api.get<any>("/analytics/portefeuille/secteur"),
        api.get<any>("/analytics/portefeuille/region"),
        api.get<any>("/analytics/portefeuille/aging"),
      ]);

      if (s.status === "fulfilled") {
        setSummary(s.value);
      }

      if (sec.status === "fulfilled") {
        setSecteurs(normalizeArray<Secteur>(sec.value, "secteurs"));
      }

      if (reg.status === "fulfilled") {
        setRegions(normalizeArray<Region>(reg.value, "regions"));
      }

      if (age.status === "fulfilled") {
        setAging(normalizeArray<Tranche>(age.value, "tranches"));
      }
    } catch {
      // silent for now
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  if (loading) {
    return (
      <View style={styles.loadingBox}>
        <ActivityIndicator color={primary} size="large" />
      </View>
    );
  }

  const riskColor = summary
    ? RISK_COLOR[summary.risque_moyen] ?? outline
    : outline;

  const pieData = secteurs.map((s, i) => ({
    label: s.secteur,
    value: s.pourcentage,
    color: s.color ?? chartColors[i % chartColors.length],
  }));

  const barData = regions.map((r, i) => ({
    label: r.region,
    value: r.taux_recouvrement,
    color: r.color ?? chartColors[i % chartColors.length],
  }));

  const nlpData = [
    { label: "Coopératif", value: 45, color: secondary },
    { label: "Neutre", value: 30, color: outline },
    { label: "Réticent", value: 25, color: error },
  ];

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Header simple comme avant */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Analyses</Text>
        <BarChart2 size={22} color={primary} />
      </View>

      {/* Summary Row comme avant */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryDonut}>
          <RecoveryDonut pct={summary?.taux_recouvrement ?? 0} />
        </View>

        <View style={styles.summaryStats}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Encours total</Text>
            <Text style={styles.statValue}>
              {summary ? fmtMoney(summary.total_encours) : "—"} TND
            </Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Débiteurs actifs</Text>
            <Text style={styles.statValue}>
              {summary
                ? summary.nb_debiteurs_actifs.toLocaleString("fr-TN")
                : "—"}
            </Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Risque global</Text>
            <Text style={[styles.statValue, { color: riskColor }]}>
              {summary?.risque_moyen ?? "—"}
            </Text>
          </View>
        </View>
      </View>

      {/* Tabs comme avant */}
      <View style={styles.tabBar}>
        {(
          [
            ["sector", "Secteurs"],
            ["region", "Régions"],
            ["nlp", "Sentiment"],
          ] as [Tab, string][]
        ).map(([key, label]) => (
          <TouchableOpacity
            key={key}
            style={[styles.tabBtn, tab === key && styles.tabBtnActive]}
            onPress={() => setTab(key)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.tabText,
                tab === key && styles.tabTextActive,
              ]}
            >
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Secteurs — Pie Chart */}
      {tab === "sector" && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Répartition par Type de Crédit</Text>

          {pieData.length === 0 ? (
            <Text style={styles.emptyText}>Aucune donnée</Text>
          ) : (
            <PieChart data={pieData} />
          )}
        </View>
      )}

      {/* Régions — Bar Chart */}
      {tab === "region" && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            Taux de Recouvrement par Région
          </Text>

          {barData.length === 0 ? (
            <Text style={styles.emptyText}>Aucune donnée</Text>
          ) : (
            <BarChart data={barData} />
          )}

          <View style={{ gap: 8, marginTop: 8 }}>
            {regions.map((r, i) => {
              const color = r.color ?? chartColors[i % chartColors.length];

              return (
                <View key={i} style={styles.legendRow}>
                  <View
                    style={[styles.legendDot, { backgroundColor: color }]}
                  />

                  <Text style={styles.legendName}>{r.region}</Text>

                  <Text style={styles.legendMeta}>
                    {fmtMoney(r.montant)} TND
                  </Text>

                  <Text style={[styles.legendRate, { color }]}>
                    {r.taux_recouvrement.toFixed(0)}%
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* NLP — Simple */}
      {tab === "nlp" && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Sentiment des Débiteurs</Text>

          <PieChart
            data={nlpData}
            centerTop="NLP"
            centerBottom="Sentiment"
          />

          <View style={{ marginTop: 16 }}>
            <Text style={styles.cardSubtitle}>
              Évolution par interaction
            </Text>

            <BarChart
              data={[
                { label: "Appel", value: 60, color: secondary },
                { label: "SMS", value: 45, color: primary },
                { label: "Email", value: 30, color: "#F97316" },
                { label: "Visite", value: 75, color: "#185FA5" },
              ]}
            />
          </View>

          <Text style={styles.nlpNote}>
            Analyse NLP basée sur les transcriptions d'interactions récentes
            avec les débiteurs.
          </Text>
        </View>
      )}

      {/* Aging Balance */}
      <View style={[styles.card, { marginTop: 14 }]}>
        <Text style={styles.cardTitle}>
          Balance Âgée - Jours de retard
        </Text>

        {aging.length === 0 ? (
          <Text style={styles.emptyText}>Aucune donnée</Text>
        ) : (
          aging.map((t, i) => {
            const maxMontant = Math.max(...aging.map((a) => a.montant), 1);
            const percent = Math.min((t.montant / maxMontant) * 100, 100);
            const color = t.color ?? chartColors[i % chartColors.length];

            return (
              <View key={i} style={styles.agingRow}>
                <View style={styles.agingTop}>
                  <Text style={styles.agingLabel}>{t.label}</Text>
                  <Text style={styles.agingAmt}>
                    {fmtMoney(t.montant)} TND
                  </Text>
                </View>

                <View style={styles.agingTrack}>
                  <View
                    style={[
                      styles.agingFill,
                      {
                        backgroundColor: color,
                        width: `${percent}%`,
                      },
                    ]}
                  />
                </View>

                <Text style={styles.agingNb}>{t.nb} dossiers</Text>
              </View>
            );
          })
        )}
      </View>
    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: background,
  },

  content: {
    paddingTop: 56,
    paddingHorizontal: 16,
    paddingBottom: 100,
  },

  loadingBox: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: background,
  },

  emptyText: {
    fontSize: 13,
    color: outline,
    textAlign: "center",
    paddingVertical: 20,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },

  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: primary,
  },

  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: surface,
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },

  summaryDonut: {
    marginRight: 16,
  },

  summaryStats: {
    flex: 1,
    gap: 8,
  },

  statItem: {
    gap: 2,
  },

  statLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: onSurfaceVariant,
    letterSpacing: 0.4,
  },

  statValue: {
    fontSize: 15,
    fontWeight: "800",
    color: onSurface,
  },

  statDivider: {
    height: 1,
    backgroundColor: `${outlineVariant}50`,
  },

  tabBar: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: `${outlineVariant}80`,
    marginBottom: 14,
  },

  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
  },

  tabBtnActive: {
    borderBottomWidth: 3,
    borderBottomColor: primary,
  },

  tabText: {
    fontSize: 12,
    fontWeight: "600",
    color: onSurfaceVariant,
  },

  tabTextActive: {
    color: primary,
    fontWeight: "800",
  },

  card: {
    backgroundColor: surface,
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
    gap: 14,
  },

  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: onSurface,
  },

  cardSubtitle: {
    fontSize: 13,
    fontWeight: "600",
    color: onSurfaceVariant,
    marginBottom: 8,
  },

  legendRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },

  legendName: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
    color: onSurface,
  },

  legendMeta: {
    fontSize: 11,
    color: onSurfaceVariant,
  },

  legendRate: {
    fontSize: 13,
    fontWeight: "800",
    minWidth: 36,
    textAlign: "right",
  },

  nlpNote: {
    fontSize: 11,
    color: outline,
    fontStyle: "italic",
    textAlign: "center",
  },

  agingRow: {
    gap: 4,
    marginBottom: 10,
  },

  agingTop: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  agingLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: onSurfaceVariant,
  },

  agingAmt: {
    fontSize: 12,
    fontWeight: "700",
    color: onSurface,
  },

  agingNb: {
    fontSize: 10,
    color: outline,
  },

  agingTrack: {
    height: 10,
    backgroundColor: surfaceContainer,
    borderRadius: 5,
    overflow: "hidden",
  },

  agingFill: {
    height: "100%",
    borderRadius: 5,
  },
});