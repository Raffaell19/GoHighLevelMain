import { NextRequest, NextResponse } from 'next/server';
import { generateWithAI } from '@/lib/ai';

export async function POST(request: NextRequest) {
  try {
    const { topic, companyName, segment, platforms } = await request.json();

    const prompt = `Escreva uma legenda de alta conversão para redes sociais (${(platforms || ['Instagram']).join(', ')}) para a empresa "${companyName}".
Segmento: ${segment || 'Serviços especializados'}.
Tema ou foco do post: "${topic || 'Dicas de manutenção preventiva e contratação de serviços profissionais'}"

Diretrizes:
1. Gancho inicial impactante nos primeiros 5 segundos de leitura.
2. Desenvolvimento com valor real para quem lê (dor -> solução).
3. Chamada para ação clara (CTA) convidando para chamar no link da bio ou enviar mensagem no WhatsApp.
4. Inclua emojis estratégicos e 5 a 8 hashtags relevantes para o mercado brasileiro.
5. Retorne apenas o texto final da legenda pronto para publicação.`;

    const caption = await generateWithAI({
      prompt,
      systemInstruction: 'Você é um estrategista de conteúdo para Instagram e redes sociais com foco em negócios locais e serviços.',
    });

    return NextResponse.json({ caption });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
