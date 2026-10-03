"use client";

import { useEffect, useSyncExternalStore } from "react";
import { applyTheme, readTheme, setTheme, subscribeTheme, type ThemeMode } from "../lib/theme";

export default function ThemeSelector() {
  const mode = useSyncExternalStore(subscribeTheme, readTheme, () => "system" as ThemeMode);

  useEffect(() => {
    const preference = window.matchMedia("(prefers-color-scheme: dark)");
    const update = () => applyTheme(mode);
    update();
    preference.addEventListener("change", update);
    return () => preference.removeEventListener("change", update);
  }, [mode]);

  return <label className="block">
    <span className="block mb-2 text-xs font-medium text-gray-500 dark:text-gray-400">Color mode</span>
    <select
      value={mode}
      onChange={event => setTheme(event.target.value as ThemeMode)}
      className="w-full rounded-lg border border-gray-300 bg-white px-2 py-2 text-sm text-gray-700 dark:text-gray-300 dark:border-gray-600 dark:bg-gray-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-500"
    >
      <option value="light">Light mode</option>
      <option value="dark">Dark mode</option>
      <option value="system">Browser default</option>
    </select>
  </label>;
}
