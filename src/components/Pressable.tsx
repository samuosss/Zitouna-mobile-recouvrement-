import { useRef } from "react";
import { Animated, Pressable, ViewStyle, StyleProp } from "react-native";

interface ScalePressableProps {
  onPress?: () => void;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  scaleTo?: number; // valeur min du scale, défaut 0.97
  disabled?: boolean;
}

export function ScalePressable({
  onPress, children, style, scaleTo = 0.97, disabled,
}: ScalePressableProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const animateTo = (value: number) => {
    Animated.spring(scale, {
      toValue: value,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      onPressIn={() => animateTo(scaleTo)}
      onPressOut={() => animateTo(1)}
    >
      <Animated.View style={[style, { transform: [{ scale }] }]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}