# Plano de Implementação: Plataforma SaaS All-in-One (Estilo GoHighLevel)

## Goal
Construir uma plataforma SaaS Multi-Tenant completa e modular inspirada no GoHighLevel, com CRM Kanban, Central de WhatsApp (Live Chat + Chatbot Híbrido), Gestão de Google Meu Negócio, Agendador de Redes Sociais e Motor de Automações.

## Arquitetura & Stack
- **Framework**: Next.js 15 (App Router, React 19, TypeScript)
- **Estilização**: Tailwind CSS + Lucide Icons (Design System refinado em tons de Slate/Zinc com destaque Azul/Esmeralda, sem roxos genéricos)
- **Persistência**: Estrutura relacional multi-tenant com isolamento por `subaccount_id` (compatível com PostgreSQL / Supabase)
- **Estado & Reatividade**: Context API global (`AppContext`) conectando leads, mensagens, avaliações do Google e postagens

## Tasks
- [x] Task 1: Inicializar projeto Next.js 15 com TypeScript e Tailwind CSS → Verify: `npm run build` executa com sucesso.
- [x] Task 2: Configurar Design System, tema visual (Dark mode) e Navegação Multi-Tenant (Sidebar com Seletor de Subcontas) → Verify: Alternância entre empresas (Alves Climatização, Dra. Camila, Nexus Growth) funcionando na UI.
- [x] Task 3: Implementar Módulo CRM com Kanban drag-and-drop, filtros e modal de ficha 360° do Lead → Verify: Arrastar leads entre colunas altera status e valor total da etapa.
- [x] Task 4: Desenvolver Central WhatsApp (Inbox Live Chat com histórico de conversa e switcher de atendente) → Verify: Envio e recebimento simulado de mensagens e troca de contatos em tempo real.
- [x] Task 5: Criar Gerenciador de Conexão WhatsApp Híbrido (QR Code para Evolution API + Credenciais Meta Cloud API) → Verify: Tela de configuração permite alternar entre os dois modos e simular status conectado.
- [x] Task 6: Desenvolver Módulo de Google Meu Negócio (Central de Avaliações, métricas locais e gerador de respostas IA) → Verify: Feed de avaliações com filtro por estrelas e resposta rápida funcional.
- [x] Task 7: Implementar Agendador de Redes Sociais (Calendário de postagens + Editor com Live Preview para Instagram/Facebook) → Verify: Agendar post aparece no calendário com status e preview correto.
- [x] Task 8: Criar Motor de Automações / Workflows visuais (Gatilho -> Condição -> Ação) → Verify: Criar regra personalizada (ex: Novo Lead -> Disparar WhatsApp) e testar execução.
- [x] Task 9: Validação e auditoria de UX, responsividade e integridade do código → Verify: Build de produção limpo e verificação E2E no navegador concluída com sucesso.

## Done When
- [x] Painel Multi-tenant funcional permitindo alternar empresas/subcontas com dados isolados.
- [x] CRM Kanban operacional com movimentação fluida de leads.
- [x] Central de WhatsApp com interface de Live Chat e configuração de provedores híbridos.
- [x] Painel do Google Meu Negócio com gestão de avaliações e métricas.
- [x] Calendário de postagens de redes sociais com simulador de preview.
- [x] Motor de automações conectando eventos do CRM com disparos de mensagens.
