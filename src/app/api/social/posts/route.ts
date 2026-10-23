import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { SocialPost } from '@/types';

const samplePosts = (subaccountId: string, companyName: string): SocialPost[] => [
  {
    id: 'post-init-1',
    subaccountId,
    platforms: ['instagram', 'facebook', 'linkedin'],
    content: `🚀 Transformando negócios com automação inteligente e presença digital de alta conversão! Na ${companyName}, cuidamos do seu atendimento ao cliente 24h por dia para que você nunca perca uma oportunidade de venda. Quer saber como implementar na sua empresa? Comente "QUERO" ou clique no link da bio! #Inovacao #Automacao #CRM #MarketingDigital #Vendas`,
    mediaUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop&q=80',
    scheduledDate: 'Publicado hoje às 10:30',
    status: 'published',
    likes: 47,
    comments: 12,
    shares: 8,
    publishedAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    platformResults: {
      instagram: { status: 'published', id: 'ig_demo_1' },
      facebook: { status: 'published', id: 'fb_demo_1' },
      linkedin: { status: 'published', id: 'li_demo_1' },
    },
  },
  {
    id: 'post-init-2',
    subaccountId,
    platforms: ['instagram', 'facebook'],
    content: `💡 Dica de Ouro da Semana: Responder clientes no WhatsApp em menos de 1 minuto aumenta em até 391% a taxa de conversão! Automatize suas respostas iniciais sem perder a humanização. Fale com a equipe da ${companyName} e dê um salto no seu faturamento. #AtendimentoWhatsApp #Escala #Sucesso`,
    mediaUrl: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=800&auto=format&fit=crop&q=80',
    scheduledDate: 'Hoje às 17:00',
    status: 'scheduled',
    likes: 0,
    comments: 0,
    shares: 0,
  },
];

export async function GET(request: NextRequest) {
  try {
    const supabase = getServiceSupabase();
    const { searchParams } = new URL(request.url);
    const subaccountId = searchParams.get('subaccountId');

    if (!subaccountId) {
      return NextResponse.json({ error: 'subaccountId é obrigatório' }, { status: 400 });
    }

    const { data: sub } = await supabase
      .from('subaccounts')
      .select('id, name')
      .eq('id', subaccountId)
      .maybeSingle();

    return NextResponse.json({
      posts: samplePosts(subaccountId, sub?.name || 'Connect Digital'),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID do post é obrigatório' }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: 'Publicação removida com sucesso.' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
