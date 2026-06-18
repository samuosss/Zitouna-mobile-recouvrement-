import { Modal, View, Text, TouchableOpacity, StyleSheet, Pressable } from "react-native";
import { Check, X, Globe } from "lucide-react-native";
import { colors } from "../theme/colors";
import { radius, shadow, spacing } from "../theme/spacing";

export interface Language {
  code: string;
  label: string;
  flag: string;
}

const LANGUAGES: Language[] = [
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "ar", label: "العربية",  flag: "🇹🇳" },
  { code: "en", label: "English",  flag: "🇬🇧" },
];

interface LanguageModalProps {
  visible: boolean;
  current: string;
  onSelect: (code: string) => void;
  onClose: () => void;
}

export function LanguageModal({ visible, current, onSelect, onClose }: LanguageModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Globe size={18} color={colors.primary} />
              <Text style={styles.title}>Langue & Région</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={18} color={colors.onSurfaceVariant} />
            </TouchableOpacity>
          </View>

          <Text style={styles.subtitle}>Choisissez la langue d'affichage de l'application</Text>

          <View style={styles.list}>
            {LANGUAGES.map((lang) => {
              const active = lang.code === current;
              return (
                <TouchableOpacity
                  key={lang.code}
                  style={[styles.row, active && styles.rowActive]}
                  onPress={() => onSelect(lang.code)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.flag}>{lang.flag}</Text>
                  <Text style={[styles.label, active && styles.labelActive]}>{lang.label}</Text>
                  {active && (
                    <View style={styles.checkBox}>
                      <Check size={14} color={colors.onPrimary} />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.footnote}>
            Le changement de langue s'applique immédiatement à toute l'application.
          </Text>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: colors.surfaceContainerLowest,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.xl,
    paddingBottom: spacing.xxxl,
    ...shadow.strong,
  },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  title: { fontSize: 17, fontWeight: "800", color: colors.onSurface },
  closeBtn: { padding: 6, backgroundColor: colors.surfaceContainerHigh, borderRadius: radius.pill },
  subtitle: { fontSize: 12, color: colors.onSurfaceVariant, marginBottom: 18 },
  list: { gap: 8 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceContainer,
  },
  rowActive: {
    backgroundColor: colors.primaryFixed + "30",
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  flag: { fontSize: 22 },
  label: { flex: 1, fontSize: 15, fontWeight: "600", color: colors.onSurface },
  labelActive: { color: colors.primary, fontWeight: "800" },
  checkBox: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: "center", justifyContent: "center",
  },
  footnote: { fontSize: 11, color: colors.outline, marginTop: 16, textAlign: "center" },
});