import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PSI Public Works Intelligence Platform — Prototype | Pioneer Smart Innovate",
  description:
    "Clickable prototype of the PSI Public Works Intelligence Platform, built by Pioneer Smart Innovate Private Limited as a capability demo for Public Works Departments. Illustrative synthetic data.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
