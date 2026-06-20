import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Speech from "expo-speech";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { DeviceEventEmitter, Platform } from "react-native";

import {
  getPermissionStatus,
  isNativeBuild,
  requestPermission,
} from "@/services/NotificationService";
import { buildDexcomSpeech, isDexcomPackage } from "@/utils/glucoseParser";

export interface NotificationItem {
  id: string;
  packageName: string;
  appName: string;
  title: string;
  text: string;
  timestamp: number;
  wasSpoken: boolean;
}

export interface AppEntry {
  packageName: string;
  displayName: string;
  enabled: boolean;
}

export interface TTSSettings {
  rate: number;
  pitch: number;
  delay: number;
  readTitle: boolean;
  readBody: boolean;
  language: string;
}

type PermissionStatus = "authorized" | "denied" | "unknown" | "checking";

interface NotificationContextType {
  isListening: boolean;
  toggleListening: () => void;
  permissionStatus: PermissionStatus;
  requestPermission: () => Promise<void>;
  notifications: NotificationItem[];
  clearNotifications: () => void;
  apps: AppEntry[];
  toggleApp: (packageName: string) => void;
  addApp: (packageName: string, displayName: string) => void;
  removeApp: (packageName: string) => void;
  ttsSettings: TTSSettings;
  updateTTSSettings: (patch: Partial<TTSSettings>) => void;
  isNativeBuild: boolean;
}

const COMMON_APPS: AppEntry[] = [
  { packageName: "com.dexcom.one", displayName: "Dexcom One", enabled: false },
  { packageName: "com.dexcom.oneplus", displayName: "Dexcom One+", enabled: false },
  { packageName: "com.dexcom.dexcomone", displayName: "Dexcom One (alt)", enabled: false },
  { packageName: "com.dexcom.g6", displayName: "Dexcom G6", enabled: false },
  { packageName: "com.dexcom.g7", displayName: "Dexcom G7", enabled: false },
  { packageName: "com.dexcom.cgm", displayName: "Dexcom CGM", enabled: false },
  { packageName: "com.dexcom.share2", displayName: "Dexcom Share", enabled: false },
  { packageName: "com.whatsapp", displayName: "WhatsApp", enabled: false },
  {
    packageName: "org.telegram.messenger",
    displayName: "Telegram",
    enabled: false,
  },
  {
    packageName: "com.google.android.gm",
    displayName: "Gmail",
    enabled: false,
  },
  {
    packageName: "com.instagram.android",
    displayName: "Instagram",
    enabled: false,
  },
  {
    packageName: "com.facebook.katana",
    displayName: "Facebook",
    enabled: false,
  },
  {
    packageName: "com.twitter.android",
    displayName: "X (Twitter)",
    enabled: false,
  },
  {
    packageName: "com.snapchat.android",
    displayName: "Snapchat",
    enabled: false,
  },
  { packageName: "com.discord", displayName: "Discord", enabled: false },
  {
    packageName: "com.spotify.music",
    displayName: "Spotify",
    enabled: false,
  },
  {
    packageName: "com.google.android.apps.messaging",
    displayName: "Messages (Google)",
    enabled: false,
  },
  {
    packageName: "com.samsung.android.messaging",
    displayName: "Samsung Messages",
    enabled: false,
  },
  {
    packageName: "com.microsoft.teams",
    displayName: "Microsoft Teams",
    enabled: false,
  },
  { packageName: "com.slack", displayName: "Slack", enabled: false },
  { packageName: "com.viber.voip", displayName: "Viber", enabled: false },
  { packageName: "com.skype.raider", displayName: "Skype", enabled: false },
  { packageName: "com.linkedin.android", displayName: "LinkedIn", enabled: false },
  {
    packageName: "com.reddit.frontpage",
    displayName: "Reddit",
    enabled: false,
  },
  {
    packageName: "com.google.android.youtube",
    displayName: "YouTube",
    enabled: false,
  },
];

const STORAGE_KEYS = {
  APPS: "@notif_reader/apps",
  TTS: "@notif_reader/tts",
  IS_LISTENING: "@notif_reader/isListening",
};

const DEFAULT_TTS: TTSSettings = {
  rate: 0.9,
  pitch: 1.0,
  delay: 0,
  readTitle: true,
  readBody: true,
  language: "en-US",
};

const NotificationContext = createContext<NotificationContextType | null>(null);

function makeId(): string {
  return Date.now().toString() + Math.random().toString(36).substring(2, 9);
}

function packageToName(pkg: string, knownApps: AppEntry[]): string {
  const found = knownApps.find((a) => a.packageName === pkg);
  if (found) return found.displayName;
  const parts = pkg.split(".");
  const last = parts[parts.length - 1];
  return last.charAt(0).toUpperCase() + last.slice(1);
}

