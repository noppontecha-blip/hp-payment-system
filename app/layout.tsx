import type { Metadata } from "next";
import { Kanit } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const kanit = Kanit({
  variable: "--font-kanit",
  subsets: ["latin", "thai"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "SPK Crane — ระบบบัญชีคุมบิลจ่าย HP",
  description: "ระบบบัญชีคุมบิลจ่าย HP สำหรับ SPK Crane",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className={`${kanit.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
