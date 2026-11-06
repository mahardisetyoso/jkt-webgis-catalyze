import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Manrope } from "next/font/google";
import "./v2.css";

// Geist isn't in next/font/google on this Next version (needs the separate `geist`
// package); Manrope is an approved typeface and ships via Google Fonts.
const sans = Manrope({ subsets: ["latin"], variable: "--font-sans", display: "swap" });

export const metadata: Metadata = {
  title: "Jakarta — Lima Wajah Satu Kota · v2",
  description: "Redesign (preview) scrollytelling WebGIS lima kota administrasi DKI Jakarta.",
};

// Nested layout: scopes the Geist font + v2.css to the /v2 subtree only.
// The existing / route is untouched.
export default function V2Layout({ children }: { children: ReactNode }) {
  return <div className={`v2-root ${sans.variable}`}>{children}</div>;
}
