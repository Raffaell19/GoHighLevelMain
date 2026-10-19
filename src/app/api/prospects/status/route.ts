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
      // Simula 10 a 20 resultados realistas baseados na consulta do usuário
      const mockItems: ProspectItem[] = [
        {
          id: `place-mock-1`,
          name: `${capitalize(searchQuery)} Vale dos Sinos`,
          phone: '(51) 99812-4589',
          address: `Rua Bento Gonçalves, 1420 - Centro, ${location}`,
          website: `https://${searchQuery.toLowerCase().replace(/[^a-z0-9]/g, '')}valedossinos.com.br`,
          rating: 4.9,
          reviewsCount: 84,
          category: capitalize(searchQuery),
          googleUrl: 'https://maps.google.com',
        },
        {
          id: `place-mock-2`,
          name: `Alumínio & ${capitalize(searchQuery)} Gaúcha`,
          phone: '(51) 98744-1230',
          address: `Av. Nações Unidas, 2800 - Ideal, ${location}`,
          website: 'https://esquadriasgaucha.com.br',
          rating: 4.8,
          reviewsCount: 52,
          category: 'Indústria & Instalações',
          googleUrl: 'https://maps.google.com',
        },
        {
          id: `place-mock-3`,
          name: `Soluções em ${capitalize(searchQuery)} & Fachadas`,
          phone: '(51) 99120-7788',
          address: `Rua Guia Lopes, 915 - Rondônia, ${location}`,
          website: 'https://solucoesfachadas.com.br',
          rating: 4.7,
          reviewsCount: 39,
          category: capitalize(searchQuery),
          googleUrl: 'https://maps.google.com',
        },
        {
          id: `place-mock-4`,
          name: `Vidraçaria & ${capitalize(searchQuery)} Elite`,
          phone: '(51) 99345-6677',
          address: `Rua Marcílio Dias, 650 - Rio Branco, ${location}`,
          website: 'https://vidracariaelite.com.br',
          rating: 4.9,
          reviewsCount: 110,
          category: 'Vidros e Esquadrias',
          googleUrl: 'https://maps.google.com',
        },
        {
          id: `place-mock-5`,
          name: `Central de ${capitalize(searchQuery)} & Serralheria`,
          phone: '(51) 98011-3344',
          address: `Av. Nicolau Becker, 310 - Operário, ${location}`,
          rating: 4.6,
          reviewsCount: 27,
          category: 'Serralheria & Montagem',
          googleUrl: 'https://maps.google.com',
        },
        {
          id: `place-mock-6`,
          name: `Master ${capitalize(searchQuery)} Sob Medida`,
          phone: '(51) 98555-8899',
          address: `Rua Primeiro de Março, 1850 - Pátria Nova, ${location}`,
          website: 'https://masteresquadrias.com.br',
          rating: 5.0,
          reviewsCount: 68,
          category: capitalize(searchQuery),
          googleUrl: 'https://maps.google.com',
        },
        {
          id: `place-mock-7`,
          name: `Metalúrgica & PVC ${capitalize(searchQuery)}`,
          phone: '(51) 99222-1144',
          address: `Rua Sapiranga, 440 - Mauá, ${location}`,
          rating: 4.5,
          reviewsCount: 19,
          category: 'Esquadrias de PVC',
          googleUrl: 'https://maps.google.com',
        },
        {
          id: `place-mock-8`,
          name: `Arte em Alumínio & ${capitalize(searchQuery)}`,
          phone: '(51) 98440-2211',
          address: `Av. Cel. Travassos, 1120 - Rondônia, ${location}`,
          website: 'https://arteemaluminio.com.br',
          rating: 4.8,
          reviewsCount: 43,
          category: 'Fábrica de Esquadrias',
          googleUrl: 'https://maps.google.com',
        },
      ];

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
      const datasetUrl = `https://api.apify.com/v2/datasets/${datasetId}/items?token=${token.trim()}&format=json&clean=true`;
      const dataRes = await fetch(datasetUrl);
      const items = await dataRes.json();

      const normalized: ProspectItem[] = (Array.isArray(items) ? items : []).map((p: any, idx: number) => ({
        id: p.placeId || `apify-${idx}`,
        name: p.title || p.name || 'Empresa sem nome',
        phone: p.phone || p.phoneUnformatted || '',
        address: p.address || p.street || `${p.city || ''}, ${p.state || ''}`,
        website: p.website || p.url || '',
        rating: p.totalScore || 0,
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
