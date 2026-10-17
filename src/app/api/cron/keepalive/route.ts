import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const EVOLUTION_URL = process.env.EVOLUTION_API_URL || 'https://evolution-api-kix9.onrender.com';

/**
 * Endpoint de Keep-Alive / Heartbeat
 * Mantém o servidor do Evolution API no Render permanentemente ativo (evitando que durma por inatividade)
 */
export async function GET() {
  const startTime = Date.now();
  try {
    const res = await fetch(`${EVOLUTION_URL}`, {
      headers: {
        'User-Agent': 'FlowLevel-Heartbeat/1.0',
      },
      cache: 'no-store',
    });

    const elapsedMs = Date.now() - startTime;
    return NextResponse.json({
      success: true,
      evolutionStatus: res.status,
      elapsedMs,
      timestamp: new Date().toISOString(),
      message: 'Evolution API server kept warm successfully.',
    });
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      error: err.message,
      elapsedMs: Date.now() - startTime,
    }, { status: 500 });
  }
}
