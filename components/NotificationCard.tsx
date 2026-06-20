import { Feather } from "@expo/vector-icons";
import React, { memo } from "react";
import { StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";
import { NotificationItem } from "@/context/NotificationContext";

interface Props {
  item: NotificationItem;
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  const h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, "0");
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${m} ${ampm}`;
}

function formatDate(ts: number): string {
  const now = new Date();
  const d = new Date(ts);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const itemDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diff = today.getTime() - itemDay.getTime();
  if (diff === 0) return "Today";
  if (diff === 86400000) return "Yesterday";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

const NotificationCard = memo(function NotificationCard({ item }: Props) {
  const colors = useColors();

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.header}>
        <View style={[styles.appBadge, { backgroundColor: colors.secondary }]}>
          <Feather name="bell" size={12} color={colors.mutedForeground} />
          <Text style={[styles.appName, { color: colors.mutedForeground }]} numberOfLines={1}>
            {item.appName}
          </Text>
        </View>
        <View style={styles.timeRow}>
          <Text style={[styles.date, { color: colors.mutedForeground }]}>
            {formatDate(item.timestamp)}
          </Text>
          <Text style={[styles.time, { color: colors.mutedForeground }]}>
            {formatTime(item.timestamp)}
          </Text>
        </View>
      </View>

      {item.title ? (
        <Text style={[styles.title, { color: colors.foreground }]} numberOfLines={2}>
          {item.title}
        </Text>
      ) : null}

      {item.text ? (
        <Text style={[styles.body, { color: colors.mutedForeground }]} numberOfLines={3}>
          {item.text}
        </Text>
      ) : null}

      {item.wasSpoken && (
        <View style={styles.spokenRow}>
          <Feather name="volume-2" size={11} color={colors.accent} />
          <Text style={[styles.spokenLabel, { color: colors.accent }]}>Spoken aloud</Text>
        </View>
      )}
    </View>
  );
});

export default NotificationCard;

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  appBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  appName: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    maxWidth: 140,
  },
  timeRow: {
    alignItems: "flex-end",
    gap: 1,
  },
  date: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
  },
  time: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
  },
  title: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 4,
    lineHeight: 20,
  },
  body: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 19,
  },
  spokenRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 8,
  },
  spokenLabel: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
  },
});
