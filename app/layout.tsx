import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "WP Agent Suite — Dev Cabin Technologies",
  description: "5 AI Agents built for WordPress professionals.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
