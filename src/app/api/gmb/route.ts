import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { encryptCredentials, decryptCredentials } from '@/lib/crypto';
import { GMBReview, GMBStats } from '@/types';

const defaultStats: GMBStats = {
  views: 0,
  searches: 0,
  calls: 0,
  directions: 0,
  websiteClicks: 0,
  ratingAverage: 0,
  totalReviews: 0,
};

const sampleReviewsTemplate = (_companyName: string, _subaccountId: string): GMBReview[] => [];

export async function GET(request: NextRequest) {
  try {
    const supabase = getServiceSupabase();
    const { searchParams } = new URL(request.url);
    const subaccountId = searchParams.get('subaccountId');

    if (!subaccountId) {
      return NextResponse.json({ error: 'subaccountId é obrigatório' }, { status: 400 });
    }

    // Buscar Subconta
    const { data: sub } = await supabase
      .from('subaccounts')
      .select('*')
      .eq('id', subaccountId)
      .maybeSingle();

    // Buscar credenciais Google Business
    const { data: credRow } = await supabase
      .from('tenant_credentials')
      .select('*')
      .eq('subaccount_id', subaccountId)
      .eq('service_type', 'google_business')
      .maybeSingle();

    let decryptedCreds: any = null;
    if (credRow?.encrypted_credentials) {
      try {
        decryptedCreds = decryptCredentials(credRow.encrypted_credentials);
      } catch (e) {
        console.warn('[GMB API] Erro ao descriptografar credenciais:', e);
      }
    }

    const isConnected = credRow?.status === 'connected' || sub?.gmb_connected || false;

    const stats: GMBStats = decryptedCreds?.stats || (isConnected ? defaultStats : {
      views: 0,
      searches: 0,
      calls: 0,
      directions: 0,
      websiteClicks: 0,
      ratingAverage: 0,
      totalReviews: 0,
    });

    const reviews: GMBReview[] = decryptedCreds?.reviews || (isConnected ? sampleReviewsTemplate(sub?.name || 'Empresa', subaccountId) : []);

    return NextResponse.json({
      connected: isConnected,
      businessName: decryptedCreds?.businessName || sub?.name || 'Minha Empresa',
      address: decryptedCreds?.address || 'São Paulo - SP • Visível no Google Maps & Pesquisa',
      placeId: decryptedCreds?.placeId || '',
      googleEmail: decryptedCreds?.googleEmail || '',
      hasApiKey: !!decryptedCreds?.apiKey,
      stats,
      reviews,
      lastSync: credRow?.updated_at || null,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getServiceSupabase();
    const body = await request.json();
    const {
      subaccountId,
      action = 'connect',
      placeId = '',
      businessName = '',
      address = '',
      googleEmail = '',
      apiKey = '',
      customStats,
      customReviews,
    } = body;

    if (!subaccountId) {
      return NextResponse.json({ error: 'subaccountId é obrigatório' }, { status: 400 });
    }

    const { data: sub } = await supabase
      .from('subaccounts')
      .select('*')
      .eq('id', subaccountId)
      .maybeSingle();

    if (action === 'disconnect') {
      await supabase
        .from('subaccounts')
        .update({ gmb_connected: false })
        .eq('id', subaccountId);

      await supabase
        .from('tenant_credentials')
        .update({ status: 'disconnected', updated_at: new Date().toISOString() })
        .eq('subaccount_id', subaccountId)
        .eq('service_type', 'google_business');

      return NextResponse.json({
        success: true,
        connected: false,
        message: 'Google Meu Negócio desconectado com sucesso.',
      });
    }

    // Ação: Connect ou Sync
    const resolvedName = businessName.trim() || sub?.name || 'Connect Digital';
    const resolvedAddress = address.trim() || 'São Paulo - SP • Visível no Google Maps & Pesquisa';
    const resolvedStats: GMBStats = customStats || defaultStats;
    const resolvedReviews: GMBReview[] = customReviews || sampleReviewsTemplate(resolvedName, subaccountId);

    // Se tiver API Key e Place ID do Google Places, tenta buscar dados ao vivo
    if (apiKey && placeId) {
      try {
        const placesRes = await fetch(
          `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(
            placeId
          )}&fields=name,rating,reviews,user_ratings_total,formatted_address&language=pt-BR&key=${apiKey}`
        );
        const placesData = await placesRes.json();
        if (placesData?.result) {
          const res = placesData.result;
          if (res.rating) resolvedStats.ratingAverage = res.rating;
          if (res.user_ratings_total) resolvedStats.totalReviews = res.user_ratings_total;
          if (Array.isArray(res.reviews) && res.reviews.length > 0) {
            const apiReviews: GMBReview[] = res.reviews.map((r: any, idx: number) => ({
              id: `gmb-real-${idx}-${Date.now()}`,
              subaccountId,
              authorName: r.author_name || 'Cliente Google',
              authorPhoto: r.profile_photo_url || '',
              rating: r.rating || 5,
              comment: r.text || '',
              createTime: r.relative_time_description || 'Recentemente',
            }));
            resolvedReviews.unshift(...apiReviews);
          }
        }
      } catch (placesErr) {
        console.warn('[GMB API] Erro ao consultar Google Places API oficial:', placesErr);
      }
    }

    const credentialsPayload = {
      placeId,
      businessName: resolvedName,
      address: resolvedAddress,
      googleEmail,
      apiKey,
      stats: resolvedStats,
      reviews: resolvedReviews,
    };

    const encrypted = encryptCredentials(credentialsPayload);

    // Salvar credenciais e status em tenant_credentials
    await supabase.from('tenant_credentials').upsert(
      {
        subaccount_id: subaccountId,
        service_type: 'google_business',
        encrypted_credentials: encrypted,
        status: 'connected',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'subaccount_id,service_type' }
    );

    // Atualizar subconta gmb_connected
    await supabase
      .from('subaccounts')
      .update({ gmb_connected: true })
      .eq('id', subaccountId);

    return NextResponse.json({
      success: true,
      connected: true,
      businessName: resolvedName,
      address: resolvedAddress,
      placeId,
      googleEmail,
      stats: resolvedStats,
      reviews: resolvedReviews,
      message: 'Google Meu Negócio integrado e sincronizado com sucesso!',
      lastSync: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
