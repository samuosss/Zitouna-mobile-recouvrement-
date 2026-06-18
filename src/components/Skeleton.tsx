import { useEffect, useRef } from "react";
import { Animated, View, ViewStyle, StyleProp, StyleSheet } from "react-native";
import { colors } from "../theme/colors";
import { radius } from "../theme/spacing";

interface SkeletonProps {
  width?: number | `${number}%`;
  height?: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
}

export function Skeleton({ width = "100%", height = 16, borderRadius = radius.sm, style }: SkeletonProps) {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        styles.base,
        { width, height, borderRadius, opacity },
        style,
      ]}
    />
  );
}

// ─── Pré-fabriqués pour cas courants ──────────────────────────────────────────
export function SkeletonCard() {
  return (
    <View style={styles.cardSkeleton}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 10 }}>
        <Skeleton width={90} height={11} />
        <Skeleton width={28} height={28} borderRadius={8} />
      </View>
      <Skeleton width={70} height={20} style={{ marginBottom: 6 }} />
      <Skeleton width={50} height={10} />
    </View>
  );
}

export function SkeletonRow() {
  return (
    <View style={styles.rowSkeleton}>
      <Skeleton width={10} height={10} borderRadius={5} />
      <View style={{ flex: 1, gap: 6 }}>
        <Skeleton width="60%" height={13} />
        <Skeleton width="40%" height={10} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.surfaceContainerHigh,
  },
  cardSkeleton: {
    width: "47%",
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radius.md,
    padding: 14,
  },
  rowSkeleton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radius.md,
    padding: 14,
  },
});