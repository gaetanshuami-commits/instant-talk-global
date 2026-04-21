import React, { useEffect, useState, useCallback } from "react";
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, RefreshControl, ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { fetchContacts } from "@/lib/api";
import { useI18n } from "@/lib/I18nContext";
import RetryView from "@/components/RetryView";
import EmptyState from "@/components/EmptyState";

type Contact = {
  id: string;
  email: string;
  name?: string;
  preferredLang?: string;
};

type LoadState = "loading" | "ok" | "error" | "offline";

const ACCENT_COLORS = ["#635bff", "#7c3aed", "#0891b2", "#059669", "#d97706", "#db2777"];

function initials(c: Contact): string {
  if (c.name) {
    const parts = c.name.trim().split(" ");
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : parts[0].slice(0, 2).toUpperCase();
  }
  return c.email.slice(0, 2).toUpperCase();
}

function colorFor(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return ACCENT_COLORS[h % ACCENT_COLORS.length];
}

export default function ContactsScreen() {
  const router   = useRouter();
  const insets   = useSafeAreaInsets();
  const { t }    = useI18n();

  const [contacts,   setContacts]   = useState<Contact[]>([]);
  const [query,      setQuery]      = useState("");
  const [state,      setState]      = useState<LoadState>("loading");
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!silent) setState("loading");
    try {
      const data = await fetchContacts();
      setContacts(Array.isArray(data.contacts) ? data.contacts : []);
      setState("ok");
    } catch (e: unknown) {
      const isOffline = e instanceof TypeError && e.message.includes("network");
      setState(isOffline ? "offline" : "error");
      setContacts([]);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const filtered = contacts.filter((c) => {
    const q = query.toLowerCase();
    return c.email.toLowerCase().includes(q) || (c.name ?? "").toLowerCase().includes(q);
  });

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
      keyboardShouldPersistTaps="handled"
    >
      <Text style={s.title}>{t("contacts.title")}</Text>

      <TextInput
        style={s.search}
        value={query}
        onChangeText={setQuery}
        placeholder={t("contacts.searchPlaceholder")}
        placeholderTextColor="rgba(255,255,255,0.25)"
        autoCapitalize="none"
        autoCorrect={false}
        selectionColor="#635bff"
      />

      {state === "loading" ? (
        <ActivityIndicator color="#635bff" style={{ marginTop: 32 }} />
      ) : state === "error" || state === "offline" ? (
        <RetryView offline={state === "offline"} onRetry={() => void load()} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="👥"
          title={query ? t("contacts.noResults") : t("contacts.noContacts")}
          subtitle={!query ? t("contacts.hint") : undefined}
        />
      ) : (
        filtered.map((c) => (
          <TouchableOpacity
            key={c.id}
            style={s.card}
            onPress={() => router.push(`/meeting/${Math.random().toString(36).substring(2, 12)}?host=1`)}
            activeOpacity={0.8}
          >
            <View style={[s.avatar, { backgroundColor: colorFor(c.id) }]}>
              <Text style={s.avatarText}>{initials(c)}</Text>
            </View>
            <View style={s.info}>
              {c.name && <Text style={s.name}>{c.name}</Text>}
              <Text style={s.email}>{c.email}</Text>
              {c.preferredLang && (
                <Text style={s.lang}>{c.preferredLang.toUpperCase()}</Text>
              )}
            </View>
            <Text style={s.callIcon}>📞</Text>
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root:       { flex: 1, backgroundColor: "#04070f" },
  content:    { paddingHorizontal: 20 },
  title:      { color: "#fff", fontSize: 26, fontWeight: "900", marginBottom: 16 },
  search:     { backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderRadius: 14, color: "#fff", paddingHorizontal: 16, paddingVertical: 13, fontSize: 15, marginBottom: 20 },
  card:       { flexDirection: "row", alignItems: "center", padding: 14, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.07)", marginBottom: 8 },
  avatar:     { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", marginRight: 14 },
  avatarText: { color: "#fff", fontWeight: "800", fontSize: 15 },
  info:       { flex: 1 },
  name:       { color: "#fff", fontSize: 14, fontWeight: "700", marginBottom: 2 },
  email:      { color: "rgba(255,255,255,0.5)", fontSize: 12 },
  lang:       { color: "#818cf8", fontSize: 10, fontWeight: "700", marginTop: 3, letterSpacing: 0.8 },
  callIcon:   { fontSize: 20 },
});
