import { useEffect, useState, useCallback } from "react";
import { Stack } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LoginScreen } from "../src/screens/LoginScreen";
import { View, ActivityIndicator, AppState } from "react-native";
import { colors } from "../src/theme/colors";
import { LanguageProvider } from "../src/context/LanguageContext";

export default function RootLayout() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  const checkAuth = useCallback(async () => {
    try {
      const logout = await AsyncStorage.getItem("__logout__");
      if (logout) {
        await AsyncStorage.multiRemove(["auth", "__logout__"]);
        setIsLoggedIn(false);
        return;
      }
      const val = await AsyncStorage.getItem("auth");
      setIsLoggedIn(!!val);
    } catch {
      setIsLoggedIn(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();

    const appStateSub = AppState.addEventListener("change", state => {
      if (state === "active") checkAuth();
    });

    const interval = setInterval(checkAuth, 500);

    return () => {
      appStateSub.remove();
      clearInterval(interval);
    };
  }, [checkAuth]);

  if (isLoggedIn === null) {
    return (
      <View style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: colors.background,
      }}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <LanguageProvider>
      {!isLoggedIn
        ? <LoginScreen onLogin={() => setIsLoggedIn(true)} />
        : <Stack screenOptions={{ headerShown: false }} />
      }
    </LanguageProvider>
  );
}