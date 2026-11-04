import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jgwsfnesrtsayivnnivh.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Fetch com timeout rápido para evitar que o sistema trave caso o banco Supabase esteja pausado/inacessível
const fetchWithTimeout: typeof fetch = async (input, init) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3500);
  try {
    return await fetch(input, {
      ...init,
      signal: init?.signal || controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }
};

// Cliente público para frontend
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: false,
  },
  global: {
    fetch: fetchWithTimeout,
  },
});

// Cliente de serviço (apenas no servidor / API routes)
export const getServiceSupabase = () => {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY não configurada no .env.local');
  }
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      fetch: fetchWithTimeout,
    },
  });
};
