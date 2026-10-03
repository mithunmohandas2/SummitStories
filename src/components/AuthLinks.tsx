"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";

export default function AuthLinks({ onNavigate, placement = "settings" }: { onNavigate?: () => void; placement?: "navigation" | "settings" }) {
  const { status } = useSession();
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
        onClick={() => {
          onNavigate?.();
          void signOut({ callbackUrl: "/" });
        }}
      >
        Log out
      </button>
  );
}
