"use client";

import { useId, useState, type FormEvent } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useErrorToast, useSuccessToast } from "./ToastProvider";

export default function LoginForm({ configured }: { configured: boolean }) {
  const router = useRouter();
  const showError = useErrorToast();
  const showSuccess = useSuccessToast();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const passwordId = useId();

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
      <div>
        <label htmlFor={passwordId} className="block">Password</label>
        <div className="relative mt-2">
          <input
            id={passwordId}
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            maxLength={256}
            className="w-full rounded-lg border p-3 pr-12 [&::-ms-reveal]:hidden"
          />
          <button
            type="button"
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-pressed={showPassword}
            aria-controls={passwordId}
            onClick={() => setShowPassword(visible => !visible)}
            className="absolute inset-y-0 right-0 flex items-center justify-center rounded-r-lg px-3 text-gray-500 hover:text-orange-600 dark:text-gray-400 dark:hover:text-orange-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-500"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
              <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
              <circle cx="12" cy="12" r="3" />
              {showPassword && <path d="m3 3 18 18" />}
            </svg>
          </button>
        </div>
      </div>
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
