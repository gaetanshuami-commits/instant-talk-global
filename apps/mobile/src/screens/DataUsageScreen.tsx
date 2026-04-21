import React from "react";
import { ScrollView, Text, View, StyleSheet, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

type DataItem = {
  category: string;
  icon: string;
  collected: string;
  purpose: string;
  shared: string;
  optional: boolean;
};

const DATA_ITEMS: DataItem[] = [
  {
    category: "Account",
    icon: "👤",
    collected: "Email address, customer reference ID",
    purpose: "Account management, authentication, billing",
    shared: "Stripe (billing only)",
    optional: false,
  },
  {
    category: "Voice / Audio",
    icon: "🎙️",
    collected: "Real-time audio stream during meetings",
    purpose: "Speech recognition, live translation, voice cloning (session only)",
    shared: "Azure Speech (STT), ElevenLabs (TTS) — ephemeral, not stored",
    optional: false,
  },
  {
    category: "Meeting Data",
    icon: "📅",
    collected: "Meeting title, time, duration, participant emails",
    purpose: "Scheduling, reminders, meeting history",
    shared: "Not shared with third parties",
    optional: false,
  },
  {
    category: "Usage Data",
    icon: "📊",
    collected: "Features used, session duration, language preference",
    purpose: "Service improvement, usage billing, support",
    shared: "Not shared with third parties",
    optional: false,
  },
  {
    category: "Device Info",
    icon: "📱",
    collected: "Device model, OS version, app version",
    purpose: "Bug reporting, compatibility",
    shared: "Not shared with third parties",
    optional: false,
  },
  {
    category: "Push Notifications",
    icon: "🔔",
    collected: "Push notification token",
    purpose: "Meeting reminders and alerts",
    shared: "Not shared with third parties",
    optional: true,
  },
];

export default function DataUsageScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Text style={s.backTxt}>‹</Text>
        </TouchableOpacity>
        <Text style={s.title}>Data Usage</Text>
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={s.intro}>
          Instant Talk collects only the data necessary to deliver its service. Below is a complete breakdown of what is collected, why, and who it is shared with.
        </Text>

        {DATA_ITEMS.map((item) => (
          <View key={item.category} style={s.card}>
            <View style={s.cardHeader}>
              <Text style={s.cardIcon}>{item.icon}</Text>
              <Text style={s.cardCategory}>{item.category}</Text>
              {item.optional && (
                <View style={s.optionalBadge}>
                  <Text style={s.optionalTxt}>Optional</Text>
                </View>
              )}
            </View>
            <Row label="Collected" value={item.collected} />
            <Row label="Purpose" value={item.purpose} />
            <Row label="Shared with" value={item.shared} />
          </View>
        ))}

        <Text style={s.footer}>
          You may request deletion of your data at any time by contacting privacy@instant-talk.com.
          Data is stored on Supabase (EU-West region) and processed under GDPR-compliant data processing agreements.
        </Text>
      </ScrollView>
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.row}>
      <Text style={s.rowLabel}>{label}</Text>
      <Text style={s.rowValue}>{value}</Text>
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
  content:       { padding: 20, gap: 14 },
  intro:         { color: "rgba(255,255,255,0.55)", fontSize: 14, lineHeight: 21, marginBottom: 8 },
  card:          { backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 16, borderWidth: 1, borderColor: "rgba(255,255,255,0.07)", padding: 16, gap: 10 },
  cardHeader:    { flexDirection: "row", alignItems: "center", marginBottom: 4 },
  cardIcon:      { fontSize: 20, marginRight: 10 },
  cardCategory:  { color: "#fff", fontSize: 15, fontWeight: "800", flex: 1 },
  optionalBadge: { backgroundColor: "rgba(99,91,255,0.2)", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  optionalTxt:   { color: "#818cf8", fontSize: 10, fontWeight: "700" },
  row:           { gap: 2 },
  rowLabel:      { color: "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: "700", letterSpacing: 0.5, textTransform: "uppercase" },
  rowValue:      { color: "rgba(255,255,255,0.75)", fontSize: 13, lineHeight: 19 },
  footer:        { color: "rgba(255,255,255,0.35)", fontSize: 12, lineHeight: 18, marginTop: 8 },
});
