import type { Metadata } from "next";
import "./globals.css";
import { AppProvider } from "@/context/AppContext";

export const metadata: Metadata = {
  title: "FlowLevel — CRM, WhatsApp Omnichannel e Automação B2B",
  description: "Plataforma Multi-Tenant de Vendas, WhatsApp, Prospecção Google Maps e Automação de Marketing",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="dark h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased bg-black text-white min-h-[100svh] selection:bg-[#c6f24e] selection:text-black">
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
