import type { Metadata } from "next";
import {
  Bricolage_Grotesque,
  JetBrains_Mono,
  Source_Sans_3,
} from "next/font/google";
import type { ReactNode } from "react";
import "./tokens.css";
import "./globals.css";

// Self-hosted at build time; exposed as CSS variables used by tokens.css.
const display = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage",
  display: "swap",
});
const body = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-source-sans",
  display: "swap",
});
const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Harbor renters quote",
  description:
    "Maps a standard customer profile to Harbor Assurance's renters quote form",
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${body.variable} ${mono.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
