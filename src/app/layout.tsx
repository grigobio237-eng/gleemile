import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Gleemile | 우리 팀의 즐거운 기록",
  description: "스포츠 팀의 실시간 데이터 시너지와 철통 보안 웰니스 관리를 위한 고성능 라운지",
  icons: {
    icon: "/images/happy.webp",
    apple: "/images/confident.png"
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Gleemile"
  }
};

import { InstallPrompt } from "@/components/pwa/InstallPrompt";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#FAF9F6]">
        <Providers>{children}</Providers>
        <InstallPrompt />
      </body>
    </html>
  );
}
