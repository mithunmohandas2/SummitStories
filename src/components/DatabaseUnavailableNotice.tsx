"use client";

import { useEffect } from "react";
import { useErrorToast } from "./ToastProvider";

export default function DatabaseUnavailableNotice() {
  const showError = useErrorToast();
  useEffect(() => {
    showError("Database unavailable");
  }, [showError]);
  return (
    <p className="px-6 py-10 text-red-700 dark:text-red-300">
      Database unavailable. Please try again later.
    </p>
  );
}
