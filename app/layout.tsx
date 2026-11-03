import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Jakarta — Lima Wajah Satu Kota",
  description:
    "Scrollytelling WebGIS lima kota administrasi DKI Jakarta: bisnis, pendidikan, pop culture, perdagangan, dan industri.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
