export const SOUND_ENABLED_KEY = "athena:sound-enabled";

export function isSoundEnabled(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const stored = window.localStorage.getItem(SOUND_ENABLED_KEY);
    if (stored == null) return true;
    return stored === "1";
  } catch {
    return true;
  }
}

export function setSoundEnabled(enabled: boolean): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(SOUND_ENABLED_KEY, enabled ? "1" : "0");
  } catch {
    // Ignore localStorage failures in restricted environments.
  }
}
