"use client";

import { useEffect, useId, useRef, useState } from "react";
import { usePwaInstall } from "./PwaProvider";

function InstallHelp({ onDismiss }: { onDismiss: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const close = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    const opener = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    element.showModal();
    close.current?.focus();
    document.body.style.overflow = "hidden";
    return () => {
      element.close();
      document.body.style.overflow = previousOverflow;
      if (opener instanceof HTMLElement && opener.isConnected) opener.focus();
    };
  }, []);
  return (
    <dialog
      ref={dialog}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        onDismiss();
      }}
      className="m-auto w-[calc(100%_-_2rem)] max-w-md max-h-[80dvh] overflow-y-auto rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 text-gray-900 dark:text-gray-100 shadow-2xl backdrop:bg-black/60"
    >
      <h2 id={titleId} className="text-xl font-semibold">
        Install Summit Stories
      </h2>
      <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">
        Keep Summit Stories on your home screen and open it like an app.
      </p>
      <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm">
        <li>On Android, open this site in Chrome.</li>
        <li>
          Open the browser menu and choose <strong>Install app</strong> or{" "}
          <strong>Add to Home screen</strong>.
        </li>
        <li>Confirm to add Summit Stories to your phone.</li>
      </ol>
      <p className="mt-4 text-sm text-gray-600 dark:text-gray-300">
        On iPhone or iPad, use Safari&rsquo;s Share menu, then Add to Home
        Screen. Installation requires an HTTPS connection (or localhost for
        testing).
      </p>
      <button
        ref={close}
        type="button"
        onClick={onDismiss}
        className="mt-6 rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600"
      >
        Got it
      </button>
    </dialog>
  );
}

export default function InstallAppButton() {
  const { installed, install } = usePwaInstall();
  const [help, setHelp] = useState(false);
  if (installed) return null;
  return (
    <>
      <button
        type="button"
        onClick={async () => {
          if (!(await install())) setHelp(true);
        }}
        className="flex w-full items-center gap-2 text-left text-sm font-medium text-orange-600 dark:text-orange-400"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5"
        >
          <path d="M12 3v12m-4-4 4 4 4-4M5 16v4h14v-4" />
        </svg>
        Install app
      </button>
      {help && <InstallHelp onDismiss={() => setHelp(false)} />}
    </>
  );
}
