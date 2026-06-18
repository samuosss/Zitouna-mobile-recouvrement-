import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  ScrollView,
  RefreshControl,
} from "react-native";
import { useEffect, useState, useCallback, useRef } from "react";
import { colors } from "../../src/theme/colors";
import { api } from "../../src/api/client";
import {
  Search,
  ChevronDown,
  X,
  Phone,
  Gavel,
  User,
} from "lucide-react-native";

// ─── Safe Colors ──────────────────────────────────────────────────────────────

const C = colors as any;

const primary = C.primary ?? "#006747";
const secondary = C.secondary ?? C.accent ?? "#A4C639";
const tertiary = C.tertiary ?? "#185FA5";
const error = C.error ?? C.danger ?? "#EF4444";
const background = C.background ?? "#F6F8F6";
const surface = C.surface ?? C.card ?? "#FFFFFF";
const surfaceLowest = C.surfaceContainerLowest ?? C.card ?? "#FFFFFF";
const surfaceLow = C.surfaceContainerLow ?? "#F8FAFC";
const surfaceContainer = C.surfaceContainer ?? "#EEF3EE";
const surfaceHigh = C.surfaceContainerHigh ?? "#E8EEE8";
const surfaceVariant = C.surfaceVariant ?? "#F3F4F6";
const onSurface = C.onSurface ?? C.textPrimary ?? "#0F172A";
const onSurfaceVariant = C.onSurfaceVariant ?? C.textSecondary ?? "#475569";
const outline = C.outline ?? C.textMuted ?? "#94A3B8";
const outlineVariant = C.outlineVariant ?? C.border ?? "#E5E7EB";
const onPrimary = C.onPrimary ?? "#FFFFFF";
const primaryFixed = C.primaryFixed ?? "#DDEFE7";
const secondaryContainer = C.secondaryContainer ?? "#D1FAE5";
const onSecondaryContainer = C.onSecondaryContainer ?? "#065F46";
const tertiaryFixed = C.tertiaryFixed ?? "#FEE2E2";
const onTertiary = C.onTertiary ?? "#76312D";

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
  telephone?: string | null;
  email?: string | null;
  cin?: string | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (v: number) =>
  new Intl.NumberFormat("fr-TN", {
    maximumFractionDigits: 0,
  }).format(v);

const fmtDate = (d: string | null) => {
  if (!d) return "—";

  return new Date(d).toLocaleDateString("fr-TN", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });
};

const getClientName = (client?: Client | null) => {
  if (!client) return null;

  const fullName = `${client.prenom ?? ""} ${client.nom ?? ""}`.trim();

  return fullName.length > 0 ? fullName : `Client #${client.id_client}`;
};

const STATUT_LABEL: Record<Statut, string> = {
  Actif: "Actif",
  Cloture: "Clôturé",
  Suspendu: "Suspendu",
  EnLitige: "Litige",
};

const STATUT_CFG: Record<
  Statut,
  { bg: string; fg: string; border: string }
> = {
  Actif: {
    bg: secondaryContainer,
    fg: onSecondaryContainer,
    border: secondary,
  },
  Cloture: {
    bg: surfaceVariant,
    fg: onSurfaceVariant,
    border: outline,
  },
  Suspendu: {
    bg: "#FDF0D5",
    fg: "#92400E",
    border: "#F59E0B",
  },
  EnLitige: {
    bg: tertiaryFixed,
    fg: onTertiary,
    border: tertiary,
  },
};

const PRIORITE_DOT: Record<Priorite, string> = {
  Basse: "#3B82F6",
  Normale: secondary,
  Haute: "#F97316",
  Critique: error,
};

const STATUT_FILTERS: { label: string; value: Statut | null }[] = [
  { label: "Tous", value: null },
  { label: "Actif", value: "Actif" },
  { label: "Litige", value: "EnLitige" },
  { label: "Suspendu", value: "Suspendu" },
  { label: "Clôturé", value: "Cloture" },
];

// ─── Dossier Row ──────────────────────────────────────────────────────────────

