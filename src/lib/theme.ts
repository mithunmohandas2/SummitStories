export type ThemeMode = "light" | "dark" | "system";
export const THEME_STORAGE_KEY = "summit-stories-theme";
const CHANGE_EVENT = "summit-stories-theme-change";
let fallbackMode: ThemeMode = "system";

export function readTheme(): ThemeMode {
  try {
    const value = window.localStorage.getItem(THEME_STORAGE_KEY);
    return value === "light" || value === "dark" ? value : "system";
  } catch { return fallbackMode; }
}

export function applyTheme(mode: ThemeMode) {
  const dark = mode === "dark" || (mode === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
  document.documentElement.style.colorScheme = dark ? "dark" : "light";
}

export function setTheme(mode: ThemeMode) {
  fallbackMode = mode;
  try { window.localStorage.setItem(THEME_STORAGE_KEY, mode); } catch { /* The choice still works when storage is unavailable. */ }
  applyTheme(mode);
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function subscribeTheme(notify: () => void) {
  window.addEventListener("storage", notify);
  window.addEventListener(CHANGE_EVENT, notify);
  return () => {
    window.removeEventListener("storage", notify);
    window.removeEventListener(CHANGE_EVENT, notify);
  };
}

// Apply the saved preference before the page paints.
export const themeInitializationScript = `(() => {
  let mode = "system";
  try { mode = localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)}) || "system"; } catch {}
  const dark = mode === "dark" || (mode !== "light" && matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
  document.documentElement.style.colorScheme = dark ? "dark" : "light";
})();`;
