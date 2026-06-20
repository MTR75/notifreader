import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Speech from "expo-speech";
import React, { useEffect, useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useNotifications } from "@/context/NotificationContext";
import { useColors } from "@/hooks/useColors";

function StepControl({
  label,
  value,
  onDecrease,
  onIncrease,
  displayValue,
}: {
  label: string;
  value: number;
  onDecrease: () => void;
  onIncrease: () => void;
  displayValue: string;
}) {
  const colors = useColors();
  return (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, { color: colors.foreground }]}>{label}</Text>
      <View style={styles.stepper}>
        <TouchableOpacity
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onDecrease(); }}
          style={[styles.stepBtn, { backgroundColor: colors.secondary, borderColor: colors.border }]}
          hitSlop={8}
        >
          <Feather name="minus" size={16} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.stepValue, { color: colors.foreground }]}>{displayValue}</Text>
        <TouchableOpacity
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onIncrease(); }}
          style={[styles.stepBtn, { backgroundColor: colors.secondary, borderColor: colors.border }]}
          hitSlop={8}
        >
          <Feather name="plus" size={16} color={colors.foreground} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function ToggleRow({
  label,
  subtitle,
  value,
  onChange,
}: {
  label: string;
  subtitle?: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  const colors = useColors();
  return (
    <View style={styles.row}>
      <View style={styles.rowInfo}>
        <Text style={[styles.rowLabel, { color: colors.foreground }]}>{label}</Text>
        {subtitle ? (
          <Text style={[styles.rowSub, { color: colors.mutedForeground }]}>{subtitle}</Text>
        ) : null}
      </View>
      <Switch
        value={value}
        onValueChange={(v) => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onChange(v);
        }}
        trackColor={{ false: colors.border, true: colors.primary }}
        thumbColor={colors.card}
      />
    </View>
  );
}

const LANGUAGES = [
  { code: "en-US", label: "English (US)" },
  { code: "en-GB", label: "English (UK)" },
  { code: "es-ES", label: "Spanish" },
  { code: "fr-FR", label: "French" },
  { code: "de-DE", label: "German" },
  { code: "it-IT", label: "Italian" },
  { code: "pt-BR", label: "Portuguese (BR)" },
  { code: "ja-JP", label: "Japanese" },
  { code: "zh-CN", label: "Chinese (Simplified)" },
  { code: "ar-SA", label: "Arabic" },
  { code: "hi-IN", label: "Hindi" },
  { code: "ko-KR", label: "Korean" },
];

function clamp(val: number, min: number, max: number, step: number) {
  return Math.round(Math.min(max, Math.max(min, val)) / step) * step;
}

