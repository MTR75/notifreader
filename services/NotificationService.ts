import { Platform } from "react-native";

let RNListener: any = null;

if (Platform.OS === "android") {
  try {
    RNListener = require("react-native-notification-listener").default;
  } catch (_e) {
    RNListener = null;
  }
}

export const isNativeBuild: boolean = RNListener !== null;

export async function getPermissionStatus(): Promise<
  "authorized" | "denied" | "unknown"
> {
  if (!RNListener) return "unknown";
  try {
    const status: string = await RNListener.getPermissionStatus();
    if (status === "authorized") return "authorized";
    if (status === "denied") return "denied";
    return "unknown";
  } catch (_e) {
    return "unknown";
  }
}

export async function requestPermission(): Promise<void> {
  if (!RNListener) return;
  try {
    await RNListener.requestPermission();
  } catch (_e) {}
}

export { RNListener };
