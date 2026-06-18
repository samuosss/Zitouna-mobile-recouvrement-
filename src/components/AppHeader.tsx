import { View, Text, Image, StyleSheet } from "react-native";
import { colors } from "../theme/colors";

interface AppHeaderProps {
  title: string;
  subtitle?: string;
}

export function AppHeader({ title, subtitle }: AppHeaderProps) {
  return (
    <View style={styles.header}>
      <View style={styles.logoBox}>
        <Image
          source={require("../../assets/ZITOUNA.png")}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      <View style={styles.textBox}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.primary,
    paddingTop: 58,
    paddingBottom: 20,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },

  logoBox: {
    width: 54,
    height: 54,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    padding: 6,
  },

  logo: {
    width: "100%",
    height: "100%",
  },

  textBox: {
    flex: 1,
  },

  title: {
    color: "#FFFFFF",
    fontSize: 21,
    fontWeight: "800",
    letterSpacing: 0.2,
  },

  subtitle: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 12,
    fontWeight: "500",
    marginTop: 3,
    lineHeight: 16,
  },
});