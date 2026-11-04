import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { SocialPost } from '@/types';

const samplePosts = (_subaccountId: string, _companyName: string): SocialPost[] => [];

export async function GET(request: NextRequest) {
  try {
    const supabase = getServiceSupabase();
    const { searchParams } = new URL(request.url);
    const subaccountId = searchParams.get('subaccountId');

    if (!subaccountId) {
      return NextResponse.json({ error: 'subaccountId é obrigatório' }, { status: 400 });
    }

    const { data: sub } = await supabase
      .from('subaccounts')
      .select('id, name')
      .eq('id', subaccountId)
      .maybeSingle();

    return NextResponse.json({
      posts: samplePosts(subaccountId, sub?.name || 'Connect Digital'),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID do post é obrigatório' }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: 'Publicação removida com sucesso.' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
