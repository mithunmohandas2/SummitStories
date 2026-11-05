import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import MainLayout from "../layouts/MainLayout";
import AuthProvider from "../components/AuthProvider";
import ToastProvider from "../components/ToastProvider";
import PwaProvider from "../components/pwa/PwaProvider";
import { themeInitializationScript } from "../lib/theme";
import { siteUrl } from "../lib/blog-metadata";
import "../index.css";

export const metadata: Metadata = {
  metadataBase: siteUrl(),
  title: {
    default: "Summit Stories",
    template: "%s | Summit Stories",
  },
  description:
    "A Blog to share travel diaries, stories, captured images, and unforgettable adventures.",
  applicationName: "Summit Stories",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Summit Stories",
    statusBarStyle: "default",
  },
  icons: { icon: "/images/logo.webp", apple: "/icons/apple-touch-icon.png" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f97316",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <script
          dangerouslySetInnerHTML={{ __html: themeInitializationScript }}
        />
        <ToastProvider>
          <AuthProvider>
            <PwaProvider>
              <MainLayout>{children}</MainLayout>
            </PwaProvider>
          </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