export default function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { ttsSettings, updateTTSSettings } = useNotifications();
  const [availableLangs, setAvailableLangs] = useState<string[]>([]);

  useEffect(() => {
    Speech.getAvailableVoicesAsync()
      .then((voices) => {
        const langs = [...new Set(voices.map((v) => v.language))];
        setAvailableLangs(langs);
      })
      .catch(() => {});
  }, []);

  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;

  function testVoice() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Speech.stop();
    Speech.speak("Hello! This is how your notifications will sound.", {
      rate: ttsSettings.rate,
      pitch: ttsSettings.pitch,
      language: ttsSettings.language,
    });
  }

  function adjustRate(delta: number) {
    updateTTSSettings({ rate: clamp(ttsSettings.rate + delta, 0.1, 2.0, 0.1) });
  }
  function adjustPitch(delta: number) {
    updateTTSSettings({ pitch: clamp(ttsSettings.pitch + delta, 0.5, 2.0, 0.1) });
  }
  function adjustDelay(delta: number) {
    updateTTSSettings({ delay: clamp((ttsSettings.delay ?? 0) + delta, 0, 30, 1) });
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 14, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Settings</Text>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + (Platform.OS === "web" ? 84 : 80) },
        ]}
      >
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>Voice Output</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <StepControl
            label="Speed"
            value={ttsSettings.rate}
            displayValue={`${ttsSettings.rate.toFixed(1)}×`}
            onDecrease={() => adjustRate(-0.1)}
            onIncrease={() => adjustRate(0.1)}
          />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <StepControl
            label="Pitch"
            value={ttsSettings.pitch}
            displayValue={`${ttsSettings.pitch.toFixed(1)}`}
            onDecrease={() => adjustPitch(-0.1)}
            onIncrease={() => adjustPitch(0.1)}
          />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <StepControl
            label="Delay"
            value={ttsSettings.delay ?? 0}
            displayValue={`${ttsSettings.delay ?? 0}s`}
            onDecrease={() => adjustDelay(-1)}
            onIncrease={() => adjustDelay(1)}
          />
        </View>

        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>What to Read</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <ToggleRow
            label="Read Title"
            subtitle="Read the notification title"
            value={ttsSettings.readTitle}
            onChange={(v) => updateTTSSettings({ readTitle: v })}
          />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <ToggleRow
            label="Read Body"
            subtitle="Read the notification message text"
            value={ttsSettings.readBody}
            onChange={(v) => updateTTSSettings({ readBody: v })}
          />
        </View>

        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>Language</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {LANGUAGES.map((lang, index) => {
            const selected = ttsSettings.language === lang.code;
            return (
              <View key={lang.code}>
                {index > 0 && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
                <TouchableOpacity
                  style={styles.langRow}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    updateTTSSettings({ language: lang.code });
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.langLabel, { color: colors.foreground }]}>{lang.label}</Text>
                  {selected && <Feather name="check" size={18} color={colors.primary} />}
                </TouchableOpacity>
              </View>
            );
          })}
        </View>

        <TouchableOpacity
          onPress={testVoice}
          style={[styles.testBtn, { backgroundColor: colors.primary }]}
          activeOpacity={0.85}
        >
          <Feather name="play" size={16} color={colors.primaryForeground} />
          <Text style={[styles.testBtnLabel, { color: colors.primaryForeground }]}>
            Test Voice
          </Text>
        </TouchableOpacity>

        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>How to Install APK</Text>
        <View style={[styles.card, styles.instructCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {[
            { step: "1", text: 'Install Node.js and run: npm install -g eas-cli' },
            { step: "2", text: 'Log in: eas login (create a free account at expo.dev)' },
            { step: "3", text: 'In the project folder run: eas build -p android --profile preview' },
            { step: "4", text: 'Download the APK from expo.dev and transfer it to your phone' },
            { step: "5", text: 'On your phone: Settings → Security → Enable "Install unknown apps"' },
            { step: "6", text: 'Install the APK, open app, grant Notification Listener permission' },
          ].map((item) => (
            <View key={item.step} style={styles.instructRow}>
              <View style={[styles.stepCircle, { backgroundColor: colors.primary }]}>
                <Text style={[styles.stepNum, { color: colors.primaryForeground }]}>{item.step}</Text>
              </View>
              <Text style={[styles.instructText, { color: colors.mutedForeground }]}>{item.text}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: { fontSize: 24, fontFamily: "Inter_700Bold" },
  scroll: { paddingHorizontal: 16, paddingTop: 16, gap: 0 },
  sectionLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginTop: 20,
    marginBottom: 8,
    marginLeft: 4,
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  rowInfo: { flex: 1, gap: 2 },
  rowLabel: { fontSize: 15, fontFamily: "Inter_500Medium" },
  rowSub: { fontSize: 12, fontFamily: "Inter_400Regular" },
  stepper: { flexDirection: "row", alignItems: "center", gap: 12 },
  stepBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  stepValue: { fontSize: 15, fontFamily: "Inter_600SemiBold", minWidth: 48, textAlign: "center" },
  divider: { height: StyleSheet.hairlineWidth, marginLeft: 16 },
  langRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  langLabel: { fontSize: 15, fontFamily: "Inter_400Regular" },
  testBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 20,
    height: 50,
    borderRadius: 12,
  },
  testBtnLabel: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  instructCard: { gap: 0 },
  instructRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  stepCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  stepNum: { fontSize: 11, fontFamily: "Inter_700Bold" },
  instructText: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 19 },
});
