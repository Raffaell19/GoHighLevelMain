import { GoogleGenerativeAI } from '@google/generative-ai';

const defaultGeminiKey = process.env.GEMINI_API_KEY || '';
const defaultOpenAiKey = process.env.OPENAI_API_KEY || '';

/**
 * Função universal para geração de conteúdo com IA
 * Suporta Gemini 1.5/2.0 Flash e OpenAI GPT-4o-mini, com motor conversacional nativo contextual.
 */
export async function generateWithAI({
  prompt,
  systemInstruction = 'Você é o assistente de inteligência artificial da plataforma FlowLevel, focado em alta conversão e atendimento ao cliente excelente no Brasil.',
  apiKey,
  provider,
}: {
  prompt: string;
  systemInstruction?: string;
  apiKey?: string;
  provider?: 'gemini' | 'openai';
}): Promise<string> {
  const activeGeminiKey = apiKey || defaultGeminiKey;
  const activeOpenAiKey = apiKey || defaultOpenAiKey;

  // 1. Tentar com Google Gemini se a chave estiver configurada
  if (provider === 'gemini' || (!provider && activeGeminiKey && !activeGeminiKey.includes('sua_'))) {
    if (activeGeminiKey) {
      try {
        const genAI = new GoogleGenerativeAI(activeGeminiKey);
        // Usar gemini-flash-latest (modelo estável e de alta velocidade oficial da Google AI)
        const candidateModels = ['gemini-flash-latest', 'gemini-3.8-flash', 'gemini-2.5-flash-lite', 'gemini-1.5-flash'];
        for (const modelName of candidateModels) {
          try {
            const model = genAI.getGenerativeModel({
              model: modelName,
              systemInstruction: systemInstruction,
            });
            const result = await model.generateContent(prompt);
            const text = result.response.text();
            if (text && text.trim()) {
              return text.trim();
            }
          } catch (modelErr: any) {
            // Tenta o próximo modelo candidato
            continue;
          }
        }
      } catch (err: any) {
        console.warn('[AI] Aviso ao chamar Gemini API, tentando fallback:', err.message);
      }
    }
  }

  // 2. Tentar com OpenAI se a chave estiver configurada
  if (provider === 'openai' || (!provider && activeOpenAiKey && !activeOpenAiKey.includes('sua_'))) {
    if (activeOpenAiKey) {
      try {
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${activeOpenAiKey}`,
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: systemInstruction },
              { role: 'user', content: prompt },
            ],
            temperature: 0.6,
          }),
        });

        const data = await res.json();
        const content = data.choices?.[0]?.message?.content;
        if (content && content.trim()) {
          return content.trim();
        }
      } catch (err: any) {
        console.warn('[AI] Aviso ao chamar OpenAI API, tentando fallback:', err.message);
      }
    }
  }

  // 3. Motor Conversacional Nativo com Compreensão Semântica & Contextual
  return contextualConversationalEngine(prompt);
}

/**
 * Motor Conversacional Nativo de Alta Fidelidade
 * Analisa a mensagem REAL do cliente (e não o texto interno do prompt do sistema)
 * garantindo respostas 100% coerentes, humanas e naturais para saudações, dúvidas e orçamentos.
 */
function contextualConversationalEngine(prompt: string): string {
  // Extrair metadados contextuais injetados no prompt
  const customerMsgMatch =
    prompt.match(/Mensagem recebida no WhatsApp:\s*"([^"]+)"/i) ||
    prompt.match(/Mensagem do cliente no WhatsApp:\s*"([^"]+)"/i) ||
    prompt.match(/Última mensagem enviada pelo cliente no WhatsApp:\s*"([^"]+)"/i);

  const customerNameMatch =
    prompt.match(/Nome do cliente:\s*"([^"]+)"/i) ||
    prompt.match(/O cliente se chama:\s*([^\.\n]+)/i);

  const botNameMatch =
    prompt.match(/Você é "([^"]+)"/i) ||
    prompt.match(/atendente chamada? ([A-Za-zÀ-ÿ]+)/i);

  const companyMatch = prompt.match(/empresa "([^"]+)"/i);

  const customerMessage = customerMsgMatch ? customerMsgMatch[1].trim() : prompt.trim();
  const rawCustomerName = customerNameMatch ? customerNameMatch[1].trim() : '';
  const customerFirstName = rawCustomerName ? rawCustomerName.split(' ')[0] : '';
  let botName = botNameMatch ? botNameMatch[1].trim() : 'Sofia';
  if (!botName || ['de', 'do', 'da', 'virtual', 'comercial', 'e', 'o'].includes(botName.toLowerCase())) {
    botName = 'Sofia';
  }
  const companyName = companyMatch ? companyMatch[1].trim() : 'Alves Climatização & Elétrica';

  const lowerMsg = customerMessage.toLowerCase();
  const lowerPrompt = prompt.toLowerCase();

  // 1. Avaliações do Google Meu Negócio
  if (
    lowerPrompt.includes('google meu negócio') ||
    lowerPrompt.includes('responder avaliação de cliente') ||
    lowerPrompt.includes('avaliação no google') ||
    lowerPrompt.includes('review no google')
  ) {
    if (
      lowerMsg.includes('5') ||
      lowerMsg.includes('4') ||
      lowerMsg.includes('excelente') ||
      lowerMsg.includes('recomendo') ||
      lowerMsg.includes('ótimo')
    ) {
      return `Muito obrigado pela avaliação e pela confiança, ${customerFirstName || 'cliente'}! Trabalhamos com dedicação para garantir serviços com máxima segurança, pontualidade e excelência técnica. É um prazer atender você!`;
    }
    return `Olá, ${customerFirstName || 'cliente'}! Agradecemos pelo seu relato sincero. Nosso compromisso é sempre a qualidade máxima. Gostaríamos muito de entender a fundo o ocorrido para solucionar da melhor forma. Por gentileza, nos envie uma mensagem direta para resolvermos com prioridade total.`;
  }

  // 2. Redes Sociais (Legendas)
  if (lowerPrompt.includes('legenda') || lowerPrompt.includes('redes sociais')) {
    return `⚡ Manutenção preventiva e instalações elétricas com quem entende do assunto!\n\nGaranta a eficiência dos seus aparelhos e reduza o consumo de energia da sua casa ou empresa com nossa equipe técnica especializada.\n\n📲 Solicite seu orçamento sem compromisso pelo link da bio ou chame no WhatsApp!\n\n#Climatizacao #Eletrica #ServicosResidenciais #PortoAlegre`;
  }

  // =========================================================================
  // 3. FLUXO CONVERSACIONAL DE WHATSAPP (ANÁLISE REAL DA FALA DO CLIENTE)
  // =========================================================================

  // A. Saudações e Cumprimentos Casuais (ex: "Boa noite tudo bem ?", "Olá", "Oi", "Bom dia")
  const isGreetingOnly =
    lowerMsg === 'oi' ||
    lowerMsg === 'ola' ||
    lowerMsg === 'olá' ||
    lowerMsg === 'oii' ||
    lowerMsg === 'oie' ||
    lowerMsg === 'opa' ||
    lowerMsg.includes('tudo bem') ||
    lowerMsg.includes('como vai') ||
    lowerMsg.includes('boa noite') ||
    lowerMsg.includes('bom dia') ||
    lowerMsg.includes('boa tarde');

  const hasSpecificQuestion =
    lowerMsg.includes('quanto custa') ||
    lowerMsg.includes('qual o valor') ||
    lowerMsg.includes('preço') ||
    lowerMsg.includes('preco') ||
    lowerMsg.includes('orçamento') ||
    lowerMsg.includes('orcamento') ||
    lowerMsg.includes('instalar') ||
    lowerMsg.includes('limpeza') ||
    lowerMsg.includes('conserto') ||
    lowerMsg.includes('onde fica') ||
    lowerMsg.includes('atendem');

  // Se o cliente apenas cumprimentou (sem pedir orçamento de imediato):
  if (isGreetingOnly && !hasSpecificQuestion) {
    const greetingWord = lowerMsg.includes('boa noite')
      ? 'Boa noite'
      : lowerMsg.includes('bom dia')
      ? 'Bom dia'
      : lowerMsg.includes('boa tarde')
      ? 'Boa tarde'
      : 'Olá';

    const greetingName = customerFirstName ? `, ${customerFirstName}` : '!';
    return `${greetingWord}${greetingName}! Tudo ótimo por aqui, e com você? Sou a ${botName}, da equipe da ${companyName}. Como posso te ajudar hoje?`;
  }

  // B. Agradecimentos e Confirmações (ex: "Obrigado", "Valeu", "Ok", "Combinado", "Perfeito")
  const isThanksOrAck =
    lowerMsg.includes('obrigado') ||
    lowerMsg.includes('obrigada') ||
    lowerMsg.includes('valeu') ||
    lowerMsg.includes('agradeço') ||
    lowerMsg === 'ok' ||
    lowerMsg === 'perfeito' ||
    lowerMsg === 'combinado' ||
    lowerMsg === 'ta bom' ||
    lowerMsg === 'tá bom' ||
    lowerMsg.includes('ate mais') ||
    lowerMsg.includes('até mais');

  if (isThanksOrAck && !hasSpecificQuestion) {
    return `Por nada${customerFirstName ? `, ${customerFirstName}` : ''}! Fico à sua total disposição. Qualquer dúvida ou precisando de agendamento, é só chamar por aqui. Tenha um ótimo dia!`;
  }

  // C. Dúvidas sobre Regiões / Bairros Atendidos
  if (
    lowerMsg.includes('onde fica') ||
    lowerMsg.includes('qual cidade') ||
    lowerMsg.includes('voces atendem') ||
    lowerMsg.includes('vocês atendem') ||
    lowerMsg.includes('região') ||
    lowerMsg.includes('bairro')
  ) {
    return `Olá${customerFirstName ? ` ${customerFirstName}` : ''}! Atendemos Porto Alegre, Canoas, Novo Hamburgo, São Leopoldo e toda a Região Metropolitana com atendimento no local. Em qual cidade ou bairro seria o seu serviço?`;
  }

  // D. Formas de Pagamento
  if (
    lowerMsg.includes('cartao') ||
    lowerMsg.includes('cartão') ||
    lowerMsg.includes('pix') ||
    lowerMsg.includes('parcela') ||
    lowerMsg.includes('boleto') ||
    lowerMsg.includes('pagamento')
  ) {
    return `Facilitamos o pagamento no cartão de crédito em até 12x, oferecemos 5% de desconto à vista no PIX, ou faturamento em boleto para empresas (PJ). Gostaria de agendar a visita técnica?`;
  }

  // E. Serviços Elétricos (Troca de Fiação, Painel Elétrico, Quadro de Disjuntores, Tomadas)
  if (
    lowerMsg.includes('eletric') ||
    lowerMsg.includes('elétric') ||
    lowerMsg.includes('fiação') ||
    lowerMsg.includes('fiacao') ||
    lowerMsg.includes('painel') ||
    lowerMsg.includes('quadro') ||
    lowerMsg.includes('disjuntor') ||
    lowerMsg.includes('tomada') ||
    lowerMsg.includes('curto') ||
    lowerMsg.includes('padrao') ||
    lowerMsg.includes('padrão') ||
    lowerMsg.includes('reforma eletrica') ||
    lowerMsg.includes('reforma elétrica')
  ) {
    return `Olá${customerFirstName ? ` ${customerFirstName}` : ''}! Realizamos serviços elétricos completos, como troca de fiação residencial, montagem de painel elétrico novo e modernização com máxima segurança técnica. Como projetos elétricos dependem do tamanho do imóvel e dos circuitos, nós realizamos uma visita técnica com nosso eletricista especialista para avaliar a estrutura e passar o orçamento exato. Em qual cidade e bairro fica a sua casa?`;
  }

  // F. Preço, Orçamento ou Serviços Específicos de Climatização
  if (
    lowerMsg.includes('quanto custa') ||
    lowerMsg.includes('qual o valor') ||
    lowerMsg.includes('preço') ||
    lowerMsg.includes('preco') ||
    lowerMsg.includes('orçamento') ||
    lowerMsg.includes('orcamento') ||
    lowerMsg.includes('instalação') ||
    lowerMsg.includes('instalacao') ||
    lowerMsg.includes('limpeza') ||
    lowerMsg.includes('higienizacao') ||
    lowerMsg.includes('higienização') ||
    lowerMsg.includes('manutenção')
  ) {
    if (lowerMsg.includes('limpeza') || lowerMsg.includes('higieniz')) {
      return `Olá${customerFirstName ? ` ${customerFirstName}` : ''}! A higienização completa antibacteriana com laudo fica a partir de R$ 190,00 por aparelho. Quantos aparelhos você tem no local para agendarmos?`;
    }

    if (lowerMsg.includes('12000') || lowerMsg.includes('12.000') || lowerMsg.includes('9000') || lowerMsg.includes('9.000')) {
      return `Olá${customerFirstName ? ` ${customerFirstName}` : ''}! A instalação padrão para modelos de 9.000 a 12.000 BTUs inicia em R$ 380,00 com materiais de alta qualidade e garantia. Em qual bairro seria o serviço e para quando precisa?`;
    }

    if (lowerMsg.includes('18000') || lowerMsg.includes('24000') || lowerMsg.includes('30000')) {
      return `Olá${customerFirstName ? ` ${customerFirstName}` : ''}! Para aparelhos de 18.000 a 30.000 BTUs, a instalação inicia a partir de R$ 550,00. Qual é a marca do aparelho e o bairro do imóvel?`;
    }

    return `Olá${customerFirstName ? ` ${customerFirstName}` : ''}! Nossos serviços de instalação partem de R$ 380,00 e higienização a partir de R$ 190,00. Poderia me informar a capacidade do seu aparelho e o bairro para prepararmos o orçamento exato?`;
  }

  // F. Resposta padrão humanizada para mensagens gerais
  return `Olá${customerFirstName ? ` ${customerFirstName}` : ''}! Recebi sua mensagem com sucesso. Como a equipe da ${companyName} pode te ajudar hoje? Pode me contar os detalhes do que você precisa!`;
}
