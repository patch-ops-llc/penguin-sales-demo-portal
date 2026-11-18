import type { Metadata, Viewport } from "next";
import { lexend, poppins } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Penguin Sales Demo Portal", template: "%s | Penguin Sales Demo Portal" },
  description: "Private sales demo portal from Penguin Strategies.",
  robots: { index: false, follow: false },
  icons: { icon: "/penguin-mark.svg" },
};

export const viewport: Viewport = { width: 1280 };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${lexend.variable} ${poppins.variable} h-full antialiased`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
