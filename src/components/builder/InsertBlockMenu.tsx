"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { Block } from "../../lib/blog-schema";

export default function InsertBlockMenu({
  options,
  label,
  disabled,
  onInsert,
}: {
  options: { type: Block["type"]; label: string }[];
  label: string;
  disabled: boolean;
  onInsert: (type: Block["type"]) => void;
}) {
  const [open, setOpen] = useState(false);
  const container = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const focusLast = useRef(false);
  const menuId = useId();
  useEffect(() => {
    if (!open) return;
    const outside = (event: Event) => {
      if (
        event.target instanceof Node &&
        !container.current?.contains(event.target)
      )
        setOpen(false);
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("focusin", outside);
    const items =
      menu.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]');
    (focusLast.current ? items?.[items.length - 1] : items?.[0])?.focus();
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("focusin", outside);
    };
  }, [open]);
  return (
    <div ref={container} className="relative">
      <button
        ref={trigger}
        type="button"
        aria-label={label}
        title="Add item below"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        disabled={disabled}
        onClick={() => {
          focusLast.current = false;
          setOpen(!open);
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            focusLast.current = event.key === "ArrowUp";
            setOpen(true);
          }
        }}
        className="flex items-center justify-center rounded-lg border bg-white dark:bg-gray-900 p-2 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950 disabled:opacity-40"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          className="h-5 w-5"
        >
          <path d="M12 5v14M5 12h14" />
        </svg>
      </button>
      {open && (
        <div
          ref={menu}
          id={menuId}
          role="menu"
          aria-label="Insert content below"
          className="absolute right-0 top-full z-50 mt-2 w-52 max-w-[calc(100vw_-_2rem)] max-h-72 overflow-y-auto rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-1 shadow-xl"
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.preventDefault();
              event.stopPropagation();
              setOpen(false);
              trigger.current?.focus();
            } else if (
              ["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)
            ) {
              event.preventDefault();
              const items = [
                ...(menu.current?.querySelectorAll<HTMLButtonElement>(
                  '[role="menuitem"]',
                ) ?? []),
              ];
              const current = items.findIndex(
                (item) => item === document.activeElement,
              );
              const next =
                event.key === "Home"
                  ? 0
                  : event.key === "End"
                    ? items.length - 1
                    : (current +
                        (event.key === "ArrowDown" ? 1 : -1) +
                        items.length) %
                      items.length;
              items[next]?.focus();
            }
          }}
        >
          {options.map((option) => (
            <button
              key={option.type}
              type="button"
              role="menuitem"
              tabIndex={-1}
              onClick={() => {
                setOpen(false);
                onInsert(option.type);
              }}
              className="block w-full rounded-lg px-3 py-2 text-left text-sm text-gray-900 dark:text-gray-100 hover:bg-orange-50 dark:hover:bg-orange-950 focus:bg-orange-50 dark:focus:bg-orange-950 focus:outline-none"
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
