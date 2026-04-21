import React, { useEffect, useState, useCallback } from "react";
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, RefreshControl, ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { fetchMeetings } from "../lib/api";
import { useI18n } from "../lib/I18nContext";
import RetryView from "../components/RetryView";
import EmptyState from "../components/EmptyState";

type Meeting = {
  id: string;
  roomId?: string;
  title: string;
  startsAt: string;
  status: string;
  invitees: { id: string; email: string }[];
};

type LoadState = "loading" | "ok" | "error" | "offline";

export default function HomeScreen() {
  const router   = useRouter();
  const insets   = useSafeAreaInsets();
  const { t }    = useI18n();

  const [meetings,   setMeetings]   = useState<Meeting[]>([]);
  const [state,      setState]      = useState<LoadState>("loading");
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!silent) setState("loading");
    try {
      const data = await fetchMeetings();
      setMeetings(Array.isArray(data.meetings) ? data.meetings : []);
      setState("ok");
    } catch (e: unknown) {
      const isOffline = e instanceof TypeError && e.message.includes("network");
      setState(isOffline ? "offline" : "error");
      setMeetings([]);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const upcoming = meetings
    .filter((m) => new Date(m.startsAt).getTime() > Date.now())
    .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())
    .slice(0, 5);

  const startInstant = () => {
    const id = Math.random().toString(36).substring(2, 12);
    router.push(`/meeting/${id}?host=1`);
  };

  return (
    <ScrollView
      style={s.root}
      contentContainerStyle={[s.content, { paddingTop: Math.max(insets.top, 16) + 8, paddingBottom: insets.bottom + 40 }]}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => { setRefreshing(true); void load(true); }}
          tintColor="#635bff"
        />
      }
    >
      {/* Header */}
      <View style={s.header}>
        <Text style={s.brand}>Instant Talk</Text>
        <Text style={s.tagline}>{t("home.tagline")}</Text>
      </View>

      {/* Quick actions */}
      <View style={s.actionRow}>
        <TouchableOpacity style={[s.btn, s.btnPrimary]} onPress={startInstant} activeOpacity={0.85}>
          <Text style={s.btnTextPrimary}>{t("home.start")}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.btn, s.btnSecondary]} onPress={() => router.push("/create-meeting")} activeOpacity={0.85}>
          <Text style={s.btnTextSecondary}>{t("home.schedule")}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.btn, s.btnSecondary]} onPress={() => router.push("/join")} activeOpacity={0.85}>
          <Text style={s.btnTextSecondary}>{t("home.join")}</Text>
        </TouchableOpacity>
      </View>

      {/* Upcoming */}
      <Text style={s.sectionTitle}>{t("home.upcoming")}</Text>

      {state === "loading" ? (
        <ActivityIndicator color="#635bff" style={{ marginTop: 24 }} />
      ) : state === "error" || state === "offline" ? (
        <View style={{ marginTop: 8 }}>
          <RetryView offline={state === "offline"} onRetry={() => void load()} />
        </View>
      ) : upcoming.length === 0 ? (
        <EmptyState
          icon="📅"
          title={t("home.noMeetings")}
          actionLabel={t("home.scheduleNow")}
          onAction={() => router.push("/create-meeting")}
        />
      ) : (
        upcoming.map((m) => {
          const dest = m.roomId ? `/meeting/${m.roomId}` : `/meeting/${m.id}`;
          return (
            <TouchableOpacity
              key={m.id}
              style={s.meetingCard}
              onPress={() => router.push(dest)}
              activeOpacity={0.8}
            >
              <View style={s.meetingLeft}>
                <Text style={s.meetingTitle} numberOfLines={1}>{m.title}</Text>
                <Text style={s.meetingTime}>
                  {new Date(m.startsAt).toLocaleString(undefined, {
                    weekday: "short", month: "short", day: "numeric",
                    hour: "2-digit", minute: "2-digit",
                  })}
                </Text>
                <Text style={s.meetingInvitees}>
                  {m.invitees.length} {t("home.participants")}{m.invitees.length !== 1 ? "s" : ""}
                </Text>
              </View>
              <View style={s.joinBadge}>
                <Text style={s.joinText}>{t("meetings.joinBtn")}</Text>
              </View>
            </TouchableOpacity>
          );
        })
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root:            { flex: 1, backgroundColor: "#04070f" },
  content:         { paddingHorizontal: 20 },
  header:          { marginBottom: 28 },
  brand:           { color: "#fff", fontSize: 28, fontWeight: "900", letterSpacing: -0.5 },
  tagline:         { color: "rgba(255,255,255,0.4)", fontSize: 13, marginTop: 4 },
  actionRow:       { flexDirection: "row", gap: 10, marginBottom: 32 },
  btn:             { flex: 1, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  btnPrimary:      { backgroundColor: "#635bff" },
  btnSecondary:    { backgroundColor: "rgba(255,255,255,0.07)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" },
  btnTextPrimary:  { color: "#fff", fontWeight: "700", fontSize: 13.5 },
  btnTextSecondary:{ color: "rgba(255,255,255,0.7)", fontWeight: "600", fontSize: 13 },
  sectionTitle:    { color: "#fff", fontSize: 17, fontWeight: "800", marginBottom: 14 },
  meetingCard:     { flexDirection: "row", alignItems: "center", padding: 16, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.07)", marginBottom: 10 },
  meetingLeft:     { flex: 1 },
  meetingTitle:    { color: "#fff", fontSize: 14, fontWeight: "700", marginBottom: 4 },
  meetingTime:     { color: "rgba(255,255,255,0.5)", fontSize: 12, marginBottom: 2 },
  meetingInvitees: { color: "rgba(255,255,255,0.35)", fontSize: 11 },
  joinBadge:       { backgroundColor: "#635bff", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999 },
  joinText:        { color: "#fff", fontWeight: "700", fontSize: 12 },
});
