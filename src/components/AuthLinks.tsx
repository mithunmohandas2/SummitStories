"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useErrorToast, useSuccessToast } from "./ToastProvider";

export default function AuthLinks({ onNavigate, placement = "settings" }: { onNavigate?: () => void; placement?: "navigation" | "settings" }) {
  const { status } = useSession();
  const router = useRouter();
  const showError = useErrorToast();
  const showSuccess = useSuccessToast();
  const [busy, setBusy] = useState(false);

  async function logout() {
    setBusy(true);
    try {
      const result = await signOut({ callbackUrl: "/", redirect: false });
      if (!result?.url) throw new Error("Logout failed");
      showSuccess("Logged out successfully.");
      onNavigate?.();
      router.push("/");
      router.refresh();
    } catch {
      showError("Unable to log out. Please try again.");
    } finally {
      setBusy(false);
    }
  }
  if (placement === "navigation") return status === "authenticated"
    ? <Link href="/builder" className="text-orange-600 dark:text-orange-400" onClick={onNavigate}>Blog builder</Link>
    : null;
  if (status === "loading")
    return <span className="text-gray-400 dark:text-gray-500 text-sm">Loading account…</span>;
  if (status === "unauthenticated")
    return (
      <Link href="/login" className="text-orange-600 dark:text-orange-400" onClick={onNavigate}>
        Log in
      </Link>
    );
  return (
      <button
        type="button"
        disabled={busy}
        onClick={logout}
      >
        {busy ? "Logging out…" : "Log out"}
      </button>
  );
}
