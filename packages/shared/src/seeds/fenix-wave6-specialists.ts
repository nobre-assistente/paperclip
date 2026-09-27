import type { AgentIconName } from "../constants.js";

export const FENIX_GENESIS_COMPANY_ID = "f1453093-9739-4dc9-a6c2-522abef97d3b";
export const FENIX_ORCHESTRATOR_AGENT_ID = "587d0d1a-3402-4d7d-a871-5465a425c4b0";
export const FENIX_LANGGRAPH_BASE_URL = "http://127.0.0.1:2024";

export interface FenixSpecialistSeed {
  id: string;
  companyId: string;
  name: string;
  role: string;
  title: string;
  description: string;
  capabilities: string;
  icon: AgentIconName;
  cargo: number;
  slug: string;
  adapterType: "langgraph";
  adapterConfig: {
    baseUrl: string;
    assistantId: string;
    [key: string]: unknown;
  };
  status: "idle";
  reportsTo: string | null;
  runtimeConfig: Record<string, unknown>;
  permissions: Record<string, unknown>;
  metadata: Record<string, unknown>;
}

// Precomputed deterministic UUID constants (100% browser-safe, zero node:crypto dependencies)
export const FENIX_SOLUTION_ARCHITECT_ID = "8e5ee226-c3e9-41e5-a615-9e95d3476790";
export const FENIX_BACKEND_SENIOR_ID = "ef676df3-35c2-4685-aef2-514996dc2ad3";
export const FENIX_DEVOPS_ID = "524095c6-2f9f-4e80-aa24-9afe2bba2682";
export const FENIX_UIUX_ID = "ecb910d2-706e-4e8e-ac70-c7887964b39b";
export const FENIX_CODE_QA_ID = "1d4592dd-6d0f-4881-ab46-17ebeb1cc9ed";
export const FENIX_BRAND_SENTINEL_ID = "ca14e4bc-84f4-4153-ae75-45fea3214420";
export const FENIX_LEGAL_SECURITY_ID = "7944dd29-6603-4c5f-a396-ba140eb29be4";
export const FENIX_COPYWRITER_ID = "cd20e0fa-6b30-405a-a45a-2fcc8338cd76";
export const FENIX_GROWTH_ID = "31f4e558-8756-42cf-a8f3-4c983648c996";
export const FENIX_SEO_ID = "f1ff171d-c21a-4496-a3ac-f5bc78105eb9";
export const FENIX_PAID_TRAFFIC_ID = "bece548a-b574-4d59-ab88-7d05133bf865";
export const FENIX_DPO_ID = "7db26700-27b2-4c31-a19c-1a82855aa9bc";
export const FENIX_LOCALIZATION_ID = "94fff6dd-f1ae-420d-a8a5-8e4c7d913c3d";
export const FENIX_DATA_ANALYST_ID = "02754e2c-ea1a-4116-a1f3-e59d72c8292b";
export const FENIX_CRM_ID = "c569f2cc-2cca-49e5-acee-eec88a33ed07";
export const FENIX_MODEL_RISK_ID = "edc24079-ea49-496f-a65f-a6f6b42c1510";
export const FENIX_GRAPHIC_DESIGNER_ID = "53268aae-2cff-4f75-a564-a0aa380d0a95";
export const FENIX_ACCESSIBILITY_ID = "533e6ccc-0033-4cc1-a616-6857b874b251";
export const FENIX_API_CONTRACT_ID = "48644daa-9c89-45b4-accc-5deedb6baa01";
export const FENIX_FRONTEND_ID = "90e27e22-be5e-4e29-a427-77c11966f1f7";

const PRECOMPUTED_UUIDS: Record<string, string> = {
  solution_architect: FENIX_SOLUTION_ARCHITECT_ID,
  backend_senior: FENIX_BACKEND_SENIOR_ID,
  devops: FENIX_DEVOPS_ID,
  uiux: FENIX_UIUX_ID,
  code_qa: FENIX_CODE_QA_ID,
  brand_sentinel: FENIX_BRAND_SENTINEL_ID,
  legal_security: FENIX_LEGAL_SECURITY_ID,
  copywriter: FENIX_COPYWRITER_ID,
  growth: FENIX_GROWTH_ID,
  seo: FENIX_SEO_ID,
  paid_traffic: FENIX_PAID_TRAFFIC_ID,
  dpo: FENIX_DPO_ID,
  localization: FENIX_LOCALIZATION_ID,
  data_analyst: FENIX_DATA_ANALYST_ID,
  crm: FENIX_CRM_ID,
  model_risk: FENIX_MODEL_RISK_ID,
  graphic_designer: FENIX_GRAPHIC_DESIGNER_ID,
  accessibility: FENIX_ACCESSIBILITY_ID,
  api_contract: FENIX_API_CONTRACT_ID,
  frontend: FENIX_FRONTEND_ID,
};

