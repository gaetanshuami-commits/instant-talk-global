import React, { useRef, useState, useCallback } from "react";
import {
  View, StyleSheet, TouchableOpacity, Text,
  StatusBar, ActivityIndicator, Alert, Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WebView, WebViewNavigation } from "react-native-webview";
import { useLocalSearchParams, useRouter } from "expo-router";
import Constants from "expo-constants";
import { useI18n } from "../lib/I18nContext";

const BASE_URL: string =
  (Constants.expoConfig?.extra as { apiUrl?: string } | undefined)?.apiUrl ??
  "https://instant-talk.com";

export default function MeetingRoomScreen() {
  const { id, host, token } = useLocalSearchParams<{ id: string; host?: string; token?: string }>();
  const router  = useRouter();
  const insets  = useSafeAreaInsets();
  const { t }   = useI18n();
  const webRef  = useRef<WebView>(null);
  const [loading,  setLoading]  = useState(true);
  const [webError, setWebError] = useState(false);

  const roomUrl = token
    ? `${BASE_URL}/join/${id}?t=${token}`
    : `${BASE_URL}/room/${id}${host ? "?host=1" : ""}`;

  const injectedJS = `
    (function() {
      document.body.classList.add('capacitor', 'mobile-app');
      // Pass safe area insets to web UI
      document.documentElement.style.setProperty('--sat', '${insets.top}px');
      document.documentElement.style.setProperty('--sab', '${insets.bottom}px');
      true;
    })();
  `;

  const onNavChange = useCallback((nav: WebViewNavigation) => {
    if (nav.url && !nav.url.includes("/room/") && !nav.url.includes("/join/") && nav.url !== "about:blank") {
      router.back();
    }
  }, [router]);

  const handleLeave = () => {
    Alert.alert(t("room.leaveTitle"), t("room.leaveMsg"), [
      { text: t("room.stay"),  style: "cancel" },
      { text: t("room.leave"), style: "destructive", onPress: () => router.back() },
    ]);
  };

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor="#000" hidden={!webError} />

      {/* Leave button */}
      <TouchableOpacity
        style={[s.leaveBtn, { top: Math.max(insets.top + 8, 52) }]}
        onPress={handleLeave}
        activeOpacity={0.85}
      >
        <Text style={s.leaveTxt}>✕</Text>
      </TouchableOpacity>

      {/* Loading overlay */}
      {loading && !webError && (
        <View style={s.loader}>
          <ActivityIndicator size="large" color="#635bff" />
          <Text style={s.loaderTxt}>{t("room.connecting")}</Text>
        </View>
      )}

      {/* Error state */}
      {webError && (
        <View style={s.errorView}>
          <Text style={s.errorIcon}>📡</Text>
          <Text style={s.errorMsg}>{t("common.noInternet")}</Text>
          <TouchableOpacity style={s.retryBtn} onPress={() => { setWebError(false); setLoading(true); webRef.current?.reload(); }}>
            <Text style={s.retryTxt}>{t("common.retry")}</Text>
          </TouchableOpacity>
        </View>
      )}

      {!webError && (
        <WebView
          ref={webRef}
          source={{ uri: roomUrl }}
          style={s.webview}
          injectedJavaScript={injectedJS}
          onLoad={() => setLoading(false)}
          onError={() => { setLoading(false); setWebError(true); }}
          onNavigationStateChange={onNavChange}
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction={false}
          allowsFullscreenVideo
          javaScriptEnabled
          domStorageEnabled
          originWhitelist={["*"]}
          {...(Platform.OS === "ios" ? { allowsBackForwardNavigationGestures: false } : {})}
          onShouldStartLoadWithRequest={(req) =>
            req.url.startsWith(BASE_URL) || req.url.startsWith("blob:") || req.url.startsWith("data:")
          }
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root:      { flex: 1, backgroundColor: "#000" },
  webview:   { flex: 1 },
  leaveBtn:  {
    position: "absolute", right: 16, zIndex: 999,
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: "rgba(239,68,68,0.9)",
    alignItems: "center", justifyContent: "center",
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.4, shadowRadius: 4,
    elevation: 8,
  },
  leaveTxt:  { color: "#fff", fontWeight: "900", fontSize: 14 },
  loader:    {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#04070f",
    alignItems: "center", justifyContent: "center", zIndex: 100,
  },
  loaderTxt: { color: "rgba(255,255,255,0.5)", marginTop: 14, fontSize: 14 },
  errorView: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#04070f",
    alignItems: "center", justifyContent: "center", zIndex: 100, padding: 32,
  },
  errorIcon: { fontSize: 48, marginBottom: 16 },
  errorMsg:  { color: "rgba(255,255,255,0.7)", fontSize: 16, fontWeight: "700", textAlign: "center", marginBottom: 24 },
  retryBtn:  { backgroundColor: "#635bff", paddingHorizontal: 28, paddingVertical: 12, borderRadius: 12 },
  retryTxt:  { color: "#fff", fontWeight: "700", fontSize: 14 },
});
