import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { searchQuery, location, limit = 70, language = 'pt-BR', customToken, subaccountId } = body;

    if (!searchQuery || !location) {
      return NextResponse.json(
        { error: 'Termo de busca e Localização são obrigatórios.' },
        { status: 400 }
      );
    }

    let token = customToken || process.env.APIFY_API_TOKEN;

    // Se não estiver em process.env, busca automaticamente no Supabase tenant_credentials
    if (!token || token.trim().length <= 5) {
      try {
        const supabase = getServiceSupabase();
        let query = supabase.from('tenant_credentials').select('encrypted_credentials').eq('service_type', 'apify');
        if (subaccountId) {
          query = query.eq('subaccount_id', subaccountId);
        }
        const { data: cred } = await query.limit(1).maybeSingle();
        if (cred?.encrypted_credentials) {
          try {
            const parsed = JSON.parse(cred.encrypted_credentials);
            if (parsed.token) token = parsed.token;
          } catch {
            token = cred.encrypted_credentials;
          }
        }
      } catch (e) {
        console.error('Erro ao buscar token no Supabase:', e);
      }
    }

    // Se houver token configurado, dispara o Actor real na Apify
    if (token && token.trim().length > 5) {
      const actorId = 'compass~crawler-google-places';
      const apifyUrl = `https://api.apify.com/v2/acts/${actorId}/runs?token=${token.trim()}`;

      const payload = {
        searchStringsArray: [searchQuery.trim()],
        locationQuery: location.trim(),
        maxCrawledPlacesPerSearch: Math.min(Number(limit) || 70, 200),
        language: language || 'pt-BR',
        includeWebResults: false,
        skipClosedPlaces: true,
      };

      const response = await fetch(apifyUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return NextResponse.json(
          { error: `Erro na Apify (${response.status}): ${errorText}` },
          { status: response.status }
        );
      }

      const runData = await response.json();
      return NextResponse.json({
        success: true,
        isLive: true,
        runId: runData.data?.id,
        defaultDatasetId: runData.data?.defaultDatasetId,
        status: runData.data?.status || 'RUNNING',
      });
    }

    // Modo Demonstração / Simulação se ainda não houver chave Apify configurada
    const mockRunId = `mock-run-${Date.now()}`;
    return NextResponse.json({
      success: true,
      isLive: false,
      isMock: true,
      runId: mockRunId,
      defaultDatasetId: `mock-dataset-${Date.now()}`,
      status: 'RUNNING',
      searchQuery,
      location,
      limit,
      notice: 'Chave APIFY_API_TOKEN não encontrada no .env.local. A extração está rodando em modo demonstração com dados realistas da região pesquisada.',
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
