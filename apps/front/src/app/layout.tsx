"use client";

import { Inter } from "next/font/google";
import { useEffect } from "react";
import "./globals.css";
import { Sidebar } from "../components/sidebar/Sidebar";
import { usePathname } from "next/navigation";
import { Header } from "../components/header/header";
import { clearLegacyP2pnetSessionCache } from "@/src/lib/clearLegacyP2pnetSessionCache";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const isAnalysisPage = pathname === "/nova-contagem/analise";

  useEffect(() => {
    clearLegacyP2pnetSessionCache();
  }, []);

  return (
    <html lang="pt-br">
      <head>
        <title>Aglo</title>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </head>
      <body className={inter.className}>
        <div className="flex h-screen bg-[#F8FAFC]">
          {!isAnalysisPage && <Sidebar />}

          <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
            {isAnalysisPage && <Header />}

            <div className="min-w-0 flex-1 overflow-y-auto">{children}</div>
          </main>
        </div>
      </body>
    </html>
  );
}
