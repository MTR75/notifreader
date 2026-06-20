import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  Alert,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import AppRow from "@/components/AppRow";
import { AppEntry, useNotifications } from "@/context/NotificationContext";
import { useColors } from "@/hooks/useColors";

export default function AppsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { apps, toggleApp, addApp, removeApp } = useNotifications();

  const [showAdd, setShowAdd] = useState(false);
  const [pkgName, setPkgName] = useState("");
  const [displayName, setDisplayName] = useState("");

  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;

  const DEXCOM_PKGS = [
    "com.dexcom.g6", "com.dexcom.g7", "com.dexcom.cgm", "com.dexcom.share2",
  ];
  const OTHER_COMMON_PKGS = [
    "com.whatsapp", "org.telegram.messenger", "com.google.android.gm",
    "com.instagram.android", "com.facebook.katana", "com.twitter.android",
    "com.snapchat.android", "com.discord", "com.spotify.music",
    "com.google.android.apps.messaging", "com.samsung.android.messaging",
    "com.microsoft.teams", "com.slack", "com.viber.voip", "com.skype.raider",
    "com.linkedin.android", "com.reddit.frontpage", "com.google.android.youtube",
  ];

  const dexcomApps = apps.filter((a) => DEXCOM_PKGS.includes(a.packageName));
  const commonApps = apps.filter((a) => OTHER_COMMON_PKGS.includes(a.packageName));
  const customApps = apps.filter(
    (a) => !DEXCOM_PKGS.includes(a.packageName) && !OTHER_COMMON_PKGS.includes(a.packageName)
  );

  const enabledCount = apps.filter((a) => a.enabled).length;

  function handleAdd() {
    const pkg = pkgName.trim().toLowerCase();
    const name = displayName.trim();
    if (!pkg) {
      Alert.alert("Package name required", "Enter the app's package name (e.g. com.example.app)");
      return;
    }
    if (!name) {
      Alert.alert("Display name required", "Enter a friendly name for this app.");
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    addApp(pkg, name);
    setPkgName("");
    setDisplayName("");
    setShowAdd(false);
  }

  type Section = { title: string; data: AppEntry[]; isCustom?: boolean; isDexcom?: boolean };

  const sections: Section[] = [
    { title: "Dexcom CGM", data: dexcomApps, isDexcom: true },
    { title: "Popular Apps", data: commonApps },
    ...(customApps.length > 0 ? [{ title: "Custom Apps", data: customApps, isCustom: true }] : []),
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 14, borderBottomColor: colors.border }]}>
        <View>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Apps</Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
            {enabledCount === 0 ? "All notifications" : `${enabledCount} app${enabledCount !== 1 ? "s" : ""} selected`}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => { setShowAdd((v) => !v); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
          activeOpacity={0.8}
        >
          <Feather name={showAdd ? "x" : "plus"} size={18} color={colors.primaryForeground} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={[]}
        renderItem={null}
        keyExtractor={() => ""}
        ListHeaderComponent={
          <View style={{ paddingBottom: insets.bottom + (Platform.OS === "web" ? 84 : 80) }}>
            {showAdd && (
              <View style={[styles.addCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.addCardTitle, { color: colors.foreground }]}>Add Custom App</Text>
                <Text style={[styles.addCardHint, { color: colors.mutedForeground }]}>
                  Find the package name in the app's Play Store URL or in Android Settings → Apps.
                </Text>
                <TextInput
                  value={pkgName}
                  onChangeText={setPkgName}
                  placeholder="Package name (e.g. com.example.app)"
                  placeholderTextColor={colors.mutedForeground}
                  style={[styles.input, { backgroundColor: colors.secondary, color: colors.foreground, borderColor: colors.border }]}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TextInput
                  value={displayName}
                  onChangeText={setDisplayName}
                  placeholder="Display name (e.g. My App)"
                  placeholderTextColor={colors.mutedForeground}
                  style={[styles.input, { backgroundColor: colors.secondary, color: colors.foreground, borderColor: colors.border }]}
                />
                <TouchableOpacity
                  onPress={handleAdd}
                  style={[styles.addConfirmBtn, { backgroundColor: colors.primary }]}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.addConfirmLabel, { color: colors.primaryForeground }]}>Add App</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={[styles.infoBanner, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name="info" size={14} color={colors.mutedForeground} />
              <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
                {enabledCount === 0
                  ? "No apps selected — all notifications will be read aloud."
                  : "Only notifications from enabled apps will be read aloud."}
              </Text>
            </View>

            {sections.map((section) => (
              <View key={section.title}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
                    {section.title}
                  </Text>
                  {section.isDexcom && (
                    <View style={[styles.smartBadge, { backgroundColor: colors.accent }]}>
                      <Feather name="zap" size={10} color={colors.accentForeground} />
                      <Text style={[styles.smartBadgeText, { color: colors.accentForeground }]}>
                        Smart glucose reading
                      </Text>
                    </View>
                  )}
                </View>
                <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: section.isDexcom ? colors.accent : colors.border }]}>
                  {section.data.map((app, index) => (
                    <View key={app.packageName}>
                      {index > 0 && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
                      <AppRow
                        app={app}
                        onToggle={toggleApp}
                        onRemove={removeApp}
                        isCustom={!!section.isCustom}
                      />
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: { fontSize: 24, fontFamily: "Inter_700Bold" },
  headerSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  addCard: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  addCardTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  addCardHint: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 17 },
  input: {
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  addConfirmBtn: {
    height: 44,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  addConfirmLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  infoBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 4,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  infoText: { flex: 1, fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 17 },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 8,
  },
  sectionLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase" as const,
    letterSpacing: 0.8,
  },
  smartBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  smartBadgeText: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
  },
  sectionCard: {
    marginHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  divider: { height: StyleSheet.hairlineWidth, marginLeft: 64 },
});
