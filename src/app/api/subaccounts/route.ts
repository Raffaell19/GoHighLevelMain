import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

export async function GET() {
  try {
    const supabase = getServiceSupabase();
    const { data: subs, error } = await supabase.from('subaccounts').select('*');
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ subaccounts: subs });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = getServiceSupabase();
    const body = await request.json();
    const { id, logo, name, segment, phone, email, gmb_connected, social_connected } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID da subconta é obrigatório' }, { status: 400 });
    }

    const updates: Record<string, any> = {};
    if (logo !== undefined) updates.logo = logo;
    if (name !== undefined) updates.name = name;
    if (segment !== undefined) updates.segment = segment;
    if (phone !== undefined) updates.phone = phone;
    if (email !== undefined) updates.email = email;
    if (gmb_connected !== undefined) updates.gmb_connected = gmb_connected;
    if (social_connected !== undefined) updates.social_connected = social_connected;

    const { data, error } = await supabase
      .from('subaccounts')
      .update(updates)
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, subaccount: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
