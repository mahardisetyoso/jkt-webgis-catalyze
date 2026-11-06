import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Manrope } from "next/font/google";
import "maplibre-gl/dist/maplibre-gl.css";
import "./globals.css";
import "./v2/v2.css";

// Manrope (approved typeface). Geist isn't in next/font/google on this Next
// version; see app/v2/v2.css for the design tokens.
const sans = Manrope({ subsets: ["latin"], variable: "--font-sans", display: "swap" });

export const metadata: Metadata = {
  title: "Jakarta — Lima Wajah Satu Kota",
  description:
    "Scrollytelling WebGIS lima kota administrasi DKI Jakarta: bisnis, pendidikan, pop culture, perdagangan, dan industri.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="id">
      <body>
        <div className={`v2-root ${sans.variable}`}>{children}</div>
      </body>
    </html>
  );
}
