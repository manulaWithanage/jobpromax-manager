import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from "@/context/AuthContext";
import { ReportProvider } from "@/context/ReportContext";
import { ActivityProvider } from "@/context/ActivityContext";
import "./globals.css";
import { cn } from "@/lib/utils";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "JobProMax Progress Hub",
  description: "Real-time project progress dashboard",
};

import { AppProviders } from "@/components/providers/AppProviders";
import Sidebar from "@/components/layout/Sidebar";

import { Shell } from "@/components/layout/Shell";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <AuthProvider>
          <AppProviders>
            <ReportProvider>
              <ActivityProvider>
                <Shell>
                  {children}
                </Shell>
              </ActivityProvider>
            </ReportProvider>
          </AppProviders>
        </AuthProvider>
      </body>
    </html>
  );
}
