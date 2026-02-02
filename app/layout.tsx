import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NexusQA",
  description: "NexusQA \u0013 Unified Test Management & Traceability for ISO/IEC/IEEE 29119",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-neutral-950 text-neutral-50`}
      >
        <div className="min-h-screen">
          <header className="border-b border-neutral-900 bg-neutral-950/95">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3 text-sm">
              <Link href="/projects" className="font-semibold tracking-tight text-neutral-50">
                NexusQA
              </Link>
              <nav className="flex items-center gap-4 text-xs text-neutral-300">
                <Link href="/projects" className="hover:text-neutral-50">
                  Projects
                </Link>
                <Link href="/test-case" className="hover:text-neutral-50">
                  Test Case Grid
                </Link>
                <Link href="/execution" className="hover:text-neutral-50">
                  Execution & TSR
                </Link>
                <Link href="/defects/manage" className="hover:text-neutral-50">
                  Defects
                </Link>
              </nav>
            </div>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
