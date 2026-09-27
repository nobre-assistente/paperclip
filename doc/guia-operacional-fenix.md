# Guia Operacional — Ecossistema Fênix Enterprise Agents & Paperclip

> **Versão:** 1.0.0 — Wave 6 / Enterprise Production  
> **Classificação:** Documento Operacional e Runbook de Governança  
> **Organização / Tenant:** FEA - Genesis (`f1453093-9739-4dc9-a6c2-522abef97d3b`)  
> **Control Plane URL:** `https://ai.acesse.la`  
> **LangGraph Server:** `http://127.0.0.1:2024`  

---

## Sumário

1. [Seção 1: Arquitetura e Papéis do Ecossistema](#seção-1-arquitetura-e-papéis-do-ecossistema)
   - 1.1 Visão Geral e Topologia Integrada
   - 1.2 Macro Orquestrador HITL
   - 1.3 Paperclip Control Plane (`https://ai.acesse.la`)
   - 1.4 LangGraph Server e Subgrafos Especializados
   - 1.5 Multi-tenancy RLS (Row-Level Security)
2. [Seção 2: Catálogo Completo dos 20 Especialistas](#seção-2-catálogo-completo-dos-20-especialistas)
   - 2.1 Matriz Geral dos Especialistas da Wave 6
   - 2.2 Fichas Técnicas Detalhadas por Especialista
3. [Seção 3: Como Usar no Dia a Dia](#seção-3-como-usar-no-dia-a-dia)
   - 3.1 Ciclo de Vida da Demanda e Abertura de Tarefas
   - 3.2 Orquestração Global vs. Acionamento Direto
   - 3.3 Interação em Chat e Modo Conversacional Seguro (Anti-Loop de Release)
   - 3.4 Padrão de Briefing e Critérios de Aceite
4. [Seção 4: Governança, CAB e Aprovações Humanas (HITL)](#seção-4-governança-cab-e-aprovações-humanas-hitl)
   - 4.1 O Papel do Change Advisory Board (CAB) Automatizado
   - 4.2 Matriz de Gates de Qualidade e Critérios de Aceite
   - 4.3 Onde Inspecionar Evidências e Relatórios de Auditoria
   - 4.4 Passo a Passo de Decisão na Aba `/approvals`
   - 4.5 Bloqueios de Segurança e Circuit Breakers
5. [Seção 5: Telemetria, Pools de IA e Resolução de Problemas](#seção-5-telemetria-pools-de-ia-e-resolução-de-problemas)
   - 5.1 Infraestrutura de Inferência: Pool OMP (Antigravity) e Multi-Account
   - 5.2 Monitoramento de Cotas, Tokens e Latência
   - 5.3 Logs de Auditoria e Rastreabilidade (`activity_log`)
   - 5.4 Runbook de Resolução de Incidentes e Falhas Operacionais

---

## Seção 1: Arquitetura e Papéis do Ecossistema

### 1.1 Visão Geral e Topologia Integrada

O **Ecossistema Fênix Enterprise Agents** constitui uma plataforma autônoma de engenharia de software e operações digitais de alta confiabilidade, orquestrada por meio do **Paperclip** como control plane centralizado e impulsionada por subgrafos determinísticos executados no **LangGraph Server**.

A arquitetura opera em três camadas estritamente desacopladas:

```
┌────────────────────────────────────────────────────────────────────────┐
│                   Camada de Governança & HITL                          │
│        Operadores Humanos · YouTrack (MFNX/FEA) · Aba Approvals        │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                    Paperclip Control Plane                             │
│                  (https://ai.acesse.la : 3100)                         │
│  - Gestão de Issues, Tarefas e Estados de Execução (Heartbeats)        │
│  - Catálogo de Agentes e Credenciais Hashed                            │
│  - Armazenamento Nativo de Documentos & Work Products                  │
│  - RLS Multi-tenant no PostgreSQL nativo                               │
└───────────────────┬────────────────────────────────┬───────────────────┘
                    │                                │
                    ▼                                ▼
┌──────────────────────────────────────┐  ┌──────────────────────────────┐
│    Macro Orquestrador HITL           │  │   LangGraph Server (Port 2024)│
│  - Roteamento de Briefing            │  │  - 20 Subgrafos de Especial. │
│  - Consolidação de Gates             │  │  - Checkpoints & Estado Pg   │
│  - Submissão de Aprovações           │  │  - Retries & Auto-Auditoria  │
└──────────────────────────────────────┘  └──────────────────────────────┘
```

### 1.2 Macro Orquestrador HITL

O **Fenix Orchestrator HITL Agent** (ID: `587d0d1a-3402-4d7d-a871-5465a425c4b0`) atua como a entidade coordenadora macro da organização. Suas atribuições incluem:
- **Recepção e Validação do Briefing:** Processa demandas provenientes do YouTrack ou do Paperclip Board, decompondo-as em requisitos funcionais e não-funcionais (NFRs).
- **Roteamento Especializado:** Determina quais dos 20 especialistas devem ser ativados em sequência ou em paralelo.
- **Auditoria Cruzada e Agregação de Gates:** Recebe relatórios estruturados de auditoria emitidos por cada especialista (ex: Code QA, Legal & Security, Brand Sentinel) e compila a matriz de risco consolidada.
- **Acionamento de Gates CAB:** Quando uma alteração afeta infraestrutura de produção, contratos de API públicos ou ativos de marca, o Macro Orquestrador suspende a execução (`interrupt`) e gera um card formal de aprovação no Paperclip.

### 1.3 Paperclip Control Plane (`https://ai.acesse.la`)

O Paperclip fornece a superfície operacional completa para interação humana e acompanhamento das operações de agentes:
- **Gestão de Tarefas (`/issues`):** Acompanhamento do progresso em tempo real (`todo`, `in_progress`, `in_review`, `done`, `blocked`).
- **Aprovações Governança (`/approvals`):** Painel unificado onde pendências de release, alterações de infraestrutura e orçamentos aguardam deliberação humana com base em evidências verificáveis.
- **Documentos Nativos (`/documents` e Issue Documents):** Registro centralizado de especificações, planos de implementação e runbooks, protegidos contra deleção acidental e auditados por revisões numéricas.
- **Rastreabilidade e Runs (`/activity` e `/activity/runs`):** Histórico completo de chamadas de ferramentas, logs de execução de cada heartbeat e custos computacionais agregados.

### 1.4 LangGraph Server e Subgrafos Especializados

Localizado em `http://127.0.0.1:2024`, o LangGraph Server executa as topologias cíclicas e lineares dos 20 especialistas:
- Cada especialista possui um subgrafo isolado de 4 ou 5 nós determinísticos (ex: `intake_brief -> strategy -> self_audit -> revision -> finalize`).
- **Checkpointers Postgres:** O estado de execução de cada thread de execução é persistido no banco de dados (`checkpoints`, `checkpoint_blobs`), garantindo resiliência contra reinicializações de pods ou falhas temporárias.
- **Mecanismo de Auto-Auditoria:** Antes de emitir qualquer entregável, o especialista roda uma bateria de checagem automatizada (critérios zero-divergence, conformidade de licenças, WCAG, cobertura de código). Falhas na auto-auditoria geram loops internos de auto-correção (`revision`) antes de submeter ao orquestrador.

### 1.5 Multi-tenancy RLS (Row-Level Security)

A camada de dados no PostgreSQL opera com isolamento rigoroso por organização/tenant:
- Cada entidade (agentes, tarefas, documentos, credenciais, execuções) possui uma coluna estrita `company_id`.
- Políticas de Row-Level Security (RLS) impedem qualquer vazamento de contexto ou colisão entre tenants distintos.
- A organização primária do ecossistema é **FEA - Genesis** (`f1453093-9739-4dc9-a6c2-522abef97d3b`).

---

## Seção 2: Catálogo Completo dos 20 Especialistas

A Wave 6 introduziu a matriz de 20 especialistas técnicos, cada qual com responsabilidade estrita sobre seu território e artefatos de entrega.

### 2.1 Matriz Geral dos Especialistas da Wave 6

| # | Cargo Oficial | Identificador | Role Paperclip | Subgrafo / Topologia | Entregável Principal |
|---|---|---|---|---|---|
| 01 | Solution Architect | `solution_architect` | `general` / `lead` | 5 nós (ADR, NFR, RTO/RPO) | Especificação de Arquitetura & ADR |
| 02 | Backend Senior | `backend_senior` | `software_engineer` | 5 nós (Build, Test, Scan, Latency) | Código Backend & Testes Unitários |
| 03 | DevOps Specialist | `devops` | `devops` | 5 nós (IaC, Drills, Policy, Guard) | Pipeline CI/CD, Docker & Terraform |
| 04 | Web Designer / UI-UX | `uiux` | `designer` | 4 nós (Tokens, WCAG, Flow States) | Wireframes, Mockups & Design Tokens |
| 05 | Code QA Specialist | `code_qa` | `qa` | 4 nós (Critical Flows, Quarantine) | Testes E2E & Relatório de Cobertura |
| 06 | Brand & Visual Sentinel | `brand_sentinel` | `brand_sentinel` | 4 nós (Baseline, OCR, Conformance) | Parecer de Conformidade de Marca |
| 07 | Legal & Security Auditor | `legal_security` | `security` | 5 nós (Licenses, Secrets, LGPD) | Laudo de Segurança & Auditoria Jurídica |
| 08 | Copywriter Senior | `copywriter` | `copywriter` | 4 nós (BDF, Rule of One, CUB) | Copies Persuasivas, Headings & CTAs |
| 09 | Growth Marketing Senior | `growth` | `growth` | 5 nós (ICP, Funis, Baselines) | Estratégia de Aquisição & Conversão |
| 10 | SEO Senior | `seo` | `seo` | 5 nós (Keywords, Meta, Estrutura) | Planejamento de SEO On-Page/Técnico |
| 11 | Paid Traffic Senior | `paid_traffic` | `paid_traffic` | 5 nós (CPA, Budget, Públicos) | Estrutura de Campanhas Ads & Alocação |
| 12 | DPO Senior | `dpo` | `dpo` | 5 nós (Privacy, Base Legal, Retenção)| Relatório de Impacto (RIPD / LGPD) |
| 13 | Localization Senior | `localization` | `localization` | 5 nós (Glossário, Adaptação Cultural)| Conteúdo Localizado & Padrões i18n |
| 14 | Data Analyst Senior | `data_analyst` | `data_analyst` | 5 nós (Métricas, Fórmulas, Fontes) | Especificação de Tracking & Dashboards |
| 15 | CRM Senior | `crm` | `crm` | 5 nós (Régua, Opt-in, Anti-Spam) | Automação de E-mails & Jornadas |
| 16 | Model Risk Senior | `model_risk` | `model_risk` | 5 nós (Acurácia, Viés, Explicab.) | Matriz de Risco Algorítmico |
| 17 | Graphic Designer Senior | `graphic_designer` | `graphic_designer` | 4 nós (Formatos, Dimensões, Contraste)| Ativos Visuais Estáticos & Banners |
| 18 | Accessibility Senior | `accessibility` | `accessibility` | 4 nós (WCAG AA/AAA, Contraste, Focus)| Laudo de Acessibilidade & Checklist |
| 19 | API Contract Specialist | `api_contract` | `api_contract` | 4 nós (OpenAPI, Breaking Changes) | Contratos de API & Schemas JSON |
| 20 | Frontend Senior | `frontend` | `frontend` | 4 nós (Bundle Budget, Typescript) | Código SPA/Web Components & UI |

---

### 2.2 Fichas Técnicas Detalhadas por Especialista

#### 01. Solution Architect (`solution_architect`)
- **Cargo:** Cargo 1 (WI-6-001 / FEA-123)
- **Papel:** Líder de arquitetura de soluções, guardião das ADRs (Architecture Decision Records) e requisitos não-funcionais.
- **Topologia de Nós:** `intake_requirements -> define_adr -> evaluate_nfr_and_rto -> self_audit -> emit_spec`.
- **Competências:** Desenho de arquiteturas desacopladas, definição de RTO (Recovery Time Objective) e RPO (Recovery Point Objective), modelagem de fronteiras de confiança (*trust boundaries*).
- **Entregáveis:** Documento de Especificação Técnica, ADR estruturada e matriz de NFRs.

#### 02. Backend Senior (`backend_senior`)
- **Cargo:** Cargo 2 (WI-6-002 / FEA-126)
- **Papel:** Desenvolvimento de serviços centrais, rotas de API, persistência segura e regras de negócio complexas.
- **Topologia de Nós:** `intake_spec -> implement_code -> run_build_and_tests -> security_scan -> finalize_backend`.
- **Competências:** Python assíncrono (FastAPI/Uvicorn), TypeScript/Node.js, PostgreSQL com RLS, transações ACID e consultas parametrizadas obrigatórias.
- **Entregáveis:** Código-fonte implementado, suíte de testes unitários com cobertura de linha e branch, relatório de scan de segurança estática.

#### 03. DevOps Specialist (`devops`)
- **Cargo:** Cargo 4 (WI-6-004 / FEA-130)
- **Papel:** Automação de infraestrutura, pipelines de entrega contínua, governança de containers e disaster recovery.
- **Topologia de Nós:** `intake_infra_spec -> compose_iac -> validate_policy_as_code -> test_dr_restoration -> finalize_pipeline`.
- **Competências:** Docker Compose / Swarm, imagens Docker assinadas e pinned com SHA256 imutável, Terraform, simulacros de restauração de banco (DR drills).
- **Entregáveis:** Arquivos `docker-compose.yml`, manifests de deploy, scripts de migração/backup e evidência de testes DR.

#### 04. Web Designer / UI-UX (`uiux`)
- **Cargo:** Cargo 6 (WI-6-006 / FEA-131)
- **Papel:** Concepção de interfaces de usuário, arquitetura de informação, prototipação e governança de design tokens.
- **Topologia de Nós:** `intake_flow -> design_states -> audit_wcag_and_tokens -> export_specs`.
- **Competências:** Design system tokens, estados de fluxo críticos (empty, loading, error, success), redução de movimento (*prefers-reduced-motion*), erradicação absoluta de *dark patterns*.
- **Entregáveis:** Especificação visual, árvore de componentes, mapa de tokens CSS/Tailwind e contratos visuais para o Frontend.

#### 05. Code QA Specialist (`code_qa`)
- **Cargo:** Cargo 9 (WI-6-009 / FEA-157)
- **Papel:** Garantia de qualidade de código, suítes de regressão end-to-end e quarentena de testes instáveis (*flaky*).
- **Topologia de Nós:** `analyze_surface -> synthesize_test_suite -> execute_real_runs -> emit_qa_verdict`.
- **Competências:** Testes de integração automatizados, validação de execução real com zero-rerun falso positivo, isolamento de testes intermitentes.
- **Entregáveis:** Suíte de testes automatizados, relatório de cobertura de caminhos críticos e parecer de aprovação técnica.

#### 06. Brand & Visual Sentinel (`brand_sentinel`)
- **Cargo:** Cargo 10 (Gate de Marca)
- **Papel:** Sentinela e auditoria contínua de integridade de marca, posicionamento visual e respeito a guidebooks.
- **Topologia de Nós:** `extract_brand_baseline -> compare_asset_conformance -> human_review_edge_cases -> emit_brand_report`.
- **Competências:** Validação de contraste de logo, zonas de respiro (*safe areas*), verificação OCR de alegações proibidas em banners e conformidade de paletas cromáticas.
- **Entregáveis:** Relatório de Auditoria de Marca com veredito Binário (Aprovado / Rejeitado) e sinalização de exceções para o CAB.

#### 07. Legal & Security Auditor (`legal_security`)
- **Cargo:** Cargo 11 (WI-6-011 / FEA-158)
- **Papel:** Auditoria rigorosa de conformidade jurídica, licenciamento de bibliotecas de terceiros e varredura de vulnerabilidades/segredos.
- **Topologia de Nós:** `inspect_dependencies -> scan_for_secrets -> audit_compliance_claims -> evaluate_risk_level -> emit_legal_report`.
- **Competências:** Detecção de dependências com licenças virais (GPL incompatível), varredura estática de segredos vazados (chaves privadas, tokens), auditoria de promessas ilegais em marketing.
- **Entregáveis:** Parecer de Risco Jurídico e de Segurança, relatório de dependências aprovadas e veto mandatório para riscos críticos.

#### 08. Copywriter Senior (`copywriter`)
- **Cargo:** Cargo 8 (WI-6-008 / FEA-189)
- **Papel:** Redação estratégica e persuasiva orientada a conversão e clareza absoluta, aplicando a metodologia Rule of One e CUB.
- **Topologia de Nós:** `analyze_bdf_and_stage -> generate_headlines -> write_copy -> cub_review_and_emit`.
- **Competências:** Framework BDF (Beliefs, Desires, Feelings), aplicação do CUB (Confusing, Unbelievable, Boring review), eliminação de jargões corporativos genéricos.
- **Entregáveis:** Peças de copy completas (títulos, body copy, microcopy de UI, botões CTA) devidamente validadas.

#### 09. Growth Marketing Senior (`growth`)
- **Cargo:** Cargo 9 (WI-6-009 / FEA-193)
- **Papel:** Estratégia de crescimento sustentável, alinhamento de canais de aquisição e mapeamento da jornada do cliente.
- **Topologia de Nós:** `intake_brief -> strategy_draft -> self_audit -> revision -> finalize`.
- **Competências:** Análise de ICP (Ideal Customer Profile), definição de métricas base e metas de conversão, conformidade contra promessas de resultados milagrosos.
- **Entregáveis:** Documento Estratégico de Crescimento, plano de ativação e matriz de experimentos de tração.

#### 10. SEO Senior (`seo`)
- **Cargo:** Cargo 10 (WI-6-010 / FEA-194)
- **Papel:** Otimização orgânica de mecanismos de busca técnica e semântica on-page.
- **Topologia de Nós:** `intake_brief -> keyword_strategy -> self_audit -> revision -> finalize`.
- **Competências:** Pesquisa de palavras-chave com intenção de busca qualificada, arquitetura de URLs limpas, meta descriptions otimizadas (140-160 caracteres), prevenção contra canibalização e *keyword stuffing*.
- **Entregáveis:** Matriz de Palavras-Chave, checklist de otimização de metadados e recomendações de estrutura semântica HTML.

#### 11. Paid Traffic Senior (`paid_traffic`)
- **Cargo:** Cargo 11 (WI-6-011 / FEA-195)
- **Papel:** Planejamento e gestão de mídia paga em plataformas de performance (Meta Ads, Google Ads).
- **Topologia de Nós:** `intake_brief -> campaign_strategy -> self_audit -> revision -> finalize`.
- **Competências:** Alocação orçamentária entre plataformas, cálculo de metas de CPA (Cost Per Acquisition), segmentação de audiências e respeito às políticas de anúncios proibidos.
- **Entregáveis:** Plano de Mídia Estruturado, arquitetura de campanhas e especificação de criativos.

#### 12. DPO Senior (`dpo`)
- **Cargo:** Cargo 12 (WI-6-012 / FEA-205)
- **Papel:** Encarregado de Proteção de Dados (Data Protection Officer) e conformidade LGPD/GDPR.
- **Topologia de Nós:** `intake_brief -> privacy_assessment -> self_audit -> revision -> finalize`.
- **Competências:** Mapeamento de bases legais para tratamento de dados, verificação de mecanismos de opt-out/revogação, definição de tabelas de retenção de dados e eliminação de IPs completos.
- **Entregáveis:** Relatório de Impacto à Proteção de Dados Pessoais (RIPD) e parecer de conformidade de privacidade.

#### 13. Localization Senior (`localization`)
- **Cargo:** Cargo 13 (WI-6-013 / FEA-206)
- **Papel:** Adaptação linguística e cultural de interfaces e conteúdos para mercados específicos (pt-BR, en-US, es-ES).
- **Topologia de Nós:** `intake_brief -> localization_strategy -> self_audit -> revision -> finalize`.
- **Competências:** Tradução semântica contextualizada (eliminação de falsos cognatos), padronização de formatos de moeda, data, fuso horário e glossário terminológico unificado.
- **Entregáveis:** Dicionários de internacionalização (i18n), textos localizados e validação de contexto sociocultural.

#### 14. Data Analyst Senior (`data_analyst`)
- **Cargo:** Cargo 14 (WI-6-014 / FEA-207)
- **Papel:** Definição de eventos de telemetria, modelagem analítica e desenho de dashboards de acompanhamento operacional.
- **Topologia de Nós:** `intake_brief -> metrics_design -> self_audit -> revision -> finalize`.
- **Competências:** Especificação explícita de fórmulas de KPIs, consistência de funis cruzados, identificação de fontes de verdade e eliminação de métricas de vaidade.
- **Entregáveis:** Plano de Marcação de Eventos (Tracking Spec), consultas SQL analíticas e especificações de dashboards.

#### 15. CRM Senior (`crm`)
- **Cargo:** Cargo 15 (WI-6-015 / FEA-208)
- **Papel:** Gestão de relacionamento com o cliente, régua de comunicação e automação de retenção.
- **Topologia de Nós:** `intake_brief -> crm_strategy -> self_audit -> revision -> finalize`.
- **Competências:** Segmentação por estágio no ciclo de vida, políticas rigorosas de frequência anti-spam, consentimento de canais diretos (WhatsApp/E-mail) e opt-out com um clique.
- **Entregáveis:** Mapa de Réguas de Comunicação, templates transacionais e gatilhos de automação.

#### 16. Model Risk Senior (`model_risk`)
- **Cargo:** Cargo 16 (WI-6-016 / FEA-222)
- **Papel:** Avaliação de risco, explicabilidade, mitigação de alucinação e governança de modelos de inteligência artificial.
- **Topologia de Nós:** `intake_brief -> risk_assessment -> self_audit -> revision -> finalize`.
- **Competências:** Rastreabilidade de proveniência de dados de treinamento/RAG, avaliação de vieses demográficos, exigência de revisão humana obrigatória para decisões de alto impacto social/financeiro.
- **Entregáveis:** Matriz de Risco do Modelo, laudo de explicabilidade e limites operacionais de inferência.

#### 17. Graphic Designer Senior (`graphic_designer`)
- **Cargo:** Cargo 17 (WI-6-017 / FEA-223)
- **Papel:** Produção de peças gráficas estáticas, banners institucionais e ilustrações vetoriais com precisão cromática.
- **Topologia de Nós:** `intake_brief -> compose_assets -> audit_standards -> export_package`.
- **Competências:** Relação de contraste de luminância (WCAG 4.5:1), dimensões milimetricamente exatas por canal de veiculação, compatibilidade de licenças de tipografias e ícones.
- **Entregáveis:** Pacote de ativos visuais em SVG e PNG de alta resolução, manifesto de especificações e guia de aplicação.

#### 18. Accessibility Senior (`accessibility`)
- **Cargo:** Cargo 18 (WI-6-018-B / FEA-224)
- **Papel:** Auditoria de conformidade técnica e usabilidade para pessoas com deficiência segundo as diretrizes WCAG 2.1 nível AA/AAA.
- **Topologia de Nós:** `intake_spec -> evaluate_contrast_and_focus -> manual_validation_audit -> emit_accessibility_report`.
- **Competências:** Rastreamento de contraste cromático, navegação por teclado (foco interativo visível), marcação ARIA correta, alt-text significativo em imagens e alertas sonoros/visuais duplicados.
- **Entregáveis:** Laudo de Auditoria de Acessibilidade com score percentual e apontamentos de remediação linha a linha.

#### 19. API Contract Specialist (`api_contract`)
- **Cargo:** Cargo 18 (WI-6-018 / FEA-127)
- **Papel:** Governança e validação de contratos de API (REST/OpenAPI, JSON Schema, Protobuf).
- **Topologia de Nós:** `intake_contract -> lint_and_validate -> compute_breaking_changes -> emit_contract_verdict`.
- **Competências:** Detecção de breaking changes retroativas (remoção de campos, mudança de tipagem), validação de schemas JSON com exemplos completos e aderência ao estilo RESTful.
- **Entregáveis:** Especificação OpenAPI 3.1 validada, relatório de impacto retroativo e schemas de payload.

#### 20. Frontend Senior (`frontend`)
- **Cargo:** Cargo 20 (WI-6-020 / FEA-240)
- **Papel:** Implementação da interface de usuário com fidelidade aos contratos de design e alta performance de renderização.
- **Topologia de Nós:** `intake_contract -> develop_components -> validate_bundle_and_types -> emit_frontend_package`.
- **Competências:** React 19, TypeScript estrito (Zero `any`), Tailwind CSS utilizando exclusivamente a camada de tokens, orçamento rigoroso de bundle size (*bundle budget*) e integração acessível.
- **Entregáveis:** Código-fonte dos componentes frontend, testes visuais/unitários e artefatos prontos para compilação.

---

## Seção 3: Como Usar no Dia a Dia

### 3.1 Ciclo de Vida da Demanda e Abertura de Tarefas

1. **Origem da Demanda:**
   - Tarefas podem originar-se de solicitações no YouTrack (projetos `FEA` ou `MFNX`) ou ser criadas diretamente no Paperclip (`https://ai.acesse.la/issues`).
   - Toda tarefa deve conter:
     - **Título Claro e Objetivo:** Ex: `[WI-13-004] Guia Operacional Integrado e Runbook`.
     - **Contexto & Escopo:** Descrição detalhada do problema, repositório alvo e requisitos técnicos inegociáveis.
     - **Contrato de Aceite:** Critérios objetivos e verificáveis que definem quando a tarefa é considerada `done`.

2. **Estados da Tarefa:**
   - `backlog`: Tarefa aguardando planejamento ou priorização.
   - `todo`: Pronta para execução; apta para checkout por um agente.
   - `in_progress`: Agente realizou checkout exclusivo e está ativamente executando ferramentas.
   - `in_review`: Execução concluída ou pausada aguardando avaliação do operador, aprovação CAB ou esclarecimento.
   - `blocked`: Bloqueada por dependência formal (`blockedByIssueIds`) ou recurso indisponível.
   - `done`: Concluída com sucesso e todas as evidências anexadas.

### 3.2 Orquestração Global vs. Acionamento Direto

- **Quando Acionar o Macro Orquestrador (`Fenix Orchestrator HITL Agent`):**
  - Demandas multidisciplinares que exigem múltiplos especialistas (ex: criar uma nova funcionalidade completa que engloba API, UI, Copy, SEO e infraestrutura).
  - Tarefas que envolvem esteiras de produção com necessidade de consolidação de múltiplos gates de segurança.
- **Quando Atribuir Diretamente a um Especialista:**
  - Tarefas puramente circunscritas ao território técnico do especialista (ex: atribuir diretamente ao `copywriter` para redigir 3 opções de e-mail marketing, ou ao `devops` para atualizar um arquivo de compose).
  - O especialista direto executará seu subgrafo específico, anexará os relatórios e concluirá a tarefa sem intermediários.

### 3.3 Interação em Chat e Modo Conversacional Seguro (Anti-Loop de Release)

Para evitar que simples perguntas ou sessões de brainstorming no chat disparem esteiras desnecessárias de build, lint, testes e release:

1. **Distinção de Modo de Conversação (Plan / Ask vs. Execution):**
   - **Modo Pergunta/Planejamento (`conversationAgentId` presente):**
     - O agente responde em linguagem natural no próprio thread.
     - O agente analisa o problema, sugere opções e atualiza o documento `plan` da issue se solicitado.
     - **Regra de Ouro:** Em modo chat/conversa, **nunca** são acionados deploys ou comandos de mutação destrutiva sem autorização explícita e desdobramento em issue de execução.
   - **Modo Execução (Tarefa Atribuída Direta):**
     - O agente realiza checkout da tarefa e executa os passos técnicos conforme especificado.
2. **Como interagir com segurança no Chat:**
   - Para tirar dúvidas conceituais, redigir rascunhos ou explorar código: abra uma issue em modo chat ou interaja no thread especificando: *"Apenas analise e elabore um plano; não execute alterações nem dispare pipelines"*.
   - Quando o plano estiver maduro, autorize formalmente a criação das subtasks de execução.

### 3.4 Padrão de Briefing e Critérios de Aceite

Todo briefing técnico inserido no ecossistema deve seguir o padrão:
```markdown
### # Contexto & Objetivo
[Descreva o problema de negócio ou técnico a ser resolvido]

### # Escopo Exato
1. [Passo concreto 1]
2. [Passo concreto 2]
3. [Passo concreto 3]

### # O que NÃO muda (Guardrails)
- [Regras imutáveis, ex: rotas de autenticação, dependências externas restritas]

### # Contrato de Aceite
- [Critério 1: saída de comando de teste passando com 0 erros]
- [Critério 2: artefato x gerado e salvo em local auditável]
- [Critério 3: relatório de evidências no formato JSON]
```

---

## Seção 4: Governança, CAB e Aprovações Humanas (HITL)

### 4.1 O Papel do Change Advisory Board (CAB) Automatizado

No Ecossistema Fênix, o CAB tradicional de empresas corporativas foi traduzido em código determinístico. Nenhum código ou configuração que afete produção é lançado sem que os relatórios dos especialistas de segurança passem por auditoria e recebam aval humano explícito.

### 4.2 Matriz de Gates de Qualidade e Critérios de Aceite

Antes de um deploy ser considerado apto, os seguintes gates devem estar em conformidade:

| Gate | Especialista Auditor | Critério Inegociável | Ação em Caso de Falha |
|---|---|---|---|
| **Code Quality & Tests** | `code_qa` | 100% de testes de fluxo crítico passando; 0 skips não justificados | Veto automático do build |
| **Security & Secrets** | `legal_security` | Zero segredos em código; dependências sem vulnerabilidades críticas conhecidas | Bloqueio imediato |
| **Brand Integrity** | `brand_sentinel` | Zero desvios de paleta ou logo; nenhuma alegação de resultado garantido | Devolução para revisão |
| **Acessibilidade** | `accessibility` | Contraste mínimo WCAG 4.5:1; foco visível em todos os elementos interativos | Alerta CAB obrigatório |
| **API Contract** | `api_contract` | Nenhuma breaking change não versionada em endpoints públicos | Bloqueio de rota |
| **LGPD / Privacidade** | `dpo` | Sem retenção de IP completo; base legal declarada para cada dado coletado | Rejeição regulatória |

### 4.3 Onde Inspecionar Evidências e Relatórios de Auditoria

O operador humano nunca deve aprovar uma mudança sem examinar as evidências reais:
1. **Aba Documents e Issue Documents (`/issues/:id#documents`):**
   - Planos de execução, relatórios técnicos e documentos estruturados emitidos pelos agentes.
2. **Aba Work Products / Artifacts (`/artifacts` ou na barra lateral da tarefa):**
   - Arquivos finais gerados (códigos, manifests, imagens, relatórios JSON).
3. **Storage de Artefatos (S3 / MinIO):**
   - Evidências completas de execução e logs brutos armazenados com hash SHA-256 no bucket corporativo.
4. **Relatório de Validação Local (`validation-evidence/`):**
   - Arquivos JSON de evidência criados na raiz da workspace contendo metadata, timestamp, bytes e hashes.

### 4.4 Passo a Passo de Decisão na Aba `/approvals`

Ao acessar `https://ai.acesse.la/approvals`:

1. **Localize a Pendência:**
   - Na lista "Pending", selecione a solicitação de aprovação desejada.
2. **Analise o Contexto Completo:**
   - Verifique a tarefa vinculada (*Linked Issue*), o agente solicitante e a descrição da mudança proposta.
3. **Examine os Laudos dos Gates:**
   - Abra o card de detalhes e inspecione as evidências anexadas pelos sentinelas de QA, Segurança e Marca.
4. **Tomando a Decisão:**
   - **Aprovar (`Approve`):**
     - Se todos os gates estiverem verdes e o impacto operacional for seguro, clique em **Approve**.
     - O Paperclip libera o subgrafo do LangGraph (`resume`) e a esteira de deploy conclui a publicação.
   - **Rejeitar (`Reject`):**
     - Se houver inconsistência técnica, risco de segurança ou ausência de evidência, clique em **Reject**.
     - Insira um comentário estruturado justificando a recusa (ex: *"Rejeitado: Falha no critério de contraste WCAG no botão principal; favor ajustar os tokens para dark mode"*).
     - O agente será acordado imediatamente com o feedback e colocará a tarefa em revisão.

### 4.5 Bloqueios de Segurança e Circuit Breakers

- **Circuit Breaker de Tentativas:** Se um agente falhar duas vezes consecutivas em atender aos gates de qualidade, a tarefa entra automaticamente em estado `blocked`, impedindo loops infinitos de consumo de tokens.
- **Budget Hard-Stop:** Se o consumo de computação de um agente ou empresa ultrapassar 100% da cota mensal alocada, o Paperclip pausa automaticamente todas as execuções ativas.

---

## Seção 5: Telemetria, Pools de IA e Resolução de Problemas

### 5.1 Infraestrutura de Inferência: Pool OMP (Antigravity) e Multi-Account

O ecossistema utiliza uma arquitetura resiliente de múltiplos provedores de inferência de IA:
- **Pool Primário — OMP (Antigravity):** Pool empresarial com modelos de alta capacidade de raciocínio (ex: `google-antigravity/gemini-3.8-flash`, Claude 3.7 Sonnet), otimizado para tarefas de código e auditoria estruturada.
- **Pool Nativo Multi-Account (Account Switcher):** Mecanismo de contingência integrado no Paperclip que rotaciona chaves de API e contas automaticamente assim que um limite de requisições por minuto (RPM) ou cota diária é detectado.

### 5.2 Monitoramento de Cotas, Tokens e Latência

- **Painel de Custos (`/activity/costs`):**
  - Gráficos em tempo real de consumo por agente, por modelo e por tarefa.
  - Alertas preventivos quando o orçamento atinge 80% do limite configurado.
- **Monitoramento de Latência:**
  - O LangGraph Server registra o tempo de execução de cada nó do subgrafo. Gargalos em nós de auto-auditoria são registrados nas métricas de execução.

### 5.3 Logs de Auditoria e Rastreabilidade (`activity_log`)

Cada ação executada no Paperclip gera um registro imutável na tabela `activity_log` do Postgres:
- Checkouts de tarefas
- Leituras e escritas de documentos
- Propostas e resoluções de aprovações
- Alterações em segredos e credenciais (apenas metadados, nunca valores)

Para consultar os logs diretamente via SQL de emergência:
```sql
SELECT 
  created_at, 
  actor_type, 
  actor_id, 
  action, 
  entity_type, 
  entity_id, 
  metadata 
FROM activity_log 
WHERE company_id = 'f1453093-9739-4dc9-a6c2-522abef97d3b' 
ORDER BY created_at DESC 
LIMIT 20;
```

### 5.4 Runbook de Resolução de Incidentes e Falhas Operacionais

#### Incidente 1: Agente em Estado Inativo ou Heartbeat Timeout
- **Sintoma:** A tarefa permanece em `in_progress`, mas nenhum comentário novo ou ação é registrada por mais de 10 minutos.
- **Diagnóstico:**
  1. Verifique `/activity/runs` para ver se o último heartbeat foi finalizado com erro ou se está em execução contínua.
  2. Inspecione o endpoint de health do Paperclip: `curl http://127.0.0.1:3100/api/health`.
- **Ação:**
  1. Se o processo travou, acesse a tarefa no board e clique em **Release Task** ou faça uma alteração de status para `todo` para liberar a concorrência.
  2. Um novo heartbeat atribuirá a tarefa normalmente.

#### Incidente 2: Erro 409 Conflict no Checkout
- **Sintoma:** O agente registra erro `409 Conflict: Task is currently owned by another agent or session`.
- **Causa:** Outro processo ou heartbeat ainda detém o lock exclusivo da tarefa.
- **Ação:**
  - **Nunca force retries rápidos.** Aguarde 60 segundos até a expiração do lock nativo ou acerte a atribuição do agente na interface gerencial.

#### Incidente 3: Subgrafo LangGraph Interrompido sem Card de Aprovação
- **Sintoma:** O LangGraph Server pausou a execução em um nó de interrupt, mas nenhum card apareceu na aba `/approvals`.
- **Causa:** O MCP session bridge perdeu o vínculo com o `issueId` ativo durante a transição.
- **Ação:**
  1. Acesse o subgrafo via LangGraph Studio ou consulte os checkpoints:
     ```sql
     SELECT thread_id, checkpoint_id, status FROM checkpoints ORDER BY checkpoint_id DESC LIMIT 5;
     ```
  2. Dispare um heartbeat no agente orquestrador enviando uma menção no thread da issue para reassociar a sessão.

#### Incidente 4: Exaustão de Quota ou 429 Too Many Requests no Modelo de IA
- **Sintoma:** O agente relata erro de limite de requisições do provedor LLM.
- **Ação:**
  1. O Account Switcher nativo deve realizar a rotação automática de chave em até 30 segundos.
  2. Se a rotação automática não ocorrer, acesse `Settings -> AI Connections` em `https://ai.acesse.la` e adicione ou promova uma conta secundária de fallback.

#### Incidente 5: Verificação de Saúde dos Serviços Básicos
Para verificar se todos os serviços de suporte estão saudáveis na VM:
```bash
docker ps --filter "name=fenix-" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```
Serviços obrigatórios ativos:
- `fenix-postgres`: banco de dados relacional e checkpointer (porta 5432)
- `fenix-qdrant`: banco de vetores para embeddings e memória de longo prazo (portas 6333/6334)
- `fenix-nats`: mensageria e eventos de pub/sub (portas 4222/8222)
- `fenix-minio`: armazenamento de artefatos e relatórios (portas 9000/9001)

---

*Fim do Guia Operacional — Fênix Enterprise Agents & Paperclip.*
