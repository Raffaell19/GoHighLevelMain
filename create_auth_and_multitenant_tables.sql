-- ==============================================================================
-- FLOWLEVEL SAAS: TABELAS DE AUTENTICAÇÃO, MULTI-TENANCY E RLS ISOLADO
-- Execute este script no SQL Editor do seu Dashboard Supabase
-- ==============================================================================

-- 1. Tabela de Vinculação entre Usuário (Auth) e Empresa (Subaccount)
CREATE TABLE IF NOT EXISTS public.subaccount_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    subaccount_id UUID NOT NULL REFERENCES public.subaccounts(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'owner', -- 'superadmin', 'owner', 'agent'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, subaccount_id)
);

-- Índices para buscas rápidas por usuário e subconta
CREATE INDEX IF NOT EXISTS idx_subaccount_users_user ON public.subaccount_users(user_id);
CREATE INDEX IF NOT EXISTS idx_subaccount_users_subaccount ON public.subaccount_users(subaccount_id);

-- 2. Função de Provisionamento Automático de Empresa no Cadastro Self-Service
-- Executada automaticamente sempre que um novo usuário confirma ou se registra no Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_tenant_signup()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    new_subaccount_id UUID;
    comp_name TEXT;
    comp_segment TEXT;
    comp_phone TEXT;
    user_is_superadmin BOOLEAN;
BEGIN
    -- Extrai dados dos metadados enviados no cadastro
    comp_name := COALESCE(NEW.raw_user_meta_data->>'company_name', 'Minha Empresa');
    comp_segment := COALESCE(NEW.raw_user_meta_data->>'company_segment', 'Geral');
    comp_phone := COALESCE(NEW.raw_user_meta_data->>'phone', '');
    user_is_superadmin := COALESCE((NEW.raw_user_meta_data->>'is_superadmin')::BOOLEAN, false);

    -- 1. Cria a Subconta / Empresa isolada
    INSERT INTO public.subaccounts (name, segment, phone, email, logo, gmb_connected, social_connected)
    VALUES (
        comp_name,
        comp_segment,
        comp_phone,
        NEW.email,
        '🏢',
        false,
        false
    )
    RETURNING id INTO new_subaccount_id;

    -- 2. Vincula o Usuário como Proprietário da Empresa (ou SuperAdmin se sinalizado)
    INSERT INTO public.subaccount_users (user_id, subaccount_id, role)
    VALUES (
        NEW.id,
        new_subaccount_id,
        CASE WHEN user_is_superadmin THEN 'superadmin' ELSE 'owner' END
    );

    -- 3. Provisiona o Template Padrão do Funil Kanban (5 Etapas Essenciais)
    INSERT INTO public.pipeline_stages (subaccount_id, name, color, sort_order)
    VALUES 
        (new_subaccount_id, 'Novos Leads', 'border-blue-500 text-blue-500', 1),
        (new_subaccount_id, 'Contato Realizado', 'border-amber-500 text-amber-500', 2),
        (new_subaccount_id, 'Visita / Reunião', 'border-cyan-500 text-cyan-500', 3),
        (new_subaccount_id, 'Proposta Enviada', 'border-indigo-500 text-indigo-400', 4),
        (new_subaccount_id, 'Fechado (Ganho)', 'border-emerald-500 text-emerald-500', 5);

    -- 4. Provisiona o Workflow Padrão de Captura de WhatsApp
    INSERT INTO public.workflows (subaccount_id, name, description, trigger_type, trigger_label, is_active, total_executions, actions)
    VALUES (
        new_subaccount_id,
        'Captura Automática de Lead no WhatsApp',
        'Cadastra contatos recebidos via WhatsApp diretamente na coluna Novos Leads.',
        'whatsapp_received',
        'Nova mensagem de contato não cadastrado',
        true,
        0,
        '[{"id": "a1", "type": "add_tag", "label": "Adicionar Tag #WhatsApp", "config": {"tag": "WhatsApp"}}, {"id": "a2", "type": "update_stage", "label": "Mover para Novos Leads", "config": {}}]'::jsonb
    );

    -- 5. Inicializa o Registro de WhatsApp no Cofre de Credenciais
    INSERT INTO public.tenant_credentials (subaccount_id, service_type, encrypted_credentials, status)
    VALUES (
        new_subaccount_id,
        'whatsapp',
        '{"provider":"evolution","status":"disconnected","instanceName":"empresa-' || SUBSTRING(new_subaccount_id::text, 1, 8) || '"}',
        'disconnected'
    );

    RETURN NEW;
END;
$$;

-- 3. Vincular Trigger ao Supabase auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_tenant_signup();

-- 4. Políticas RLS (Row Level Security) Multi-Tenant
ALTER TABLE public.subaccount_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuários leem suas vinculações" ON public.subaccount_users;
CREATE POLICY "Usuários leem suas vinculações"
    ON public.subaccount_users
    FOR SELECT
    USING (auth.uid() = user_id);

-- Liberar leitura da tabela subaccounts apenas para quem for membro daquela empresa
DROP POLICY IF EXISTS "Acesso isolado a subcontas" ON public.subaccounts;
CREATE POLICY "Acesso isolado a subcontas"
    ON public.subaccounts
    FOR ALL
    USING (
        id IN (SELECT subaccount_id FROM public.subaccount_users WHERE user_id = auth.uid())
        OR EXISTS (SELECT 1 FROM public.subaccount_users WHERE user_id = auth.uid() AND role = 'superadmin')
    );
