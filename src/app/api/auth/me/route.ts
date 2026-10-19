import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const supabase = getServiceSupabase();
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ user: null, authenticated: false }, { status: 401 });
    }

    // 1. Validar o token de sessão do usuário no Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ user: null, authenticated: false }, { status: 401 });
    }

    // 2. Buscar a relação do usuário com subcontas
    const { data: userLink, error: linkError } = await supabase
      .from('subaccount_users')
      .select('subaccount_id, role, subaccounts(*)')
      .eq('user_id', user.id)
      .maybeSingle();

    const role = userLink?.role || 'owner';
    const isSuperAdmin = role === 'superadmin' || user.email?.includes('admin@flowlevel.com');

    // 3. Se for SuperAdmin, pode acessar todas as empresas
    let availableSubaccounts: any[] = [];
    if (isSuperAdmin) {
      const { data: allSubs } = await supabase.from('subaccounts').select('*');
      availableSubaccounts = allSubs || [];
    } else if (userLink?.subaccounts) {
      availableSubaccounts = [userLink.subaccounts];
    } else {
      // Caso a subconta do usuário ainda não tenha sido vinculada (ex: criada antes da tabela)
      const { data: fallbackSub } = await supabase
        .from('subaccounts')
        .select('*')
        .eq('email', user.email)
        .maybeSingle();
      if (fallbackSub) {
        availableSubaccounts = [fallbackSub];
      }
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuário',
        role,
        isSuperAdmin,
      },
      currentSubaccount: availableSubaccounts[0] || null,
      subaccounts: availableSubaccounts,
    });
  } catch (err: any) {
    console.error('Erro na rota /api/auth/me:', err);
    return NextResponse.json({ error: err.message || 'Erro interno' }, { status: 500 });
  }
}
