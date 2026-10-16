import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { encryptCredentials, decryptCredentials } from '@/lib/crypto';

// GET: Recupera credenciais descriptografadas para uso pelo backend
export async function GET(request: NextRequest) {
  try {
    const supabase = getServiceSupabase();
    const { searchParams } = new URL(request.url);
    const subaccountId = searchParams.get('subaccountId');
    const serviceType = searchParams.get('serviceType') || 'whatsapp';

    if (!subaccountId) {
      return NextResponse.json({ error: 'subaccountId é obrigatório' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('tenant_credentials')
      .select('*')
      .eq('subaccount_id', subaccountId)
      .eq('service_type', serviceType)
      .single();

    if (error || !data) {
      return NextResponse.json({ credentials: null, status: 'disconnected' });
    }

    const decrypted = decryptCredentials(data.encrypted_credentials);

    // Retorna credencial mascarada para segurança no frontend se necessário
    return NextResponse.json({
      serviceType,
      credentials: decrypted,
      status: data.status,
      updatedAt: data.updated_at,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST: Criptografa e salva credenciais de uma subconta
export async function POST(request: NextRequest) {
  try {
    const supabase = getServiceSupabase();
    const body = await request.json();
    const { subaccountId, serviceType, credentials } = body;

    if (!subaccountId || !serviceType || !credentials) {
      return NextResponse.json({ error: 'Parâmetros incompletos' }, { status: 400 });
    }

    const encrypted = encryptCredentials(credentials);

    const { data, error } = await supabase
      .from('tenant_credentials')
      .upsert(
        {
          subaccount_id: subaccountId,
          service_type: serviceType,
          encrypted_credentials: encrypted,
          status: 'connected',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'subaccount_id,service_type' }
      )
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Credencial criptografada e armazenada no cofre com segurança.',
      updatedAt: data.updated_at,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
