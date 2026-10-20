const EVOLUTION_URL = process.env.EVOLUTION_API_URL || 'https://evolution-api-kix9.onrender.com';
const EVOLUTION_KEY = process.env.EVOLUTION_API_KEY || 'flowlevel_secret_key_2026';

/**
 * Busca a foto de perfil real diretamente do WhatsApp via Evolution API
 */
export async function fetchWhatsAppProfilePicture(
  phone: string,
  instanceName?: string
): Promise<string | null> {
  const digits = (phone || '').replace(/[^0-9]/g, '');
  if (!digits || digits.length < 8) return null;
  const instance = instanceName || 'alves-climatiza--o---el-trica';

  try {
    const res = await fetch(
      `${EVOLUTION_URL}/chat/fetchProfilePictureUrl/${encodeURIComponent(instance)}`,
      {
        method: 'POST',
        headers: {
          apikey: EVOLUTION_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ number: digits }),
        cache: 'no-store',
      }
    );
    const data = await res.json().catch(() => ({}));
    if (
      res.ok &&
      data?.profilePictureUrl &&
      typeof data.profilePictureUrl === 'string' &&
      data.profilePictureUrl.startsWith('http')
    ) {
      return data.profilePictureUrl;
    }
  } catch (err) {
    console.warn(`[WhatsApp Avatar] Erro ao buscar foto para ${digits}:`, err);
  }
  return null;
}

/**
 * Gera um avatar de iniciais limpo e personalizado como fallback
 */
export function getDefaultAvatarUrl(name?: string): string {
  const safeName = name && name.trim() ? name.trim() : 'Contato WhatsApp';
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(safeName)}&background=0284c7&color=ffffff&bold=true&size=128`;
}

/**
 * Verifica se a URL é de uma foto real e não de placeholders genéricos antigos
 */
export function isRealAvatar(url?: string | null): boolean {
  if (!url || typeof url !== 'string') return false;
  if (url.includes('unsplash.com')) return false;
  return url.startsWith('http');
}
