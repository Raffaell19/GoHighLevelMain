-- ==============================================================================
-- FLOWLEVEL SAAS MULTI-TENANT: SCHEMA COMPLETO PARA SUPABASE / POSTGRESQL
-- ==============================================================================

-- 1. Habilitar extensão para geração de UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Tabela de Subcontas / Empresas (Tenants)
CREATE TABLE IF NOT EXISTS subaccounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    segment VARCHAR(100),
    logo VARCHAR(50) DEFAULT '⚡',
    phone VARCHAR(50),
    email VARCHAR(255),
    gmb_connected BOOLEAN DEFAULT false,
    social_connected BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Cofre de Credenciais Criptografadas por Subconta (WhatsApp, Google, Meta)
CREATE TABLE IF NOT EXISTS tenant_credentials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subaccount_id UUID NOT NULL REFERENCES subaccounts(id) ON DELETE CASCADE,
    service_type VARCHAR(50) NOT NULL, -- 'whatsapp', 'google_my_business', 'meta_social'
    encrypted_credentials TEXT NOT NULL, -- Chaves/tokens criptografados com AES-256
    status VARCHAR(20) DEFAULT 'connected', -- 'connected', 'disconnected', 'expired'
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(subaccount_id, service_type)
);

-- 4. Estágios do Funil Kanban por Subconta
CREATE TABLE IF NOT EXISTS pipeline_stages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subaccount_id UUID NOT NULL REFERENCES subaccounts(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    color VARCHAR(100) DEFAULT 'border-blue-500 text-blue-500',
    sort_order INT NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Leads & Oportunidades do CRM
CREATE TABLE IF NOT EXISTS leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subaccount_id UUID NOT NULL REFERENCES subaccounts(id) ON DELETE CASCADE,
    stage_id UUID REFERENCES pipeline_stages(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    company VARCHAR(255),
    phone VARCHAR(50),
    email VARCHAR(255),
    value NUMERIC(12, 2) DEFAULT 0.00,
    tags TEXT[] DEFAULT '{}',
    notes TEXT,
    status VARCHAR(20) DEFAULT 'open', -- 'open', 'won', 'lost'
    last_activity VARCHAR(255) DEFAULT 'Cadastrado recentemente',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Contatos de WhatsApp
CREATE TABLE IF NOT EXISTS whatsapp_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subaccount_id UUID NOT NULL REFERENCES subaccounts(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    avatar TEXT,
    last_message TEXT,
    last_message_time VARCHAR(50),
    unread_count INT DEFAULT 0,
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Mensagens de WhatsApp (Histórico do Chat)
CREATE TABLE IF NOT EXISTS whatsapp_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subaccount_id UUID NOT NULL REFERENCES subaccounts(id) ON DELETE CASCADE,
    contact_id UUID NOT NULL REFERENCES whatsapp_contacts(id) ON DELETE CASCADE,
    sender VARCHAR(20) NOT NULL, -- 'contact', 'agent', 'bot'
    text TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'sent', -- 'sent', 'delivered', 'read'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Avaliações do Google Meu Negócio
CREATE TABLE IF NOT EXISTS gmb_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subaccount_id UUID NOT NULL REFERENCES subaccounts(id) ON DELETE CASCADE,
    author_name VARCHAR(255) NOT NULL,
    author_photo TEXT,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    reply_text TEXT,
    reply_time TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Postagens de Redes Sociais (Agendador)
CREATE TABLE IF NOT EXISTS social_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subaccount_id UUID NOT NULL REFERENCES subaccounts(id) ON DELETE CASCADE,
    platforms TEXT[] NOT NULL, -- 'instagram', 'facebook', 'linkedin'
    content TEXT NOT NULL,
    media_url TEXT,
    scheduled_date TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(20) DEFAULT 'scheduled', -- 'draft', 'scheduled', 'published'
    likes INT DEFAULT 0,
    comments INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. Automações & Workflows
CREATE TABLE IF NOT EXISTS workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subaccount_id UUID NOT NULL REFERENCES subaccounts(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    trigger_type VARCHAR(100) NOT NULL,
    trigger_label VARCHAR(255) NOT NULL,
    actions JSONB NOT NULL DEFAULT '[]',
    is_active BOOLEAN DEFAULT true,
    total_executions INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices de Alta Performance para Isolamento Multi-Tenant
CREATE INDEX IF NOT EXISTS idx_leads_subaccount ON leads(subaccount_id);
CREATE INDEX IF NOT EXISTS idx_credentials_subaccount ON tenant_credentials(subaccount_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_contacts_subaccount ON whatsapp_contacts(subaccount_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_contact ON whatsapp_messages(contact_id);
CREATE INDEX IF NOT EXISTS idx_gmb_reviews_subaccount ON gmb_reviews(subaccount_id);
CREATE INDEX IF NOT EXISTS idx_social_posts_subaccount ON social_posts(subaccount_id);
CREATE INDEX IF NOT EXISTS idx_workflows_subaccount ON workflows(subaccount_id);
