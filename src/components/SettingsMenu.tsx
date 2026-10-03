"use client";

import { useEffect, useId, useRef, useState } from "react";
import AuthLinks from "./AuthLinks";
import ThemeSelector from "./ThemeSelector";

export default function SettingsMenu({ onNavigate }: { onNavigate?: () => void }) {
  const [open, setOpen] = useState(false);
  const container = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    const outsideClick = (event: PointerEvent) => {
      if (event.target instanceof Node && !container.current?.contains(event.target)) setOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        trigger.current?.focus();
      }
    };
    document.addEventListener("pointerdown", outsideClick);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", outsideClick);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);

  return <div ref={container} className="relative shrink-0">
    <button
      ref={trigger}
      type="button"
      aria-label="Settings"
      aria-expanded={open}
      aria-controls={panelId}
      onClick={() => setOpen(!open)}
      className="flex items-center justify-center rounded-lg p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-500"
    >
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
        <path d="m9.5 3-.6 2.3-1.4.8-2.3-.6-2.5 4.3 1.7 1.7v1.6l-1.7 1.7 2.5 4.3 2.3-.6 1.4.8.6 2.3h5l.6-2.3 1.4-.8 2.3.6 2.5-4.3-1.7-1.7v-1.6l1.7-1.7-2.5-4.3-2.3.6-1.4-.8L14.5 3z" />
        <circle cx="12" cy="12" r="3.2" />
      </svg>
    </button>
    <div
      id={panelId}
      hidden={!open}
      role="region"
      aria-label="Settings options"
      className="absolute right-0 top-full mt-3 w-56 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 shadow-xl"
    >
      <div className="mb-4 border-b border-gray-200 dark:border-gray-700 pb-4 text-sm font-medium">
        <AuthLinks onNavigate={() => { setOpen(false); onNavigate?.(); }} />
      </div>
      <ThemeSelector />
    </div>
  </div>;
}
