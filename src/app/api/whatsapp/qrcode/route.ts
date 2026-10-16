import { NextResponse } from 'next/server';

const DEFAULT_EVOLUTION_URL = process.env.EVOLUTION_API_URL || 'https://evolution-api-kix9.onrender.com';
const DEFAULT_EVOLUTION_KEY = process.env.EVOLUTION_API_KEY || 'flowlevel_secret_key_2026';
const WEBHOOK_URL = process.env.NEXT_PUBLIC_APP_URL
  ? `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/whatsapp`
  : 'https://flowlevel.vercel.app/api/webhooks/whatsapp';

function cleanInstanceName(raw: string): string {
  if (!raw) return 'flowlevel_main';
  const clean = raw
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove acentos
    .replace(/[^a-zA-Z0-9_-]/g, '_') // caracteres especiais viram _
    .replace(/_+/g, '_')             // remove múltiplos _
    .replace(/^_+|_+$/g, '')         // trim _
    .toLowerCase();
  return clean || 'flowlevel_main';
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const rawInstance = searchParams.get('instance') || 'flowlevel_main';
    const instance = cleanInstanceName(rawInstance);

    const apiUrl = searchParams.get('apiUrl') || DEFAULT_EVOLUTION_URL;
    const apiKey = searchParams.get('apiKey') || DEFAULT_EVOLUTION_KEY;

    // 1. Verificar se a instância existe e qual o estado
    const stateRes = await fetch(`${apiUrl}/instance/connectionState/${encodeURIComponent(instance)}`, {
      headers: { 'apikey': apiKey },
      cache: 'no-store',
    });

    const stateStatus = stateRes.status;
    const stateData = await stateRes.json().catch(() => ({}));

    // Se a instância já está conectada
    if (stateStatus === 200 && stateData?.instance?.state === 'open') {
      return NextResponse.json({
        connected: true,
        state: 'open',
        instance,
        message: 'WhatsApp já está conectado!',
      });
    }

    // Se a instância não existe (404), vamos criar automaticamente na hora!
    if (stateStatus === 404 || stateData?.error === 'Not Found') {
      console.log(`[Auto-Create] Criando instância "${instance}" na Evolution API...`);
      const createRes = await fetch(`${apiUrl}/instance/create`, {
        method: 'POST',
        headers: {
          'apikey': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          instanceName: instance,
          token: 'flowlevel_token_2026',
          qrcode: true,
          integration: 'WHATSAPP-BAILEYS',
        }),
      });

      console.log(`[Auto-Create] Status criação:`, createRes.status);

      // Configurar o Webhook oficial
      await fetch(`${apiUrl}/webhook/set/${encodeURIComponent(instance)}`, {
        method: 'POST',
        headers: {
          'apikey': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          webhook: {
            enabled: true,
            url: WEBHOOK_URL,
            byEvents: false,
            base64: false,
            events: ['MESSAGES_UPSERT', 'MESSAGES_UPDATE', 'CONNECTION_UPDATE', 'QRCODE_UPDATED'],
          },
        }),
      }).catch((e) => console.error('[Webhook Setup Error]', e));
    }

    // 2. Buscar o QR Code da instância
    const qrRes = await fetch(`${apiUrl}/instance/connect/${encodeURIComponent(instance)}`, {
      headers: { 'apikey': apiKey },
      cache: 'no-store',
    });

    const qrData = await qrRes.json().catch(() => ({}));

    return NextResponse.json({
      connected: false,
      state: qrData?.instance?.state || stateData?.instance?.state || 'connecting',
      instance,
      base64: qrData?.base64 || null,
      code: qrData?.code || null,
      pairingCode: qrData?.pairingCode || null,
    });
  } catch (error: any) {
    console.error('Error fetching QR code from Evolution API:', error);
    return NextResponse.json(
      { error: 'Falha ao buscar QR code da Evolution API', details: error.message },
      { status: 500 }
    );
  }
}
