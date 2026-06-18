import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, ActivityIndicator, RefreshControl,
} from "react-native";
import { useEffect, useState, useCallback } from "react";
import { colors } from "../../src/theme/colors";
import { api } from "../../src/api/client";
import {
  TrendingUp, FolderOpen, Users, Wallet,
  RefreshCw, AlertTriangle, Info,
  ChevronRight, CheckCircle,
} from "lucide-react-native";
import { useLanguage } from "../../src/context/LanguageContext";

interface DashboardStats {
  total_dossiers: number;
  dossiers_actifs: number;
  total_clients: number;
  montant_total_du: number;
  montant_recouvre: number;
  taux_recouvrement: number;
}

interface Alerte {
  id_alerte: number;
  niveau: "Info" | "Warning" | "Critique";
  titre: string;
  message: string;
  date_creation: string;
  lue: boolean;
}

interface Dossier {
  id_dossier: number;
  numero_dossier: string;
  statut: "Actif" | "Cloture" | "Suspendu" | "EnLitige";
  priorite: "Basse" | "Normale" | "Haute" | "Critique";
  montant_total_du: number | null;
  date_ouverture: string;
}

const fmt = (v: number) =>
  new Intl.NumberFormat("fr-TN", { maximumFractionDigits: 0 }).format(v);

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("fr-TN", { day: "2-digit", month: "short", year: "numeric" });

const NIVEAU_CFG = {
  Critique: { bg: colors.errorContainer,     fg: colors.onErrorContainer,     iconBg: "rgba(186,26,26,0.15)" },
  Warning:  { bg: colors.secondaryContainer, fg: colors.onSecondaryContainer, iconBg: "rgba(80,102,0,0.12)" },
  Info:     { bg: colors.primaryFixed + "33",fg: colors.primary,              iconBg: "rgba(0,77,52,0.10)" },
};

const PRIORITE_DOT = {
  Basse: "#3B82F6", Normale: colors.secondary,
  Haute: "#F97316", Critique: colors.error,
};

function KpiCard({ title, value, suffix, icon, sub }: {
  title: string; value: string; suffix?: string;
  icon: React.ReactNode; sub?: string;
}) {
  return (
    <View style={styles.kpiCard}>
      <View style={styles.kpiHeader}>
        {icon}
        <Text style={styles.kpiTitle}>{title}</Text>
      </View>
      <Text style={styles.kpiValue}>
        {value}{suffix ? <Text style={styles.kpiSuffix}> {suffix}</Text> : null}
      </Text>
      {sub ? <Text style={styles.kpiSub}>{sub}</Text> : null}
    </View>
  );
}

function AlertCard({ alerte, onLue, markLabel }: {
  alerte: Alerte; onLue: (id: number) => void; markLabel: string;
}) {
  const cfg = NIVEAU_CFG[alerte.niveau] ?? NIVEAU_CFG.Info;
  const Icon = alerte.niveau === "Critique" ? AlertTriangle : Info;
  return (
    <View style={[styles.alertCard, { backgroundColor: cfg.bg }]}>
      <View style={{ flexDirection: "row", gap: 12 }}>
        <View style={[styles.alertIconBox, { backgroundColor: cfg.iconBg }]}>
          <Icon size={18} color={cfg.fg} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.alertTitle, { color: cfg.fg }]}>{alerte.titre}</Text>
          <Text style={[styles.alertMsg, { color: cfg.fg }]} numberOfLines={3}>{alerte.message}</Text>
        </View>
      </View>
      <TouchableOpacity
        style={[styles.alertBtn, { backgroundColor: cfg.fg }]}
        onPress={() => onLue(alerte.id_alerte)}
        activeOpacity={0.85}
      >
        <Text style={[styles.alertBtnText, { color: cfg.bg }]}>{markLabel}</Text>
      </TouchableOpacity>
    </View>
  );
}

function RecentDossierRow({ dossier, statutLabel }: { dossier: Dossier; statutLabel: string }) {
  const dot = PRIORITE_DOT[dossier.priorite] ?? colors.outline;
  return (
    <TouchableOpacity style={styles.dossierRow} activeOpacity={0.7}>
      <View style={[styles.dossierDot, { backgroundColor: dot }]} />
      <View style={{ flex: 1 }}>
        <View style={styles.dossierTopRow}>
          <Text style={styles.dossierNum}>{dossier.numero_dossier}</Text>
          <View style={styles.dossierBadge}>
            <Text style={styles.dossierBadgeText}>{statutLabel}</Text>
          </View>
        </View>
        <View style={styles.dossierBottomRow}>
          <Text style={styles.dossierAmount}>
            {dossier.montant_total_du != null ? `${fmt(dossier.montant_total_du)} TND` : "—"}
          </Text>
          <Text style={styles.dossierDate}>{fmtDate(dossier.date_ouverture)}</Text>
        </View>
      </View>
      <ChevronRight size={18} color={colors.outlineVariant} />
    </TouchableOpacity>
  );
}

