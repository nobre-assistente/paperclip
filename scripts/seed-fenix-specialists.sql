-- ==============================================================================
-- Seeding Idempotente dos 20 Especialistas da Wave 6 no Paperclip (FEA-429 / WI-13-001)
-- Companhia Alvo: Genesis (f1453093-9739-4dc9-a6c2-522abef97d3b)
-- Orquestrador Existente: 587d0d1a-3402-4d7d-a871-5465a425c4b0
-- ==============================================================================

BEGIN;

-- 1. Solution Architect (Cargo 1, role: lead)
INSERT INTO agents (
  id, company_id, name, role, title, status, reports_to, capabilities,
  adapter_type, adapter_config, runtime_config, permissions, icon, metadata,
  created_at, updated_at
) VALUES (
  '8e5ee226-c3e9-41e5-8615-9e95d3476790'::uuid,
  'f1453093-9739-4dc9-a6c2-522abef97d3b'::uuid,
  'Fênix — Solution Architect',
  'lead',
  'Solution Architect',
  'idle',
  '587d0d1a-3402-4d7d-a871-5465a425c4b0'::uuid,
  'Transforma briefing corporativo, regulações e NFRs em ProjectBlueprint, bounded contexts, ADRs, trust boundaries e topologia C4. Governa o ciclo de vida da arquitetura com foco em resiliência e isolamento multi-tenant.',
  'langgraph',
  '{"baseUrl": "http://127.0.0.1:2024", "assistantId": "solution_architect"}'::jsonb,
  '{"heartbeat": {"enabled": false, "maxConcurrentRuns": 10}}'::jsonb,
  '{"canCreateAgents": false, "canCreateSkills": false}'::jsonb,
  'circuit-board',
  '{"cargo": 1, "cargoName": "solution_architect", "wave": 6, "roleCategory": "general/lead", "description": "Transforma briefing corporativo, regulações e NFRs em ProjectBlueprint, bounded contexts, ADRs, trust boundaries e topologia C4."}'::jsonb,
  NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  company_id = EXCLUDED.company_id,
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  title = EXCLUDED.title,
  status = EXCLUDED.status,
  reports_to = EXCLUDED.reports_to,
  capabilities = EXCLUDED.capabilities,
  adapter_type = EXCLUDED.adapter_type,
  adapter_config = EXCLUDED.adapter_config,
  runtime_config = EXCLUDED.runtime_config,
  permissions = EXCLUDED.permissions,
  icon = EXCLUDED.icon,
  metadata = EXCLUDED.metadata,
  updated_at = NOW();

INSERT INTO company_memberships (
  company_id, principal_type, principal_id, status, membership_role, created_at, updated_at
) VALUES (
  'f1453093-9739-4dc9-a6c2-522abef97d3b'::uuid, 'agent', '8e5ee226-c3e9-41e5-8615-9e95d3476790', 'active', 'member', NOW(), NOW()
) ON CONFLICT (company_id, principal_type, principal_id) DO UPDATE SET
  status = 'active', membership_role = 'member', updated_at = NOW();

-- 2. Backend Senior (Cargo 2, role: software_engineer)
INSERT INTO agents (
  id, company_id, name, role, title, status, reports_to, capabilities,
  adapter_type, adapter_config, runtime_config, permissions, icon, metadata,
  created_at, updated_at
) VALUES (
  'ef676df3-35c2-4685-bef2-514996dc2ad3'::uuid,
  'f1453093-9739-4dc9-a6c2-522abef97d3b'::uuid,
  'Fênix — Backend Senior',
  'software_engineer',
  'Tech Lead / Backend Senior',
  'idle',
  '8e5ee226-c3e9-41e5-8615-9e95d3476790'::uuid,
  'Produz código backend testado, APIs REST/gRPC e migrações de banco conforme blueprint, arquitetura limpa e cobertura >=85%. Implementa lógica de negócio de alta performance e concorrência segura.',
  'langgraph',
  '{"baseUrl": "http://127.0.0.1:2024", "assistantId": "backend_senior"}'::jsonb,
  '{"heartbeat": {"enabled": false, "maxConcurrentRuns": 10}}'::jsonb,
  '{"canCreateAgents": false, "canCreateSkills": false}'::jsonb,
  'code',
  '{"cargo": 2, "cargoName": "backend_senior", "wave": 6, "roleCategory": "software_engineer", "description": "Produz código backend testado, APIs REST/gRPC e migrações de banco conforme blueprint, arquitetura limpa e cobertura >=85%."}'::jsonb,
  NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  company_id = EXCLUDED.company_id,
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  title = EXCLUDED.title,
  status = EXCLUDED.status,
  reports_to = EXCLUDED.reports_to,
  capabilities = EXCLUDED.capabilities,
  adapter_type = EXCLUDED.adapter_type,
  adapter_config = EXCLUDED.adapter_config,
  runtime_config = EXCLUDED.runtime_config,
  permissions = EXCLUDED.permissions,
  icon = EXCLUDED.icon,
  metadata = EXCLUDED.metadata,
  updated_at = NOW();

INSERT INTO company_memberships (
  company_id, principal_type, principal_id, status, membership_role, created_at, updated_at
) VALUES (
  'f1453093-9739-4dc9-a6c2-522abef97d3b'::uuid, 'agent', 'ef676df3-35c2-4685-bef2-514996dc2ad3', 'active', 'member', NOW(), NOW()
) ON CONFLICT (company_id, principal_type, principal_id) DO UPDATE SET
  status = 'active', membership_role = 'member', updated_at = NOW();

-- 3. DevOps Specialist (Cargo 4, role: devops)
INSERT INTO agents (
  id, company_id, name, role, title, status, reports_to, capabilities,
  adapter_type, adapter_config, runtime_config, permissions, icon, metadata,
  created_at, updated_at
) VALUES (
  '524095c6-2f9f-4e80-aa24-9afe2bba2682'::uuid,
  'f1453093-9739-4dc9-a6c2-522abef97d3b'::uuid,
  'Fênix — DevOps Specialist',
  'devops',
  'DevOps & Infrastructure Specialist',
  'idle',
  '8e5ee226-c3e9-41e5-8615-9e95d3476790'::uuid,
  'Gera infraestrutura como código (IaC), GitOps, observabilidade, planos de disaster recovery, rollback e scans de vulnerabilidades. Garante pipelines herméticos e imagens assinadas.',
  'langgraph',
  '{"baseUrl": "http://127.0.0.1:2024", "assistantId": "devops"}'::jsonb,
  '{"heartbeat": {"enabled": false, "maxConcurrentRuns": 10}}'::jsonb,
  '{"canCreateAgents": false, "canCreateSkills": false}'::jsonb,
  'terminal',
  '{"cargo": 4, "cargoName": "devops", "wave": 6, "roleCategory": "devops", "description": "Gera infraestrutura como código (IaC), GitOps, observabilidade, planos de disaster recovery, rollback e scans de vulnerabilidades."}'::jsonb,
  NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  company_id = EXCLUDED.company_id,
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  title = EXCLUDED.title,
  status = EXCLUDED.status,
  reports_to = EXCLUDED.reports_to,
  capabilities = EXCLUDED.capabilities,
  adapter_type = EXCLUDED.adapter_type,
  adapter_config = EXCLUDED.adapter_config,
  runtime_config = EXCLUDED.runtime_config,
  permissions = EXCLUDED.permissions,
  icon = EXCLUDED.icon,
  metadata = EXCLUDED.metadata,
  updated_at = NOW();

INSERT INTO company_memberships (
  company_id, principal_type, principal_id, status, membership_role, created_at, updated_at
) VALUES (
  'f1453093-9739-4dc9-a6c2-522abef97d3b'::uuid, 'agent', '524095c6-2f9f-4e80-aa24-9afe2bba2682', 'active', 'member', NOW(), NOW()
) ON CONFLICT (company_id, principal_type, principal_id) DO UPDATE SET
  status = 'active', membership_role = 'member', updated_at = NOW();

-- 4. Web Designer / UI-UX (Cargo 6, role: designer)
INSERT INTO agents (
  id, company_id, name, role, title, status, reports_to, capabilities,
  adapter_type, adapter_config, runtime_config, permissions, icon, metadata,
  created_at, updated_at
) VALUES (
  'ecb910d2-706e-4e8e-ac70-c7887964b39b'::uuid,
  'f1453093-9739-4dc9-a6c2-522abef97d3b'::uuid,
  'Fênix — Web Designer / UI-UX',
  'designer',
  'Web Designer & UI-UX Specialist',
  'idle',
  '8e5ee226-c3e9-41e5-8615-9e95d3476790'::uuid,
  'Arquitetura de informação, jornadas de usuário, wireframes, design system em tokens e relatórios de conformidade de usabilidade. Foco em interfaces responsivas e intuitivas.',
  'langgraph',
  '{"baseUrl": "http://127.0.0.1:2024", "assistantId": "uiux"}'::jsonb,
  '{"heartbeat": {"enabled": false, "maxConcurrentRuns": 10}}'::jsonb,
  '{"canCreateAgents": false, "canCreateSkills": false}'::jsonb,
  'sparkles',
  '{"cargo": 6, "cargoName": "uiux", "wave": 6, "roleCategory": "designer", "description": "Arquitetura de informação, jornadas de usuário, wireframes, design system em tokens e relatórios de conformidade de usabilidade."}'::jsonb,
  NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  company_id = EXCLUDED.company_id,
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  title = EXCLUDED.title,
  status = EXCLUDED.status,
  reports_to = EXCLUDED.reports_to,
  capabilities = EXCLUDED.capabilities,
  adapter_type = EXCLUDED.adapter_type,
  adapter_config = EXCLUDED.adapter_config,
  runtime_config = EXCLUDED.runtime_config,
  permissions = EXCLUDED.permissions,
  icon = EXCLUDED.icon,
  metadata = EXCLUDED.metadata,
  updated_at = NOW();

INSERT INTO company_memberships (
  company_id, principal_type, principal_id, status, membership_role, created_at, updated_at
) VALUES (
  'f1453093-9739-4dc9-a6c2-522abef97d3b'::uuid, 'agent', 'ecb910d2-706e-4e8e-ac70-c7887964b39b', 'active', 'member', NOW(), NOW()
) ON CONFLICT (company_id, principal_type, principal_id) DO UPDATE SET
  status = 'active', membership_role = 'member', updated_at = NOW();

-- 5. Code QA Specialist (Cargo 9, role: qa)
INSERT INTO agents (
  id, company_id, name, role, title, status, reports_to, capabilities,
  adapter_type, adapter_config, runtime_config, permissions, icon, metadata,
  created_at, updated_at
) VALUES (
  '1d4592dd-6d0f-4881-9b46-17ebeb1cc9ed'::uuid,
  'f1453093-9739-4dc9-a6c2-522abef97d3b'::uuid,
  'Fênix — Code QA Specialist',
  'qa',
  'QA Automation & Code QA Specialist',
  'idle',
  '8e5ee226-c3e9-41e5-8615-9e95d3476790'::uuid,
  'Avalia pacotes de software em sandbox hermética, executando pirâmide de testes automatizados, mutation testing e relatórios de conformidade técnica e cobertura.',
  'langgraph',
  '{"baseUrl": "http://127.0.0.1:2024", "assistantId": "code_qa"}'::jsonb,
  '{"heartbeat": {"enabled": false, "maxConcurrentRuns": 10}}'::jsonb,
  '{"canCreateAgents": false, "canCreateSkills": false}'::jsonb,
  'bug',
  '{"cargo": 9, "cargoName": "code_qa", "wave": 6, "roleCategory": "qa", "description": "Avalia pacotes de software em sandbox hermética, executando pirâmide de testes automatizados, mutation testing e relatórios de conformidade técnica."}'::jsonb,
  NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  company_id = EXCLUDED.company_id,
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  title = EXCLUDED.title,
  status = EXCLUDED.status,
  reports_to = EXCLUDED.reports_to,
  capabilities = EXCLUDED.capabilities,
  adapter_type = EXCLUDED.adapter_type,
  adapter_config = EXCLUDED.adapter_config,
  runtime_config = EXCLUDED.runtime_config,
  permissions = EXCLUDED.permissions,
  icon = EXCLUDED.icon,
  metadata = EXCLUDED.metadata,
  updated_at = NOW();

INSERT INTO company_memberships (
  company_id, principal_type, principal_id, status, membership_role, created_at, updated_at
) VALUES (
  'f1453093-9739-4dc9-a6c2-522abef97d3b'::uuid, 'agent', '1d4592dd-6d0f-4881-9b46-17ebeb1cc9ed', 'active', 'member', NOW(), NOW()
) ON CONFLICT (company_id, principal_type, principal_id) DO UPDATE SET
  status = 'active', membership_role = 'member', updated_at = NOW();

-- 6. Brand & Visual Sentinel (Cargo 10, role: brand_sentinel)
INSERT INTO agents (
  id, company_id, name, role, title, status, reports_to, capabilities,
  adapter_type, adapter_config, runtime_config, permissions, icon, metadata,
  created_at, updated_at
) VALUES (
  'ca14e4bc-84f4-4153-8e75-45fea3214420'::uuid,
  'f1453093-9739-4dc9-a6c2-522abef97d3b'::uuid,
  'Fênix — Brand & Visual Sentinel',
  'brand_sentinel',
  'Brand & Visual Sentinel Specialist',
  'idle',
  '8e5ee226-c3e9-41e5-8615-9e95d3476790'::uuid,
  'Audita assets visuais contra manual de marca, tokens e safe areas via visão computacional, OCR e perceptual diff. Assegura integridade visual corporativa.',
  'langgraph',
  '{"baseUrl": "http://127.0.0.1:2024", "assistantId": "brand_sentinel"}'::jsonb,
  '{"heartbeat": {"enabled": false, "maxConcurrentRuns": 10}}'::jsonb,
  '{"canCreateAgents": false, "canCreateSkills": false}'::jsonb,
  'eye',
  '{"cargo": 10, "cargoName": "brand_sentinel", "wave": 6, "roleCategory": "brand_sentinel", "description": "Audita assets visuais contra manual de marca, tokens e safe areas via visão computacional, OCR e perceptual diff."}'::jsonb,
  NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  company_id = EXCLUDED.company_id,
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  title = EXCLUDED.title,
  status = EXCLUDED.status,
  reports_to = EXCLUDED.reports_to,
  capabilities = EXCLUDED.capabilities,
  adapter_type = EXCLUDED.adapter_type,
  adapter_config = EXCLUDED.adapter_config,
  runtime_config = EXCLUDED.runtime_config,
  permissions = EXCLUDED.permissions,
  icon = EXCLUDED.icon,
  metadata = EXCLUDED.metadata,
  updated_at = NOW();

INSERT INTO company_memberships (
  company_id, principal_type, principal_id, status, membership_role, created_at, updated_at
) VALUES (
  'f1453093-9739-4dc9-a6c2-522abef97d3b'::uuid, 'agent', 'ca14e4bc-84f4-4153-8e75-45fea3214420', 'active', 'member', NOW(), NOW()
) ON CONFLICT (company_id, principal_type, principal_id) DO UPDATE SET
  status = 'active', membership_role = 'member', updated_at = NOW();

-- 7. Legal & Security Auditor (Cargo 11, role: security)
INSERT INTO agents (
  id, company_id, name, role, title, status, reports_to, capabilities,
  adapter_type, adapter_config, runtime_config, permissions, icon, metadata,
  created_at, updated_at
) VALUES (
  '7944dd29-6603-4c5f-9396-ba140eb29be4'::uuid,
  'f1453093-9739-4dc9-a6c2-522abef97d3b'::uuid,
  'Fênix — Legal & Security Auditor',
  'security',
  'Legal & Security Auditor Specialist',
  'idle',
  '8e5ee226-c3e9-41e5-8615-9e95d3476790'::uuid,
  'Gate técnico-jurídico com SAST/DAST, auditoria de licenças, secrets e claims regulatórios com escalonamento HITL. Garante conformidade jurídica e segurança da informação.',
  'langgraph',
  '{"baseUrl": "http://127.0.0.1:2024", "assistantId": "legal_security"}'::jsonb,
  '{"heartbeat": {"enabled": false, "maxConcurrentRuns": 10}}'::jsonb,
  '{"canCreateAgents": false, "canCreateSkills": false}'::jsonb,
  'lock',
  '{"cargo": 11, "cargoName": "legal_security", "wave": 6, "roleCategory": "security", "description": "Gate técnico-jurídico com SAST/DAST, auditoria de licenças, secrets e claims regulatórios com escalonamento HITL."}'::jsonb,
  NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  company_id = EXCLUDED.company_id,
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  title = EXCLUDED.title,
  status = EXCLUDED.status,
  reports_to = EXCLUDED.reports_to,
  capabilities = EXCLUDED.capabilities,
  adapter_type = EXCLUDED.adapter_type,
  adapter_config = EXCLUDED.adapter_config,
  runtime_config = EXCLUDED.runtime_config,
  permissions = EXCLUDED.permissions,
  icon = EXCLUDED.icon,
  metadata = EXCLUDED.metadata,
  updated_at = NOW();

INSERT INTO company_memberships (
  company_id, principal_type, principal_id, status, membership_role, created_at, updated_at
) VALUES (
  'f1453093-9739-4dc9-a6c2-522abef97d3b'::uuid, 'agent', '7944dd29-6603-4c5f-9396-ba140eb29be4', 'active', 'member', NOW(), NOW()
) ON CONFLICT (company_id, principal_type, principal_id) DO UPDATE SET
  status = 'active', membership_role = 'member', updated_at = NOW();

-- 8. Copywriter Senior (Cargo 8, role: copywriter)
INSERT INTO agents (
  id, company_id, name, role, title, status, reports_to, capabilities,
  adapter_type, adapter_config, runtime_config, permissions, icon, metadata,
  created_at, updated_at
) VALUES (
  'cd20e0fa-6b30-405a-b45a-2fcc8338cd76'::uuid,
  'f1453093-9739-4dc9-a6c2-522abef97d3b'::uuid,
  'Fênix — Copywriter Senior',
  'copywriter',
  'Copywriter Senior Specialist',
  'idle',
  '8e5ee226-c3e9-41e5-8615-9e95d3476790'::uuid,
  'Produção de copy persuasiva e ética baseada em claim ledger, personas e adequação a canais sem termos proibidos. Alinha narrativa de produto e marketing.',
  'langgraph',
  '{"baseUrl": "http://127.0.0.1:2024", "assistantId": "copywriter"}'::jsonb,
  '{"heartbeat": {"enabled": false, "maxConcurrentRuns": 10}}'::jsonb,
  '{"canCreateAgents": false, "canCreateSkills": false}'::jsonb,
  'message-square',
  '{"cargo": 8, "cargoName": "copywriter", "wave": 6, "roleCategory": "copywriter", "description": "Produção de copy persuasiva e ética baseada em claim ledger, personas e adequação a canais sem termos proibidos."}'::jsonb,
  NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  company_id = EXCLUDED.company_id,
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  title = EXCLUDED.title,
  status = EXCLUDED.status,
  reports_to = EXCLUDED.reports_to,
  capabilities = EXCLUDED.capabilities,
  adapter_type = EXCLUDED.adapter_type,
  adapter_config = EXCLUDED.adapter_config,
  runtime_config = EXCLUDED.runtime_config,
  permissions = EXCLUDED.permissions,
  icon = EXCLUDED.icon,
  metadata = EXCLUDED.metadata,
  updated_at = NOW();

INSERT INTO company_memberships (
  company_id, principal_type, principal_id, status, membership_role, created_at, updated_at
) VALUES (
  'f1453093-9739-4dc9-a6c2-522abef97d3b'::uuid, 'agent', 'cd20e0fa-6b30-405a-b45a-2fcc8338cd76', 'active', 'member', NOW(), NOW()
) ON CONFLICT (company_id, principal_type, principal_id) DO UPDATE SET
  status = 'active', membership_role = 'member', updated_at = NOW();

-- 9. Growth Marketing Senior (Cargo 9, role: growth)
INSERT INTO agents (
  id, company_id, name, role, title, status, reports_to, capabilities,
  adapter_type, adapter_config, runtime_config, permissions, icon, metadata,
  created_at, updated_at
) VALUES (
  '31f4e558-8756-42cf-88f3-4c983648c996'::uuid,
  'f1453093-9739-4dc9-a6c2-522abef97d3b'::uuid,
  'Fênix — Growth Marketing Senior',
  'growth',
  'Growth Marketing Senior Specialist',
  'idle',
  '8e5ee226-c3e9-41e5-8615-9e95d3476790'::uuid,
  'Desenvolve portfólio de experimentos causais, hipóteses pré-registradas, análise de poder estatístico e guardrails de retenção. Foco em escala sustentável.',
  'langgraph',
  '{"baseUrl": "http://127.0.0.1:2024", "assistantId": "growth"}'::jsonb,
  '{"heartbeat": {"enabled": false, "maxConcurrentRuns": 10}}'::jsonb,
  '{"canCreateAgents": false, "canCreateSkills": false}'::jsonb,
  'rocket',
  '{"cargo": 9, "cargoName": "growth", "wave": 6, "roleCategory": "growth", "description": "Desenvolve portfólio de experimentos causais, hipóteses pré-registradas, análise de poder estatístico e guardrails de retenção."}'::jsonb,
  NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  company_id = EXCLUDED.company_id,
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  title = EXCLUDED.title,
  status = EXCLUDED.status,
  reports_to = EXCLUDED.reports_to,
  capabilities = EXCLUDED.capabilities,
  adapter_type = EXCLUDED.adapter_type,
  adapter_config = EXCLUDED.adapter_config,
  runtime_config = EXCLUDED.runtime_config,
  permissions = EXCLUDED.permissions,
  icon = EXCLUDED.icon,
  metadata = EXCLUDED.metadata,
  updated_at = NOW();

INSERT INTO company_memberships (
  company_id, principal_type, principal_id, status, membership_role, created_at, updated_at
) VALUES (
  'f1453093-9739-4dc9-a6c2-522abef97d3b'::uuid, 'agent', '31f4e558-8756-42cf-88f3-4c983648c996', 'active', 'member', NOW(), NOW()
) ON CONFLICT (company_id, principal_type, principal_id) DO UPDATE SET
  status = 'active', membership_role = 'member', updated_at = NOW();

-- 10. SEO Senior (Cargo 10, role: seo)
INSERT INTO agents (
  id, company_id, name, role, title, status, reports_to, capabilities,
  adapter_type, adapter_config, runtime_config, permissions, icon, metadata,
  created_at, updated_at
) VALUES (
  'f1ff171d-c21a-4496-b3ac-f5bc78105eb9'::uuid,
  'f1453093-9739-4dc9-a6c2-522abef97d3b'::uuid,
  'Fênix — SEO Senior',
  'seo',
  'SEO Senior Specialist',
  'idle',
  '8e5ee226-c3e9-41e5-8615-9e95d3476790'::uuid,
  'Especificações técnicas de indexabilidade, Core Web Vitals, arquitetura de informação e mapeamento semântico de keywords. Otimização orgânica com base em evidências.',
  'langgraph',
  '{"baseUrl": "http://127.0.0.1:2024", "assistantId": "seo"}'::jsonb,
  '{"heartbeat": {"enabled": false, "maxConcurrentRuns": 10}}'::jsonb,
  '{"canCreateAgents": false, "canCreateSkills": false}'::jsonb,
  'search',
  '{"cargo": 10, "cargoName": "seo", "wave": 6, "roleCategory": "seo", "description": "Especificações técnicas de indexabilidade, Core Web Vitals, arquitetura de informação e mapeamento semântico de keywords."}'::jsonb,
  NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  company_id = EXCLUDED.company_id,
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  title = EXCLUDED.title,
  status = EXCLUDED.status,
  reports_to = EXCLUDED.reports_to,
  capabilities = EXCLUDED.capabilities,
  adapter_type = EXCLUDED.adapter_type,
  adapter_config = EXCLUDED.adapter_config,
  runtime_config = EXCLUDED.runtime_config,
  permissions = EXCLUDED.permissions,
  icon = EXCLUDED.icon,
  metadata = EXCLUDED.metadata,
  updated_at = NOW();

INSERT INTO company_memberships (
  company_id, principal_type, principal_id, status, membership_role, created_at, updated_at
) VALUES (
  'f1453093-9739-4dc9-a6c2-522abef97d3b'::uuid, 'agent', 'f1ff171d-c21a-4496-b3ac-f5bc78105eb9', 'active', 'member', NOW(), NOW()
) ON CONFLICT (company_id, principal_type, principal_id) DO UPDATE SET
  status = 'active', membership_role = 'member', updated_at = NOW();

-- 11. Paid Traffic Senior (Cargo 11, role: paid_traffic)
INSERT INTO agents (
  id, company_id, name, role, title, status, reports_to, capabilities,
  adapter_type, adapter_config, runtime_config, permissions, icon, metadata,
  created_at, updated_at
) VALUES (
  'bece548a-b574-4d59-8b88-7d05133bf865'::uuid,
  'f1453093-9739-4dc9-a6c2-522abef97d3b'::uuid,
  'Fênix — Paid Traffic Senior',
  'paid_traffic',
  'Paid Traffic Senior Specialist',
  'idle',
  '8e5ee226-c3e9-41e5-8615-9e95d3476790'::uuid,
  'Planejamento e alocação de mídia paga, tracking com server-side tagging, matriz criativa e regras estritas de stop-loss. Gestão de CAC/LTV e conversão.',
  'langgraph',
  '{"baseUrl": "http://127.0.0.1:2024", "assistantId": "paid_traffic"}'::jsonb,
  '{"heartbeat": {"enabled": false, "maxConcurrentRuns": 10}}'::jsonb,
  '{"canCreateAgents": false, "canCreateSkills": false}'::jsonb,
  'target',
  '{"cargo": 11, "cargoName": "paid_traffic", "wave": 6, "roleCategory": "paid_traffic", "description": "Planejamento e alocação de mídia paga, tracking com server-side tagging, matriz criativa e regras estritas de stop-loss."}'::jsonb,
  NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  company_id = EXCLUDED.company_id,
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  title = EXCLUDED.title,
  status = EXCLUDED.status,
  reports_to = EXCLUDED.reports_to,
  capabilities = EXCLUDED.capabilities,
  adapter_type = EXCLUDED.adapter_type,
  adapter_config = EXCLUDED.adapter_config,
  runtime_config = EXCLUDED.runtime_config,
  permissions = EXCLUDED.permissions,
  icon = EXCLUDED.icon,
  metadata = EXCLUDED.metadata,
  updated_at = NOW();

INSERT INTO company_memberships (
  company_id, principal_type, principal_id, status, membership_role, created_at, updated_at
) VALUES (
  'f1453093-9739-4dc9-a6c2-522abef97d3b'::uuid, 'agent', 'bece548a-b574-4d59-8b88-7d05133bf865', 'active', 'member', NOW(), NOW()
) ON CONFLICT (company_id, principal_type, principal_id) DO UPDATE SET
  status = 'active', membership_role = 'member', updated_at = NOW();

-- 12. DPO Senior (Cargo 12, role: dpo)
INSERT INTO agents (
  id, company_id, name, role, title, status, reports_to, capabilities,
  adapter_type, adapter_config, runtime_config, permissions, icon, metadata,
  created_at, updated_at
) VALUES (
  '7db26700-27b2-4c31-819c-1a82855aa9bc'::uuid,
  'f1453093-9739-4dc9-a6c2-522abef97d3b'::uuid,
  'Fênix — DPO Senior',
  'dpo',
  'Data Protection Officer (DPO) Senior',
  'idle',
  '8e5ee226-c3e9-41e5-8615-9e95d3476790'::uuid,
  'Governança de privacidade, inventário de dados, RoPA, DPIA, mapeamento de bases legais LGPD/GDPR e fluxos de DSAR. Proteção de dados e conformidade regulatória.',
  'langgraph',
  '{"baseUrl": "http://127.0.0.1:2024", "assistantId": "dpo"}'::jsonb,
  '{"heartbeat": {"enabled": false, "maxConcurrentRuns": 10}}'::jsonb,
  '{"canCreateAgents": false, "canCreateSkills": false}'::jsonb,
  'shield',
  '{"cargo": 12, "cargoName": "dpo", "wave": 6, "roleCategory": "dpo", "description": "Governança de privacidade, inventário de dados, RoPA, DPIA, mapeamento de bases legais LGPD/GDPR e fluxos de DSAR."}'::jsonb,
  NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  company_id = EXCLUDED.company_id,
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  title = EXCLUDED.title,
  status = EXCLUDED.status,
  reports_to = EXCLUDED.reports_to,
  capabilities = EXCLUDED.capabilities,
  adapter_type = EXCLUDED.adapter_type,
  adapter_config = EXCLUDED.adapter_config,
  runtime_config = EXCLUDED.runtime_config,
  permissions = EXCLUDED.permissions,
  icon = EXCLUDED.icon,
  metadata = EXCLUDED.metadata,
  updated_at = NOW();

INSERT INTO company_memberships (
  company_id, principal_type, principal_id, status, membership_role, created_at, updated_at
) VALUES (
  'f1453093-9739-4dc9-a6c2-522abef97d3b'::uuid, 'agent', '7db26700-27b2-4c31-819c-1a82855aa9bc', 'active', 'member', NOW(), NOW()
) ON CONFLICT (company_id, principal_type, principal_id) DO UPDATE SET
  status = 'active', membership_role = 'member', updated_at = NOW();

-- 13. Localization Senior (Cargo 13, role: localization)
INSERT INTO agents (
  id, company_id, name, role, title, status, reports_to, capabilities,
  adapter_type, adapter_config, runtime_config, permissions, icon, metadata,
  created_at, updated_at
) VALUES (
  '94fff6dd-f1ae-420d-98a5-8e4c7d913c3d'::uuid,
  'f1453093-9739-4dc9-a6c2-522abef97d3b'::uuid,
  'Fênix — Localization Senior',
  'localization',
  'Internationalization & Localization Senior',
  'idle',
  '8e5ee226-c3e9-41e5-8615-9e95d3476790'::uuid,
  'Adaptação cultural, regulatória e terminológica de produtos para múltiplos idiomas via padrões ICU e testes de pseudo-localização. Internacionalização completa.',
  'langgraph',
  '{"baseUrl": "http://127.0.0.1:2024", "assistantId": "localization"}'::jsonb,
  '{"heartbeat": {"enabled": false, "maxConcurrentRuns": 10}}'::jsonb,
  '{"canCreateAgents": false, "canCreateSkills": false}'::jsonb,
  'globe',
  '{"cargo": 13, "cargoName": "localization", "wave": 6, "roleCategory": "localization", "description": "Adaptação cultural, regulatória e terminológica de produtos para múltiplos idiomas via padrões ICU e testes de pseudo-localização."}'::jsonb,
  NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  company_id = EXCLUDED.company_id,
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  title = EXCLUDED.title,
  status = EXCLUDED.status,
  reports_to = EXCLUDED.reports_to,
  capabilities = EXCLUDED.capabilities,
  adapter_type = EXCLUDED.adapter_type,
  adapter_config = EXCLUDED.adapter_config,
  runtime_config = EXCLUDED.runtime_config,
  permissions = EXCLUDED.permissions,
  icon = EXCLUDED.icon,
  metadata = EXCLUDED.metadata,
  updated_at = NOW();

INSERT INTO company_memberships (
  company_id, principal_type, principal_id, status, membership_role, created_at, updated_at
) VALUES (
  'f1453093-9739-4dc9-a6c2-522abef97d3b'::uuid, 'agent', '94fff6dd-f1ae-420d-98a5-8e4c7d913c3d', 'active', 'member', NOW(), NOW()
) ON CONFLICT (company_id, principal_type, principal_id) DO UPDATE SET
  status = 'active', membership_role = 'member', updated_at = NOW();

-- 14. Data Analyst Senior (Cargo 14, role: data_analyst)
INSERT INTO agents (
  id, company_id, name, role, title, status, reports_to, capabilities,
  adapter_type, adapter_config, runtime_config, permissions, icon, metadata,
  created_at, updated_at
) VALUES (
  '02754e2c-ea1a-4116-91f3-e59d72c8292b'::uuid,
  'f1453093-9739-4dc9-a6c2-522abef97d3b'::uuid,
  'Fênix — Data Analyst Senior',
  'data_analyst',
  'Data Analyst Senior Specialist',
  'idle',
  '8e5ee226-c3e9-41e5-8615-9e95d3476790'::uuid,
  'Modelagem de métricas de negócio reproduzíveis, análise exploratória e confirmatória de dados e validação de qualidade de pipelines. Inteligência orientada a dados.',
  'langgraph',
  '{"baseUrl": "http://127.0.0.1:2024", "assistantId": "data_analyst"}'::jsonb,
  '{"heartbeat": {"enabled": false, "maxConcurrentRuns": 10}}'::jsonb,
  '{"canCreateAgents": false, "canCreateSkills": false}'::jsonb,
  'database',
  '{"cargo": 14, "cargoName": "data_analyst", "wave": 6, "roleCategory": "data_analyst", "description": "Modelagem de métricas de negócio reproduzíveis, análise exploratória e confirmatória de dados e validação de qualidade de pipelines."}'::jsonb,
  NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  company_id = EXCLUDED.company_id,
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  title = EXCLUDED.title,
  status = EXCLUDED.status,
  reports_to = EXCLUDED.reports_to,
  capabilities = EXCLUDED.capabilities,
  adapter_type = EXCLUDED.adapter_type,
  adapter_config = EXCLUDED.adapter_config,
  runtime_config = EXCLUDED.runtime_config,
  permissions = EXCLUDED.permissions,
  icon = EXCLUDED.icon,
  metadata = EXCLUDED.metadata,
  updated_at = NOW();

INSERT INTO company_memberships (
  company_id, principal_type, principal_id, status, membership_role, created_at, updated_at
) VALUES (
  'f1453093-9739-4dc9-a6c2-522abef97d3b'::uuid, 'agent', '02754e2c-ea1a-4116-91f3-e59d72c8292b', 'active', 'member', NOW(), NOW()
) ON CONFLICT (company_id, principal_type, principal_id) DO UPDATE SET
  status = 'active', membership_role = 'member', updated_at = NOW();

-- 15. CRM Senior (Cargo 15, role: crm)
INSERT INTO agents (
  id, company_id, name, role, title, status, reports_to, capabilities,
  adapter_type, adapter_config, runtime_config, permissions, icon, metadata,
  created_at, updated_at
) VALUES (
  'c569f2cc-2cca-49e5-8cee-eec88a33ed07'::uuid,
  'f1453093-9739-4dc9-a6c2-522abef97d3b'::uuid,
  'Fênix — CRM Senior',
  'crm',
  'CRM & Lifecycle Specialist Senior',
  'idle',
  '8e5ee226-c3e9-41e5-8615-9e95d3476790'::uuid,
  'Automação de jornadas de cliente baseadas em eventos, segmentação dinâmica, políticas de frequência e mensuração de retenção. Gestão de ciclo de vida do cliente.',
  'langgraph',
  '{"baseUrl": "http://127.0.0.1:2024", "assistantId": "crm"}'::jsonb,
  '{"heartbeat": {"enabled": false, "maxConcurrentRuns": 10}}'::jsonb,
  '{"canCreateAgents": false, "canCreateSkills": false}'::jsonb,
  'heart',
  '{"cargo": 15, "cargoName": "crm", "wave": 6, "roleCategory": "crm", "description": "Automação de jornadas de cliente baseadas em eventos, segmentação dinâmica, políticas de frequência e mensuração de retenção."}'::jsonb,
  NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  company_id = EXCLUDED.company_id,
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  title = EXCLUDED.title,
  status = EXCLUDED.status,
  reports_to = EXCLUDED.reports_to,
  capabilities = EXCLUDED.capabilities,
  adapter_type = EXCLUDED.adapter_type,
  adapter_config = EXCLUDED.adapter_config,
  runtime_config = EXCLUDED.runtime_config,
  permissions = EXCLUDED.permissions,
  icon = EXCLUDED.icon,
  metadata = EXCLUDED.metadata,
  updated_at = NOW();

INSERT INTO company_memberships (
  company_id, principal_type, principal_id, status, membership_role, created_at, updated_at
) VALUES (
  'f1453093-9739-4dc9-a6c2-522abef97d3b'::uuid, 'agent', 'c569f2cc-2cca-49e5-8cee-eec88a33ed07', 'active', 'member', NOW(), NOW()
) ON CONFLICT (company_id, principal_type, principal_id) DO UPDATE SET
  status = 'active', membership_role = 'member', updated_at = NOW();

-- 16. Model Risk Senior (Cargo 16, role: model_risk)
INSERT INTO agents (
  id, company_id, name, role, title, status, reports_to, capabilities,
  adapter_type, adapter_config, runtime_config, permissions, icon, metadata,
  created_at, updated_at
) VALUES (
  'edc24079-ea49-496f-865f-a6f6b42c1510'::uuid,
  'f1453093-9739-4dc9-a6c2-522abef97d3b'::uuid,
  'Fênix — Model Risk Senior',
  'model_risk',
  'AI Evaluation & Model Risk Specialist Senior',
  'idle',
  '8e5ee226-c3e9-41e5-8615-9e95d3476790'::uuid,
  'Avaliação sistemática de LLMs via datasets congelados, calibração de avaliadores (judges), detecção de alucinação e governança de risco. Confiabilidade algorítmica.',
  'langgraph',
  '{"baseUrl": "http://127.0.0.1:2024", "assistantId": "model_risk"}'::jsonb,
  '{"heartbeat": {"enabled": false, "maxConcurrentRuns": 10}}'::jsonb,
  '{"canCreateAgents": false, "canCreateSkills": false}'::jsonb,
  'microscope',
  '{"cargo": 16, "cargoName": "model_risk", "wave": 6, "roleCategory": "model_risk", "description": "Avaliação sistemática de LLMs via datasets congelados, calibração de avaliadores (judges), detecção de alucinação e governança de risco."}'::jsonb,
  NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  company_id = EXCLUDED.company_id,
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  title = EXCLUDED.title,
  status = EXCLUDED.status,
  reports_to = EXCLUDED.reports_to,
  capabilities = EXCLUDED.capabilities,
  adapter_type = EXCLUDED.adapter_type,
  adapter_config = EXCLUDED.adapter_config,
  runtime_config = EXCLUDED.runtime_config,
  permissions = EXCLUDED.permissions,
  icon = EXCLUDED.icon,
  metadata = EXCLUDED.metadata,
  updated_at = NOW();

INSERT INTO company_memberships (
  company_id, principal_type, principal_id, status, membership_role, created_at, updated_at
) VALUES (
  'f1453093-9739-4dc9-a6c2-522abef97d3b'::uuid, 'agent', 'edc24079-ea49-496f-865f-a6f6b42c1510', 'active', 'member', NOW(), NOW()
) ON CONFLICT (company_id, principal_type, principal_id) DO UPDATE SET
  status = 'active', membership_role = 'member', updated_at = NOW();

-- 17. Graphic Designer Senior (Cargo 17, role: graphic_designer)
INSERT INTO agents (
  id, company_id, name, role, title, status, reports_to, capabilities,
  adapter_type, adapter_config, runtime_config, permissions, icon, metadata,
  created_at, updated_at
) VALUES (
  '53268aae-2cff-4f75-8564-a0aa380d0a95'::uuid,
  'f1453093-9739-4dc9-a6c2-522abef97d3b'::uuid,
  'Fênix — Graphic Designer Senior',
  'graphic_designer',
  'Graphic Designer Senior Specialist',
  'idle',
  '8e5ee226-c3e9-41e5-8615-9e95d3476790'::uuid,
  'Criação de masters visuais, renditions multicanal e validação estrita de licenciamento e proveniência de assets gráficos. Excelência visual e estética.',
  'langgraph',
  '{"baseUrl": "http://127.0.0.1:2024", "assistantId": "graphic_designer"}'::jsonb,
  '{"heartbeat": {"enabled": false, "maxConcurrentRuns": 10}}'::jsonb,
  '{"canCreateAgents": false, "canCreateSkills": false}'::jsonb,
  'wand',
  '{"cargo": 17, "cargoName": "graphic_designer", "wave": 6, "roleCategory": "graphic_designer", "description": "Criação de masters visuais, renditions multicanal e validação estrita de licenciamento e proveniência de assets gráficos."}'::jsonb,
  NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  company_id = EXCLUDED.company_id,
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  title = EXCLUDED.title,
  status = EXCLUDED.status,
  reports_to = EXCLUDED.reports_to,
  capabilities = EXCLUDED.capabilities,
  adapter_type = EXCLUDED.adapter_type,
  adapter_config = EXCLUDED.adapter_config,
  runtime_config = EXCLUDED.runtime_config,
  permissions = EXCLUDED.permissions,
  icon = EXCLUDED.icon,
  metadata = EXCLUDED.metadata,
  updated_at = NOW();

INSERT INTO company_memberships (
  company_id, principal_type, principal_id, status, membership_role, created_at, updated_at
) VALUES (
  'f1453093-9739-4dc9-a6c2-522abef97d3b'::uuid, 'agent', '53268aae-2cff-4f75-8564-a0aa380d0a95', 'active', 'member', NOW(), NOW()
) ON CONFLICT (company_id, principal_type, principal_id) DO UPDATE SET
  status = 'active', membership_role = 'member', updated_at = NOW();

-- 18. Accessibility Senior (Cargo 18, role: accessibility)
INSERT INTO agents (
  id, company_id, name, role, title, status, reports_to, capabilities,
  adapter_type, adapter_config, runtime_config, permissions, icon, metadata,
  created_at, updated_at
) VALUES (
  '533e6ccc-0033-4cc1-a616-6857b874b251'::uuid,
  'f1453093-9739-4dc9-a6c2-522abef97d3b'::uuid,
  'Fênix — Accessibility Senior',
  'accessibility',
  'Accessibility Specialist Senior',
  'idle',
  '8e5ee226-c3e9-41e5-8615-9e95d3476790'::uuid,
  'Auditoria e validação independente de acessibilidade conforme normas WCAG 2.2 AA em fluxos críticos e tecnologias assistivas. Inclusão digital sem barreiras.',
  'langgraph',
  '{"baseUrl": "http://127.0.0.1:2024", "assistantId": "accessibility"}'::jsonb,
  '{"heartbeat": {"enabled": false, "maxConcurrentRuns": 10}}'::jsonb,
  '{"canCreateAgents": false, "canCreateSkills": false}'::jsonb,
  'star',
  '{"cargo": 18, "cargoName": "accessibility", "wave": 6, "roleCategory": "accessibility", "description": "Auditoria e validação independente de acessibilidade conforme normas WCAG 2.2 AA em fluxos críticos e tecnologias assistivas."}'::jsonb,
  NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  company_id = EXCLUDED.company_id,
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  title = EXCLUDED.title,
  status = EXCLUDED.status,
  reports_to = EXCLUDED.reports_to,
  capabilities = EXCLUDED.capabilities,
  adapter_type = EXCLUDED.adapter_type,
  adapter_config = EXCLUDED.adapter_config,
  runtime_config = EXCLUDED.runtime_config,
  permissions = EXCLUDED.permissions,
  icon = EXCLUDED.icon,
  metadata = EXCLUDED.metadata,
  updated_at = NOW();

INSERT INTO company_memberships (
  company_id, principal_type, principal_id, status, membership_role, created_at, updated_at
) VALUES (
  'f1453093-9739-4dc9-a6c2-522abef97d3b'::uuid, 'agent', '533e6ccc-0033-4cc1-a616-6857b874b251', 'active', 'member', NOW(), NOW()
) ON CONFLICT (company_id, principal_type, principal_id) DO UPDATE SET
  status = 'active', membership_role = 'member', updated_at = NOW();

-- 19. API Contract Specialist (Cargo 18, role: api_contract)
INSERT INTO agents (
  id, company_id, name, role, title, status, reports_to, capabilities,
  adapter_type, adapter_config, runtime_config, permissions, icon, metadata,
  created_at, updated_at
) VALUES (
  '48644daa-9c89-45b4-bccc-5deedb6baa01'::uuid,
  'f1453093-9739-4dc9-a6c2-522abef97d3b'::uuid,
  'Fênix — API Contract Specialist',
  'api_contract',
  'API Contract Specialist Senior',
  'idle',
  '8e5ee226-c3e9-41e5-8615-9e95d3476790'::uuid,
  'Governança e especificação de contratos de API (OpenAPI/AsyncAPI), versionamento semântico, mocks e verificação de breaking changes. Padronização de integrações.',
  'langgraph',
  '{"baseUrl": "http://127.0.0.1:2024", "assistantId": "api_contract"}'::jsonb,
  '{"heartbeat": {"enabled": false, "maxConcurrentRuns": 10}}'::jsonb,
  '{"canCreateAgents": false, "canCreateSkills": false}'::jsonb,
  'file-code',
  '{"cargo": 18, "cargoName": "api_contract", "wave": 6, "roleCategory": "api_contract", "description": "Governança e especificação de contratos de API (OpenAPI/AsyncAPI), versionamento semântico, mocks e verificação de breaking changes."}'::jsonb,
  NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  company_id = EXCLUDED.company_id,
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  title = EXCLUDED.title,
  status = EXCLUDED.status,
  reports_to = EXCLUDED.reports_to,
  capabilities = EXCLUDED.capabilities,
  adapter_type = EXCLUDED.adapter_type,
  adapter_config = EXCLUDED.adapter_config,
  runtime_config = EXCLUDED.runtime_config,
  permissions = EXCLUDED.permissions,
  icon = EXCLUDED.icon,
  metadata = EXCLUDED.metadata,
  updated_at = NOW();

INSERT INTO company_memberships (
  company_id, principal_type, principal_id, status, membership_role, created_at, updated_at
) VALUES (
  'f1453093-9739-4dc9-a6c2-522abef97d3b'::uuid, 'agent', '48644daa-9c89-45b4-bccc-5deedb6baa01', 'active', 'member', NOW(), NOW()
) ON CONFLICT (company_id, principal_type, principal_id) DO UPDATE SET
  status = 'active', membership_role = 'member', updated_at = NOW();

-- 20. Frontend Senior (Cargo 20, role: frontend)
INSERT INTO agents (
  id, company_id, name, role, title, status, reports_to, capabilities,
  adapter_type, adapter_config, runtime_config, permissions, icon, metadata,
  created_at, updated_at
) VALUES (
  '90e27e22-be5e-4e29-8427-77c11966f1f7'::uuid,
  'f1453093-9739-4dc9-a6c2-522abef97d3b'::uuid,
  'Fênix — Frontend Senior',
  'frontend',
  'Frontend Senior Specialist',
  'idle',
  '8e5ee226-c3e9-41e5-8615-9e95d3476790'::uuid,
  'Implementação de interfaces web reativas com TypeScript estrito, zero any, design tokens, testes ponta a ponta e performance budgets. Experiência de usuário fluida.',
  'langgraph',
  '{"baseUrl": "http://127.0.0.1:2024", "assistantId": "frontend"}'::jsonb,
  '{"heartbeat": {"enabled": false, "maxConcurrentRuns": 10}}'::jsonb,
  '{"canCreateAgents": false, "canCreateSkills": false}'::jsonb,
  'package',
  '{"cargo": 20, "cargoName": "frontend", "wave": 6, "roleCategory": "frontend", "description": "Implementação de interfaces web reativas com TypeScript estrito, zero any, design tokens, testes ponta a ponta e performance budgets."}'::jsonb,
  NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  company_id = EXCLUDED.company_id,
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  title = EXCLUDED.title,
  status = EXCLUDED.status,
  reports_to = EXCLUDED.reports_to,
  capabilities = EXCLUDED.capabilities,
  adapter_type = EXCLUDED.adapter_type,
  adapter_config = EXCLUDED.adapter_config,
  runtime_config = EXCLUDED.runtime_config,
  permissions = EXCLUDED.permissions,
  icon = EXCLUDED.icon,
  metadata = EXCLUDED.metadata,
  updated_at = NOW();

INSERT INTO company_memberships (
  company_id, principal_type, principal_id, status, membership_role, created_at, updated_at
) VALUES (
  'f1453093-9739-4dc9-a6c2-522abef97d3b'::uuid, 'agent', '90e27e22-be5e-4e29-8427-77c11966f1f7', 'active', 'member', NOW(), NOW()
) ON CONFLICT (company_id, principal_type, principal_id) DO UPDATE SET
  status = 'active', membership_role = 'member', updated_at = NOW();

-- 21. Validação Final
SELECT COUNT(*) AS total_agents_genesis
FROM agents
WHERE company_id = 'f1453093-9739-4dc9-a6c2-522abef97d3b'::uuid;

COMMIT;
