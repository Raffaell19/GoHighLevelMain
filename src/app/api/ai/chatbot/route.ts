import { NextRequest, NextResponse } from 'next/server';
import { generateWithAI } from '@/lib/ai';

export async function POST(request: NextRequest) {
  try {
    const { message, contactName, companyName, segment, systemPromptOverride } = await request.json();

    const prompt = systemPromptOverride || `Você é o atendente de vendas e relacionamento no WhatsApp da empresa "${companyName}" (Segmento: ${segment || 'Serviços'}).
O cliente se chama: ${contactName || 'Cliente'}.
Última mensagem enviada pelo cliente no WhatsApp:
"${message}"

Objetivo:
1. Responda com clareza, empatia e presteza em português do Brasil.
2. Seja objetivo e persuasivo (máximo 2 a 3 parágrafos curtos, ideais para leitura no celular).
3. Conduza o cliente para o próximo passo (ex: agendar uma visita, informar a localização, ou pedir detalhes para orçamento).
4. Retorne apenas o texto da mensagem a ser enviada no WhatsApp.`;

    const response = await generateWithAI({
      prompt,
      systemInstruction: `Você é o melhor especialista em atendimento comercial e conversão no WhatsApp do Brasil para ${companyName}.`,
    });

    return NextResponse.json({ response });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
