"use client";

import { useState, type FormEvent } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useErrorToast, useSuccessToast } from "./ToastProvider";

export default function LoginForm({ configured }: { configured: boolean }) {
  const router = useRouter();
  const showError = useErrorToast();
  const showSuccess = useSuccessToast();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const data = new FormData(event.currentTarget);
    try {
      const result = await signIn("credentials", {
        username: data.get("username"),
        password: data.get("password"),
        redirect: false,
      });
      if (!result?.ok || result.error) {
        setError("Username or password is incorrect.");
        showError("Login failed. Check your username and password.");
      } else {
        showSuccess("Logged in successfully. You can now create blogs.");
        router.push("/builder");
        router.refresh();
      }
    } catch {
      setError("Unable to log in. Please try again.");
      showError("Unable to log in. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      {!configured && (
        <p
          role="status"
          className="rounded-xl bg-orange-50 dark:bg-orange-950 p-4 text-orange-800 dark:text-orange-200"
        >
          Login is not configured yet. Contact the site administrator.
        </p>
      )}
      <label className="block">
        Username
        <input
          name="username"
          autoComplete="username"
          required
          maxLength={100}
          className="mt-2 w-full rounded-lg border p-3"
        />
      </label>
      <label className="block">
        Password
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          maxLength={256}
          className="mt-2 w-full rounded-lg border p-3"
        />
      </label>
      {error && (
        <p role="alert" className="text-red-700 dark:text-red-300">
          {error}
        </p>
      )}
      <button
        disabled={busy || !configured}
        className="w-full rounded-full bg-orange-500 px-6 py-3 font-semibold text-white disabled:opacity-50"
      >
        {busy ? "Logging in…" : "Log in"}
      </button>
    </form>
  );
}
