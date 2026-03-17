import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";

export const metadata: Metadata = {
  title: "BIGSHOT | EVE Frontier Bounty Board",
  description: "Decentralized player-to-player bounty contracts for EVE Frontier.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" style={{ backgroundColor: '#050505', color: '#fafae5' }}>
      <body 
        className="bg-scanlines dot-grid antialiased"
        style={{ backgroundColor: '#050505', color: '#fafae5', minHeight: '100vh', margin: 0 }}
      >
        <Header />
        <div className="relative z-10 w-full px-6 lg:px-12 max-w-7xl mx-auto pt-20 pb-20">
          {children}
        </div>
      </body>
    </html>
  );
}
