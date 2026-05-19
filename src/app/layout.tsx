import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { DataProvider } from "@/context/DataContext";
import { AuthProvider } from "@/context/AuthContext";
import { Sidebar } from "@/components/Sidebar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Productivito-Meter",
  description: "Track your productivity, build streaks, and crush your goals",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

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
      <body className="min-h-screen flex bg-background text-foreground">
        <AuthProvider>
          <DataProvider>
            <Sidebar />
            <main className="flex-1 pt-16 pb-20 px-4 md:pt-0 md:pb-0 md:ml-64 md:p-8 overflow-auto min-h-screen">
              {children}
            </main>
          </DataProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
