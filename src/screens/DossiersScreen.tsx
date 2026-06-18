import {
  View, Text, StyleSheet, FlatList, TextInput,
  TouchableOpacity, ActivityIndicator, Modal, ScrollView,
} from "react-native";
import { useEffect, useState, useCallback, useRef } from "react";
import { colors } from "../../src/theme/colors";
import { api } from "../../src/api/client";
import {
  Search, ChevronDown, X, Phone, Gavel, User,
} from "lucide-react-native";

// ─── Types ────────────────────────────────────────────────────────────────────
type Statut = "Actif" | "Cloture" | "Suspendu" | "EnLitige";
type Priorite = "Basse" | "Normale" | "Haute" | "Critique";

interface Dossier {
  id_dossier: number;
  numero_dossier: string;
  statut: Statut;
  priorite: Priorite;
  montant_total_du: number | null;
  notes: string | null;
  id_client: number;
  date_ouverture: string;
  date_derniere_action: string | null;
}

interface Client {
  id_client: number;
  nom: string;
  prenom: string;
  telephone: string;
  email?: string | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (v: number) =>
  new Intl.NumberFormat("fr-TN", { maximumFractionDigits: 0 }).format(v);

const fmtDate = (d: string | null) => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-TN", { day: "2-digit", month: "2-digit", year: "2-digit" });
};

const STATUT_LABEL: Record<Statut, string> = {
  Actif: "Actif", Cloture: "Clôturé", Suspendu: "Suspendu", EnLitige: "Litige",
};

const STATUT_CFG: Record<Statut, { bg: string; fg: string; border: string }> = {
  Actif:    { bg: colors.secondaryContainer, fg: colors.onSecondaryContainer, border: colors.secondary },
  Cloture:  { bg: colors.surfaceVariant,     fg: colors.onSurfaceVariant,     border: colors.outline },
  Suspendu: { bg: "#fdf0d5",                 fg: "#92400E",                   border: "#f59e0b" },
  EnLitige: { bg: colors.tertiaryFixed,      fg: colors.onTertiary ?? "#76312d", border: colors.tertiary },
};

const PRIORITE_DOT: Record<Priorite, string> = {
  Basse: "#3B82F6", Normale: colors.secondary, Haute: "#F97316", Critique: colors.error,
};

const STATUT_FILTERS: { label: string; value: Statut | null }[] = [
  { label: "Tous",     value: null },
  { label: "Actif",    value: "Actif" },
  { label: "Litige",   value: "EnLitige" },
  { label: "Suspendu", value: "Suspendu" },
  { label: "Clôturé",  value: "Cloture" },
];

