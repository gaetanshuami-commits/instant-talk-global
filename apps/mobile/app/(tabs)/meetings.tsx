import React, { useEffect, useState, useCallback } from "react";
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, RefreshControl, ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { fetchMeetings } from "@/lib/api";
import { useI18n } from "@/lib/I18nContext";
import RetryView from "@/components/RetryView";
import EmptyState from "@/components/EmptyState";

type Meeting = {
  id: string;
  title: string;
  startsAt: string;
  endsAt: string;
  status: string;
  invitees: { id: string; email: string }[];
};

type LoadState = "loading" | "ok" | "error" | "offline";

export default function MeetingsScreen() {
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

  const past     = meetings.filter((m) => new Date(m.endsAt).getTime() < Date.now());
  const upcoming = meetings.filter((m) => new Date(m.startsAt).getTime() >= Date.now());

  const renderCard = (m: Meeting, isPast: boolean) => (
    <TouchableOpacity
      key={m.id}
      style={[s.card, isPast && s.cardPast]}
      onPress={() => !isPast && router.push(`/meeting/${m.id}`)}
      activeOpacity={isPast ? 1 : 0.75}
    >
      <View style={s.cardLeft}>
        <Text style={s.cardTitle} numberOfLines={1}>{m.title}</Text>
        <Text style={s.cardTime}>
          {new Date(m.startsAt).toLocaleString(undefined, {
            weekday: "short", month: "short", day: "numeric",
            hour: "2-digit", minute: "2-digit",
          })}
        </Text>
        <Text style={s.cardInvitees}>
          {m.invitees.length} {t("home.participants")}{m.invitees.length !== 1 ? "s" : ""}
        </Text>
      </View>
      {isPast
        ? <View style={s.pastBadge}><Text style={s.pastText}>{t("meetings.done")}</Text></View>
        : <View style={s.joinBadge}><Text style={s.joinText}>{t("meetings.joinBtn")}</Text></View>
      }
    </TouchableOpacity>
  );

  return (
    <ScrollView
      style={s.root}
      contentContainerStyle={[s.content, {
        paddingTop: Math.max(insets.top, 16) + 8,
        paddingBottom: insets.bottom + 48,
      }]}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => { setRefreshing(true); void load(true); }}
          tintColor="#635bff"
        />
      }
    >
      <Text style={s.title}>{t("meetings.title")}</Text>

      {state === "loading" ? (
        <ActivityIndicator color="#635bff" style={{ marginTop: 32 }} />
      ) : state === "error" || state === "offline" ? (
        <RetryView offline={state === "offline"} onRetry={() => void load()} />
      ) : meetings.length === 0 ? (
        <EmptyState
          icon="📅"
          title={t("meetings.noMeetings")}
          actionLabel={t("meetings.scheduleNow")}
          onAction={() => router.push("/create-meeting")}
        />
      ) : (
        <>
          {upcoming.length > 0 && (
            <>
              <Text style={s.sectionLabel}>{t("meetings.upcoming")}</Text>
              {upcoming
                .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())
                .map((m) => renderCard(m, false))}
            </>
          )}
          {past.length > 0 && (
            <>
              <Text style={[s.sectionLabel, { marginTop: 24 }]}>{t("meetings.past")}</Text>
              {past
                .sort((a, b) => new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime())
                .slice(0, 10)
                .map((m) => renderCard(m, true))}
            </>
          )}
        </>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root:         { flex: 1, backgroundColor: "#04070f" },
  content:      { paddingHorizontal: 20 },
  title:        { color: "#fff", fontSize: 26, fontWeight: "900", marginBottom: 20 },
  sectionLabel: { color: "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: "700", letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 },
  card:         { flexDirection: "row", alignItems: "center", padding: 16, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.07)", marginBottom: 10 },
  cardPast:     { opacity: 0.5 },
  cardLeft:     { flex: 1 },
  cardTitle:    { color: "#fff", fontSize: 14, fontWeight: "700", marginBottom: 4 },
  cardTime:     { color: "rgba(255,255,255,0.5)", fontSize: 12, marginBottom: 2 },
  cardInvitees: { color: "rgba(255,255,255,0.35)", fontSize: 11 },
  joinBadge:    { backgroundColor: "#635bff", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999 },
  joinText:     { color: "#fff", fontWeight: "700", fontSize: 12 },
  pastBadge:    { backgroundColor: "rgba(255,255,255,0.07)", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999 },
  pastText:     { color: "rgba(255,255,255,0.35)", fontWeight: "700", fontSize: 12 },
});
