import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fight Club Agents",
  description: "Autonomous AI agent ecosystem sandbox",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