// ─── Dossier Row ──────────────────────────────────────────────────────────────
function DossierRow({
  dossier, clientName, onPress,
}: {
  dossier: Dossier; clientName: string | null; onPress: () => void;
}) {
  const cfg = STATUT_CFG[dossier.statut] ?? STATUT_CFG.Actif;
  const dot = PRIORITE_DOT[dossier.priorite] ?? colors.outline;

  return (
    <TouchableOpacity
      style={[styles.row, { borderLeftColor: cfg.border }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.rowAvatar}>
        <User size={18} color={colors.primary} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={styles.rowTopLine}>
          <Text style={styles.rowNum}>{dossier.numero_dossier}</Text>
          <View style={[styles.rowBadge, { backgroundColor: cfg.bg }]}>
            <Text style={[styles.rowBadgeText, { color: cfg.fg }]}>
              {STATUT_LABEL[dossier.statut]}
            </Text>
          </View>
        </View>
        <Text style={styles.rowClient} numberOfLines={1}>
          {clientName ?? "Chargement..."}
        </Text>
        <Text style={styles.rowDate}>
          {dossier.date_derniere_action
            ? `Mis à jour le ${fmtDate(dossier.date_derniere_action)}`
            : `Ouvert le ${fmtDate(dossier.date_ouverture)}`}
        </Text>
      </View>
      <View style={{ alignItems: "flex-end" }}>
        <Text style={styles.rowAmount}>
          {dossier.montant_total_du != null ? `${fmt(dossier.montant_total_du)} DT` : "—"}
        </Text>
        <View style={[styles.rowDot, { backgroundColor: dot }]} />
      </View>
    </TouchableOpacity>
  );
}

// ─── Detail Bottom Sheet ──────────────────────────────────────────────────────
function DossierDetailSheet({
  dossier, client, visible, onClose,
}: {
  dossier: Dossier | null; client: Client | null;
  visible: boolean; onClose: () => void;
}) {
  if (!dossier) return null;
  const cfg = STATUT_CFG[dossier.statut] ?? STATUT_CFG.Actif;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.sheetTitle}>Détail {dossier.numero_dossier}</Text>
              <Text style={styles.sheetSubtitle}>
                {client ? `${client.prenom} ${client.nom}` : "Chargement client..."}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.sheetCloseBtn}>
              <X size={20} color={colors.onSurface} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.sheetBody} showsVerticalScrollIndicator={false}>
            {/* Status + priority */}
            <View style={styles.sheetRow}>
              <View style={[styles.sheetBadge, { backgroundColor: cfg.bg }]}>
                <Text style={[styles.sheetBadgeText, { color: cfg.fg }]}>
                  {STATUT_LABEL[dossier.statut]}
                </Text>
              </View>
              <View style={styles.sheetPriority}>
                <View style={[styles.rowDot, { backgroundColor: PRIORITE_DOT[dossier.priorite] }]} />
                <Text style={styles.sheetPriorityText}>Priorité {dossier.priorite}</Text>
              </View>
            </View>

            {/* Amount */}
            <View style={styles.sheetAmountBox}>
              <Text style={styles.sheetAmountLabel}>MONTANT TOTAL DÛ</Text>
              <Text style={styles.sheetAmountValue}>
                {dossier.montant_total_du != null ? `${fmt(dossier.montant_total_du)} DT` : "—"}
              </Text>
            </View>

            {/* Dates */}
            <View style={styles.sheetGrid}>
              <View style={styles.sheetGridItem}>
                <Text style={styles.sheetGridLabel}>OUVERTURE</Text>
                <Text style={styles.sheetGridValue}>{fmtDate(dossier.date_ouverture)}</Text>
              </View>
              <View style={styles.sheetGridItem}>
                <Text style={styles.sheetGridLabel}>DERNIÈRE ACTION</Text>
                <Text style={styles.sheetGridValue}>{fmtDate(dossier.date_derniere_action)}</Text>
              </View>
            </View>

            {/* Client info */}
            {client && (
              <View style={styles.sheetClientBox}>
                <Text style={styles.sheetGridLabel}>CLIENT</Text>
                <Text style={styles.sheetClientName}>{client.prenom} {client.nom}</Text>
                <Text style={styles.sheetClientPhone}>{client.telephone}</Text>
              </View>
            )}

            {/* Notes */}
            {dossier.notes ? (
              <View style={styles.sheetNotesBox}>
                <Text style={styles.sheetGridLabel}>NOTES</Text>
                <Text style={styles.sheetNotesText}>{dossier.notes}</Text>
              </View>
            ) : null}

            {/* Actions */}
            <View style={{ gap: 10, marginTop: 8 }}>
              <TouchableOpacity style={styles.actionPrimary} activeOpacity={0.85}>
                <Phone size={18} color={colors.onPrimary} />
                <Text style={styles.actionPrimaryText}>Contacter le débiteur</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionSecondary} activeOpacity={0.85}>
                <Gavel size={18} color={colors.primary} />
                <Text style={styles.actionSecondaryText}>Engager procédure légale</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ─── Dossiers Screen ──────────────────────────────────────────────────────────
