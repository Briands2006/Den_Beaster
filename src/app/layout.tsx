import type { Metadata } from "next";
import { Metal_Mania, Barlow_Condensed } from "next/font/google";
import "./globals.css";

// next/font downloadt de fonts tijdens de build en serveert ze zelf:
// geen aanvraag naar Google en geen verspringende tekst tijdens het laden.
// "variable" maakt er een CSS-variabele van, die globals.css aan Tailwind koppelt.
const metal = Metal_Mania({ weight: "400", subsets: ["latin"], variable: "--font-metal" });
const body = Barlow_Condensed({ weight: ["400", "600"], subsets: ["latin"], variable: "--font-body" });

export const metadata: Metadata = {
  title: "Pit Ledger",
  description: "Wie kocht welke tickets, en wie moet wie nog terugbetalen 🤘",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // Geen "dark"-class: de app is altijd licht, dus de dark:-varianten van shadcn blijven uit.
    <html lang="nl" className={`${metal.variable} ${body.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