export default function DashboardScreen() {
  const { t, language } = useLanguage();
  const [stats,    setStats]    = useState<DashboardStats | null>(null);
  const [alertes,  setAlertes]  = useState<Alerte[]>([]);
  const [dossiers, setDossiers] = useState<Dossier[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [refresh,  setRefresh]  = useState(false);

  const today = new Date().toLocaleDateString(language === "ar" ? "ar-TN" : language === "en" ? "en-GB" : "fr-FR", {
    weekday: "long", day: "numeric", month: "long",
  });

  const STATUT_LABEL: Record<string, string> = {
    Actif:    t("statut_Actif"),
    Cloture:  t("statut_Cloture"),
    Suspendu: t("statut_Suspendu"),
    EnLitige: t("statut_EnLitige"),
  };

  const fetchAll = useCallback(async () => {
    try {
      const [s, a, d] = await Promise.allSettled([
        api.get<DashboardStats>("/dashboard/stats"),
        api.get<Alerte[]>("/alertes/non-lues"),
        api.get<Dossier[]>("/dossiers/?limit=3"),
      ]);
      if (s.status === "fulfilled") setStats(s.value);
      if (a.status === "fulfilled") setAlertes(a.value.slice(0, 3));
      if (d.status === "fulfilled") setDossiers(d.value.slice(0, 3));
    } catch {}
    finally { setLoading(false); setRefresh(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const marquerLue = async (id: number) => {
    try {
      await api.post(`/alertes/${id}/lire`);
      setAlertes(prev => prev.filter(a => a.id_alerte !== id));
    } catch {}
  };

  if (loading) {
    return (
      <View style={styles.loadingBox}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refresh}
          onRefresh={() => { setRefresh(true); fetchAll(); }}
          tintColor={colors.primary}
        />
      }
    >
      <View style={styles.hero}>
        <View style={styles.heroTopRow}>
          <View>
            <Text style={styles.heroDate}>{today.toUpperCase()}</Text>
            <Text style={styles.heroGreeting}>{t("dash_greeting")} </Text>
          </View>
          <TouchableOpacity
            style={styles.refreshBtn}
            onPress={() => { setRefresh(true); fetchAll(); }}
            activeOpacity={0.7}
          >
            <RefreshCw size={18} color={colors.onPrimary} />
          </TouchableOpacity>
        </View>

        {stats && (
          <View style={styles.heroStatsRow}>
            <View style={styles.heroStatCard}>
              <Text style={styles.heroStatLabel}>{t("dash_recoveryRate")}</Text>
              <Text style={styles.heroStatValue}>{stats.taux_recouvrement}%</Text>
              <View style={styles.heroProgressTrack}>
                <View style={[styles.heroProgressFill, { width: `${Math.min(stats.taux_recouvrement, 100)}%` }]} />
              </View>
            </View>
            <View style={styles.heroStatCard}>
              <Text style={styles.heroStatLabel}>{t("dash_kpiActiveDossiers")}</Text>
              <Text style={styles.heroStatValue}>{stats.dossiers_actifs} / {stats.total_dossiers}</Text>
              <View style={styles.heroProgressTrack}>
                <View style={[styles.heroProgressFill, {
                  width: stats.total_dossiers > 0
                    ? `${Math.min((stats.dossiers_actifs / stats.total_dossiers) * 100, 100)}%`
                    : "0%",
                }]} />
              </View>
            </View>
          </View>
        )}
      </View>

      {stats && (
        <View style={styles.kpiGrid}>
          <KpiCard
            title={t("dash_kpiActiveDossiers")}
            value={String(stats.dossiers_actifs)}
            sub={`${t("dash_outOf")} ${stats.total_dossiers} ${t("dash_total")}`}
            icon={<FolderOpen size={18} color={colors.secondary} />}
          />
          <KpiCard
            title={t("dash_kpiTotalClients")}
            value={String(stats.total_clients)}
            icon={<Users size={18} color={colors.secondary} />}
          />
          <KpiCard
            title={t("dash_kpiRecovered")}
            value={fmt(stats.montant_recouvre)}
            suffix="TND"
            icon={<Wallet size={18} color={colors.secondary} />}
          />
          <KpiCard
            title={t("dash_kpiRemaining")}
            value={fmt(stats.montant_total_du)}
            suffix="TND"
            icon={<TrendingUp size={18} color={colors.secondary} />}
          />
        </View>
      )}

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t("dash_activeAlerts")}</Text>
          {alertes.length > 0 && (
            <View style={styles.sectionBadge}>
              <Text style={styles.sectionBadgeText}>
                {alertes.length} {alertes.length > 1 ? t("dash_news") : t("dash_new")}
              </Text>
            </View>
          )}
        </View>
        {alertes.length === 0 ? (
          <View style={styles.emptyBox}>
            <CheckCircle size={28} color={colors.primary} />
            <Text style={styles.emptyText}>{t("dash_noAlerts")}</Text>
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
            {alertes.map(a => (
              <AlertCard key={a.id_alerte} alerte={a} onLue={marquerLue} markLabel={t("dash_markAsRead")} />
            ))}
          </ScrollView>
        )}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t("dash_recentDossiers")}</Text>
          <TouchableOpacity><Text style={styles.sectionLink}>{t("common_seeAll")}</Text></TouchableOpacity>
        </View>
        {dossiers.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>{t("dash_noDossiers")}</Text>
          </View>
        ) : (
          <View style={{ gap: 10 }}>
            {dossiers.map(d => (
              <RecentDossierRow
                key={d.id_dossier}
                dossier={d}
                statutLabel={STATUT_LABEL[d.statut] ?? d.statut}
              />
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen:  { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: 40 },
  loadingBox: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background },
  hero: {
    backgroundColor: colors.primaryContainer,
    paddingTop: 60, paddingHorizontal: 16, paddingBottom: 32,
    borderBottomLeftRadius: 32, borderBottomRightRadius: 32,
  },
  heroTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  heroDate: { color: "rgba(255,255,255,0.7)", fontSize: 11, fontWeight: "700", letterSpacing: 1 },
  heroGreeting: { color: "#fff", fontSize: 26, fontWeight: "800", marginTop: 4 },
  refreshBtn: { backgroundColor: "rgba(255,255,255,0.15)", padding: 10, borderRadius: 12 },
  heroStatsRow: { flexDirection: "row", gap: 12, marginTop: 24 },
  heroStatCard: { flex: 1, backgroundColor: "rgba(255,255,255,0.12)", borderRadius: 16, padding: 14, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" },
  heroStatLabel: { color: "rgba(255,255,255,0.7)", fontSize: 11, fontWeight: "600" },
  heroStatValue: { color: "#fff", fontSize: 18, fontWeight: "800", marginTop: 4 },
  heroProgressTrack: { height: 5, backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 3, marginTop: 8, overflow: "hidden" },
  heroProgressFill: { height: "100%", backgroundColor: colors.secondaryFixed, borderRadius: 3 },
  kpiGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, paddingHorizontal: 16, marginTop: -16, marginBottom: 8 },
  kpiCard: {
    width: "47%", backgroundColor: colors.surfaceContainerLowest, borderRadius: 16, padding: 14,
    shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  kpiHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 10 },
  kpiTitle:  { fontSize: 11, color: colors.onSurfaceVariant, fontWeight: "600", flexShrink: 1 },
  kpiValue:  { fontSize: 20, fontWeight: "800", color: colors.onSurface },
  kpiSuffix: { fontSize: 12, fontWeight: "600", color: colors.onSurfaceVariant },
  kpiSub:    { fontSize: 10, color: colors.outline, marginTop: 3 },
  section: { marginTop: 24, paddingHorizontal: 16 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: colors.onSurface },
  sectionBadge: { backgroundColor: colors.primaryFixed + "55", paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12 },
  sectionBadgeText: { fontSize: 11, fontWeight: "700", color: colors.primary },
  sectionLink: { fontSize: 12, fontWeight: "700", color: colors.primary },
  alertCard: { width: 260, borderRadius: 16, padding: 14, justifyContent: "space-between" },
  alertIconBox: { width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  alertTitle: { fontSize: 13, fontWeight: "700", marginBottom: 3 },
  alertMsg:   { fontSize: 11, lineHeight: 16, opacity: 0.85 },
  alertBtn:   { marginTop: 12, borderRadius: 10, paddingVertical: 9, alignItems: "center" },
  alertBtnText: { fontSize: 11, fontWeight: "700" },
  emptyBox: { alignItems: "center", paddingVertical: 24, gap: 8 },
  emptyText: { fontSize: 13, color: colors.outline },
  dossierRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: colors.surfaceContainerLowest, borderRadius: 14, padding: 14,
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
  },
  dossierDot: { width: 10, height: 10, borderRadius: 5 },
  dossierTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  dossierNum: { fontSize: 14, fontWeight: "700", color: colors.onSurface },
  dossierBadge: { backgroundColor: colors.surfaceVariant, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  dossierBadgeText: { fontSize: 10, fontWeight: "700", color: colors.onSurfaceVariant, textTransform: "uppercase" },
  dossierBottomRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 4 },
  dossierAmount: { fontSize: 13, fontWeight: "700", color: colors.onSurface },
  dossierDate: { fontSize: 11, color: colors.outline },
});