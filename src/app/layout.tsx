import type { Metadata } from "next";
import type { ReactNode } from "react";
import MainLayout from "../layouts/MainLayout";
import AuthProvider from "../components/AuthProvider";
import { themeInitializationScript } from "../lib/theme";
import "../index.css";

export const metadata: Metadata = {
  title: {
    default: "Summit Stories",
    template: "%s | Summit Stories",
  },
  description:
    "A Blog to share travel diaries, stories, captured images, and unforgettable adventures.",
  icons: { icon: "/images/logo.webp" },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <script dangerouslySetInnerHTML={{ __html: themeInitializationScript }} />
        <AuthProvider>
          <MainLayout>{children}</MainLayout>
        </AuthProvider>
      </body>
    </html>
  );
}
