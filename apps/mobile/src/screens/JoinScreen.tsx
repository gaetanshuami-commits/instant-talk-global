import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useI18n } from "../lib/I18nContext";

export default function JoinScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t }  = useI18n();
  const [code,  setCode]  = useState("");
  const [token, setToken] = useState("");

  const join = () => {
    // Accept full URL or plain ID
    let id = code.trim();
    const urlMatch = id.match(/\/room\/([a-zA-Z0-9-]+)/);
    if (urlMatch) id = urlMatch[1];
    id = id.replace(/[^a-zA-Z0-9-]/g, "");
    if (!id) return;
    router.push(token.trim()
      ? `/meeting/${id}?token=${token.trim()}`
      : `/meeting/${id}`);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#04070f" }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={[s.content, {
          paddingTop: Math.max(insets.top, 20) + 16,
          paddingBottom: insets.bottom + 32,
        }]}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={s.title}>{t("join.title")}</Text>
        <Text style={s.sub}>{t("join.subtitle")}</Text>

        <Text style={s.label}>{t("join.idLabel")}</Text>
        <TextInput
          style={s.input}
          value={code}
          onChangeText={setCode}
          placeholder={t("join.idPlaceholder")}
          placeholderTextColor="rgba(255,255,255,0.25)"
          autoCapitalize="none"
          autoCorrect={false}
          selectionColor="#635bff"
          onSubmitEditing={join}
          returnKeyType="go"
        />

        <Text style={[s.label, { marginTop: 16 }]}>{t("join.tokenLabel")}</Text>
        <TextInput
          style={s.input}
          value={token}
          onChangeText={setToken}
          placeholder={t("join.tokenPlaceholder")}
          placeholderTextColor="rgba(255,255,255,0.25)"
          autoCapitalize="none"
          autoCorrect={false}
          selectionColor="#635bff"
        />

        <TouchableOpacity
          style={[s.btn, !code.trim() && s.btnDisabled]}
          onPress={join}
          disabled={!code.trim()}
          activeOpacity={0.85}
        >
          <Text style={s.btnTxt}>{t("join.joinNow")}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  content:    { paddingHorizontal: 28, justifyContent: "center", flexGrow: 1 },
  title:      { color: "#fff", fontSize: 28, fontWeight: "900", marginBottom: 8 },
  sub:        { color: "rgba(255,255,255,0.4)", fontSize: 14, marginBottom: 32, lineHeight: 20 },
  label:      { color: "rgba(255,255,255,0.45)", fontSize: 10, fontWeight: "800", letterSpacing: 1, marginBottom: 7, textTransform: "uppercase" },
  input:      { backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderRadius: 14, color: "#fff", paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, height: 52 },
  btn:        { backgroundColor: "#635bff", borderRadius: 16, height: 54, alignItems: "center", justifyContent: "center", marginTop: 28 },
  btnDisabled:{ opacity: 0.4 },
  btnTxt:     { color: "#fff", fontWeight: "800", fontSize: 16 },
});
