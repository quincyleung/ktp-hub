import { useSyncExternalStore } from "react";

export type Device = {
  isIOS: boolean;
  isStandalone: boolean; // opened from the home screen
  isInApp: boolean; // Messenger, Instagram, etc.
};

let cached: Device | null = null;

function detectDevice(): Device {
  if (cached) return cached;
  const ua = navigator.userAgent;
  const isIOS =
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const isStandalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true;
  const isInApp = /FBAN|FBAV|FB_IAB|Instagram|Snapchat/.test(ua);
  cached = { isIOS, isStandalone, isInApp };
  return cached;
}

const noSubscribe = () => () => {};

// null on the server and during hydration, then the real device.
export function useDevice(): Device | null {
  return useSyncExternalStore(noSubscribe, detectDevice, () => null);
}
