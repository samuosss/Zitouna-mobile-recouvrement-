import { View, Text, StyleSheet } from "react-native";
import { radius } from "../theme/spacing";

interface BadgeProps {
  label: string;
  bg: string;
  color: string;
  size?: "sm" | "md";
}

export function Badge({ label, bg, color, size = "sm" }: BadgeProps) {
  return (
    <View style={[
      styles.base,
      { backgroundColor: bg },
      size === "md" && styles.md,
    ]}>
      <Text style={[styles.text, { color }, size === "md" && styles.textMd]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 2,
    alignSelf: "flex-start",
  },
  md: {
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  text: {
    fontSize: 10,
    fontWeight: "700",
  },
  textMd: {
    fontSize: 11,
  },
});