import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { memo } from "react";
import {
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { AppEntry } from "@/context/NotificationContext";
import { useColors } from "@/hooks/useColors";

interface Props {
  app: AppEntry;
  onToggle: (pkg: string) => void;
  onRemove?: (pkg: string) => void;
  isCustom?: boolean;
}

const AppRow = memo(function AppRow({ app, onToggle, onRemove, isCustom }: Props) {
  const colors = useColors();

  function handleToggle() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onToggle(app.packageName);
  }

  function handleRemove() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onRemove?.(app.packageName);
  }

  return (
    <View style={[styles.row, { borderBottomColor: colors.border }]}>
      <View style={[styles.iconBox, { backgroundColor: colors.secondary }]}>
        <Feather name="smartphone" size={16} color={colors.mutedForeground} />
      </View>
      <View style={styles.info}>
        <Text style={[styles.name, { color: colors.foreground }]}>{app.displayName}</Text>
        <Text style={[styles.pkg, { color: colors.mutedForeground }]} numberOfLines={1}>
          {app.packageName}
        </Text>
      </View>
      <View style={styles.actions}>
        {isCustom && onRemove && (
          <TouchableOpacity onPress={handleRemove} style={styles.removeBtn} hitSlop={8}>
            <Feather name="trash-2" size={16} color={colors.destructive} />
          </TouchableOpacity>
        )}
        <Switch
          value={app.enabled}
          onValueChange={handleToggle}
          trackColor={{ false: colors.border, true: colors.primary }}
          thumbColor={colors.card}
        />
      </View>
    </View>
  );
});

export default AppRow;

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  info: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  pkg: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  removeBtn: {
    padding: 4,
  },
});
