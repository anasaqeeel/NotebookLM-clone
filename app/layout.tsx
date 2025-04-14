import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ResearchProvider } from "@/contexts/research-context";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "LAv1 AI Research",
  description: "AI-powered marketing research assistant",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ResearchProvider>
          {children}
        </ResearchProvider>
      </body>
    </html>
  );
}
