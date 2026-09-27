import type { AgentIconName } from "./constants.js";

export interface FenixSpecialistPreset {
  id: string;
  name: string;
  role: string;
  title: string;
  icon: AgentIconName;
  description: string;
  adapterConfig: {
    baseUrl: string;
    assistantId: string;
  };
}

export const FENIX_SPECIALIST_PRESETS: readonly FenixSpecialistPreset[] = [
  {
    id: "solution_architect",
    name: "Fênix — Solution Architect",
    role: "solution_architect",
    title: "Solution Architect Senior",
    icon: "brain",
    description: "Architecture blueprints, decomposition into specialized sub-specs, and multi-tenant boundaries",
    adapterConfig: {
      baseUrl: "http://127.0.0.1:2024",
      assistantId: "solution_architect",
    },
  },
  {
    id: "api_contract",
    name: "Fênix — API Contract Specialist",
    role: "api_contract",
    title: "API Contract Engineer",
    icon: "file-code",
    description: "OpenAPI 3.1 schema validation, semantic versioning, and backwards-compatibility verification",
    adapterConfig: {
      baseUrl: "http://127.0.0.1:2024",
      assistantId: "api_contract",
    },
  },
  {
    id: "uiux",
    name: "Fênix — UI/UX Specialist",
    role: "uiux",
    title: "UI/UX Design Systems Lead",
    icon: "sparkles",
    description: "Design token schemas, WCAG 2.1 AA accessibility, and component design systems",
    adapterConfig: {
      baseUrl: "http://127.0.0.1:2024",
      assistantId: "uiux",
    },
  },
  {
    id: "devops",
    name: "Fênix — DevOps Specialist",
    role: "devops",
    title: "DevOps Specialist",
    icon: "terminal",
    description: "Docker Swarm manifests, container infrastructure, health checks, and service orchestration",
    adapterConfig: {
      baseUrl: "http://127.0.0.1:2024",
      assistantId: "devops",
    },
  },
  {
    id: "copywriter",
    name: "Fênix — Copywriter Specialist",
    role: "copywriter",
    title: "Senior Copywriter & UX Writer",
    icon: "message-square",
    description: "Microcopy tone, brand voice alignment, UI strings, and user onboarding flows",
    adapterConfig: {
      baseUrl: "http://127.0.0.1:2024",
      assistantId: "copywriter",
    },
  },
  {
    id: "growth",
    name: "Fênix — Growth Specialist",
    role: "growth",
    title: "Growth & Product Strategy Senior",
    icon: "rocket",
    description: "Product analytics funnels, activation and retention metrics, and growth experiments",
    adapterConfig: {
      baseUrl: "http://127.0.0.1:2024",
      assistantId: "growth",
    },
  },
  {
    id: "seo",
    name: "Fênix — SEO Specialist",
    role: "seo",
    title: "Technical SEO Specialist",
    icon: "search",
    description: "Structured schema.org markup, canonical URLs, OpenGraph tags, and crawl optimization",
    adapterConfig: {
      baseUrl: "http://127.0.0.1:2024",
      assistantId: "seo",
    },
  },
  {
    id: "paid_traffic",
    name: "Fênix — Paid Traffic Specialist",
    role: "paid_traffic",
    title: "Paid Acquisition Strategist",
    icon: "target",
    description: "Conversion tracking, attribution taxonomy, and performance campaign management",
    adapterConfig: {
      baseUrl: "http://127.0.0.1:2024",
      assistantId: "paid_traffic",
    },
  },
  {
    id: "localization",
    name: "Fênix — Localization Specialist",
    role: "localization",
    title: "Localization & i18n Engineer",
    icon: "globe",
    description: "String extraction, pt-BR/en-US translation catalogs, and internationalization standards",
    adapterConfig: {
      baseUrl: "http://127.0.0.1:2024",
      assistantId: "localization",
    },
  },
  {
    id: "data_analyst",
    name: "Fênix — Data Analyst Specialist",
    role: "data_analyst",
    title: "Data Analyst & Telemetry Engineer",
    icon: "database",
    description: "Data warehouse event streams, ClickHouse partitioning, and operational metrics",
    adapterConfig: {
      baseUrl: "http://127.0.0.1:2024",
      assistantId: "data_analyst",
    },
  },
  {
    id: "crm",
    name: "Fênix — CRM Specialist",
    role: "crm",
    title: "CRM & Lifecycle Operations Lead",
    icon: "mail",
    description: "Webhook lifecycle events, customer journeys, and automated marketing flows",
    adapterConfig: {
      baseUrl: "http://127.0.0.1:2024",
      assistantId: "crm",
    },
  },
  {
    id: "graphic_designer",
    name: "Fênix — Graphic Designer",
    role: "graphic_designer",
    title: "Graphic & Visual Designer",
    icon: "gem",
    description: "Visual assets, SVG optimization, responsive vector media, and branding collateral",
    adapterConfig: {
      baseUrl: "http://127.0.0.1:2024",
      assistantId: "graphic_designer",
    },
  },
  {
    id: "dpo",
    name: "Fênix — DPO Specialist",
    role: "dpo",
    title: "Data Protection Officer (LGPD/GDPR)",
    icon: "shield",
    description: "PII masking, LGPD Art. 7 consent compliance, and data governance policies",
    adapterConfig: {
      baseUrl: "http://127.0.0.1:2024",
      assistantId: "dpo",
    },
  },
  {
    id: "accessibility",
    name: "Fênix — Accessibility Specialist",
    role: "accessibility",
    title: "Accessibility (a11y) Specialist",
    icon: "eye",
    description: "ARIA live regions, keyboard navigation audits, and axe-core compliance",
    adapterConfig: {
      baseUrl: "http://127.0.0.1:2024",
      assistantId: "accessibility",
    },
  },
  {
    id: "model_risk",
    name: "Fênix — Model Risk Specialist",
    role: "model_risk",
    title: "Model Risk & AI Safety Auditor",
    icon: "radar",
    description: "Adversarial prompt injection batteries, hallucination scoring, and safety gates",
    adapterConfig: {
      baseUrl: "http://127.0.0.1:2024",
      assistantId: "model_risk",
    },
  },
  {
    id: "frontend",
    name: "Fênix — Frontend Senior Engineer",
    role: "frontend",
    title: "Frontend Senior Engineer",
    icon: "code",
    description: "React component architectures, TypeScript strictness, and bundle size optimization",
    adapterConfig: {
      baseUrl: "http://127.0.0.1:2024",
      assistantId: "frontend",
    },
  },
  {
    id: "backend",
    name: "Fênix — Backend Senior Engineer",
    role: "backend",
    title: "Backend Senior Engineer",
    icon: "terminal",
    description: "Postgres migrations, high-throughput APIs, queue workers, and async job pipelines",
    adapterConfig: {
      baseUrl: "http://127.0.0.1:2024",
      assistantId: "backend",
    },
  },
  {
    id: "code_qa",
    name: "Fênix — Code QA Specialist",
    role: "code_qa",
    title: "Code QA & Test Architect",
    icon: "bug",
    description: "Automated unit and integration test suites, mutation coverage, and CI test pipelines",
    adapterConfig: {
      baseUrl: "http://127.0.0.1:2024",
      assistantId: "code_qa",
    },
  },
  {
    id: "brand_sentinel",
    name: "Fênix — Brand Sentinel",
    role: "brand_sentinel",
    title: "Brand Sentinel & Compliance Gate",
    icon: "crown",
    description: "Brand guidelines verification, prohibited terminology scanning, and compliance checks",
    adapterConfig: {
      baseUrl: "http://127.0.0.1:2024",
      assistantId: "brand_sentinel",
    },
  },
  {
    id: "legal_security",
    name: "Fênix — Legal & Security Specialist",
    role: "legal_security",
    title: "Legal & Information Security Officer",
    icon: "lock",
    description: "Cryptographic signing keys, OWASP ASVS Level 2 baselines, and legal compliance",
    adapterConfig: {
      baseUrl: "http://127.0.0.1:2024",
      assistantId: "legal_security",
    },
  },
] as const;

export function findFenixPreset(idOrRole: string): FenixSpecialistPreset | undefined {
  return FENIX_SPECIALIST_PRESETS.find(
    (preset) => preset.id === idOrRole || preset.role === idOrRole || preset.adapterConfig.assistantId === idOrRole,
  );
}
