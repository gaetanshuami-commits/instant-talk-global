import React, { useEffect, useState } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Switch,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as SecureStore from "expo-secure-store";
import { useRouter } from "expo-router";
import { getCustomerRef } from "../lib/api";
import { useI18n, LANGUAGES } from "../lib/I18nContext";

const NOTIF_KEY = "itg_notifications";
const DARK_KEY  = "itg_dark";

export default function SettingsScreen() {
  const { t, lang } = useI18n();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [darkMode,    setDarkModeState]  = useState(true);
  const [notifications, setNotifsState] = useState(true);
  const [customerRef, setCustomerRef]   = useState("");

  useEffect(() => {
    getCustomerRef().then(setCustomerRef);
    SecureStore.getItemAsync(NOTIF_KEY).then((v) => v !== null && setNotifsState(v === "1"));
    SecureStore.getItemAsync(DARK_KEY).then((v) => v !== null && setDarkModeState(v !== "0"));
  }, []);

  const toggleDark = async (v: boolean) => {
    setDarkModeState(v);
    await SecureStore.setItemAsync(DARK_KEY, v ? "1" : "0");
  };

  const toggleNotifs = async (v: boolean) => {
    setNotifsState(v);
    await SecureStore.setItemAsync(NOTIF_KEY, v ? "1" : "0");
  };

  const currentLang = LANGUAGES.find((l) => l.code === lang);

  return (
    <ScrollView
      style={s.root}
      contentContainerStyle={{ paddingBottom: insets.bottom + 48 }}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[s.title, { paddingTop: Math.max(insets.top, 16) + 8 }]}>
        {t("settings.title")}
      </Text>

      {/* Language */}
      <Section title={t("settings.language")}>
        <TouchableOpacity style={s.langRow} onPress={() => router.push("/language-selector")}>
          <View>
            <Text style={s.langCurrent}>{currentLang?.label ?? lang.toUpperCase()}</Text>
            <Text style={s.langCode}>{lang.toUpperCase()}</Text>
          </View>
          <Text style={s.chevron}>›</Text>
        </TouchableOpacity>
      </Section>

      {/* Preferences */}
      <Section title={t("settings.preferences")}>
        <Row label={t("settings.darkMode")} value={darkMode} onToggle={toggleDark} />
        <Row label={t("settings.notifications")} value={notifications} onToggle={toggleNotifs} />
      </Section>

      {/* Account */}
      <Section title={t("settings.account")}>
        <View style={s.infoRow}>
          <Text style={s.infoLabel}>{t("settings.customerId")}</Text>
          <Text style={s.infoVal} numberOfLines={1}>{customerRef || "—"}</Text>
        </View>
      </Section>

      {/* Legal */}
      <Section title={t("settings.legal")}>
        <LinkRow label={t("settings.privacy")}     onPress={() => router.push("/privacy-policy")} />
        <LinkRow label={t("settings.terms")}       onPress={() => router.push("/terms")} />
        <LinkRow label={t("settings.dataUsage")}   onPress={() => router.push("/data-usage")} />
        <LinkRow label={t("settings.permissions")} onPress={() => router.push("/permissions")} />
        <LinkRow label={t("settings.contact")}     onPress={() => router.push("/privacy-policy")} last />
      </Section>

      <Text style={s.version}>{t("settings.version")} · v1.0.0</Text>
    </ScrollView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={s.section}>
      <Text style={s.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Row({ label, value, onToggle }: { label: string; value: boolean; onToggle: (v: boolean) => void }) {
  return (
    <View style={s.row}>
      <Text style={s.rowLabel}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ true: "#635bff", false: "rgba(255,255,255,0.1)" }}
        thumbColor="#fff"
      />
    </View>
  );
}

function LinkRow({ label, onPress, last }: { label: string; onPress: () => void; last?: boolean }) {
  return (
    <TouchableOpacity
      style={[s.link, last && s.linkLast]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={s.linkTxt}>{label}</Text>
      <Text style={s.chevronSmall}>›</Text>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  root:          { flex: 1, backgroundColor: "#04070f" },
  title:         { color: "#fff", fontSize: 26, fontWeight: "900", paddingHorizontal: 24, paddingBottom: 8 },
  section:       { margin: 16, marginTop: 8 },
  sectionTitle:  { color: "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: "700", letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 },
  langRow:       { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, borderWidth: 1, borderColor: "rgba(255,255,255,0.07)" },
  langCurrent:   { color: "#fff", fontSize: 15, fontWeight: "700" },
  langCode:      { color: "rgba(255,255,255,0.4)", fontSize: 10, fontWeight: "700", letterSpacing: 1, marginTop: 2 },
  chevron:       { color: "rgba(255,255,255,0.3)", fontSize: 22, fontWeight: "300" },
  row:           { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, marginBottom: 8, borderWidth: 1, borderColor: "rgba(255,255,255,0.07)" },
  rowLabel:      { color: "#fff", fontSize: 14, fontWeight: "600" },
  infoRow:       { backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, borderWidth: 1, borderColor: "rgba(255,255,255,0.07)" },
  infoLabel:     { color: "rgba(255,255,255,0.45)", fontSize: 11, marginBottom: 4 },
  infoVal:       { color: "rgba(255,255,255,0.7)", fontSize: 12, fontFamily: "monospace" },
  link:          { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.05)" },
  linkLast:      { borderBottomWidth: 0 },
  linkTxt:       { color: "#818cf8", fontSize: 14, fontWeight: "600" },
  chevronSmall:  { color: "rgba(255,255,255,0.25)", fontSize: 18 },
  version:       { color: "rgba(255,255,255,0.25)", fontSize: 12, textAlign: "center", marginTop: 24 },
});
