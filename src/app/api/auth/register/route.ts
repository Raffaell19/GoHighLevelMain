import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const supabase = getServiceSupabase();
    const body = await request.json();
    const { email, password, fullName, companyName, companySegment, phone } = body;

    if (!email || !password || !companyName) {
      return NextResponse.json(
        { error: 'E-mail, senha e nome da empresa são obrigatórios.' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'A senha deve conter no mínimo 6 caracteres.' },
        { status: 400 }
      );
    }

    // 1. Criar usuário no Supabase Auth com metadados da empresa
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName || 'Proprietário',
          company_name: companyName,
          company_segment: companySegment || 'Geral',
          phone: phone || '',
        },
      },
    });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    const user = authData.user;
    if (!user) {
      return NextResponse.json(
        { error: 'Não foi possível inicializar o usuário.' },
        { status: 500 }
      );
    }

    // 2. Provisionamento de Reserva (caso o trigger do banco ainda não tenha rodado)
    let subaccountId: string | null = null;

    // Checar se a subconta já foi criada pelo trigger
    const { data: existingUserLink } = await supabase
      .from('subaccount_users')
      .select('subaccount_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (existingUserLink?.subaccount_id) {
      subaccountId = existingUserLink.subaccount_id;
    } else {
      // Criar a subconta / empresa
      const { data: newSub, error: subError } = await supabase
        .from('subaccounts')
        .insert({
          name: companyName,
          segment: companySegment || 'Geral',
          phone: phone || '',
          email: email,
          logo: '🏢',
          gmb_connected: false,
          social_connected: false,
        })
        .select()
        .single();

      if (subError) {
        console.error('Aviso ao criar subconta no register:', subError.message);
      } else if (newSub) {
        subaccountId = newSub.id;

        // Vincular usuário como proprietário
        await supabase.from('subaccount_users').insert({
          user_id: user.id,
          subaccount_id: newSub.id,
          role: 'owner',
        });

        // Criar os 5 estágios padrão do Kanban
        await supabase.from('pipeline_stages').insert([
          { subaccount_id: newSub.id, name: 'Novos Leads', color: 'border-blue-500 text-blue-500', sort_order: 1 },
          { subaccount_id: newSub.id, name: 'Contato Realizado', color: 'border-amber-500 text-amber-500', sort_order: 2 },
          { subaccount_id: newSub.id, name: 'Visita / Reunião', color: 'border-cyan-500 text-cyan-500', sort_order: 3 },
          { subaccount_id: newSub.id, name: 'Proposta Enviada', color: 'border-indigo-500 text-indigo-400', sort_order: 4 },
          { subaccount_id: newSub.id, name: 'Fechado (Ganho)', color: 'border-emerald-500 text-emerald-500', sort_order: 5 },
        ]);

        // Criar o workflow padrão de WhatsApp
        await supabase.from('workflows').insert({
          subaccount_id: newSub.id,
          name: 'Captura Automática de Lead no WhatsApp',
          description: 'Cadastra contatos recebidos via WhatsApp diretamente na coluna Novos Leads.',
          trigger_type: 'whatsapp_received',
          trigger_label: 'Nova mensagem de contato não cadastrado',
          is_active: true,
          total_executions: 0,
          actions: [
            { id: 'a1', type: 'add_tag', label: 'Adicionar Tag #WhatsApp', config: { tag: 'WhatsApp' } },
            { id: 'a2', type: 'update_stage', label: 'Mover para Novos Leads', config: {} },
          ],
        });

        // Inicializar credencial isolada de WhatsApp
        await supabase.from('tenant_credentials').insert({
          subaccount_id: newSub.id,
          service_type: 'whatsapp',
          encrypted_credentials: JSON.stringify({
            provider: 'evolution',
            status: 'disconnected',
            instanceName: `empresa-${newSub.id.slice(0, 8)}`,
          }),
          status: 'disconnected',
        });
      }
    }

    // Verificar se confirmação de e-mail é necessária
    // Se authData.session for nulo, significa que a confirmação de e-mail está ativa no Supabase
    const needsEmailConfirmation = !authData.session;

    return NextResponse.json({
      success: true,
      message: needsEmailConfirmation
        ? 'Cadastro realizado com sucesso! Enviamos um e-mail de confirmação. Por favor, valide seu e-mail para ativar sua conta.'
        : 'Cadastro realizado com sucesso! Você já pode acessar a plataforma.',
      needsEmailConfirmation,
      user: {
        id: user.id,
        email: user.email,
        subaccountId,
      },
    });
  } catch (err: any) {
    console.error('Erro na rota de cadastro:', err);
    return NextResponse.json({ error: err.message || 'Erro interno no servidor' }, { status: 500 });
  }
}
