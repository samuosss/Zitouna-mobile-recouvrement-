import { View, ViewStyle, StyleProp, StyleSheet } from "react-native";
import { colors } from "../theme/colors";
import { radius, shadow, spacing } from "../theme/spacing";

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: "soft" | "medium" | "flat";
  noPadding?: boolean;
}

export function Card({ children, style, variant = "soft", noPadding }: CardProps) {
  return (
    <View
      style={[
        styles.base,
        variant !== "flat" && shadow[variant],
        !noPadding && styles.padding,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radius.md,
  },
  padding: {
    padding: spacing.lg,
  },
});