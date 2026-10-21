import type { Metadata } from 'next';
import './globals.css';
import { AppProvider } from '@/context/AppContext';

export const metadata: Metadata = {
  title: 'FlowLevel | CRM, WhatsApp, Google & Redes Sociais',
  description:
    'Plataforma completa inspirada no GoHighLevel para gestão de CRM Kanban, automação de WhatsApp com Chatbot híbrido, gerenciamento de perfil do Google Meu Negócio e agendamento de redes sociais.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="dark">
      <body className="bg-slate-950 text-slate-100 antialiased min-h-screen">
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
