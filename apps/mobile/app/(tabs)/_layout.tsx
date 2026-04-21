import { Tabs } from "expo-router";
import { Text } from "react-native";
import { useI18n } from "@/lib/I18nContext";

function Icon({ label, focused }: { label: string; focused: boolean }) {
  return <Text style={{ fontSize: 19, opacity: focused ? 1 : 0.4 }}>{label}</Text>;
}

export default function TabsLayout() {
  const { t } = useI18n();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#07101e",
          borderTopColor: "rgba(255,255,255,0.07)",
          borderTopWidth: 1,
          height: 80,
          paddingBottom: 20,
          paddingTop: 10,
        },
        tabBarActiveTintColor: "#635bff",
        tabBarInactiveTintColor: "rgba(255,255,255,0.4)",
        tabBarLabelStyle: { fontSize: 11, fontWeight: "700" },
      }}
    >
      <Tabs.Screen name="index"    options={{ title: t("tabs.home"),     tabBarIcon: ({ focused }) => <Icon label="🏠" focused={focused} /> }} />
      <Tabs.Screen name="meetings" options={{ title: t("tabs.meetings"), tabBarIcon: ({ focused }) => <Icon label="📅" focused={focused} /> }} />
      <Tabs.Screen name="contacts" options={{ title: t("tabs.contacts"), tabBarIcon: ({ focused }) => <Icon label="👥" focused={focused} /> }} />
      <Tabs.Screen name="settings" options={{ title: t("tabs.settings"), tabBarIcon: ({ focused }) => <Icon label="⚙️" focused={focused} /> }} />
    </Tabs>
  );
}
