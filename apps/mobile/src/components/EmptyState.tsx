import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

type Props = {
  icon?: string;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
};

export default function EmptyState({ icon = "📭", title, subtitle, actionLabel, onAction }: Props) {
  return (
    <View style={s.root}>
      <Text style={s.icon}>{icon}</Text>
      <Text style={s.title}>{title}</Text>
      {subtitle && <Text style={s.sub}>{subtitle}</Text>}
      {actionLabel && onAction && (
        <TouchableOpacity style={s.btn} onPress={onAction}>
          <Text style={s.btnTxt}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root:   { alignItems: "center", padding: 40, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.07)" },
  icon:   { fontSize: 36, marginBottom: 14 },
  title:  { color: "rgba(255,255,255,0.55)", fontSize: 15, fontWeight: "700", textAlign: "center", marginBottom: 8 },
  sub:    { color: "rgba(255,255,255,0.3)", fontSize: 13, textAlign: "center", lineHeight: 18, marginBottom: 16 },
  btn:    { backgroundColor: "rgba(99,91,255,0.2)", borderWidth: 1, borderColor: "#635bff", paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  btnTxt: { color: "#818cf8", fontWeight: "700", fontSize: 13 },
});