export function NotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isListening, setIsListening] = useState<boolean>(false);
  const [permissionStatus, setPermissionStatus] =
    useState<PermissionStatus>("checking");
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [apps, setApps] = useState<AppEntry[]>(COMMON_APPS);
  const [ttsSettings, setTtsSettings] = useState<TTSSettings>(DEFAULT_TTS);

  const appsRef = useRef<AppEntry[]>(apps);
  const isListeningRef = useRef<boolean>(isListening);
  const ttsRef = useRef<TTSSettings>(ttsSettings);

  useEffect(() => {
    appsRef.current = apps;
  }, [apps]);
  useEffect(() => {
    isListeningRef.current = isListening;
  }, [isListening]);
  useEffect(() => {
    ttsRef.current = ttsSettings;
  }, [ttsSettings]);

  useEffect(() => {
    async function load() {
      try {
        const [appsJson, ttsJson, listeningVal] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.APPS),
          AsyncStorage.getItem(STORAGE_KEYS.TTS),
          AsyncStorage.getItem(STORAGE_KEYS.IS_LISTENING),
        ]);

        if (appsJson) {
          const saved: AppEntry[] = JSON.parse(appsJson);
          const merged = COMMON_APPS.map((common) => {
            const s = saved.find((x) => x.packageName === common.packageName);
            return s ? { ...common, enabled: s.enabled } : common;
          });
          const extra = saved.filter(
            (s) => !COMMON_APPS.find((c) => c.packageName === s.packageName)
          );
          setApps([...merged, ...extra]);
        }

        if (ttsJson) {
          setTtsSettings({ ...DEFAULT_TTS, ...JSON.parse(ttsJson) });
        }

        if (listeningVal === "true") {
          setIsListening(true);
        }
      } catch (_e) {}
    }

    load();
    checkPermission();
  }, []);

  async function checkPermission() {
    setPermissionStatus("checking");
    const status = await getPermissionStatus();
    setPermissionStatus(status);
  }

  const handleRequestPermission = useCallback(async () => {
    await requestPermission();
    setTimeout(checkPermission, 1500);
  }, []);

  function speakNotification(
    pkg: string,
    title: string,
    text: string,
    settings: TTSSettings
  ) {
    let spokenText: string;

    if (isDexcomPackage(pkg)) {
      spokenText = buildDexcomSpeech(title, text).spokenText;
    } else {
      const parts: string[] = [];
      if (settings.readTitle && title) parts.push(title);
      if (settings.readBody && text) parts.push(text);
      if (parts.length === 0) return;
      spokenText = parts.join(". ");
    }

    const doSpeak = () => {
      Speech.stop();
      Speech.speak(spokenText, {
        rate: settings.rate,
        pitch: settings.pitch,
        language: settings.language,
      });
    };

    if (settings.delay > 0) {
      setTimeout(doSpeak, settings.delay * 1000);
    } else {
      doSpeak();
    }
  }

  useEffect(() => {
    if (!isNativeBuild || Platform.OS !== "android") return;

    const subscription = DeviceEventEmitter.addListener(
      "notificationReceived",
      (raw: any) => {
        if (!isListeningRef.current) return;

        const pkg: string = raw?.app ?? "";
        const title: string = raw?.title ?? raw?.titleBig ?? "";
        const text: string =
          raw?.bigText ?? raw?.text ?? raw?.subText ?? raw?.summaryText ?? "";

        const enabledApps = appsRef.current;
        const enabledPkgs = enabledApps
          .filter((a) => a.enabled)
          .map((a) => a.packageName);

        if (enabledPkgs.length > 0 && !enabledPkgs.includes(pkg)) return;

        const appName = packageToName(pkg, appsRef.current);

        setApps((prev) => {
          const exists = prev.find((a) => a.packageName === pkg);
          if (exists) return prev;
          return [
            ...prev,
            { packageName: pkg, displayName: appName, enabled: false },
          ];
        });

        const item: NotificationItem = {
          id: makeId(),
          packageName: pkg,
          appName,
          title: title || "(no title)",
          text: text || "",
          timestamp: Date.now(),
          wasSpoken: true,
        };

        setNotifications((prev) => [item, ...prev].slice(0, 100));
        speakNotification(pkg, title, text, ttsRef.current);
      }
    );

    return () => subscription.remove();
  }, [isNativeBuild]);

  const toggleListening = useCallback(() => {
    setIsListening((prev) => {
      const next = !prev;
      if (!next) {
        Speech.stop();
      }
      AsyncStorage.setItem(STORAGE_KEYS.IS_LISTENING, next ? "true" : "false");
      return next;
    });
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const toggleApp = useCallback(
    (packageName: string) => {
      setApps((prev) => {
        const next = prev.map((a) =>
          a.packageName === packageName ? { ...a, enabled: !a.enabled } : a
        );
        AsyncStorage.setItem(STORAGE_KEYS.APPS, JSON.stringify(next));
        return next;
      });
    },
    []
  );

  const addApp = useCallback((packageName: string, displayName: string) => {
    setApps((prev) => {
      if (prev.find((a) => a.packageName === packageName)) return prev;
      const next = [
        ...prev,
        { packageName, displayName, enabled: true },
      ];
      AsyncStorage.setItem(STORAGE_KEYS.APPS, JSON.stringify(next));
      return next;
    });
  }, []);

  const removeApp = useCallback((packageName: string) => {
    setApps((prev) => {
      if (COMMON_APPS.find((c) => c.packageName === packageName)) {
        const next = prev.map((a) =>
          a.packageName === packageName ? { ...a, enabled: false } : a
        );
        AsyncStorage.setItem(STORAGE_KEYS.APPS, JSON.stringify(next));
        return next;
      }
      const next = prev.filter((a) => a.packageName !== packageName);
      AsyncStorage.setItem(STORAGE_KEYS.APPS, JSON.stringify(next));
      return next;
    });
  }, []);

  const updateTTSSettings = useCallback((patch: Partial<TTSSettings>) => {
    setTtsSettings((prev) => {
      const next = { ...prev, ...patch };
      AsyncStorage.setItem(STORAGE_KEYS.TTS, JSON.stringify(next));
      return next;
    });
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        isListening,
        toggleListening,
        permissionStatus,
        requestPermission: handleRequestPermission,
        notifications,
        clearNotifications,
        apps,
        toggleApp,
        addApp,
        removeApp,
        ttsSettings,
        updateTTSSettings,
        isNativeBuild,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications(): NotificationContextType {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotifications must be used inside NotificationProvider");
  return ctx;
}
