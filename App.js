import React, { useState, useEffect, useCallback } from "react";
import { NavigationContainer } from "@react-navigation/native";
import * as SplashScreen from "expo-splash-screen";
import AnimatedSplash from "./src/modules/animation/AnimatedSplash";
import StackNavigator from "./src/navigation/StackNavigator";
import { AuthProvider } from "./src/AuthContext";

// Prevenir que el splash nativo se oculte automáticamente
SplashScreen.preventAutoHideAsync();

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Aquí puedes cargar recursos, fuentes, datos, etc.
        // Por ahora solo esperamos un momento
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (e) {
        console.warn(e);
      } finally {
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) {
      // Ocultar el splash nativo cuando la app esté lista
      await SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  if (!appIsReady) {
    return null;
  }

  if (showSplash) {
    return (
      <AnimatedSplash
        onFinish={() => setShowSplash(false)}
        onLayout={onLayoutRootView}
      />
    );
  }

  return (
    <AuthProvider>
      <NavigationContainer>
        <StackNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}
