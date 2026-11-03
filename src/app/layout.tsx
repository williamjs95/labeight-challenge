import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./tokens.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Harbor renters quote",
  description: "Standard profile to Harbor Assurance quote form adapter",
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
