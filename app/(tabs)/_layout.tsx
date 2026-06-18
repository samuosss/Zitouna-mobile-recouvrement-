import { Tabs } from "expo-router";
import { colors } from "../../src/theme/colors";
import { Home, FolderOpen, BarChart2, Send, User } from "lucide-react-native";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          height: 85,
          paddingBottom: 20,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "600",
        },
      }}
    >
      <Tabs.Screen name="index"    options={{ title: "Accueil",  tabBarIcon: ({ color }) => <Home        size={22} color={color} /> }} />
      <Tabs.Screen name="dossiers" options={{ title: "Dossiers", tabBarIcon: ({ color }) => <FolderOpen  size={22} color={color} /> }} />
      <Tabs.Screen name="analyses" options={{ title: "Analyses", tabBarIcon: ({ color }) => <BarChart2   size={22} color={color} /> }} />
      <Tabs.Screen name="dispatch" options={{ title: "Dispatch", tabBarIcon: ({ color }) => <Send        size={22} color={color} /> }} />
      <Tabs.Screen name="profil"   options={{ title: "Profil",   tabBarIcon: ({ color }) => <User        size={22} color={color} /> }} />
    </Tabs>
  );
}