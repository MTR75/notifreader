import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useCallback } from "react";
import {
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import NotificationCard from "@/components/NotificationCard";
import { NotificationItem, useNotifications } from "@/context/NotificationContext";
import { useColors } from "@/hooks/useColors";

function PermissionBanner() {
  const colors = useColors();
  const { permissionStatus, requestPermission } = useNotifications();
  if (permissionStatus === "authorized") return null;

  return (
    <TouchableOpacity
      style={[styles.banner, { backgroundColor: colors.card, borderColor: "#D29922" }]}
      onPress={requestPermission}
      activeOpacity={0.8}
    >
      <Feather name="alert-triangle" size={16} color="#D29922" />
      <View style={styles.bannerText}>
        <Text style={[styles.bannerTitle, { color: colors.foreground }]}>
          Notification Access Required
        </Text>
        <Text style={[styles.bannerBody, { color: colors.mutedForeground }]}>
          Tap to open Settings → enable Notification Listener for this app.
        </Text>
      </View>
      <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
    </TouchableOpacity>
  );
}

function NativeBuildBanner() {
  const colors = useColors();
  const { isNativeBuild } = useNotifications();
  if (isNativeBuild) return null;

  return (
    <View style={[styles.banner, { backgroundColor: colors.card, borderColor: colors.primary }]}>
      <Feather name="info" size={16} color={colors.primary} />
      <View style={styles.bannerText}>
        <Text style={[styles.bannerTitle, { color: colors.foreground }]}>
          Preview Mode
        </Text>
        <Text style={[styles.bannerBody, { color: colors.mutedForeground }]}>
          Install the APK on your Android phone to read real notifications. TTS and app settings work now.
        </Text>
      </View>
    </View>
  );
}

function ListenToggle() {
  const colors = useColors();
  const { isListening, toggleListening, permissionStatus, isNativeBuild } = useNotifications();
  const active = isListening && (permissionStatus === "authorized" || !isNativeBuild);

  function handlePress() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    toggleListening();
  }

  return (
    <View style={styles.toggleSection}>
      <Pressable
        onPress={handlePress}
        style={({ pressed }) => [
          styles.bigButton,
          {
            backgroundColor: active ? colors.accent : colors.card,
            borderColor: active ? colors.accent : colors.border,
            opacity: pressed ? 0.82 : 1,
          },
        ]}
      >
        <Feather
          name={active ? "volume-2" : "volume-x"}
          size={38}
          color={active ? colors.accentForeground : colors.mutedForeground}
        />
        <Text
          style={[
            styles.bigButtonLabel,
            { color: active ? colors.accentForeground : colors.foreground },
          ]}
        >
          {active ? "Listening…" : "Start Listening"}
        </Text>
        <Text style={[styles.bigButtonSub, { color: active ? colors.accentForeground : colors.mutedForeground }]}>
          {active ? "Tap to stop" : "Tap to start"}
        </Text>
      </Pressable>

      {active && (
        <View style={styles.pulseRow}>
          <View style={[styles.dot, { backgroundColor: colors.accent }]} />
          <Text style={[styles.pulseLabel, { color: colors.accent }]}>
            Reading notifications aloud
          </Text>
        </View>
      )}
    </View>
  );
}

function EmptyNotifications() {
  const colors = useColors();
  return (
    <View style={styles.emptyState}>
      <Feather name="inbox" size={40} color={colors.mutedForeground} />
      <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No notifications yet</Text>
      <Text style={[styles.emptyBody, { color: colors.mutedForeground }]}>
        Notifications from your selected apps will appear here when received.
      </Text>
    </View>
  );
}

const renderItem = ({ item }: { item: NotificationItem }) => <NotificationCard item={item} />;
const keyExtractor = (item: NotificationItem) => item.id;

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { notifications, clearNotifications } = useNotifications();

  const handleClear = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    clearNotifications();
  }, [clearNotifications]);

  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 14, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>NotifReader</Text>
        {notifications.length > 0 && (
          <TouchableOpacity onPress={handleClear} hitSlop={8}>
            <Text style={[styles.clearBtn, { color: colors.mutedForeground }]}>Clear all</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={notifications}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        scrollEnabled={!!notifications.length}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + (Platform.OS === "web" ? 84 : 80) },
        ]}
        ListHeaderComponent={
          <View>
            <NativeBuildBanner />
            <PermissionBanner />
            <ListenToggle />
            {notifications.length > 0 && (
              <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
                Recent ({notifications.length})
              </Text>
            )}
          </View>
        }
        ListEmptyComponent={<EmptyNotifications />}
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
  clearBtn: { fontSize: 14, fontFamily: "Inter_500Medium" },
  listContent: { paddingHorizontal: 16, paddingTop: 14 },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 12,
    gap: 10,
  },
  bannerText: { flex: 1, gap: 3 },
  bannerTitle: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  bannerBody: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 17 },
  toggleSection: { alignItems: "center", marginVertical: 24, gap: 14 },
  bigButton: {
    width: 180,
    height: 180,
    borderRadius: 90,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    gap: 6,
  },
  bigButtonLabel: { fontSize: 16, fontFamily: "Inter_700Bold" },
  bigButtonSub: { fontSize: 12, fontFamily: "Inter_400Regular" },
  pulseRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  pulseLabel: { fontSize: 13, fontFamily: "Inter_500Medium" },
  sectionTitle: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 8,
    marginTop: 4,
  },
  emptyState: { alignItems: "center", paddingTop: 48, gap: 10, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  emptyBody: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 19 },
});
