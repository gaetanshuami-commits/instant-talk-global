import React from "react";
import { ScrollView, Text, View, StyleSheet, TouchableOpacity, Linking, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useI18n } from "../lib/I18nContext";

export default function PermissionsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useI18n();

  const openSettings = () => {
    if (Platform.OS === "ios") {
      Linking.openURL("app-settings:");
    } else {
      Linking.openSettings();
    }
  };

  const permissions = [
    {
      icon: "🎙️",
      title: t("perm.micTitle"),
      why: t("perm.micWhy"),
      required: true,
    },
    {
      icon: "📷",
      title: t("perm.camTitle"),
      why: t("perm.camWhy"),
      required: true,
    },
    {
      icon: "🔔",
      title: t("perm.notifTitle"),
      why: t("perm.notifWhy"),
      required: false,
    },
    {
      icon: "🌐",
      title: t("perm.internetTitle"),
      why: t("perm.internetWhy"),
      required: true,
    },
  ];

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Text style={s.backTxt}>‹</Text>
        </TouchableOpacity>
        <Text style={s.title}>{t("legal.permTitle")}</Text>
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={s.intro}>
          Instant Talk requests the following permissions to function correctly. All permissions are explained below.
        </Text>

        {permissions.map((p) => (
          <View key={p.title} style={s.card}>
            <View style={s.cardLeft}>
              <Text style={s.icon}>{p.icon}</Text>
            </View>
            <View style={s.cardRight}>
              <View style={s.cardTitleRow}>
                <Text style={s.permTitle}>{p.title}</Text>
                <View style={[s.badge, p.required ? s.badgeRequired : s.badgeOptional]}>
                  <Text style={[s.badgeTxt, p.required ? s.badgeTxtReq : s.badgeTxtOpt]}>
                    {p.required ? "Required" : "Optional"}
                  </Text>
                </View>
              </View>
              <Text style={s.why}>{p.why}</Text>
            </View>
          </View>
        ))}

        <View style={s.settingsBox}>
          <Text style={s.settingsText}>
            You can manage app permissions at any time in your device settings.
          </Text>
          <TouchableOpacity style={s.settingsBtn} onPress={openSettings}>
            <Text style={s.settingsBtnTxt}>Open Device Settings →</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root:          { flex: 1, backgroundColor: "#04070f" },
  header:        { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.07)" },
  backBtn:       { width: 36, height: 36, alignItems: "center", justifyContent: "center", marginRight: 8 },
  backTxt:       { color: "#818cf8", fontSize: 28, fontWeight: "300", lineHeight: 32 },
  title:         { color: "#fff", fontSize: 18, fontWeight: "800" },
  scroll:        { flex: 1 },
  content:       { padding: 20, gap: 12 },
  intro:         { color: "rgba(255,255,255,0.55)", fontSize: 14, lineHeight: 21, marginBottom: 4 },
  card:          { flexDirection: "row", backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 16, borderWidth: 1, borderColor: "rgba(255,255,255,0.07)", padding: 16, gap: 14, alignItems: "flex-start" },
  cardLeft:      {},
  cardRight:     { flex: 1 },
  cardTitleRow:  { flexDirection: "row", alignItems: "center", marginBottom: 6, gap: 8 },
  icon:          { fontSize: 28 },
  permTitle:     { color: "#fff", fontSize: 15, fontWeight: "800", flex: 1 },
  why:           { color: "rgba(255,255,255,0.6)", fontSize: 13, lineHeight: 19 },
  badge:         { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  badgeRequired: { backgroundColor: "rgba(239,68,68,0.15)" },
  badgeOptional: { backgroundColor: "rgba(99,91,255,0.15)" },
  badgeTxt:      { fontSize: 10, fontWeight: "700" },
  badgeTxtReq:   { color: "#f87171" },
  badgeTxtOpt:   { color: "#818cf8" },
  settingsBox:   { backgroundColor: "rgba(99,91,255,0.08)", borderRadius: 16, borderWidth: 1, borderColor: "rgba(99,91,255,0.2)", padding: 18, marginTop: 8, gap: 12 },
  settingsText:  { color: "rgba(255,255,255,0.6)", fontSize: 13, lineHeight: 19 },
  settingsBtn:   {},
  settingsBtnTxt:{ color: "#818cf8", fontWeight: "700", fontSize: 13 },
});
