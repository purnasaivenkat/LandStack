import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LandStack — GIS + Parcel Engine | SIH 2026 PS 26014",
  description: "An Integrated GIS-based Digital Public Infrastructure for Land Governance powered by PostGIS & MapLibre GL JS.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased h-screen w-screen overflow-hidden bg-slate-950">
        {children}
      </body>
    </html>
  );
}