function DossierRow({
  dossier,
  clientName,
  onPress,
}: {
  dossier: Dossier;
  clientName: string;
  onPress: () => void;
}) {
  const cfg = STATUT_CFG[dossier.statut] ?? STATUT_CFG.Actif;
  const dot = PRIORITE_DOT[dossier.priorite] ?? outline;

  return (
    <TouchableOpacity
      style={[styles.row, { borderLeftColor: cfg.border }]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <View style={styles.rowAvatar}>
        <User size={18} color={primary} />
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
          {clientName}
        </Text>

        <Text style={styles.rowDate}>
          {dossier.date_derniere_action
            ? `Mis à jour le ${fmtDate(dossier.date_derniere_action)}`
            : `Ouvert le ${fmtDate(dossier.date_ouverture)}`}
        </Text>
      </View>

      <View style={styles.rowRight}>
        <Text style={styles.rowAmount}>
          {dossier.montant_total_du != null
            ? `${fmt(dossier.montant_total_du)} DT`
            : "—"}
        </Text>

        <View style={[styles.rowDot, { backgroundColor: dot }]} />
      </View>
    </TouchableOpacity>
  );
}

// ─── Detail Bottom Sheet ──────────────────────────────────────────────────────

function DossierDetailSheet({
  dossier,
  client,
  visible,
  onClose,
}: {
  dossier: Dossier | null;
  client: Client | null;
  visible: boolean;
  onClose: () => void;
}) {
  if (!dossier) return null;

  const cfg = STATUT_CFG[dossier.statut] ?? STATUT_CFG.Actif;
  const clientName = getClientName(client) ?? "Chargement du client...";

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity
          style={{ flex: 1 }}
          activeOpacity={1}
          onPress={onClose}
        />

        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />

          <View style={styles.sheetHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.sheetTitle}>
                Détail {dossier.numero_dossier}
              </Text>

              <Text style={styles.sheetSubtitle}>{clientName}</Text>
            </View>

            <TouchableOpacity onPress={onClose} style={styles.sheetCloseBtn}>
              <X size={20} color={onSurface} />
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerStyle={styles.sheetBody}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.sheetRow}>
              <View style={[styles.sheetBadge, { backgroundColor: cfg.bg }]}>
                <Text style={[styles.sheetBadgeText, { color: cfg.fg }]}>
                  {STATUT_LABEL[dossier.statut]}
                </Text>
              </View>

              <View style={styles.sheetPriority}>
                <View
                  style={[
                    styles.rowDot,
                    {
                      backgroundColor:
                        PRIORITE_DOT[dossier.priorite] ?? outline,
                    },
                  ]}
                />

                <Text style={styles.sheetPriorityText}>
                  Priorité {dossier.priorite}
                </Text>
              </View>
            </View>

            <View style={styles.sheetAmountBox}>
              <Text style={styles.sheetAmountLabel}>MONTANT TOTAL DÛ</Text>

              <Text style={styles.sheetAmountValue}>
                {dossier.montant_total_du != null
                  ? `${fmt(dossier.montant_total_du)} DT`
                  : "—"}
              </Text>
            </View>

            <View style={styles.sheetGrid}>
              <View style={styles.sheetGridItem}>
                <Text style={styles.sheetGridLabel}>OUVERTURE</Text>
                <Text style={styles.sheetGridValue}>
                  {fmtDate(dossier.date_ouverture)}
                </Text>
              </View>

              <View style={styles.sheetGridItem}>
                <Text style={styles.sheetGridLabel}>DERNIÈRE ACTION</Text>
                <Text style={styles.sheetGridValue}>
                  {fmtDate(dossier.date_derniere_action)}
                </Text>
              </View>
            </View>

            <View style={styles.sheetClientBox}>
              <Text style={styles.sheetGridLabel}>CLIENT</Text>

              <Text style={styles.sheetClientName}>{clientName}</Text>

              <Text style={styles.sheetClientPhone}>
                {client?.telephone ?? "Téléphone indisponible"}
              </Text>

              {client?.email ? (
                <Text style={styles.sheetClientEmail}>{client.email}</Text>
              ) : null}

              {client?.cin ? (
                <Text style={styles.sheetClientEmail}>CIN: {client.cin}</Text>
              ) : null}
            </View>

            {dossier.notes ? (
              <View style={styles.sheetNotesBox}>
                <Text style={styles.sheetGridLabel}>NOTES</Text>
                <Text style={styles.sheetNotesText}>{dossier.notes}</Text>
              </View>
            ) : null}

            <View style={{ gap: 10, marginTop: 8 }}>
              <TouchableOpacity
                style={styles.actionPrimary}
                activeOpacity={0.85}
              >
                <Phone size={18} color={onPrimary} />
                <Text style={styles.actionPrimaryText}>
                  Contacter le débiteur
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionSecondary}
                activeOpacity={0.85}
              >
                <Gavel size={18} color={primary} />
                <Text style={styles.actionSecondaryText}>
                  Engager procédure légale
                </Text>
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
  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState("");
  const [statutFilter, setStatutFilter] = useState<Statut | null>(null);

  const [selected, setSelected] = useState<Dossier | null>(null);
  const [sheetVisible, setSheetVisible] = useState(false);

  const [stats, setStats] = useState<{
    total: number;
    actifs: number;
    litige: number;
    clotures: number;
  } | null>(null);

  const clientCache = useRef<Record<number, Client>>({});

  // Fallback: fetch one client by ID if not found in bulk list
  const fetchClient = useCallback(async (id_client: number) => {
    if (clientCache.current[id_client]) {
      return clientCache.current[id_client];
    }

    try {
      const c = await api.get<Client>(`/clients/${id_client}`);

      clientCache.current[id_client] = c;

      setClients(prev => ({
        ...prev,
        [id_client]: c,
      }));

      return c;
    } catch (e) {
      console.log("Erreur chargement client", id_client, e);
      return null;
    }
  }, []);

  // Main fetch: dossiers + stats + clients list
  const fetchAll = useCallback(async () => {
    try {
      const params = new URLSearchParams();

      if (statutFilter) {
        params.set("statut", statutFilter);
      }

      params.set("limit", "100");

      const [list, summary, clientsList] = await Promise.allSettled([
        api.get<Dossier[]>(`/dossiers/?${params.toString()}`),
        api.get<any>("/dossiers/stats/summary"),
        api.get<Client[]>("/clients/?limit=1000"),
      ]);

      // 1. Clients bulk
      if (clientsList.status === "fulfilled") {
        const clientArray = Array.isArray(clientsList.value)
          ? clientsList.value
          : [];

        const map: Record<number, Client> = {};

        clientArray.forEach(client => {
          map[client.id_client] = client;
        });

        clientCache.current = {
          ...clientCache.current,
          ...map,
        };

        setClients(prev => ({
          ...prev,
          ...map,
        }));
      } else {
        console.log("Erreur clients list:", clientsList.reason);
      }

      // 2. Dossiers
      if (list.status === "fulfilled") {
        const dossierList = Array.isArray(list.value) ? list.value : [];

        setDossiers(dossierList);

        const uniqueClientIds = Array.from(
          new Set(
            dossierList
              .map(d => d.id_client)
              .filter(Boolean)
          )
        );

        const missingIds = uniqueClientIds.filter(
          id => !clientCache.current[id]
        );

        if (missingIds.length > 0) {
          await Promise.all(missingIds.map(id => fetchClient(id)));
        }
      } else {
        console.log("Erreur dossiers list:", list.reason);
      }

      // 3. Stats
      if (summary.status === "fulfilled") {
        const s = summary.value;

        setStats({
          total: s.total_dossiers ?? 0,
          actifs: s.par_statut?.Actif ?? 0,
          litige: s.par_statut?.EnLitige ?? 0,
          clotures: s.par_statut?.Cloture ?? 0,
        });
      } else {
        console.log("Erreur dossiers stats:", summary.reason);
      }
    } catch (e) {
      console.log("Erreur chargement dossiers", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [statutFilter, fetchClient]);

  useEffect(() => {
    setLoading(true);
    fetchAll();
  }, [fetchAll]);

  const openDetail = (dossier: Dossier) => {
    setSelected(dossier);
    setSheetVisible(true);

    if (!clients[dossier.id_client]) {
      fetchClient(dossier.id_client);
    }
  };

  const filtered = dossiers.filter(d => {
    if (!search.trim()) return true;

    const client = clients[d.id_client];

    const haystack = `
      ${d.numero_dossier}
      ${client?.nom ?? ""}
      ${client?.prenom ?? ""}
      ${client?.cin ?? ""}
      ${d.id_client}
    `.toLowerCase();

    return haystack.includes(search.trim().toLowerCase());
  });

  return (
    <View style={styles.screen}>
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Search size={18} color={outline} />

          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher un dossier, client..."
            placeholderTextColor={outline}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8 }}
        >
          {STATUT_FILTERS.map(f => {
            const active = statutFilter === f.value;

            return (
              <TouchableOpacity
                key={f.label}
                style={[
                  styles.filterChip,
                  active && styles.filterChipActive,
                ]}
                onPress={() => setStatutFilter(f.value)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    active && styles.filterChipTextActive,
                  ]}
                >
                  {f.label}
                </Text>

                {f.value === null ? (
                  <ChevronDown
                    size={14}
                    color={active ? onPrimary : onSurfaceVariant}
                  />
                ) : null}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {stats ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.statsRow}
        >
          <View style={[styles.statCard, { borderLeftColor: primary }]}>
            <Text style={styles.statLabel}>TOTAL</Text>
            <Text style={[styles.statValue, { color: primary }]}>
              {stats.total}
            </Text>
          </View>

          <View style={[styles.statCard, { borderLeftColor: secondary }]}>
            <Text style={styles.statLabel}>ACTIFS</Text>
            <Text style={[styles.statValue, { color: secondary }]}>
              {stats.actifs}
            </Text>
          </View>

          <View style={[styles.statCard, { borderLeftColor: tertiary }]}>
            <Text style={styles.statLabel}>LITIGE</Text>
            <Text style={[styles.statValue, { color: tertiary }]}>
              {stats.litige}
            </Text>
          </View>

          <View style={[styles.statCard, { borderLeftColor: outline }]}>
            <Text style={styles.statLabel}>CLÔTURÉS</Text>
            <Text style={[styles.statValue, { color: outline }]}>
              {stats.clotures}
            </Text>
          </View>
        </ScrollView>
      ) : null}

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => String(item.id_dossier)}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              tintColor={primary}
              onRefresh={() => {
                setRefreshing(true);
                fetchAll();
              }}
            />
          }
          ListHeaderComponent={
            <Text style={styles.listTitle}>Derniers dossiers</Text>
          }
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>Aucun dossier trouvé</Text>
            </View>
          }
          renderItem={({ item }) => {
            const client = clients[item.id_client];
            const clientName =
              getClientName(client) ?? "Chargement du client...";

            return (
              <DossierRow
                dossier={item}
                clientName={clientName}
                onPress={() => openDetail(item)}
              />
            );
          }}
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
  screen: {
    flex: 1,
    backgroundColor: background,
    paddingTop: 56,
  },

  searchSection: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    gap: 10,
  },

  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: surfaceLowest,
    borderWidth: 1,
    borderColor: outlineVariant,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },

  searchInput: {
    flex: 1,
    fontSize: 14,
    color: onSurface,
  },

  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: surfaceContainer,
    borderWidth: 1,
    borderColor: outlineVariant,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },

  filterChipActive: {
    backgroundColor: primary,
    borderColor: primary,
  },

  filterChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: onSurfaceVariant,
  },

  filterChipTextActive: {
    color: onPrimary,
  },

  statsRow: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 10,
  },

  statCard: {
    minWidth: 92,
    backgroundColor: surfaceLowest,
    borderRadius: 14,
    padding: 10,
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },

  statLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: onSurfaceVariant,
    letterSpacing: 0.5,
  },

  statValue: {
    fontSize: 18,
    fontWeight: "800",
    marginTop: 2,
  },

  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },

  listTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: onSurface,
    marginBottom: 10,
  },

  loadingBox: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  emptyBox: {
    alignItems: "center",
    paddingVertical: 40,
  },

  emptyText: {
    fontSize: 13,
    color: outline,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: surfaceLowest,
    borderRadius: 14,
    padding: 14,
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },

  rowAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: `${primaryFixed}55`,
    alignItems: "center",
    justifyContent: "center",
  },

  rowTopLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 2,
  },

  rowNum: {
    fontSize: 12,
    fontWeight: "800",
    color: primary,
  },

  rowBadge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },

  rowBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
  },

  rowClient: {
    fontSize: 15,
    fontWeight: "800",
    color: onSurface,
  },

  rowDate: {
    fontSize: 11,
    color: outline,
    marginTop: 2,
  },

  rowRight: {
    alignItems: "flex-end",
  },

  rowAmount: {
    fontSize: 14,
    fontWeight: "800",
    color: onSurface,
  },

  rowDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },

  sheet: {
    backgroundColor: surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: "85%",
    paddingTop: 12,
  },

  sheetHandle: {
    width: 48,
    height: 5,
    borderRadius: 3,
    backgroundColor: outlineVariant,
    alignSelf: "center",
    marginBottom: 16,
  },

  sheetHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: `${outlineVariant}40`,
  },

  sheetTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: primary,
  },

  sheetSubtitle: {
    fontSize: 13,
    color: onSurfaceVariant,
    marginTop: 2,
    fontWeight: "600",
  },

  sheetCloseBtn: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: surfaceHigh,
  },

  sheetBody: {
    padding: 20,
    gap: 16,
  },

  sheetRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  sheetBadge: {
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },

  sheetBadgeText: {
    fontSize: 12,
    fontWeight: "700",
  },

  sheetPriority: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  sheetPriorityText: {
    fontSize: 12,
    fontWeight: "600",
    color: onSurfaceVariant,
  },

  sheetAmountBox: {
    backgroundColor: surfaceLow,
    borderRadius: 16,
    padding: 16,
  },

  sheetAmountLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: outline,
    letterSpacing: 1,
    marginBottom: 4,
  },

  sheetAmountValue: {
    fontSize: 24,
    fontWeight: "800",
    color: onSurface,
  },

  sheetGrid: {
    flexDirection: "row",
    gap: 12,
  },

  sheetGridItem: {
    flex: 1,
    backgroundColor: surfaceLow,
    borderRadius: 14,
    padding: 12,
  },

  sheetGridLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: outline,
    letterSpacing: 1,
    marginBottom: 4,
    textTransform: "uppercase",
  },

  sheetGridValue: {
    fontSize: 14,
    fontWeight: "700",
    color: onSurface,
  },

  sheetClientBox: {
    backgroundColor: surfaceLow,
    borderRadius: 14,
    padding: 12,
  },

  sheetClientName: {
    fontSize: 15,
    fontWeight: "800",
    color: onSurface,
    marginTop: 2,
  },

  sheetClientPhone: {
    fontSize: 13,
    color: onSurfaceVariant,
    marginTop: 2,
  },

  sheetClientEmail: {
    fontSize: 13,
    color: onSurfaceVariant,
    marginTop: 2,
  },

  sheetNotesBox: {
    backgroundColor: surfaceLow,
    borderRadius: 14,
    padding: 12,
  },

  sheetNotesText: {
    fontSize: 13,
    color: onSurfaceVariant,
    marginTop: 4,
    lineHeight: 19,
  },

  actionPrimary: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: primary,
    borderRadius: 14,
    paddingVertical: 15,
  },

  actionPrimaryText: {
    color: onPrimary,
    fontSize: 14,
    fontWeight: "700",
  },

  actionSecondary: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 2,
    borderColor: primary,
    borderRadius: 14,
    paddingVertical: 15,
  },

  actionSecondaryText: {
    color: primary,
    fontSize: 14,
    fontWeight: "700",
  },
});