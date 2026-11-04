import { NextResponse } from 'next/server';

const DEFAULT_EVOLUTION_URL = process.env.EVOLUTION_API_URL || 'https://evolution-api-kix9.onrender.com';
const DEFAULT_EVOLUTION_KEY = process.env.EVOLUTION_API_KEY || 'flowlevel_secret_key_2026';
const WEBHOOK_URL = process.env.NEXT_PUBLIC_APP_URL
  ? `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/whatsapp`
  : 'https://flowlevel.vercel.app/api/webhooks/whatsapp';

function cleanInstanceName(raw: string): string {
  if (!raw) return 'connect-digital';
  const clean = raw
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove acentos
    .replace(/[^a-zA-Z0-9_-]/g, '_') // caracteres especiais viram _
    .replace(/_+/g, '_')             // remove múltiplos _
    .replace(/^_+|_+$/g, '')         // trim _
    .toLowerCase();
  return clean || 'connect-digital';
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const rawInstance = searchParams.get('instance') || 'connect-digital';
    const instance = cleanInstanceName(rawInstance);
    const forceRestart = searchParams.get('force') === 'true';

    const apiUrl = (searchParams.get('apiUrl') || DEFAULT_EVOLUTION_URL).trim().replace(/\/+$/, '');
    const rawKey = (searchParams.get('apiKey') || '').trim();
    const candidateKeys = Array.from(new Set([rawKey, DEFAULT_EVOLUTION_KEY].filter(Boolean)));

    let activeKey = candidateKeys[0] || DEFAULT_EVOLUTION_KEY;
    let stateRes: Response | null = null;

    // 1. Verificar se a instância existe e qual o estado (com fallback automático para a chave oficial se der 401/403)
    for (const k of candidateKeys) {
      const res = await fetch(`${apiUrl}/instance/connectionState/${encodeURIComponent(instance)}`, {
        headers: { apikey: k },
        cache: 'no-store',
      });
      if (res.status !== 401 && res.status !== 403) {
        activeKey = k;
        stateRes = res;
        break;
      }
      stateRes = res;
    }

    const stateStatus = stateRes?.status || 500;
    const stateData = stateRes ? await stateRes.json().catch(() => ({})) : {};

    // Se a instância já está conectada e não foi pedido reinício forçado
    if (!forceRestart && stateStatus === 200 && stateData?.instance?.state === 'open') {
      return NextResponse.json({
        connected: true,
        state: 'open',
        instance,
        message: 'WhatsApp já está conectado!',
      });
    }

    // Helper para criar instância e configurar webhook
    const createFreshInstance = async () => {
      const createRes = await fetch(`${apiUrl}/instance/create`, {
        method: 'POST',
        headers: {
          apikey: activeKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          instanceName: instance,
          token: 'flowlevel_token_2026',
          qrcode: true,
          integration: 'WHATSAPP-BAILEYS',
        }),
      });
      const createData = await createRes.json().catch(() => ({}));

      await fetch(`${apiUrl}/webhook/set/${encodeURIComponent(instance)}`, {
        method: 'POST',
        headers: {
          apikey: activeKey,
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
      }).catch(() => {});

      return createData;
    };

    let createdQrBase64: string | null = null;
    let createdQrCode: string | null = null;

    // Se o usuário pediu atualização forçada ou se a instância não existe (404), recria limpa
    if (forceRestart && stateStatus !== 404) {
      await fetch(`${apiUrl}/instance/logout/${encodeURIComponent(instance)}`, {
        method: 'DELETE',
        headers: { apikey: activeKey },
      }).catch(() => {});
      await fetch(`${apiUrl}/instance/delete/${encodeURIComponent(instance)}`, {
        method: 'DELETE',
        headers: { apikey: activeKey },
      }).catch(() => {});
      const createData = await createFreshInstance();
      createdQrBase64 = createData?.qrcode?.base64 || createData?.base64 || null;
      createdQrCode = createData?.qrcode?.code || createData?.code || null;
    } else if (stateStatus === 404 || stateData?.error === 'Not Found') {
      const createData = await createFreshInstance();
      createdQrBase64 = createData?.qrcode?.base64 || createData?.base64 || null;
      createdQrCode = createData?.qrcode?.code || createData?.code || null;
    }

    // 2. Buscar o QR Code da instância
    let qrData: any = {};
    if (!createdQrBase64) {
      const qrRes = await fetch(`${apiUrl}/instance/connect/${encodeURIComponent(instance)}`, {
        headers: { apikey: activeKey },
        cache: 'no-store',
      });
      qrData = await qrRes.json().catch(() => ({}));

      // Se a instância estiver travada sem retornar base64 (ex: sessão antiga expirada count: 0), recria automaticamente
      if (!qrData?.base64 && !qrData?.qrcode?.base64 && qrData?.instance?.state !== 'open') {
        await fetch(`${apiUrl}/instance/delete/${encodeURIComponent(instance)}`, {
          method: 'DELETE',
          headers: { apikey: activeKey },
        }).catch(() => {});
        const recreated = await createFreshInstance();
        createdQrBase64 = recreated?.qrcode?.base64 || recreated?.base64 || null;
        createdQrCode = recreated?.qrcode?.code || recreated?.code || null;

        if (!createdQrBase64) {
          const retryRes = await fetch(`${apiUrl}/instance/connect/${encodeURIComponent(instance)}`, {
            headers: { apikey: activeKey },
            cache: 'no-store',
          });
          qrData = await retryRes.json().catch(() => ({}));
        }
      }
    }

    const finalBase64 = createdQrBase64 || qrData?.base64 || qrData?.qrcode?.base64 || null;
    const finalCode = createdQrCode || qrData?.code || qrData?.qrcode?.code || null;

    return NextResponse.json({
      connected: false,
      state: qrData?.instance?.state || stateData?.instance?.state || 'connecting',
      instance,
      base64: finalBase64,
      code: finalCode,
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
