"use client";

import type { ReactNode } from "react";
import toast, { Toaster, ToastBar } from "react-hot-toast";

const showError = (message: string) => {
  toast.error(message, {
    id: message === "Database unavailable" ? "database-unavailable" : message,
    ariaProps: { role: "alert", "aria-live": "assertive" },
  });
};

export function useErrorToast() {
  return showError;
}

const showSuccess = (message: string) => {
  toast.success(message, {
    id: message,
    ariaProps: { role: "status", "aria-live": "polite" },
  });
};

export function useSuccessToast() {
  return showSuccess;
}

export default function ToastProvider({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <Toaster
        position="bottom-right"
        containerStyle={{ zIndex: 100 }}
        toastOptions={{
          duration: 6000,
          error: {
            className:
              "!border !border-red-200 dark:!border-red-800 !bg-red-50 dark:!bg-red-950 !text-red-800 dark:!text-red-200",
          },
          success: {
            duration: 4000,
            className:
              "!border !border-green-200 dark:!border-green-800 !bg-green-50 dark:!bg-green-950 !text-green-800 dark:!text-green-200",
          },
        }}
      >
        {(notification) => (
          <ToastBar toast={notification}>
            {({ icon, message }) => (
              <>
                {icon}
                {message}
                <button
                  type="button"
                  aria-label="Dismiss notification"
                  onClick={() => toast.dismiss(notification.id)}
                  className="ml-2 rounded p-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-current"
                >
                  <span aria-hidden="true">×</span>
                </button>
              </>
            )}
          </ToastBar>
        )}
      </Toaster>
    </>
  );
}