export function generateDeterministicUuid(namespace: string, name: string): string {
  if (PRECOMPUTED_UUIDS[name]) return PRECOMPUTED_UUIDS[name];
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
  const str = `${namespace}:${name}`;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  const hex = (h1 >>> 0).toString(16).padStart(8, "0") + (h2 >>> 0).toString(16).padStart(8, "0");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(12, 15)}-a${hex.slice(15, 18)}-${hex.repeat(2).slice(0, 12)}`;
}

export const FENIX_WAVE6_SPECIALISTS: readonly FenixSpecialistSeed[] = [
  {
    id: FENIX_SOLUTION_ARCHITECT_ID,
    companyId: FENIX_GENESIS_COMPANY_ID,
    name: "Fênix — Solution Architect",
    role: "lead",
    title: "Solution Architect",
    description:
      "Transforma briefing corporativo, regulações e NFRs em ProjectBlueprint, bounded contexts, ADRs, trust boundaries e topologia C4. Governa o ciclo de vida da arquitetura com foco em resiliência e isolamento multi-tenant.",
    capabilities:
      "Transforma briefing corporativo, regulações e NFRs em ProjectBlueprint, bounded contexts, ADRs, trust boundaries e topologia C4. Governa o ciclo de vida da arquitetura com foco em resiliência e isolamento multi-tenant.",
    icon: "circuit-board",
    cargo: 1,
    slug: "solution_architect",
    adapterType: "langgraph",
    adapterConfig: {
      baseUrl: FENIX_LANGGRAPH_BASE_URL,
      assistantId: "solution_architect",
    },
    status: "idle",
    reportsTo: FENIX_ORCHESTRATOR_AGENT_ID,
    runtimeConfig: {
      heartbeat: { enabled: false, maxConcurrentRuns: 10 },
    },
    permissions: {
      canCreateAgents: false,
      canCreateSkills: false,
    },
    metadata: {
      cargo: 1,
      cargoName: "solution_architect",
      wave: 6,
      roleCategory: "general/lead",
      description:
        "Transforma briefing corporativo, regulações e NFRs em ProjectBlueprint, bounded contexts, ADRs, trust boundaries e topologia C4.",
    },
  },
  {
    id: generateDeterministicUuid(FENIX_GENESIS_COMPANY_ID, "backend_senior"),
    companyId: FENIX_GENESIS_COMPANY_ID,
    name: "Fênix — Backend Senior",
    role: "software_engineer",
    title: "Tech Lead / Backend Senior",
    description:
      "Produz código backend testado, APIs REST/gRPC e migrações de banco conforme blueprint, arquitetura limpa e cobertura >=85%. Implementa lógica de negócio de alta performance e concorrência segura.",
    capabilities:
      "Produz código backend testado, APIs REST/gRPC e migrações de banco conforme blueprint, arquitetura limpa e cobertura >=85%. Implementa lógica de negócio de alta performance e concorrência segura.",
    icon: "code",
    cargo: 2,
    slug: "backend_senior",
    adapterType: "langgraph",
    adapterConfig: {
      baseUrl: FENIX_LANGGRAPH_BASE_URL,
      assistantId: "backend_senior",
    },
    status: "idle",
    reportsTo: FENIX_SOLUTION_ARCHITECT_ID,
    runtimeConfig: {
      heartbeat: { enabled: false, maxConcurrentRuns: 10 },
    },
    permissions: {
      canCreateAgents: false,
      canCreateSkills: false,
    },
    metadata: {
      cargo: 2,
      cargoName: "backend_senior",
      wave: 6,
      roleCategory: "software_engineer",
      description:
        "Produz código backend testado, APIs REST/gRPC e migrações de banco conforme blueprint, arquitetura limpa e cobertura >=85%.",
    },
  },
  {
    id: generateDeterministicUuid(FENIX_GENESIS_COMPANY_ID, "devops"),
    companyId: FENIX_GENESIS_COMPANY_ID,
    name: "Fênix — DevOps Specialist",
    role: "devops",
    title: "DevOps & Infrastructure Specialist",
    description:
      "Gera infraestrutura como código (IaC), GitOps, observabilidade, planos de disaster recovery, rollback e scans de vulnerabilidades. Garante pipelines herméticos e imagens assinadas.",
    capabilities:
      "Gera infraestrutura como código (IaC), GitOps, observabilidade, planos de disaster recovery, rollback e scans de vulnerabilidades. Garante pipelines herméticos e imagens assinadas.",
    icon: "terminal",
    cargo: 4,
    slug: "devops",
    adapterType: "langgraph",
    adapterConfig: {
      baseUrl: FENIX_LANGGRAPH_BASE_URL,
      assistantId: "devops",
    },
    status: "idle",
    reportsTo: FENIX_SOLUTION_ARCHITECT_ID,
    runtimeConfig: {
      heartbeat: { enabled: false, maxConcurrentRuns: 10 },
    },
    permissions: {
      canCreateAgents: false,
      canCreateSkills: false,
    },
    metadata: {
      cargo: 4,
      cargoName: "devops",
      wave: 6,
      roleCategory: "devops",
      description:
        "Gera infraestrutura como código (IaC), GitOps, observabilidade, planos de disaster recovery, rollback e scans de vulnerabilidades.",
    },
  },
  {
    id: generateDeterministicUuid(FENIX_GENESIS_COMPANY_ID, "uiux"),
    companyId: FENIX_GENESIS_COMPANY_ID,
    name: "Fênix — Web Designer / UI-UX",
    role: "designer",
    title: "Web Designer & UI-UX Specialist",
    description:
      "Arquitetura de informação, jornadas de usuário, wireframes, design system em tokens e relatórios de conformidade de usabilidade. Foco em interfaces responsivas e intuitivas.",
    capabilities:
      "Arquitetura de informação, jornadas de usuário, wireframes, design system em tokens e relatórios de conformidade de usabilidade. Foco em interfaces responsivas e intuitivas.",
    icon: "sparkles",
    cargo: 6,
    slug: "uiux",
    adapterType: "langgraph",
    adapterConfig: {
      baseUrl: FENIX_LANGGRAPH_BASE_URL,
      assistantId: "uiux",
    },
    status: "idle",
    reportsTo: FENIX_SOLUTION_ARCHITECT_ID,
    runtimeConfig: {
      heartbeat: { enabled: false, maxConcurrentRuns: 10 },
    },
    permissions: {
      canCreateAgents: false,
      canCreateSkills: false,
    },
    metadata: {
      cargo: 6,
      cargoName: "uiux",
      wave: 6,
      roleCategory: "designer",
      description:
        "Arquitetura de informação, jornadas de usuário, wireframes, design system em tokens e relatórios de conformidade de usabilidade.",
    },
  },
  {
    id: generateDeterministicUuid(FENIX_GENESIS_COMPANY_ID, "code_qa"),
    companyId: FENIX_GENESIS_COMPANY_ID,
    name: "Fênix — Code QA Specialist",
    role: "qa",
    title: "QA Automation & Code QA Specialist",
    description:
      "Avalia pacotes de software em sandbox hermética, executando pirâmide de testes automatizados, mutation testing e relatórios de conformidade técnica e cobertura.",
    capabilities:
      "Avalia pacotes de software em sandbox hermética, executando pirâmide de testes automatizados, mutation testing e relatórios de conformidade técnica e cobertura.",
    icon: "bug",
    cargo: 9,
    slug: "code_qa",
    adapterType: "langgraph",
    adapterConfig: {
      baseUrl: FENIX_LANGGRAPH_BASE_URL,
      assistantId: "code_qa",
    },
    status: "idle",
    reportsTo: FENIX_SOLUTION_ARCHITECT_ID,
    runtimeConfig: {
      heartbeat: { enabled: false, maxConcurrentRuns: 10 },
    },
    permissions: {
      canCreateAgents: false,
      canCreateSkills: false,
    },
    metadata: {
      cargo: 9,
      cargoName: "code_qa",
      wave: 6,
      roleCategory: "qa",
      description:
        "Avalia pacotes de software em sandbox hermética, executando pirâmide de testes automatizados, mutation testing e relatórios de conformidade técnica.",
    },
  },
  {
    id: generateDeterministicUuid(FENIX_GENESIS_COMPANY_ID, "brand_sentinel"),
    companyId: FENIX_GENESIS_COMPANY_ID,
    name: "Fênix — Brand & Visual Sentinel",
    role: "brand_sentinel",
    title: "Brand & Visual Sentinel Specialist",
    description:
      "Audita assets visuais contra manual de marca, tokens e safe areas via visão computacional, OCR e perceptual diff. Assegura integridade visual corporativa.",
    capabilities:
      "Audita assets visuais contra manual de marca, tokens e safe areas via visão computacional, OCR e perceptual diff. Assegura integridade visual corporativa.",
    icon: "eye",
    cargo: 10,
    slug: "brand_sentinel",
    adapterType: "langgraph",
    adapterConfig: {
      baseUrl: FENIX_LANGGRAPH_BASE_URL,
      assistantId: "brand_sentinel",
    },
    status: "idle",
    reportsTo: FENIX_SOLUTION_ARCHITECT_ID,
    runtimeConfig: {
      heartbeat: { enabled: false, maxConcurrentRuns: 10 },
    },
    permissions: {
      canCreateAgents: false,
      canCreateSkills: false,
    },
    metadata: {
      cargo: 10,
      cargoName: "brand_sentinel",
      wave: 6,
      roleCategory: "brand_sentinel",
      description:
        "Audita assets visuais contra manual de marca, tokens e safe areas via visão computacional, OCR e perceptual diff.",
    },
  },
  {
    id: generateDeterministicUuid(FENIX_GENESIS_COMPANY_ID, "legal_security"),
    companyId: FENIX_GENESIS_COMPANY_ID,
    name: "Fênix — Legal & Security Auditor",
    role: "security",
    title: "Legal & Security Auditor Specialist",
    description:
      "Gate técnico-jurídico com SAST/DAST, auditoria de licenças, secrets e claims regulatórios com escalonamento HITL. Garante conformidade jurídica e segurança da informação.",
    capabilities:
      "Gate técnico-jurídico com SAST/DAST, auditoria de licenças, secrets e claims regulatórios com escalonamento HITL. Garante conformidade jurídica e segurança da informação.",
    icon: "lock",
    cargo: 11,
    slug: "legal_security",
    adapterType: "langgraph",
    adapterConfig: {
      baseUrl: FENIX_LANGGRAPH_BASE_URL,
      assistantId: "legal_security",
    },
    status: "idle",
    reportsTo: FENIX_SOLUTION_ARCHITECT_ID,
    runtimeConfig: {
      heartbeat: { enabled: false, maxConcurrentRuns: 10 },
    },
    permissions: {
      canCreateAgents: false,
      canCreateSkills: false,
    },
    metadata: {
      cargo: 11,
      cargoName: "legal_security",
      wave: 6,
      roleCategory: "security",
      description:
        "Gate técnico-jurídico com SAST/DAST, auditoria de licenças, secrets e claims regulatórios com escalonamento HITL.",
    },
  },
  {
    id: generateDeterministicUuid(FENIX_GENESIS_COMPANY_ID, "copywriter"),
    companyId: FENIX_GENESIS_COMPANY_ID,
    name: "Fênix — Copywriter Senior",
    role: "copywriter",
    title: "Copywriter Senior Specialist",
    description:
      "Produção de copy persuasiva e ética baseada em claim ledger, personas e adequação a canais sem termos proibidos. Alinha narrativa de produto e marketing.",
    capabilities:
      "Produção de copy persuasiva e ética baseada em claim ledger, personas e adequação a canais sem termos proibidos. Alinha narrativa de produto e marketing.",
    icon: "message-square",
    cargo: 8,
    slug: "copywriter",
    adapterType: "langgraph",
    adapterConfig: {
      baseUrl: FENIX_LANGGRAPH_BASE_URL,
      assistantId: "copywriter",
    },
    status: "idle",
    reportsTo: FENIX_SOLUTION_ARCHITECT_ID,
    runtimeConfig: {
      heartbeat: { enabled: false, maxConcurrentRuns: 10 },
    },
    permissions: {
      canCreateAgents: false,
      canCreateSkills: false,
    },
    metadata: {
      cargo: 8,
      cargoName: "copywriter",
      wave: 6,
      roleCategory: "copywriter",
      description:
        "Produção de copy persuasiva e ética baseada em claim ledger, personas e adequação a canais sem termos proibidos.",
    },
  },
  {
    id: generateDeterministicUuid(FENIX_GENESIS_COMPANY_ID, "growth"),
    companyId: FENIX_GENESIS_COMPANY_ID,
    name: "Fênix — Growth Marketing Senior",
    role: "growth",
    title: "Growth Marketing Senior Specialist",
    description:
      "Desenvolve portfólio de experimentos causais, hipóteses pré-registradas, análise de poder estatístico e guardrails de retenção. Foco em escala sustentável.",
    capabilities:
      "Desenvolve portfólio de experimentos causais, hipóteses pré-registradas, análise de poder estatístico e guardrails de retenção. Foco em escala sustentável.",
    icon: "rocket",
    cargo: 9,
    slug: "growth",
    adapterType: "langgraph",
    adapterConfig: {
      baseUrl: FENIX_LANGGRAPH_BASE_URL,
      assistantId: "growth",
    },
    status: "idle",
    reportsTo: FENIX_SOLUTION_ARCHITECT_ID,
    runtimeConfig: {
      heartbeat: { enabled: false, maxConcurrentRuns: 10 },
    },
    permissions: {
      canCreateAgents: false,
      canCreateSkills: false,
    },
    metadata: {
      cargo: 9,
      cargoName: "growth",
      wave: 6,
      roleCategory: "growth",
      description:
        "Desenvolve portfólio de experimentos causais, hipóteses pré-registradas, análise de poder estatístico e guardrails de retenção.",
    },
  },
  {
    id: generateDeterministicUuid(FENIX_GENESIS_COMPANY_ID, "seo"),
    companyId: FENIX_GENESIS_COMPANY_ID,
    name: "Fênix — SEO Senior",
    role: "seo",
    title: "SEO Senior Specialist",
    description:
      "Especificações técnicas de indexabilidade, Core Web Vitals, arquitetura de informação e mapeamento semântico de keywords. Otimização orgânica com base em evidências.",
    capabilities:
      "Especificações técnicas de indexabilidade, Core Web Vitals, arquitetura de informação e mapeamento semântico de keywords. Otimização orgânica com base em evidências.",
    icon: "search",
    cargo: 10,
    slug: "seo",
    adapterType: "langgraph",
    adapterConfig: {
      baseUrl: FENIX_LANGGRAPH_BASE_URL,
      assistantId: "seo",
    },
    status: "idle",
    reportsTo: FENIX_SOLUTION_ARCHITECT_ID,
    runtimeConfig: {
      heartbeat: { enabled: false, maxConcurrentRuns: 10 },
    },
    permissions: {
      canCreateAgents: false,
      canCreateSkills: false,
    },
    metadata: {
      cargo: 10,
      cargoName: "seo",
      wave: 6,
      roleCategory: "seo",
      description:
        "Especificações técnicas de indexabilidade, Core Web Vitals, arquitetura de informação e mapeamento semântico de keywords.",
    },
  },
  {
    id: generateDeterministicUuid(FENIX_GENESIS_COMPANY_ID, "paid_traffic"),
    companyId: FENIX_GENESIS_COMPANY_ID,
    name: "Fênix — Paid Traffic Senior",
    role: "paid_traffic",
    title: "Paid Traffic Senior Specialist",
    description:
      "Planejamento e alocação de mídia paga, tracking com server-side tagging, matriz criativa e regras estritas de stop-loss. Gestão de CAC/LTV e conversão.",
    capabilities:
      "Planejamento e alocação de mídia paga, tracking com server-side tagging, matriz criativa e regras estritas de stop-loss. Gestão de CAC/LTV e conversão.",
    icon: "target",
    cargo: 11,
    slug: "paid_traffic",
    adapterType: "langgraph",
    adapterConfig: {
      baseUrl: FENIX_LANGGRAPH_BASE_URL,
      assistantId: "paid_traffic",
    },
    status: "idle",
    reportsTo: FENIX_SOLUTION_ARCHITECT_ID,
    runtimeConfig: {
      heartbeat: { enabled: false, maxConcurrentRuns: 10 },
    },
    permissions: {
      canCreateAgents: false,
      canCreateSkills: false,
    },
    metadata: {
      cargo: 11,
      cargoName: "paid_traffic",
      wave: 6,
      roleCategory: "paid_traffic",
      description:
        "Planejamento e alocação de mídia paga, tracking com server-side tagging, matriz criativa e regras estritas de stop-loss.",
    },
  },
  {
    id: generateDeterministicUuid(FENIX_GENESIS_COMPANY_ID, "dpo"),
    companyId: FENIX_GENESIS_COMPANY_ID,
    name: "Fênix — DPO Senior",
    role: "dpo",
    title: "Data Protection Officer (DPO) Senior",
    description:
      "Governança de privacidade, inventário de dados, RoPA, DPIA, mapeamento de bases legais LGPD/GDPR e fluxos de DSAR. Proteção de dados e conformidade regulatória.",
    capabilities:
      "Governança de privacidade, inventário de dados, RoPA, DPIA, mapeamento de bases legais LGPD/GDPR e fluxos de DSAR. Proteção de dados e conformidade regulatória.",
    icon: "shield",
    cargo: 12,
    slug: "dpo",
    adapterType: "langgraph",
    adapterConfig: {
      baseUrl: FENIX_LANGGRAPH_BASE_URL,
      assistantId: "dpo",
    },
    status: "idle",
    reportsTo: FENIX_SOLUTION_ARCHITECT_ID,
    runtimeConfig: {
      heartbeat: { enabled: false, maxConcurrentRuns: 10 },
    },
    permissions: {
      canCreateAgents: false,
      canCreateSkills: false,
    },
    metadata: {
      cargo: 12,
      cargoName: "dpo",
      wave: 6,
      roleCategory: "dpo",
      description:
        "Governança de privacidade, inventário de dados, RoPA, DPIA, mapeamento de bases legais LGPD/GDPR e fluxos de DSAR.",
    },
  },
  {
    id: generateDeterministicUuid(FENIX_GENESIS_COMPANY_ID, "localization"),
    companyId: FENIX_GENESIS_COMPANY_ID,
    name: "Fênix — Localization Senior",
    role: "localization",
    title: "Internationalization & Localization Senior",
    description:
      "Adaptação cultural, regulatória e terminológica de produtos para múltiplos idiomas via padrões ICU e testes de pseudo-localização. Internacionalização completa.",
    capabilities:
      "Adaptação cultural, regulatória e terminológica de produtos para múltiplos idiomas via padrões ICU e testes de pseudo-localização. Internacionalização completa.",
    icon: "globe",
    cargo: 13,
    slug: "localization",
    adapterType: "langgraph",
    adapterConfig: {
      baseUrl: FENIX_LANGGRAPH_BASE_URL,
      assistantId: "localization",
    },
    status: "idle",
    reportsTo: FENIX_SOLUTION_ARCHITECT_ID,
    runtimeConfig: {
      heartbeat: { enabled: false, maxConcurrentRuns: 10 },
    },
    permissions: {
      canCreateAgents: false,
      canCreateSkills: false,
    },
    metadata: {
      cargo: 13,
      cargoName: "localization",
      wave: 6,
      roleCategory: "localization",
      description:
        "Adaptação cultural, regulatória e terminológica de produtos para múltiplos idiomas via padrões ICU e testes de pseudo-localização.",
    },
  },
  {
    id: generateDeterministicUuid(FENIX_GENESIS_COMPANY_ID, "data_analyst"),
    companyId: FENIX_GENESIS_COMPANY_ID,
    name: "Fênix — Data Analyst Senior",
    role: "data_analyst",
    title: "Data Analyst Senior Specialist",
    description:
      "Modelagem de métricas de negócio reproduzíveis, análise exploratória e confirmatória de dados e validação de qualidade de pipelines. Inteligência orientada a dados.",
    capabilities:
      "Modelagem de métricas de negócio reproduzíveis, análise exploratória e confirmatória de dados e validação de qualidade de pipelines. Inteligência orientada a dados.",
    icon: "database",
    cargo: 14,
    slug: "data_analyst",
    adapterType: "langgraph",
    adapterConfig: {
      baseUrl: FENIX_LANGGRAPH_BASE_URL,
      assistantId: "data_analyst",
    },
    status: "idle",
    reportsTo: FENIX_SOLUTION_ARCHITECT_ID,
    runtimeConfig: {
      heartbeat: { enabled: false, maxConcurrentRuns: 10 },
    },
    permissions: {
      canCreateAgents: false,
      canCreateSkills: false,
    },
    metadata: {
      cargo: 14,
      cargoName: "data_analyst",
      wave: 6,
      roleCategory: "data_analyst",
      description:
        "Modelagem de métricas de negócio reproduzíveis, análise exploratória e confirmatória de dados e validação de qualidade de pipelines.",
    },
  },
  {
    id: generateDeterministicUuid(FENIX_GENESIS_COMPANY_ID, "crm"),
    companyId: FENIX_GENESIS_COMPANY_ID,
    name: "Fênix — CRM Senior",
    role: "crm",
    title: "CRM & Lifecycle Specialist Senior",
    description:
      "Automação de jornadas de cliente baseadas em eventos, segmentação dinâmica, políticas de frequência e mensuração de retenção. Gestão de ciclo de vida do cliente.",
    capabilities:
      "Automação de jornadas de cliente baseadas em eventos, segmentação dinâmica, políticas de frequência e mensuração de retenção. Gestão de ciclo de vida do cliente.",
    icon: "heart",
    cargo: 15,
    slug: "crm",
    adapterType: "langgraph",
    adapterConfig: {
      baseUrl: FENIX_LANGGRAPH_BASE_URL,
      assistantId: "crm",
    },
    status: "idle",
    reportsTo: FENIX_SOLUTION_ARCHITECT_ID,
    runtimeConfig: {
      heartbeat: { enabled: false, maxConcurrentRuns: 10 },
    },
    permissions: {
      canCreateAgents: false,
      canCreateSkills: false,
    },
    metadata: {
      cargo: 15,
      cargoName: "crm",
      wave: 6,
      roleCategory: "crm",
      description:
        "Automação de jornadas de cliente baseadas em eventos, segmentação dinâmica, políticas de frequência e mensuração de retenção.",
    },
  },
  {
    id: generateDeterministicUuid(FENIX_GENESIS_COMPANY_ID, "model_risk"),
    companyId: FENIX_GENESIS_COMPANY_ID,
    name: "Fênix — Model Risk Senior",
    role: "model_risk",
    title: "AI Evaluation & Model Risk Specialist Senior",
    description:
      "Avaliação sistemática de LLMs via datasets congelados, calibração de avaliadores (judges), detecção de alucinação e governança de risco. Confiabilidade algorítmica.",
    capabilities:
      "Avaliação sistemática de LLMs via datasets congelados, calibração de avaliadores (judges), detecção de alucinação e governança de risco. Confiabilidade algorítmica.",
    icon: "microscope",
    cargo: 16,
    slug: "model_risk",
    adapterType: "langgraph",
    adapterConfig: {
      baseUrl: FENIX_LANGGRAPH_BASE_URL,
      assistantId: "model_risk",
    },
    status: "idle",
    reportsTo: FENIX_SOLUTION_ARCHITECT_ID,
    runtimeConfig: {
      heartbeat: { enabled: false, maxConcurrentRuns: 10 },
    },
    permissions: {
      canCreateAgents: false,
      canCreateSkills: false,
    },
    metadata: {
      cargo: 16,
      cargoName: "model_risk",
      wave: 6,
      roleCategory: "model_risk",
      description:
        "Avaliação sistemática de LLMs via datasets congelados, calibração de avaliadores (judges), detecção de alucinação e governança de risco.",
    },
  },
  {
    id: generateDeterministicUuid(FENIX_GENESIS_COMPANY_ID, "graphic_designer"),
    companyId: FENIX_GENESIS_COMPANY_ID,
    name: "Fênix — Graphic Designer Senior",
    role: "graphic_designer",
    title: "Graphic Designer Senior Specialist",
    description:
      "Criação de masters visuais, renditions multicanal e validação estrita de licenciamento e proveniência de assets gráficos. Excelência visual e estética.",
    capabilities:
      "Criação de masters visuais, renditions multicanal e validação estrita de licenciamento e proveniência de assets gráficos. Excelência visual e estética.",
    icon: "wand",
    cargo: 17,
    slug: "graphic_designer",
    adapterType: "langgraph",
    adapterConfig: {
      baseUrl: FENIX_LANGGRAPH_BASE_URL,
      assistantId: "graphic_designer",
    },
    status: "idle",
    reportsTo: FENIX_SOLUTION_ARCHITECT_ID,
    runtimeConfig: {
      heartbeat: { enabled: false, maxConcurrentRuns: 10 },
    },
    permissions: {
      canCreateAgents: false,
      canCreateSkills: false,
    },
    metadata: {
      cargo: 17,
      cargoName: "graphic_designer",
      wave: 6,
      roleCategory: "graphic_designer",
      description:
        "Criação de masters visuais, renditions multicanal e validação estrita de licenciamento e proveniência de assets gráficos.",
    },
  },
  {
    id: generateDeterministicUuid(FENIX_GENESIS_COMPANY_ID, "accessibility"),
    companyId: FENIX_GENESIS_COMPANY_ID,
    name: "Fênix — Accessibility Senior",
    role: "accessibility",
    title: "Accessibility Specialist Senior",
    description:
      "Auditoria e validação independente de acessibilidade conforme normas WCAG 2.2 AA em fluxos críticos e tecnologias assistivas. Inclusão digital sem barreiras.",
    capabilities:
      "Auditoria e validação independente de acessibilidade conforme normas WCAG 2.2 AA em fluxos críticos e tecnologias assistivas. Inclusão digital sem barreiras.",
    icon: "star",
    cargo: 18,
    slug: "accessibility",
    adapterType: "langgraph",
    adapterConfig: {
      baseUrl: FENIX_LANGGRAPH_BASE_URL,
      assistantId: "accessibility",
    },
    status: "idle",
    reportsTo: FENIX_SOLUTION_ARCHITECT_ID,
    runtimeConfig: {
      heartbeat: { enabled: false, maxConcurrentRuns: 10 },
    },
    permissions: {
      canCreateAgents: false,
      canCreateSkills: false,
    },
    metadata: {
      cargo: 18,
      cargoName: "accessibility",
      wave: 6,
      roleCategory: "accessibility",
      description:
        "Auditoria e validação independente de acessibilidade conforme normas WCAG 2.2 AA em fluxos críticos e tecnologias assistivas.",
    },
  },
  {
    id: generateDeterministicUuid(FENIX_GENESIS_COMPANY_ID, "api_contract"),
    companyId: FENIX_GENESIS_COMPANY_ID,
    name: "Fênix — API Contract Specialist",
    role: "api_contract",
    title: "API Contract Specialist Senior",
    description:
      "Governança e especificação de contratos de API (OpenAPI/AsyncAPI), versionamento semântico, mocks e verificação de breaking changes. Padronização de integrações.",
    capabilities:
      "Governança e especificação de contratos de API (OpenAPI/AsyncAPI), versionamento semântico, mocks e verificação de breaking changes. Padronização de integrações.",
    icon: "file-code",
    cargo: 18,
    slug: "api_contract",
    adapterType: "langgraph",
    adapterConfig: {
      baseUrl: FENIX_LANGGRAPH_BASE_URL,
      assistantId: "api_contract",
    },
    status: "idle",
    reportsTo: FENIX_SOLUTION_ARCHITECT_ID,
    runtimeConfig: {
      heartbeat: { enabled: false, maxConcurrentRuns: 10 },
    },
    permissions: {
      canCreateAgents: false,
      canCreateSkills: false,
    },
    metadata: {
      cargo: 18,
      cargoName: "api_contract",
      wave: 6,
      roleCategory: "api_contract",
      description:
        "Governança e especificação de contratos de API (OpenAPI/AsyncAPI), versionamento semântico, mocks e verificação de breaking changes.",
    },
  },
  {
    id: generateDeterministicUuid(FENIX_GENESIS_COMPANY_ID, "frontend"),
    companyId: FENIX_GENESIS_COMPANY_ID,
    name: "Fênix — Frontend Senior",
    role: "frontend",
    title: "Frontend Senior Specialist",
    description:
      "Implementação de interfaces web reativas com TypeScript estrito, zero any, design tokens, testes ponta a ponta e performance budgets. Experiência de usuário fluida.",
    capabilities:
      "Implementação de interfaces web reativas com TypeScript estrito, zero any, design tokens, testes ponta a ponta e performance budgets. Experiência de usuário fluida.",
    icon: "package",
    cargo: 20,
    slug: "frontend",
    adapterType: "langgraph",
    adapterConfig: {
      baseUrl: FENIX_LANGGRAPH_BASE_URL,
      assistantId: "frontend",
    },
    status: "idle",
    reportsTo: FENIX_SOLUTION_ARCHITECT_ID,
    runtimeConfig: {
      heartbeat: { enabled: false, maxConcurrentRuns: 10 },
    },
    permissions: {
      canCreateAgents: false,
      canCreateSkills: false,
    },
    metadata: {
      cargo: 20,
      cargoName: "frontend",
      wave: 6,
      roleCategory: "frontend",
      description:
        "Implementação de interfaces web reativas com TypeScript estrito, zero any, design tokens, testes ponta a ponta e performance budgets.",
    },
  },
] as const;
