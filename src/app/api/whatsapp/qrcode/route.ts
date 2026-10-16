import { NextResponse } from 'next/server';

const EVOLUTION_URL = process.env.EVOLUTION_API_URL || 'https://evolution-api-kix9.onrender.com';
const EVOLUTION_KEY = process.env.EVOLUTION_API_KEY || 'flowlevel_secret_key_2026';
const INSTANCE_NAME = 'flowlevel_main';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const instance = searchParams.get('instance') || INSTANCE_NAME;

    // Check connection state first
    const stateRes = await fetch(`${EVOLUTION_URL}/instance/connectionState/${instance}`, {
      headers: { 'apikey': EVOLUTION_KEY },
      cache: 'no-store',
    });

    const stateData = await stateRes.json().catch(() => ({}));
    const state = stateData?.instance?.state || 'unknown';

    if (state === 'open') {
      return NextResponse.json({
        connected: true,
        state: 'open',
        message: 'WhatsApp já está conectado!',
      });
    }

    // Fetch QR Code
    const qrRes = await fetch(`${EVOLUTION_URL}/instance/connect/${instance}`, {
      headers: { 'apikey': EVOLUTION_KEY },
      cache: 'no-store',
    });

    const qrData = await qrRes.json().catch(() => ({}));

    return NextResponse.json({
      connected: false,
      state,
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
