import React from "react";
import { ScrollView, Text, View, StyleSheet, TouchableOpacity, Linking } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

type Section = { heading?: string; body: string };

type Props = {
  title: string;
  effectiveDate: string;
  sections: Section[];
  contactEmail?: string;
};

export default function LegalScreen({ title, effectiveDate, sections, contactEmail }: Props) {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Text style={s.backTxt}>‹</Text>
        </TouchableOpacity>
        <Text style={s.title}>{title}</Text>
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={s.effectiveDate}>Effective: {effectiveDate}</Text>

        {sections.map((sec, i) => (
          <View key={i} style={s.section}>
            {sec.heading && <Text style={s.heading}>{sec.heading}</Text>}
            <Text style={s.body}>{sec.body}</Text>
          </View>
        ))}

        {contactEmail && (
          <TouchableOpacity onPress={() => Linking.openURL(`mailto:${contactEmail}`)}>
            <Text style={s.contactLink}>{contactEmail}</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root:          { flex: 1, backgroundColor: "#04070f" },
  header:        { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.07)" },
  backBtn:       { width: 36, height: 36, alignItems: "center", justifyContent: "center", marginRight: 8 },
  backTxt:       { color: "#818cf8", fontSize: 28, fontWeight: "300", lineHeight: 32 },
  title:         { color: "#fff", fontSize: 18, fontWeight: "800", flex: 1 },
  scroll:        { flex: 1 },
  content:       { padding: 20 },
  effectiveDate: { color: "rgba(255,255,255,0.35)", fontSize: 12, marginBottom: 24, fontStyle: "italic" },
  section:       { marginBottom: 22 },
  heading:       { color: "#a5b4fc", fontSize: 14, fontWeight: "800", letterSpacing: 0.3, marginBottom: 8, textTransform: "uppercase" },
  body:          { color: "rgba(255,255,255,0.7)", fontSize: 14, lineHeight: 22 },
  contactLink:   { color: "#635bff", fontSize: 14, fontWeight: "600", marginTop: 16 },
});
