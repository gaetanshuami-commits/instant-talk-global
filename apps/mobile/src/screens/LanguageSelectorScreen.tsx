import React from "react";
import { ScrollView, Text, View, TouchableOpacity, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useI18n, LANGUAGES } from "../lib/I18nContext";

export default function LanguageSelectorScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { lang, setLang, t } = useI18n();

  const handleSelect = async (code: string) => {
    await setLang(code as never);
    router.back();
  };

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Text style={s.backTxt}>‹</Text>
        </TouchableOpacity>
        <Text style={s.title}>{t("settings.language")}</Text>
      </View>

      <ScrollView
        contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.grid}>
          {LANGUAGES.map((l) => {
            const active = lang === l.code;
            return (
              <TouchableOpacity
                key={l.code}
                style={[s.langBtn, active && s.langBtnActive]}
                onPress={() => handleSelect(l.code)}
                activeOpacity={0.7}
              >
                {active && <Text style={s.checkmark}>✓ </Text>}
                <View style={s.langTextGroup}>
                  <Text style={[s.langCode, active && s.langCodeActive]}>
                    {l.code.toUpperCase()}
                  </Text>
                  <Text style={[s.langLabel, active && s.langLabelActive]}>
                    {l.label}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root:           { flex: 1, backgroundColor: "#04070f" },
  header:         { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.07)" },
  backBtn:        { width: 36, height: 36, alignItems: "center", justifyContent: "center", marginRight: 8 },
  backTxt:        { color: "#818cf8", fontSize: 28, fontWeight: "300", lineHeight: 32 },
  title:          { color: "#fff", fontSize: 18, fontWeight: "800" },
  content:        { padding: 16 },
  grid:           { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  langBtn:        { borderRadius: 14, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", backgroundColor: "rgba(255,255,255,0.04)", paddingHorizontal: 14, paddingVertical: 10, flexDirection: "row", alignItems: "center", minWidth: 100 },
  langBtnActive:  { borderColor: "#635bff", backgroundColor: "rgba(99,91,255,0.15)" },
  checkmark:      { color: "#635bff", fontWeight: "900", fontSize: 13 },
  langTextGroup:  {},
  langCode:       { color: "rgba(255,255,255,0.45)", fontSize: 9, fontWeight: "800", letterSpacing: 1, textTransform: "uppercase" },
  langCodeActive: { color: "#a5b4fc" },
  langLabel:      { color: "rgba(255,255,255,0.65)", fontSize: 13, fontWeight: "600", marginTop: 1 },
  langLabelActive:{ color: "#fff" },
});
