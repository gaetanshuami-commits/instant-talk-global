import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useI18n } from "../lib/I18nContext";

type Props = {
  message?: string;
  onRetry: () => void;
  offline?: boolean;
};

export default function RetryView({ message, onRetry, offline }: Props) {
  const { t } = useI18n();
  return (
    <View style={s.root}>
      <Text style={s.icon}>{offline ? "📡" : "⚠️"}</Text>
      <Text style={s.msg}>{message ?? (offline ? t("common.noInternet") : t("common.error"))}</Text>
      {offline && <Text style={s.sub}>{t("common.offlineMsg")}</Text>}
      <TouchableOpacity style={s.btn} onPress={onRetry}>
        <Text style={s.btnTxt}>{t("common.retry")}</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  root:   { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  icon:   { fontSize: 40, marginBottom: 16 },
  msg:    { color: "rgba(255,255,255,0.7)", fontSize: 16, fontWeight: "700", textAlign: "center", marginBottom: 8 },
  sub:    { color: "rgba(255,255,255,0.4)", fontSize: 13, textAlign: "center", marginBottom: 24, lineHeight: 20 },
  btn:    { backgroundColor: "#635bff", paddingHorizontal: 28, paddingVertical: 12, borderRadius: 12 },
  btnTxt: { color: "#fff", fontWeight: "700", fontSize: 14 },
});
