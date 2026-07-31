import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import { AuthProvider } from "@/lib/auth-context";
import "./globals.css";

const montserrat = Montserrat({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  variable: "--font-montserrat",
});

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
    <html
      lang="pt-BR"
      className={`${montserrat.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-surface text-slate-900">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
