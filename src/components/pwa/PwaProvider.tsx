"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

type InstallContext = { installed: boolean; install: () => Promise<boolean> };
const Context = createContext<InstallContext | null>(null);
function subscribeInstalled(callback: () => void) {
  const query = window.matchMedia("(display-mode: standalone)");
  query.addEventListener("change", callback);
  window.addEventListener("appinstalled", callback);
  return () => {
    query.removeEventListener("change", callback);
    window.removeEventListener("appinstalled", callback);
  };
}
const getInstalled = () =>
  window.matchMedia("(display-mode: standalone)").matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true;
const getServerSnapshot = () => false;

export function usePwaInstall() {
  const context = useContext(Context);
  if (!context) throw new Error("Install controls require PwaProvider.");
  return context;
}

export default function PwaProvider({ children }: { children: ReactNode }) {
  const [prompt, setPrompt] = useState<InstallPromptEvent | null>(null);
  const [accepted, setAccepted] = useState(false);
  const standalone = useSyncExternalStore(
    subscribeInstalled,
    getInstalled,
    getServerSnapshot,
  );
  useEffect(() => {
    const beforeInstall = (event: Event) => {
      event.preventDefault();
      setPrompt(event as InstallPromptEvent);
    };
    const installed = () => {
      setPrompt(null);
      setAccepted(true);
    };
    window.addEventListener("beforeinstallprompt", beforeInstall);
    window.addEventListener("appinstalled", installed);
    return () => {
      window.removeEventListener("beforeinstallprompt", beforeInstall);
      window.removeEventListener("appinstalled", installed);
    };
  }, []);

  useEffect(() => {
    if (
      process.env.NODE_ENV !== "production" ||
      !window.isSecureContext ||
      !("serviceWorker" in navigator)
    )
      return;
    const register = () => {
      void navigator.serviceWorker
        .register("/sw.js", { scope: "/", updateViaCache: "none" })
        .catch((error) =>
          console.error("Unable to register offline support", error),
        );
    };
    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });
    return () => window.removeEventListener("load", register);
  }, []);

  async function install() {
    if (!prompt) return false;
    setPrompt(null);
    try {
      await prompt.prompt();
      if ((await prompt.userChoice).outcome === "accepted") setAccepted(true);
      return true;
    } catch {
      return false;
    }
  }
  return (
    <Context.Provider value={{ installed: standalone || accepted, install }}>
      {children}
    </Context.Provider>
  );
}
