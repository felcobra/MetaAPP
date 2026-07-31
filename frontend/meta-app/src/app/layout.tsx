import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Meta App | Meta Consultoria",
  description: "Plataforma interna da Meta Consultoria.",
  icons: {
    icon: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="h-full antialiased">
      <body className="flex min-h-full flex-col bg-surface text-slate-900">
        {children}
      </body>
    </html>
  );
}
