/**
 * Utilitários de formatação de telefone e resolução de nomes de contatos/leads
 */

/**
 * Formata um número de telefone com DDI, DDD e separadores legíveis.
 * Exemplos:
 * 5551999995293 -> +55 (51) 99999-5293
 * 555132224444  -> +55 (51) 3222-4444
 * 51999995293   -> +55 (51) 99999-5293
 * +12025550192  -> +1 (202) 555-0192
 */
export function formatFullPhoneNumber(phone: string | null | undefined): string {
  if (!phone) return '';
  const trimmed = phone.trim();
  const digits = trimmed.replace(/\D/g, '');
  if (!digits) return trimmed;

  // Brasil com DDI 55 (13 dígitos: 55 + DDD + 9 dígitos celular)
  if (digits.startsWith('55') && digits.length === 13) {
    const ddd = digits.slice(2, 4);
    const part1 = digits.slice(4, 9);
    const part2 = digits.slice(9);
    return `+55 (${ddd}) ${part1}-${part2}`;
  }

  // Brasil com DDI 55 (12 dígitos: 55 + DDD + 8 dígitos fixo)
  if (digits.startsWith('55') && digits.length === 12) {
    const ddd = digits.slice(2, 4);
    const part1 = digits.slice(4, 8);
    const part2 = digits.slice(8);
    return `+55 (${ddd}) ${part1}-${part2}`;
  }

  // Brasil sem DDI 55 (11 dígitos: DDD + 9 dígitos celular)
  if (digits.length === 11) {
    const ddd = digits.slice(0, 2);
    const part1 = digits.slice(2, 7);
    const part2 = digits.slice(7);
    return `+55 (${ddd}) ${part1}-${part2}`;
  }

  // Brasil sem DDI 55 (10 dígitos: DDD + 8 dígitos fixo)
  if (digits.length === 10) {
    const ddd = digits.slice(0, 2);
    const part1 = digits.slice(2, 6);
    const part2 = digits.slice(6);
    return `+55 (${ddd}) ${part1}-${part2}`;
  }

  // EUA / Canadá (DDI 1 + 10 dígitos)
  if (digits.startsWith('1') && digits.length === 11) {
    const area = digits.slice(1, 4);
    const part1 = digits.slice(4, 7);
    const part2 = digits.slice(7);
    return `+1 (${area}) ${part1}-${part2}`;
  }

  // Outros números internacionais
  if (digits.length >= 8) {
    return `+${digits}`;
  }

  return trimmed;
}

/**
 * Verifica se um nome é genérico ou não identificado (ex: 'Contato 5293', 'Contato WhatsApp', 'Sem nome', vazio, etc.)
 */
export function isUnidentifiedContactName(name: string | null | undefined): boolean {
  if (!name) return true;
  const trimmed = name.trim();
  if (!trimmed) return true;

  const lower = trimmed.toLowerCase();
  if (
    lower === 'contato' ||
    lower === 'contato whatsapp' ||
    lower === 'contato adicionado' ||
    lower === 'sem nome' ||
    lower === 'desconhecido' ||
    lower === 'lead automático' ||
    lower === 'whatsapp inbound'
  ) {
    return true;
  }

  // Detecta padrões como "Contato 5293", "Contato 1234", "contato-5293"
  if (/^contato[\s_-]*\d{2,6}$/i.test(trimmed)) {
    return true;
  }

  // Se o nome for apenas números (ou telefone cru como 5551999995293 ou +55 51...)
  const digitsOnly = trimmed.replace(/\D/g, '');
  if (digitsOnly.length >= 8 && digitsOnly === trimmed.replace(/[\s+()-]/g, '')) {
    return true;
  }

  return false;
}

/**
 * Retorna o nome do contato se identificado, ou o telefone completo formatado caso o nome não seja identificado.
 */
export function getContactDisplayName(
  name: string | null | undefined,
  phone: string | null | undefined,
  fallback = 'Contato'
): string {
  const trimmedName = (name || '').trim();

  if (!isUnidentifiedContactName(trimmedName)) {
    return trimmedName;
  }

  // Nome não identificado: tentar usar o telefone completo formatado
  if (phone && phone.trim()) {
    return formatFullPhoneNumber(phone);
  }

  // Se não tiver telefone disponível, mas tinha algo no nome que não seja vazio
  if (trimmedName) {
    return trimmedName;
  }

  return fallback;
}
