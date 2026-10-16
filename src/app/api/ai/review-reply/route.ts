import { NextRequest, NextResponse } from 'next/server';
import { generateWithAI } from '@/lib/ai';

export async function POST(request: NextRequest) {
  try {
    const { authorName, rating, comment, companyName } = await request.json();

    const prompt = `Gere uma resposta pública oficial para uma avaliação no Google Meu Negócio da empresa "${companyName}".
Dados da avaliação:
- Cliente: ${authorName}
- Nota: ${rating} estrelas de 5
- Comentário do cliente: "${comment || 'Sem comentário, apenas avaliação com estrelas'}"

Diretrizes obrigatórias:
1. Tom: Humano, caloroso, profissional e cordial (sem parecer robótico).
2. Se a nota for 4 ou 5 estrelas: Agradeça pelo tempo e confiança, mencione o compromisso com pontualidade e excelência, e termine convidando para contar sempre com a empresa.
3. Se a nota for 1, 2 ou 3 estrelas: Demonstre empatia imediata, assuma responsabilidade com elegância sem entrar em discussões públicas e convide o cliente para resolver a situação com prioridade no canal direto/WhatsApp.
4. Tamanho: Entre 2 e 4 frases bem pontuadas.
5. Retorne APENAS o texto da resposta para ser publicado diretamente.`;

    const reply = await generateWithAI({
      prompt,
      systemInstruction: 'Você é um especialista em reputação de marcas locais no Google Maps e SEO Local.',
    });

    return NextResponse.json({ reply });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
