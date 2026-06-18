import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator, Alert,
} from "react-native";
import { useEffect, useState, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { colors } from "../../src/theme/colors";
import { api } from "../../src/api/client";
import {
  ShieldCheck, Mail, Building2, LogOut,
  ChevronRight, Settings, Bell, Lock,
  History, Globe, Pencil,
} from "lucide-react-native";
import { LanguageModal } from "../../src/components/LanguageModal";
import { useLanguage } from "../../src/context/LanguageContext";

interface UserProfile {
  id_utilisateur: number;
  nom: string;
  prenom: string;
  email: string;
  role: string;
  id_agence: number | null;
  actif: boolean;
}

const LANG_LABELS: Record<string, string> = {
  fr: "Français (FR)",
  ar: "العربية (AR)",
  en: "English (EN)",
};

export default function ProfilScreen() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showLangModal, setShowLangModal] = useState(false);
  const { language, setLanguage, t } = useLanguage();

  const ROLE_LABELS: Record<string, string> = {
    Agent:         t("profil_roleAgent"),
    ChefAgence:    t("profil_roleChefAgence"),
    ChefRegional:  t("profil_roleChefRegional"),
    DGA:           t("profil_roleDGA"),
    Admin:         t("profil_roleAdmin"),
  };

  const fetchProfile = useCallback(async () => {
    try {
      const data = await api.get<UserProfile>("/auth/me");
      setProfile(data);
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const handleLogout = () => {
    Alert.alert(
      t("profil_logoutConfirmTitle"),
      t("profil_logoutConfirmMsg"),
      [
        { text: t("common_cancel"), style: "cancel" },
        {
          text: t("profil_logout"),
          style: "destructive",
          onPress: async () => {
            try { await api.post("/auth/logout"); } catch {}
            await AsyncStorage.removeItem("auth");
            await AsyncStorage.setItem("__logout__", "1");
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingBox}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.loadingBox}>
        <Text style={styles.mutedText}>{t("common_error")}</Text>
      </View>
    );
  }

  const initials = `${profile.prenom?.[0] ?? ""}${profile.nom?.[0] ?? ""}`.toUpperCase();
  const roleLabel = ROLE_LABELS[profile.role] ?? profile.role;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

      <View style={styles.topBar}>
        <Text style={styles.topBarTitle}>{t("profil_title")}</Text>
        <View style={styles.topBarAvatar}>
          <Text style={styles.topBarAvatarText}>{initials}</Text>
        </View>
      </View>

      <View style={styles.heroCard}>
        <View style={styles.avatarWrapper}>
          <View style={styles.avatarRing}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.editBtn} activeOpacity={0.8}>
            <Pencil size={14} color={colors.onPrimary} />
          </TouchableOpacity>
        </View>
        <Text style={styles.heroName}>{profile.prenom} {profile.nom}</Text>
        <View style={styles.heroRoleRow}>
          <ShieldCheck size={16} color={colors.primary} />
          <Text style={styles.heroRole}>{roleLabel}</Text>
        </View>
        <View style={styles.heroTags}>
          {profile.id_agence != null && (
            <View style={styles.tagGreen}>
              <Text style={styles.tagGreenText}>{t("profil_agency").toUpperCase()} #{profile.id_agence}</Text>
            </View>
          )}
          <View style={styles.tagGray}>
            <Text style={styles.tagGrayText}>
              ID: ZR-{String(profile.id_utilisateur).padStart(4, "0")}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{t("profil_contactInfo")}</Text>
          <Mail size={20} color={colors.outline} />
        </View>
        <View style={styles.infoGrid}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>{t("profil_email").toUpperCase()}</Text>
            <Text style={styles.infoValue}>{profile.email}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>{t("profil_role").toUpperCase()}</Text>
            <Text style={styles.infoValue}>{roleLabel}</Text>
          </View>
          {profile.id_agence != null && (
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>{t("profil_agency").toUpperCase()}</Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <Building2 size={14} color={colors.onSurfaceVariant} />
                <Text style={styles.infoValue}>#{profile.id_agence}</Text>
              </View>
            </View>
          )}
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>{t("profil_status").toUpperCase()}</Text>
            <View style={[styles.statusPill, { backgroundColor: profile.actif ? colors.secondaryContainer : colors.errorContainer }]}>
              <Text style={[styles.statusPillText, { color: profile.actif ? colors.onSecondaryContainer : colors.onErrorContainer }]}>
                {profile.actif ? t("profil_active") : t("profil_inactive")}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.performanceCard}>
        <Text style={styles.perfLabel}>{t("profil_monthlyGoal")}</Text>
        <Text style={styles.perfValue}>{profile.actif ? t("profil_active") : "—"}</Text>
        <View style={styles.perfTrack}>
          <View style={[styles.perfFill, { width: "84%" }]} />
        </View>
        <Text style={styles.perfSub}>Excellent rendement ce mois-ci</Text>
      </View>

      <View style={styles.menuGrid}>
        <TouchableOpacity style={[styles.menuCard, { borderLeftColor: colors.primary }]} activeOpacity={0.7}>
          <View style={[styles.menuIconBox, { backgroundColor: colors.surfaceContainerHigh }]}>
            <Settings size={22} color={colors.primary} />
          </View>
          <Text style={styles.menuTitle}>{t("profil_settings")}</Text>
          <Text style={styles.menuSub}>{t("profil_settingsSub")}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.menuCard, { borderLeftColor: colors.secondary }]} activeOpacity={0.7}>
          <View style={[styles.menuIconBox, { backgroundColor: colors.surfaceContainerHigh }]}>
            <Bell size={22} color={colors.secondary} />
          </View>
          <Text style={styles.menuTitle}>{t("profil_notifications")}</Text>
          <Text style={styles.menuSub}>{t("profil_notificationsSub")}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.menuCard, { borderLeftColor: colors.tertiary }]} activeOpacity={0.7}>
          <View style={[styles.menuIconBox, { backgroundColor: colors.surfaceContainerHigh }]}>
            <Lock size={22} color={colors.tertiary} />
          </View>
          <Text style={styles.menuTitle}>{t("profil_security")}</Text>
          <Text style={styles.menuSub}>{t("profil_securitySub")}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.actionsCard}>
        <View style={styles.actionsHeader}>
          <Text style={styles.actionsHeaderText}>{t("profil_quickActions")}</Text>
        </View>
        <TouchableOpacity style={styles.actionRow} activeOpacity={0.7}>
          <View style={styles.actionLeft}>
            <History size={20} color={colors.onSurfaceVariant} />
            <Text style={styles.actionLabel}>{t("profil_loginHistory")}</Text>
          </View>
          <ChevronRight size={18} color={colors.outline} />
        </TouchableOpacity>
        <View style={styles.actionDivider} />
        <TouchableOpacity style={styles.actionRow} activeOpacity={0.7} onPress={() => setShowLangModal(true)}>
          <View style={styles.actionLeft}>
            <Globe size={20} color={colors.onSurfaceVariant} />
            <Text style={styles.actionLabel}>{t("profil_language")}</Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Text style={styles.actionMeta}>{LANG_LABELS[language] ?? "Français (FR)"}</Text>
            <ChevronRight size={18} color={colors.outline} />
          </View>
        </TouchableOpacity>
        <View style={styles.actionDivider} />
        <TouchableOpacity style={styles.actionRow} onPress={handleLogout} activeOpacity={0.7}>
          <View style={styles.actionLeft}>
            <LogOut size={20} color={colors.error} />
            <Text style={[styles.actionLabel, { color: colors.error }]}>{t("profil_logout")}</Text>
          </View>
        </TouchableOpacity>
      </View>

      <LanguageModal
        visible={showLangModal}
        current={language}
        onSelect={(code) => { setLanguage(code); setShowLangModal(false); }}
        onClose={() => setShowLangModal(false)}
      />

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: 100 },
  loadingBox: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background },
  mutedText: { fontSize: 13, color: colors.outline },
  topBar: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 16, paddingTop: 56, paddingBottom: 12,
    backgroundColor: colors.surface,
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 4, elevation: 2,
  },
  topBarTitle: { fontSize: 22, fontWeight: "800", color: colors.primary },
  topBarAvatar: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: colors.secondaryContainer,
    borderWidth: 2, borderColor: colors.primary,
    alignItems: "center", justifyContent: "center",
  },
  topBarAvatarText: { fontSize: 14, fontWeight: "800", color: colors.onSecondaryContainer },
  heroCard: {
    backgroundColor: colors.surfaceContainerLowest, marginHorizontal: 16, marginTop: 16,
    borderRadius: 18, padding: 20, alignItems: "center",
    borderLeftWidth: 4, borderLeftColor: colors.primary,
    shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  avatarWrapper: { position: "relative", marginBottom: 12 },
  avatarRing: {
    width: 88, height: 88, borderRadius: 44,
    borderWidth: 4, borderColor: colors.secondaryContainer, padding: 3,
  },
  avatar: {
    flex: 1, borderRadius: 40, backgroundColor: colors.primaryContainer,
    alignItems: "center", justifyContent: "center",
  },
  avatarText: { color: colors.onPrimary, fontSize: 26, fontWeight: "800" },
  editBtn: {
    position: "absolute", bottom: 0, right: 0,
    backgroundColor: colors.primary, borderRadius: 14, padding: 7,
    shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 4, elevation: 3,
  },
  heroName: { fontSize: 22, fontWeight: "800", color: colors.onSurface },
  heroRoleRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 },
  heroRole: { fontSize: 15, fontWeight: "600", color: colors.primary },
  heroTags: { flexDirection: "row", gap: 8, marginTop: 12, flexWrap: "wrap", justifyContent: "center" },
  tagGreen: { backgroundColor: colors.secondaryContainer, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  tagGreenText: { fontSize: 10, fontWeight: "700", color: colors.onSecondaryContainer, letterSpacing: 0.5 },
  tagGray: { backgroundColor: colors.surfaceContainerHigh, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  tagGrayText: { fontSize: 10, fontWeight: "700", color: colors.onSurfaceVariant, letterSpacing: 0.5 },
  card: {
    backgroundColor: colors.surfaceContainerLowest, marginHorizontal: 16, marginTop: 14,
    borderRadius: 16, padding: 18,
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  cardTitle: { fontSize: 15, fontWeight: "700", color: colors.onSurface },
  infoGrid: { gap: 14 },
  infoItem: { gap: 3 },
  infoLabel: { fontSize: 11, fontWeight: "600", color: colors.onSurfaceVariant, letterSpacing: 0.5 },
  infoValue: { fontSize: 14, fontWeight: "700", color: colors.onSurface },
  statusPill: { alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 },
  statusPillText: { fontSize: 11, fontWeight: "700" },
  performanceCard: {
    backgroundColor: colors.primary, marginHorizontal: 16, marginTop: 14,
    borderRadius: 16, padding: 18,
    shadowColor: colors.primary, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  perfLabel: { fontSize: 10, fontWeight: "700", color: colors.onPrimaryContainer, letterSpacing: 1 },
  perfValue: { fontSize: 28, fontWeight: "800", color: colors.onPrimary, marginTop: 4 },
  perfTrack: { height: 10, backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 5, marginTop: 14, overflow: "hidden" },
  perfFill: { height: "100%", backgroundColor: colors.secondaryFixed, borderRadius: 5 },
  perfSub: { fontSize: 11, color: "rgba(255,255,255,0.75)", marginTop: 8 },
  menuGrid: { marginHorizontal: 16, marginTop: 14, gap: 10 },
  menuCard: {
    backgroundColor: colors.surfaceContainerLowest, borderRadius: 16, padding: 16,
    borderLeftWidth: 4,
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
  },
  menuIconBox: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center", marginBottom: 10 },
  menuTitle: { fontSize: 15, fontWeight: "700", color: colors.onSurface },
  menuSub: { fontSize: 12, color: colors.onSurfaceVariant, marginTop: 3 },
  actionsCard: {
    backgroundColor: colors.surfaceContainerLowest, marginHorizontal: 16, marginTop: 14,
    borderRadius: 16, overflow: "hidden",
    borderWidth: 1, borderColor: colors.outlineVariant + "40",
  },
  actionsHeader: { backgroundColor: colors.surfaceContainerHigh, paddingHorizontal: 16, paddingVertical: 10 },
  actionsHeaderText: { fontSize: 11, fontWeight: "700", color: colors.onSurfaceVariant, letterSpacing: 1 },
  actionRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16 },
  actionLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  actionLabel: { fontSize: 14, color: colors.onSurface, fontWeight: "500" },
  actionMeta: { fontSize: 12, fontWeight: "700", color: colors.primary },
  actionDivider: { height: 1, backgroundColor: colors.outlineVariant + "30", marginHorizontal: 16 },
});