import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const supabase = getServiceSupabase();
    const { searchParams } = new URL(request.url);
    const subaccountId = searchParams.get('subaccountId');

    let query = supabase.from('leads').select('*').order('created_at', { ascending: false });
    if (subaccountId) {
      query = query.eq('subaccount_id', subaccountId);
    }

    const { data, error } = await query;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ leads: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getServiceSupabase();
    const body = await request.json();

    const { data, error } = await supabase
      .from('leads')
      .insert([
        {
          subaccount_id: body.subaccountId,
          stage_id: body.stageId,
          name: body.name,
          company: body.company,
          phone: body.phone,
          email: body.email,
          value: body.value,
          tags: body.tags || [],
          notes: body.notes || '',
          status: body.status || 'open',
          last_activity: 'Cadastrado agora',
        },
      ])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ lead: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = getServiceSupabase();
    const body = await request.json();
    const { id, stageId, status, notes, lastActivity } = body;

    const updates: Record<string, any> = {};
    if (stageId !== undefined) updates.stage_id = stageId;
    if (status !== undefined) updates.status = status;
    if (notes !== undefined) updates.notes = notes;
    if (lastActivity !== undefined) updates.last_activity = lastActivity;

    const { data, error } = await supabase.from('leads').update(updates).eq('id', id).select().single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ lead: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = getServiceSupabase();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 });
    }

    const { error } = await supabase.from('leads').delete().eq('id', id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
