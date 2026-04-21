import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { createMeeting } from "../lib/api";
import { useI18n } from "../lib/I18nContext";

export default function CreateMeetingScreen() {
  const router  = useRouter();
  const insets  = useSafeAreaInsets();
  const { t }   = useI18n();

  const [title,    setTitle]    = useState("");
  const [date,     setDate]     = useState("");
  const [time,     setTime]     = useState("");
  const [duration, setDuration] = useState("60");
  const [emails,   setEmails]   = useState("");
  const [loading,  setLoading]  = useState(false);

  const todayStr = new Date().toISOString().split("T")[0];

  async function handleCreate() {
    if (!title.trim()) { Alert.alert(t("create.titleRequired")); return; }
    setLoading(true);
    try {
      const startsAt = new Date(`${date || todayStr}T${time || "09:00"}:00`);
      const endsAt   = new Date(startsAt.getTime() + Number(duration) * 60_000);
      const inviteeEmails = emails.split(",").map((e) => e.trim()).filter(Boolean);

      await createMeeting({
        title: title.trim(),
        startsAt: startsAt.toISOString(),
        endsAt:   endsAt.toISOString(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        inviteeEmails,
      });

      Alert.alert(t("create.success"), t("create.successMsg"), [
        { text: t("common.ok"), onPress: () => router.back() },
      ]);
    } catch {
      Alert.alert(t("common.error"), t("common.offlineMsg"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#04070f" }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={[s.content, {
          paddingTop: Math.max(insets.top, 20) + 8,
          paddingBottom: insets.bottom + 48,
        }]}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={s.title}>{t("create.title")}</Text>

        <Field label={t("create.titleLabel")}        value={title}    onChangeText={setTitle} placeholder="Board meeting, Product review…" />
        <Field label={t("create.dateLabel")}         value={date}     onChangeText={setDate}  placeholder={todayStr} keyboardType="numbers-and-punctuation" />
        <Field label={t("create.timeLabel")}         value={time}     onChangeText={setTime}  placeholder="14:00"   keyboardType="numbers-and-punctuation" />
        <Field label={t("create.durationLabel")}     value={duration} onChangeText={setDuration} placeholder="60"  keyboardType="number-pad" />
        <Field label={t("create.emailsLabel")}       value={emails}   onChangeText={setEmails} placeholder="alice@co.com, bob@org.com" autoCapitalize="none" keyboardType="email-address" multiline />

        <TouchableOpacity
          style={[s.btn, loading && s.btnDisabled]}
          onPress={handleCreate}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={s.btnTxt}>{t("create.createBtn")}</Text>
          }
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({ label, ...props }: { label: string } & React.ComponentProps<typeof TextInput>) {
  return (
    <View style={s.field}>
      <Text style={s.label}>{label}</Text>
      <TextInput
        style={[s.input, props.multiline && s.inputMulti]}
        placeholderTextColor="rgba(255,255,255,0.25)"
        selectionColor="#635bff"
        {...props}
      />
    </View>
  );
}

const s = StyleSheet.create({
  content:    { paddingHorizontal: 24 },
  title:      { color: "#fff", fontSize: 26, fontWeight: "900", marginBottom: 28 },
  field:      { marginBottom: 20 },
  label:      { color: "rgba(255,255,255,0.5)", fontSize: 11, fontWeight: "700", letterSpacing: 0.8, marginBottom: 6, textTransform: "uppercase" },
  input:      { backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderRadius: 14, color: "#fff", paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, minHeight: 48 },
  inputMulti: { minHeight: 72, textAlignVertical: "top" },
  btn:        { backgroundColor: "#635bff", borderRadius: 16, height: 52, alignItems: "center", justifyContent: "center", marginTop: 12 },
  btnDisabled:{ opacity: 0.6 },
  btnTxt:     { color: "#fff", fontWeight: "800", fontSize: 15 },
});
