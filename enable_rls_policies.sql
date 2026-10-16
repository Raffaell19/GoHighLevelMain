-- ==============================================================================
-- POLÍTICAS RLS (ROW LEVEL SECURITY) PARA ACESSO DO CLIENTE WEB (ANON KEY)
-- ==============================================================================

-- 1. Habilitar e liberar acesso de leitura e gravação para a aplicação
DO $$ 
DECLARE 
    t text;
BEGIN
    FOR t IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
          AND table_name IN ('subaccounts', 'pipeline_stages', 'leads', 'whatsapp_contacts', 'whatsapp_messages', 'gmb_reviews', 'social_posts', 'workflows', 'tenant_credentials')
    LOOP
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', t);
        EXECUTE format('DROP POLICY IF EXISTS "Public Access" ON %I;', t);
        EXECUTE format('CREATE POLICY "Public Access" ON %I FOR ALL USING (true) WITH CHECK (true);', t);
    END LOOP;
END $$;
