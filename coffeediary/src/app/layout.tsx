import type { Metadata } from "next";
import "./globals.css";
import { Inter } from "next/font/google";
import Header from "@/components/layout/Header";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CoffeeDiary - コーヒー記録アプリ",
  description: "あなたのコーヒー体験を記録・管理するコーヒーダイアリーアプリ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={`${inter.className} min-h-screen bg-zinc-50`}>
        <Header />
        <main className="container mx-auto pb-16 pt-2">
          {children}
        </main>
        <footer className="py-6 border-t mt-12 text-center text-zinc-500 text-sm">
          <div className="container mx-auto">
            &copy; {new Date().getFullYear()} CoffeeDiary - コーヒー記録アプリ
          </div>
        </footer>
      </body>
    </html>
  );
}
