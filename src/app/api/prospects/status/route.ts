import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

export interface ProspectItem {
  id: string;
  name: string;
  phone: string;
  address: string;
  website?: string;
  rating: number;
  reviewsCount: number;
  category: string;
  googleUrl?: string;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const runId = searchParams.get('runId');
    const defaultDatasetId = searchParams.get('defaultDatasetId');
    const customToken = searchParams.get('customToken');
    const subaccountId = searchParams.get('subaccountId');
    const searchQuery = searchParams.get('searchQuery') || 'Empresas';
    const location = searchParams.get('location') || 'Brasil';
    const limit = Number(searchParams.get('limit')) || 25;

    if (!runId) {
      return NextResponse.json({ error: 'runId é obrigatório' }, { status: 400 });
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

    // Caso 1: Run Mock / Demonstração
    if (runId.startsWith('mock-run-') || !token || token.trim().length < 5) {
      const targetCount = Math.max(Number(limit) || 20, 20);
      const streetNames = [
        'Rua Bento Gonçalves, 1420 - Centro',
        'Av. Nações Unidas, 2800 - Ideal',
        'Rua Guia Lopes, 915 - Rondônia',
        'Rua Marcílio Dias, 650 - Rio Branco',
        'Av. Nicolau Becker, 310 - Operário',
        'Rua Primeiro de Março, 1850 - Pátria Nova',
        'Rua Sapiranga, 440 - Mauá',
        'Av. Cel. Travassos, 1120 - Rondônia',
        'Rua Bartolomeu de Gusmão, 780 - Canudos',
        'Av. Pedro Adams Filho, 3420 - Centro',
        'Rua General Osório, 520 - Hamburgo Velho',
        'Rua Tapes, 190 - Ideal',
        'Rua Joaquim Nabuco, 840 - Rio Branco',
        'Av. Victor Hugo Kunz, 1650 - São Jorge',
        'Rua Magalhães Calvet, 310 - Centro',
        'Rua 24 de Maio, 420 - Vila Rosa',
        'Rua Almirante Barroso, 610 - Centro',
        'Rua David Canabarro, 150 - Centro',
        'Av. 7 de Setembro, 980 - Liberdade',
        'Rua Presidente Lucena, 530 - Petrópolis',
      ];

      const suffixes = [
        'Vale dos Sinos',
        'Gaúcha',
        'Elite',
        'Premium Soluções',
        'Sob Medida',
        'Instalações & Serviços',
        'Indústria & Comércio',
        'Central & Montagem',
        'Master',
        'Brasil',
        'São Jorge',
        'Hamburgo',
        'Metropolitana',
        'Líder',
        'Aliança',
        'Express',
        'Inovação',
        'Serralheria & Metal',
        'Sul',
        'Top Quality',
      ];

      const cleanQuery = capitalize(searchQuery);
      const mockItems: ProspectItem[] = Array.from({ length: targetCount }).map((_, idx) => {
        const suffix = suffixes[idx % suffixes.length];
        const street = streetNames[idx % streetNames.length];
        const phoneDDD = location.toLowerCase().includes('rs') || location.toLowerCase().includes('hamburgo') ? '51' : '11';
        const numPart = 98000 + (idx * 37) % 9999;
        const numEnd = 1000 + (idx * 83) % 8999;
        const rating = +(4.5 + (idx % 6) * 0.1).toFixed(1);
        const reviewsCount = 15 + (idx * 17) % 150;
        const slug = `${searchQuery.toLowerCase().replace(/[^a-z0-9]/g, '')}${suffix.toLowerCase().replace(/[^a-z0-9]/g, '')}`;

        return {
          id: `place-mock-${idx + 1}`,
          name: `${cleanQuery} ${suffix}`,
          phone: `(${phoneDDD}) 9${numPart}-${numEnd}`,
          address: `${street}, ${location}`,
          website: `https://${slug}.com.br`,
          rating,
          reviewsCount,
          category: cleanQuery,
          googleUrl: `https://maps.google.com/?q=${encodeURIComponent(`${cleanQuery} ${suffix} ${location}`)}`,
        };
      });

      return NextResponse.json({
        status: 'SUCCEEDED',
        isMock: true,
        progress: 100,
        items: mockItems,
      });
    }

    // Caso 2: Apify Real
    const runCheckUrl = `https://api.apify.com/v2/actor-runs/${runId}?token=${token.trim()}`;
    const runRes = await fetch(runCheckUrl);
    if (!runRes.ok) {
      return NextResponse.json({ error: 'Erro ao consultar status da execução na Apify' }, { status: 500 });
    }

    const runJson = await runRes.json();
    const runStatus = runJson.data?.status;

    if (runStatus === 'SUCCEEDED') {
      const datasetId = defaultDatasetId || runJson.data?.defaultDatasetId;
      const datasetUrl = `https://api.apify.com/v2/datasets/${datasetId}/items?token=${token.trim()}&format=json&clean=true&limit=200`;
      const dataRes = await fetch(datasetUrl);
      const items = await dataRes.json();

      const normalized: ProspectItem[] = (Array.isArray(items) ? items : []).map((p: any, idx: number) => ({
        id: p.placeId || p.cid || `apify-${idx}`,
        name: p.title || p.name || 'Empresa sem nome',
        phone: p.phone || p.phoneUnformatted || '',
        address: p.address || p.street || `${p.city || ''}, ${p.state || ''}`,
        website: p.website || p.url || '',
        rating: p.totalScore || p.stars || p.rating || 0,
        reviewsCount: p.reviewsCount || 0,
        category: p.categoryName || searchQuery,
        googleUrl: p.googleUrl || p.url || '',
      }));

      return NextResponse.json({
        status: 'SUCCEEDED',
        isMock: false,
        items: normalized,
      });
    }

    return NextResponse.json({
      status: runStatus,
      isMock: false,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

function capitalize(s: string) {
  if (!s) return '';
  return s.charAt(0).toUpperCase() + s.slice(1);
}
