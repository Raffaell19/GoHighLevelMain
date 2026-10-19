import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { ProspectItem } from '../status/route';

export async function POST(request: NextRequest) {
  try {
    const supabase = getServiceSupabase();
    const body = await request.json();
    const { subaccountId, prospects, stageId } = body;

    if (!subaccountId || !Array.isArray(prospects) || prospects.length === 0) {
      return NextResponse.json(
        { error: 'subaccountId e lista de prospects são obrigatórios.' },
        { status: 400 }
      );
    }

    // Identificar estágio inicial do funil se não especificado
    let targetStageId = stageId;
    if (!targetStageId) {
      const { data: stages } = await supabase
        .from('pipeline_stages')
        .select('id')
        .eq('subaccount_id', subaccountId)
        .order('sort_order', { ascending: true })
        .limit(1);

      if (stages && stages.length > 0) {
        targetStageId = stages[0].id;
      }
    }

    const rowsToInsert = prospects.map((p: ProspectItem) => ({
      subaccount_id: subaccountId,
      stage_id: targetStageId || null,
      name: p.name,
      company: p.name,
      phone: p.phone || '',
      email: '',
      value: 0.0,
      tags: ['Apify', 'Google Maps', p.category || 'Prospecção B2B'],
      notes: `📍 Endereço: ${p.address}\n🌐 Website: ${p.website || 'Não informado'}\n⭐ Avaliação Google: ${p.rating}★ (${p.reviewsCount} avaliações)\n🔗 Link do Maps: ${p.googleUrl || 'N/A'}`,
      status: 'open',
      last_activity: 'Importado da Mineração Apify',
    }));

    const { data: inserted, error } = await supabase
      .from('leads')
      .insert(rowsToInsert)
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      importedCount: inserted?.length || rowsToInsert.length,
      leads: inserted,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
