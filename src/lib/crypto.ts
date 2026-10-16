import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const SECRET_KEY = process.env.VAULT_SECRET_KEY || 'flowlevel_secret_vault_key_2026_xyz';

// Garante uma chave de exatamente 32 bytes (256 bits)
function getKey(): Buffer {
  return crypto.createHash('sha256').update(SECRET_KEY).digest();
}

/**
 * Criptografa um objeto ou string para salvar com segurança no banco
 */
export function encryptCredentials(data: Record<string, any> | string): string {
  const text = typeof data === 'string' ? data : JSON.stringify(data);
  const iv = crypto.randomBytes(12); // 96 bits para GCM
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  // Formato: iv:authTag:encryptedText
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

/**
 * Descriptografa uma credencial recuperada do banco
 */
export function decryptCredentials<T = Record<string, any>>(encryptedBundle: string): T {
  try {
    const [ivHex, authTagHex, encryptedText] = encryptedBundle.split(':');
    if (!ivHex || !authTagHex || !encryptedText) {
      throw new Error('Formato de credencial criptografada inválido');
    }

    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    try {
      return JSON.parse(decrypted) as T;
    } catch {
      return decrypted as unknown as T;
    }
  } catch (err: any) {
    throw new Error(`Falha ao descriptografar credencial: ${err.message}`);
  }
}
