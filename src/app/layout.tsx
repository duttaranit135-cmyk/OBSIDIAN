import type { Metadata } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import CustomCursor from "@/components/CustomCursor";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "OBSIDIAN — Where Form Meets Forever",
  description:
    "OBSIDIAN transforms your physical business into a fully functional, custom digital storefront. Not a template. A monument.",
  openGraph: {
    title: "OBSIDIAN",
    description: "Where Form Meets Forever.",
    siteName: "OBSIDIAN",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${cormorant.variable} ${inter.variable}`}
      style={{ scrollBehavior: "auto" }}
    >
      <body>
        <CustomCursor />
        {children}
      </body>
    </html>
  );
}
