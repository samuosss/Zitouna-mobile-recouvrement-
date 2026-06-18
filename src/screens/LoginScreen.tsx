import { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Image, ScrollView, ActivityIndicator,
  KeyboardAvoidingView, Platform, StatusBar,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { colors } from "../theme/colors";
import { Lock, Mail, ShieldCheck } from "lucide-react-native";

const API_BASE = "https://gigantic-borax-handyman.ngrok-free.dev/api/v1"; // ← ton IP ici

export function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  const handleLogin = async () => {
    if (!email || !password) { setError("Remplissez tous les champs"); return; }
    setLoading(true); setError("");
    try {
      const res = await fetch(`${API_BASE}/auth/login-json`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "true",
  },
  body: JSON.stringify({ email, password }),
});
      if (!res.ok) throw new Error("Identifiants incorrects");
      const data = await res.json();
      await AsyncStorage.setItem("auth", JSON.stringify({
        accessToken:  data.access_token,
        refreshToken: data.refresh_token,
      }));
      onLogin();
    } catch (e: any) {
      setError(e.message ?? "Erreur de connexion");
    } finally {
      setLoading(false);
    }
  };

  const testAccounts = [
    { role: "Agent",       email: "agent@zitouna.tn",    pass: "agent123",    color: colors.primary },
    { role: "Chef Agence", email: "chef@zitouna.tn",     pass: "chef123",     color: colors.primaryLight },
    { role: "Admin / DGA", email: "admin@zitouna.tn",    pass: "admin123",    color: colors.accent },
  ];

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >

        {/* ── Top green wave ── */}
        <View style={styles.topWave}>
          {/* Logo */}
          <Image
            source={require("../../assets/ZITOUNA.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.appName}>Recouvrement</Text>
          <Text style={styles.appSub}>Espace sécurisé · Collaborateurs</Text>
        </View>

        {/* ── White card ── */}
        <View style={styles.card}>

          {/* Error */}
          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>⚠ {error}</Text>
            </View>
          ) : null}

          {/* Email */}
          <Text style={styles.label}>Adresse e-mail</Text>
          <View style={styles.inputRow}>
            <Mail size={16} color={colors.textMuted} />
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="prenom.nom@zitouna.tn"
              placeholderTextColor={colors.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* Password */}
          <Text style={styles.label}>Mot de passe</Text>
          <View style={styles.inputRow}>
            <Lock size={16} color={colors.textMuted} />
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor={colors.textMuted}
              secureTextEntry
            />
          </View>

          {/* Login button */}
          <TouchableOpacity
            style={styles.btn}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={styles.btnText}>Se connecter</Text>
            }
          </TouchableOpacity>

          {/* SSL */}
          <View style={styles.sslRow}>
            <ShieldCheck size={11} color={colors.textMuted} />
            <Text style={styles.sslText}>CONNEXION SÉCURISÉE SSL</Text>
          </View>
        </View>

        {/* ── Test accounts ── */}
        <View style={styles.testSection}>
          <Text style={styles.testTitle}>— Comptes de test —</Text>
          {testAccounts.map(a => (
            <TouchableOpacity
              key={a.email}
              style={[styles.testBtn, { borderLeftColor: a.color }]}
              onPress={() => { setEmail(a.email); setPassword(a.pass); }}
              activeOpacity={0.7}
            >
              <View style={[styles.testDot, { backgroundColor: a.color }]} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.testRole, { color: a.color }]}>{a.role}</Text>
                <Text style={styles.testEmail}>{a.email}</Text>
              </View>
              <Text style={styles.testArrow}>→</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Footer */}
        <Text style={styles.footer}>© 2026 Banque Zitouna · Direction du Recouvrement</Text>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#F6F8F6",
  },

  // Top green section
  topWave: {
    backgroundColor: "#b7e6ad",
    alignItems: "center",
    paddingTop: 70,
    paddingBottom: 48,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
  },
  logo: {
    width: 140,
    height: 140,
    marginBottom: 8,
  },
  appName: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  appSub: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 12,
    marginTop: 4,
  },

  // Card
  card: {
    backgroundColor: "#fff",
    marginHorizontal: 20,
    marginTop: -24,
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },

  errorBox: {
    backgroundColor: "#FEE2E2",
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: "#991B1B",
    fontSize: 13,
    fontWeight: "500",
  },

  label: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textSecondary,
    marginBottom: 8,
    marginTop: 16,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: colors.textPrimary,
  },

  btn: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 24,
    shadowColor: colors.primary,
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  btnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.3,
  },

  sslRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 16,
  },
  sslText: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: "600",
    letterSpacing: 1.2,
  },

  // Test accounts
  testSection: {
    marginHorizontal: 20,
    marginTop: 28,
  },
  testTitle: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: "600",
    textAlign: "center",
    letterSpacing: 1,
    marginBottom: 12,
  },
  testBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  testDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  testRole: {
    fontSize: 13,
    fontWeight: "700",
  },
  testEmail: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  testArrow: {
    fontSize: 16,
    color: colors.textMuted,
  },

  footer: {
    textAlign: "center",
    color: colors.textMuted,
    fontSize: 10,
    marginTop: 28,
    marginBottom: 40,
  },
});