export default function DossiersScreen() {
  const [dossiers, setDossiers] = useState<Dossier[]>([]);
  const [clients, setClients] = useState<Record<number, Client>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statutFilter, setStatutFilter] = useState<Statut | null>(null);
  const [selected, setSelected] = useState<Dossier | null>(null);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [stats, setStats] = useState<{
    total: number; actifs: number; litige: number; clotures: number;
  } | null>(null);

  const clientCache = useRef<Record<number, Client>>({});

  const fetchClient = useCallback(async (id_client: number) => {
    if (clientCache.current[id_client]) return clientCache.current[id_client];
    try {
      const c = await api.get<Client>(`/clients/${id_client}`);
      clientCache.current[id_client] = c;
      setClients(prev => ({ ...prev, [id_client]: c }));
      return c;
    } catch {
      return null;
    }
  }, []);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statutFilter) params.set("statut", statutFilter);
      params.set("limit", "100");

      const [list, summary] = await Promise.allSettled([
        api.get<Dossier[]>(`/dossiers?${params.toString()}`),
        api.get<any>("/dossiers/stats/summary"),
      ]);

      if (list.status === "fulfilled") {
        setDossiers(list.value);
        // Resolve client names for visible dossiers (deduped by cache)
        const uniqueClientIds = Array.from(new Set(list.value.map(d => d.id_client)));
        uniqueClientIds.forEach(id => { fetchClient(id); });
      }

      if (summary.status === "fulfilled") {
        const s = summary.value;
        setStats({
          total: s.total_dossiers ?? 0,
          actifs: s.par_statut?.Actif ?? 0,
          litige: s.par_statut?.EnLitige ?? 0,
          clotures: s.par_statut?.Cloture ?? 0,
        });
      }
    } catch {}
    finally { setLoading(false); }
  }, [statutFilter, fetchClient]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const openDetail = (dossier: Dossier) => {
    setSelected(dossier);
    setSheetVisible(true);
    if (!clients[dossier.id_client]) fetchClient(dossier.id_client);
  };

  const filtered = dossiers.filter(d => {
    if (!search.trim()) return true;
    const client = clients[d.id_client];
    const haystack = `${d.numero_dossier} ${client?.nom ?? ""} ${client?.prenom ?? ""}`.toLowerCase();
    return haystack.includes(search.trim().toLowerCase());
  });

  return (
    <View style={styles.screen}>
      {/* Search + filters */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Search size={18} color={colors.outline} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher un dossier, client..."
            placeholderTextColor={colors.outline}
            value={search}
            onChangeText={setSearch}
          />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {STATUT_FILTERS.map(f => {
            const active = statutFilter === f.value;
            return (
              <TouchableOpacity
                key={f.label}
                style={[styles.filterChip, active && styles.filterChipActive]}
                onPress={() => setStatutFilter(f.value)}
                activeOpacity={0.7}
              >
                <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                  {f.label}
                </Text>
                {f.value === null && <ChevronDown size={14} color={active ? colors.onPrimary : colors.onSurfaceVariant} />}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Stats badges */}
      {stats && (
        <ScrollView
          horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.statsRow}
        >
          <View style={[styles.statCard, { borderLeftColor: colors.primary }]}>
            <Text style={styles.statLabel}>TOTAL</Text>
            <Text style={[styles.statValue, { color: colors.primary }]}>{stats.total}</Text>
          </View>
          <View style={[styles.statCard, { borderLeftColor: colors.secondary }]}>
            <Text style={styles.statLabel}>ACTIFS</Text>
            <Text style={[styles.statValue, { color: colors.secondary }]}>{stats.actifs}</Text>
          </View>
          <View style={[styles.statCard, { borderLeftColor: colors.tertiary }]}>
            <Text style={styles.statLabel}>LITIGE</Text>
            <Text style={[styles.statValue, { color: colors.tertiary }]}>{stats.litige}</Text>
          </View>
          <View style={[styles.statCard, { borderLeftColor: colors.outline }]}>
            <Text style={styles.statLabel}>CLÔTURÉS</Text>
            <Text style={[styles.statValue, { color: colors.outline }]}>{stats.clotures}</Text>
          </View>
        </ScrollView>
      )}

      {/* List */}
      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => String(item.id_dossier)}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={<Text style={styles.listTitle}>Derniers dossiers</Text>}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>Aucun dossier trouvé</Text>
            </View>
          }
          renderItem={({ item }) => (
            <DossierRow
              dossier={item}
              clientName={clients[item.id_client] ? `${clients[item.id_client].prenom} ${clients[item.id_client].nom}` : null}
              onPress={() => openDetail(item)}
            />
          )}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        />
      )}

      <DossierDetailSheet
        dossier={selected}
        client={selected ? clients[selected.id_client] ?? null : null}
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background, paddingTop: 56 },

  // Search & filters
  searchSection: { paddingHorizontal: 16, paddingBottom: 10, gap: 10 },
  searchBar: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: colors.surfaceContainerLowest, borderWidth: 1, borderColor: colors.outlineVariant,
    borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12,
  },
  searchInput: { flex: 1, fontSize: 14, color: colors.onSurface },
  filterChip: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: colors.surfaceContainer, borderWidth: 1, borderColor: colors.outlineVariant,
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7,
  },
  filterChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterChipText: { fontSize: 12, fontWeight: "600", color: colors.onSurfaceVariant },
  filterChipTextActive: { color: colors.onPrimary },

  // Stats
  statsRow: { paddingHorizontal: 16, paddingBottom: 12, gap: 10 },
  statCard: {
    minWidth: 92, backgroundColor: colors.surfaceContainerLowest, borderRadius: 14,
    padding: 10, borderLeftWidth: 4,
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
  },
  statLabel: { fontSize: 10, fontWeight: "700", color: colors.onSurfaceVariant, letterSpacing: 0.5 },
  statValue: { fontSize: 18, fontWeight: "800", marginTop: 2 },

  // List
  listContent: { paddingHorizontal: 16, paddingBottom: 40 },
  listTitle: { fontSize: 16, fontWeight: "700", color: colors.onSurface, marginBottom: 10 },
  loadingBox: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyBox: { alignItems: "center", paddingVertical: 40 },
  emptyText: { fontSize: 13, color: colors.outline },

  // Row
  row: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: colors.surfaceContainerLowest, borderRadius: 14, padding: 14,
    borderLeftWidth: 4,
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
  },
  rowAvatar: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: colors.primaryFixed + "55",
    alignItems: "center", justifyContent: "center",
  },
  rowTopLine: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 2 },
  rowNum: { fontSize: 11, fontWeight: "700", color: colors.outline },
  rowBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 },
  rowBadgeText: { fontSize: 10, fontWeight: "700", textTransform: "uppercase" },
  rowClient: { fontSize: 14, fontWeight: "700", color: colors.onSurface },
  rowDate: { fontSize: 11, color: colors.outline, marginTop: 2 },
  rowAmount: { fontSize: 14, fontWeight: "700", color: colors.onSurface },
  rowDot: { width: 8, height: 8, borderRadius: 4, marginTop: 6 },

  // Modal / Sheet
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  sheet: {
    backgroundColor: colors.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28,
    maxHeight: "85%", paddingTop: 12,
  },
  sheetHandle: { width: 48, height: 5, borderRadius: 3, backgroundColor: colors.outlineVariant, alignSelf: "center", marginBottom: 16 },
  sheetHeader: {
    flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between",
    paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: colors.outlineVariant + "40",
  },
  sheetTitle: { fontSize: 18, fontWeight: "800", color: colors.primary },
  sheetSubtitle: { fontSize: 13, color: colors.onSurfaceVariant, marginTop: 2 },
  sheetCloseBtn: { padding: 6, borderRadius: 20, backgroundColor: colors.surfaceContainerHigh },

  sheetBody: { padding: 20, gap: 16 },
  sheetRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  sheetBadge: { borderRadius: 10, paddingHorizontal: 12, paddingVertical: 5 },
  sheetBadgeText: { fontSize: 12, fontWeight: "700" },
  sheetPriority: { flexDirection: "row", alignItems: "center", gap: 6 },
  sheetPriorityText: { fontSize: 12, fontWeight: "600", color: colors.onSurfaceVariant },

  sheetAmountBox: { backgroundColor: colors.surfaceContainerLow, borderRadius: 16, padding: 16 },
  sheetAmountLabel: { fontSize: 11, fontWeight: "700", color: colors.outline, letterSpacing: 1, marginBottom: 4 },
  sheetAmountValue: { fontSize: 24, fontWeight: "800", color: colors.onSurface },

  sheetGrid: { flexDirection: "row", gap: 12 },
  sheetGridItem: { flex: 1, backgroundColor: colors.surfaceContainerLow, borderRadius: 14, padding: 12 },
  sheetGridLabel: { fontSize: 10, fontWeight: "700", color: colors.outline, letterSpacing: 1, marginBottom: 4, textTransform: "uppercase" },
  sheetGridValue: { fontSize: 14, fontWeight: "700", color: colors.onSurface },

  sheetClientBox: { backgroundColor: colors.surfaceContainerLow, borderRadius: 14, padding: 12 },
  sheetClientName: { fontSize: 15, fontWeight: "700", color: colors.onSurface, marginTop: 2 },
  sheetClientPhone: { fontSize: 13, color: colors.onSurfaceVariant, marginTop: 2 },

  sheetNotesBox: { backgroundColor: colors.surfaceContainerLow, borderRadius: 14, padding: 12 },
  sheetNotesText: { fontSize: 13, color: colors.onSurfaceVariant, marginTop: 4, lineHeight: 19 },

  actionPrimary: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: colors.primary, borderRadius: 14, paddingVertical: 15,
  },
  actionPrimaryText: { color: colors.onPrimary, fontSize: 14, fontWeight: "700" },
  actionSecondary: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    borderWidth: 2, borderColor: colors.primary, borderRadius: 14, paddingVertical: 15,
  },
  actionSecondaryText: { color: colors.primary, fontSize: 14, fontWeight: "700" },
});