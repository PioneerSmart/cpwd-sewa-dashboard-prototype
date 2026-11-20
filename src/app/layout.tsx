import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CPWD Sewa Analytics Dashboard — Prototype | Pioneer Smart Innovate",
  description:
    "Clickable prototype of the CPWD Sewa Analytics Dashboard, built by Pioneer Smart Innovate Private Limited for appraisal purposes. Illustrative synthetic data.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
