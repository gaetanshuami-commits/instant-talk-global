import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "react-native";
import { I18nProvider } from "@/lib/I18nContext";

const MODAL_OPTS = { presentation: "modal" as const };
const FULL_OPTS  = { presentation: "fullScreenModal" as const, animation: "fade" as const };

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <I18nProvider>
          <StatusBar barStyle="light-content" backgroundColor="#04070f" />
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#04070f" } }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="meeting/[id]"      options={FULL_OPTS} />
            <Stack.Screen name="join"              options={MODAL_OPTS} />
            <Stack.Screen name="create-meeting"    options={MODAL_OPTS} />
            <Stack.Screen name="language-selector" options={MODAL_OPTS} />
            <Stack.Screen name="privacy-policy"    options={MODAL_OPTS} />
            <Stack.Screen name="terms"             options={MODAL_OPTS} />
            <Stack.Screen name="data-usage"        options={MODAL_OPTS} />
            <Stack.Screen name="permissions"       options={MODAL_OPTS} />
          </Stack>
        </I18nProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
