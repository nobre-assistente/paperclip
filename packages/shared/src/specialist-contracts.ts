import { z } from "zod";

// ============================================================================
// Types and Definitions for Fênix Wave 6 Specialist Contracts
// ============================================================================

export type SpecialistFieldType =
  | "string"
  | "number"
  | "boolean"
  | "select"
  | "string_list"
  | "json"
  | "textarea";

export interface SpecialistFieldOption {
  label: string;
  value: string;
}

export interface SpecialistFieldDefinition {
  key: string;
  label: string;
  description?: string;
  type: SpecialistFieldType;
  defaultValue: unknown;
  options?: readonly SpecialistFieldOption[];
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
}

// ----------------------------------------------------------------------------
// 1. Solution Architect (Cargo 1)
// ----------------------------------------------------------------------------
export const solutionArchitectContractSchema = z.object({
  target_audience: z.string().default("b2b_saas"),
  architecture_style: z
    .enum(["modular_monolith", "microservices", "event_driven", "serverless"])
    .default("modular_monolith"),
  nfr_thresholds: z
    .record(z.string(), z.union([z.number(), z.string()]))
    .default({ latency_p99_ms: 250, availability_target_pct: 99.9 }),
  compliance_frameworks: z
    .array(z.string())
    .default(["lgpd", "soc2"]),
});
export type SolutionArchitectContract = z.infer<typeof solutionArchitectContractSchema>;

// ----------------------------------------------------------------------------
// 2. Backend Senior (Cargo 2)
// ----------------------------------------------------------------------------
export const backendContractSchema = z.object({
  db_pool_size: z.number().int().min(1).max(200).default(20),
  transaction_timeout_ms: z.number().int().min(100).max(60000).default(5000),
  orm_strict_mode: z.boolean().default(true),
  query_optimization_level: z
    .enum(["standard", "aggressive", "paranoid"])
    .default("standard"),
  api_transport: z.enum(["rest", "grpc", "graphql"]).default("rest"),
});
export type BackendContract = z.infer<typeof backendContractSchema>;

// ----------------------------------------------------------------------------
// 3. DevOps (Cargo 4)
// ----------------------------------------------------------------------------
export const devopsContractSchema = z.object({
  rto_seconds: z.number().int().nonnegative().default(300),
  rpo_seconds: z.number().int().nonnegative().default(60),
  infrastructure_profile: z
    .enum(["swarm", "kubernetes", "standalone_compose", "cloud_native"])
    .default("swarm"),
  policy_strictness: z
    .enum(["permissive", "standard", "strict", "airgapped"])
    .default("strict"),
  deploy_strategy: z
    .enum(["rolling", "blue_green", "canary", "recreate"])
    .default("rolling"),
});
export type DevopsContract = z.infer<typeof devopsContractSchema>;

// ----------------------------------------------------------------------------
// 4. UI/UX (Cargo 6)
// ----------------------------------------------------------------------------
export const uiuxContractSchema = z.object({
  design_system_theme: z
    .enum(["default", "dark", "light", "high_contrast"])
    .default("default"),
  component_density: z
    .enum(["compact", "comfortable", "spacious"])
    .default("comfortable"),
  wcag_compliance_level: z.enum(["A", "AA", "AAA"]).default("AA"),
  motion_reduced: z.boolean().default(false),
  figma_sync_enabled: z.boolean().default(false),
});
export type UiuxContract = z.infer<typeof uiuxContractSchema>;

// ----------------------------------------------------------------------------
// 5. Copywriter (Cargo 8)
// ----------------------------------------------------------------------------
export const copywriterContractSchema = z.object({
  tone_of_voice: z
    .enum(["professional", "conversational", "bold", "minimalist", "empathetic"])
    .default("conversational"),
  reading_level: z
    .enum(["grade_6", "grade_8", "high_school", "technical_specialist"])
    .default("grade_8"),
  cta_density: z.enum(["low", "medium", "high"]).default("medium"),
  brand_vocabulary_whitelist: z
    .array(z.string())
    .default(["acesse.la", "ágil", "seguro", "transparente"]),
  emoji_usage: z.enum(["none", "conservative", "frequent"]).default("conservative"),
});
export type CopywriterContract = z.infer<typeof copywriterContractSchema>;

// ----------------------------------------------------------------------------
// 6. Growth (Cargo 9)
// ----------------------------------------------------------------------------
export const growthContractSchema = z.object({
  target_keywords: z
    .array(z.string())
    .default(["growth loops", "viral coefficient", "retention"]),
  max_daily_budget_cents: z.number().int().nonnegative().default(10000),
  max_cac_cents: z.number().int().nonnegative().default(2000),
  target_channels: z
    .array(z.string())
    .default(["in_product", "email", "referrals", "paid"]),
  funnel_focus: z
    .enum(["acquisition", "activation", "retention", "referral", "revenue"])
    .default("activation"),
});
export type GrowthContract = z.infer<typeof growthContractSchema>;

// ----------------------------------------------------------------------------
// 7. Code QA (Cargo 9)
// ----------------------------------------------------------------------------
export const codeQaContractSchema = z.object({
  coverage_threshold_pct: z.number().min(0).max(100).default(85),
  sast_severity_level: z
    .enum(["low", "medium", "high", "critical"])
    .default("high"),
  mutation_testing_enabled: z.boolean().default(false),
  fpy_target: z.number().min(0).max(100).default(95),
  flaky_retry_attempts: z.number().int().min(0).max(10).default(2),
});
export type CodeQaContract = z.infer<typeof codeQaContractSchema>;

// ----------------------------------------------------------------------------
// 8. SEO (Cargo 10)
// ----------------------------------------------------------------------------
export const seoContractSchema = z.object({
  target_keywords: z
    .array(z.string())
    .default(["acesse.la", "link shortener", "bio link"]),
  max_daily_budget_cents: z.number().int().nonnegative().default(5000),
  max_cac_cents: z.number().int().nonnegative().default(1500),
  target_channels: z
    .array(z.string())
    .default(["google_organic", "bing", "yandex"]),
  crawl_budget_priority: z.enum(["speed", "depth", "balanced"]).default("balanced"),
});
export type SeoContract = z.infer<typeof seoContractSchema>;

// ----------------------------------------------------------------------------
// 9. Brand Sentinel (Cargo 10)
// ----------------------------------------------------------------------------
export const brandSentinelContractSchema = z.object({
  forbidden_words: z
    .array(z.string())
    .default(["garantido", "revolucionário", "infalível"]),
  enforce_inclusive_language: z.boolean().default(true),
  trademark_notice_required: z.boolean().default(true),
  tone_audit_strictness: z.enum(["lenient", "balanced", "strict"]).default("strict"),
  brand_voice_profile: z.string().default("Direct, technical, evidence-first"),
});
export type BrandSentinelContract = z.infer<typeof brandSentinelContractSchema>;

// ----------------------------------------------------------------------------
// 10. Paid Traffic (Cargo 11)
// ----------------------------------------------------------------------------
export const paidTrafficContractSchema = z.object({
  target_keywords: z
    .array(z.string())
    .default(["url shortener pro", "custom domains"]),
  max_daily_budget_cents: z.number().int().nonnegative().default(15000),
  max_cac_cents: z.number().int().nonnegative().default(3000),
  target_channels: z
    .array(z.string())
    .default(["google_ads", "meta_ads", "linkedin_ads"]),
  bid_strategy: z
    .enum(["target_cpa", "maximize_conversions", "target_roas", "manual_cpc"])
    .default("target_cpa"),
});
export type PaidTrafficContract = z.infer<typeof paidTrafficContractSchema>;

// ----------------------------------------------------------------------------
// 11. Legal & Security (Cargo 11)
// ----------------------------------------------------------------------------
export const legalSecurityContractSchema = z.object({
  data_classification_default: z
    .enum(["public", "internal", "confidential", "restricted"])
    .default("confidential"),
  pii_masking_mode: z
    .enum(["pseudonymization", "anonymization", "redaction", "none"])
    .default("pseudonymization"),
  threat_model_framework: z
    .enum(["stride", "dread", "owasp_asvs", "pasta"])
    .default("owasp_asvs"),
  regulatory_scope: z
    .array(z.string())
    .default(["lgpd", "iso27001", "owasp_asvs_l2"]),
  require_crypto_signing: z.boolean().default(true),
});
export type LegalSecurityContract = z.infer<typeof legalSecurityContractSchema>;

// ----------------------------------------------------------------------------
// 12. DPO (Cargo 12)
// ----------------------------------------------------------------------------
export const dpoContractSchema = z.object({
  data_classification_default: z
    .enum(["public", "internal", "confidential", "restricted"])
    .default("confidential"),
  pii_masking_mode: z
    .enum(["pseudonymization", "anonymization", "redaction", "none"])
    .default("anonymization"),
  threat_model_framework: z
    .enum(["stride", "dread", "owasp_asvs", "pasta"])
    .default("stride"),
  regulatory_scope: z
    .array(z.string())
    .default(["lgpd", "gdpr"]),
  data_retention_days: z.number().int().positive().default(180),
});
export type DpoContract = z.infer<typeof dpoContractSchema>;

// ----------------------------------------------------------------------------
// 13. Localization (Cargo 13)
// ----------------------------------------------------------------------------
export const localizationContractSchema = z.object({
  source_locale: z.string().default("pt-BR"),
  target_locales: z.array(z.string()).default(["en-US", "es-ES"]),
  date_format_locale: z.string().default("pt-BR"),
  currency_code: z.string().default("BRL"),
  missing_translation_fallback: z
    .enum(["source_locale", "blank", "throw_error"])
    .default("source_locale"),
});
export type LocalizationContract = z.infer<typeof localizationContractSchema>;

// ----------------------------------------------------------------------------
// 14. Data Analyst (Cargo 14)
// ----------------------------------------------------------------------------
export const dataAnalystContractSchema = z.object({
  olap_engine: z
    .enum(["clickhouse", "duckdb", "bigquery", "postgres"])
    .default("clickhouse"),
  aggregation_window_seconds: z.number().int().positive().default(300),
  sampling_rate_pct: z.number().min(1).max(100).default(100),
  metrics_export_format: z
    .enum(["prometheus", "parquet", "json", "csv"])
    .default("prometheus"),
  retention_period_days: z.number().int().positive().default(90),
});
export type DataAnalystContract = z.infer<typeof dataAnalystContractSchema>;

// ----------------------------------------------------------------------------
// 15. CRM (Cargo 15)
// ----------------------------------------------------------------------------
export const crmContractSchema = z.object({
  lifecycle_stages: z
    .array(z.string())
    .default(["lead", "mql", "sql", "opportunity", "customer", "churned"]),
  webhook_retry_limit: z.number().int().nonnegative().default(5),
  rate_limit_per_minute: z.number().int().positive().default(60),
  lead_scoring_model: z
    .enum(["rule_based", "predictive", "rfm"])
    .default("rule_based"),
  sync_interval_seconds: z.number().int().positive().default(60),
});
export type CrmContract = z.infer<typeof crmContractSchema>;

// ----------------------------------------------------------------------------
// 16. Model Risk (Cargo 16)
// ----------------------------------------------------------------------------
export const modelRiskContractSchema = z.object({
  adversarial_testing_suite: z
    .enum(["owasp_llm_top10", "nist_ai_rmf", "mitre_atlas"])
    .default("owasp_llm_top10"),
  hallucination_threshold: z.number().min(0).max(1).default(0.05),
  jailbreak_sensitivity: z
    .enum(["low", "medium", "high", "paranoid"])
    .default("high"),
  prompt_injection_detection: z.boolean().default(true),
  audit_sampling_rate_pct: z.number().min(1).max(100).default(100),
});
export type ModelRiskContract = z.infer<typeof modelRiskContractSchema>;

// ----------------------------------------------------------------------------
// 17. Graphic Designer (Cargo 17)
// ----------------------------------------------------------------------------
export const graphicDesignerContractSchema = z.object({
  primary_color_palette: z
    .array(z.string())
    .default(["#4F46E5", "#06B6D4", "#10B981", "#F59E0B"]),
  aspect_ratios: z
    .array(z.string())
    .default(["1:1", "16:9", "9:16", "4:5"]),
  output_format: z.enum(["svg", "png", "webp", "pdf"]).default("svg"),
  optimize_vectors: z.boolean().default(true),
  dpi_resolution: z.number().int().positive().default(300),
});
export type GraphicDesignerContract = z.infer<typeof graphicDesignerContractSchema>;

// ----------------------------------------------------------------------------
// 18. Accessibility (Cargo 18)
// ----------------------------------------------------------------------------
export const accessibilityContractSchema = z.object({
  wcag_target_level: z.enum(["A", "AA", "AAA"]).default("AA"),
  screen_reader_verbosity: z
    .enum(["minimal", "standard", "verbose"])
    .default("standard"),
  contrast_ratio_minimum: z.number().min(1).max(21).default(4.5),
  keyboard_navigation_strict: z.boolean().default(true),
  focus_indicator_visible: z.boolean().default(true),
});
export type AccessibilityContract = z.infer<typeof accessibilityContractSchema>;

// ----------------------------------------------------------------------------
// 19. API Contract (Cargo 18)
// ----------------------------------------------------------------------------
export const apiContractContractSchema = z.object({
  openapi_version: z.enum(["3.0.3", "3.1.0"]).default("3.1.0"),
  breaking_change_policy: z
    .enum(["forbid", "warn", "allow_major_bump"])
    .default("forbid"),
  naming_convention: z
    .enum(["camelCase", "snake_case", "kebab-case"])
    .default("camelCase"),
  spectral_ruleset: z.enum(["recommended", "strict", "minimal"]).default("strict"),
  mock_server_enabled: z.boolean().default(true),
});
export type ApiContractContract = z.infer<typeof apiContractContractSchema>;

// ----------------------------------------------------------------------------
// 20. Frontend (Cargo 20)
// ----------------------------------------------------------------------------
export const frontendContractSchema = z.object({
  framework: z.enum(["react", "nextjs", "vue", "svelte"]).default("react"),
  state_management: z
    .enum(["zustand", "tanstack_query", "redux", "context"])
    .default("zustand"),
  max_bundle_size_kb: z.number().int().positive().default(250),
  strict_typescript: z.boolean().default(true),
  css_strategy: z
    .enum(["tailwind", "css_modules", "styled_components"])
    .default("tailwind"),
});
export type FrontendContract = z.infer<typeof frontendContractSchema>;

// ============================================================================
// Canonical Model Presets (Antigravity / OMP / Google / Anthropic)
// ============================================================================

export interface SpecialistModelPreset {
  id: string;
  label: string;
  provider: string;
}

export const SPECIALIST_MODEL_PRESETS: readonly SpecialistModelPreset[] = [
  {
    id: "google-antigravity/gemini-3.8-flash",
    label: "Google Antigravity — Gemini 3.8 Flash (Default / High Speed)",
    provider: "antigravity",
  },
  {
    id: "google-antigravity/gemini-2.5-pro",
    label: "Google Antigravity — Gemini 2.5 Pro (Deep Reasoning)",
    provider: "antigravity",
  },
  {
    id: "omp/gemini-3.8-flash",
    label: "OMP — Gemini 3.8 Flash",
    provider: "omp",
  },
  {
    id: "omp/claude-3-7-sonnet",
    label: "OMP — Claude 3.7 Sonnet",
    provider: "omp",
  },
  {
    id: "antigravity/claude-3-7-sonnet",
    label: "Antigravity — Claude 3.7 Sonnet (Hybrid)",
    provider: "antigravity",
  },
  {
    id: "openai/gpt-4o",
    label: "OpenAI — GPT-4o",
    provider: "openai",
  },
  {
    id: "anthropic/claude-3-5-sonnet",
    label: "Anthropic — Claude 3.5 Sonnet",
    provider: "anthropic",
  },
] as const;

// Common Specialist Parameters Schema
export const specialistCommonParamsSchema = z.object({
  systemPrompt: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
  model: z.string().optional(),
  provider: z.string().optional(),
});
export type SpecialistCommonParams = z.infer<typeof specialistCommonParamsSchema>;

// ============================================================================
// Specialist Role Definitions & Field Mappings
// ============================================================================

export type SpecialistRole =
  | "solution_architect"
  | "backend"
  | "devops"
  | "uiux"
  | "copywriter"
  | "growth"
  | "code_qa"
  | "seo"
  | "brand_sentinel"
  | "paid_traffic"
  | "legal_security"
  | "dpo"
  | "localization"
  | "data_analyst"
  | "crm"
  | "model_risk"
  | "graphic_designer"
  | "accessibility"
  | "api_contract"
  | "frontend";

export interface SpecialistCatalogEntry {
  role: SpecialistRole;
  cargo: number;
  slug: string;
  name: string;
  title: string;
  schema: z.ZodTypeAny;
  fields: readonly SpecialistFieldDefinition[];
}

export const SPECIALIST_CONTRACT_REGISTRY: Record<SpecialistRole, SpecialistCatalogEntry> = {
  solution_architect: {
    role: "solution_architect",
    cargo: 1,
    slug: "solution_architect",
    name: "Fênix — Solution Architect",
    title: "Solution Architect Senior",
    schema: solutionArchitectContractSchema,
    fields: [
      {
        key: "target_audience",
        label: "Target Audience",
        description: "Primary audience profile for the architecture requirements.",
        type: "string",
        defaultValue: "b2b_saas",
        placeholder: "e.g. b2b_saas, enterprise",
      },
      {
        key: "architecture_style",
        label: "Architecture Style",
        description: "Primary structural architectural pattern.",
        type: "select",
        defaultValue: "modular_monolith",
        options: [
          { label: "Modular Monolith", value: "modular_monolith" },
          { label: "Microservices", value: "microservices" },
          { label: "Event-Driven", value: "event_driven" },
          { label: "Serverless", value: "serverless" },
        ],
      },
      {
        key: "nfr_thresholds",
        label: "NFR Thresholds (JSON)",
        description: "Non-functional requirements latency and availability targets.",
        type: "json",
        defaultValue: { latency_p99_ms: 250, availability_target_pct: 99.9 },
      },
      {
        key: "compliance_frameworks",
        label: "Compliance Frameworks",
        description: "Active governance and regulatory compliance frameworks.",
        type: "string_list",
        defaultValue: ["lgpd", "soc2"],
        placeholder: "lgpd, soc2, pci_dss",
      },
    ],
  },

  backend: {
    role: "backend",
    cargo: 2,
    slug: "backend_senior",
    name: "Fênix — Backend Senior",
    title: "Tech Lead / Backend Senior",
    schema: backendContractSchema,
    fields: [
      {
        key: "db_pool_size",
        label: "DB Pool Size",
        description: "Maximum pool connections for database transactions.",
        type: "number",
        defaultValue: 20,
        min: 1,
        max: 200,
      },
      {
        key: "transaction_timeout_ms",
        label: "Transaction Timeout (ms)",
        description: "Timeout limit in milliseconds before transaction rollback.",
        type: "number",
        defaultValue: 5000,
        min: 100,
        max: 60000,
      },
      {
        key: "orm_strict_mode",
        label: "ORM Strict Mode",
        description: "Enforce strict schema validation and typing on queries.",
        type: "boolean",
        defaultValue: true,
      },
      {
        key: "query_optimization_level",
        label: "Query Optimization Level",
        description: "Optimizer aggressiveness for query plans and indexes.",
        type: "select",
        defaultValue: "standard",
        options: [
          { label: "Standard", value: "standard" },
          { label: "Aggressive", value: "aggressive" },
          { label: "Paranoid", value: "paranoid" },
        ],
      },
      {
        key: "api_transport",
        label: "API Transport Protocol",
        description: "Default wire transport for API endpoints.",
        type: "select",
        defaultValue: "rest",
        options: [
          { label: "REST (HTTP/JSON)", value: "rest" },
          { label: "gRPC (Protobuf)", value: "grpc" },
          { label: "GraphQL", value: "graphql" },
        ],
      },
    ],
  },

  devops: {
    role: "devops",
    cargo: 4,
    slug: "devops",
    name: "Fênix — DevOps Specialist",
    title: "DevOps & Infrastructure Specialist",
    schema: devopsContractSchema,
    fields: [
      {
        key: "rto_seconds",
        label: "RTO Target (seconds)",
        description: "Recovery Time Objective target in seconds.",
        type: "number",
        defaultValue: 300,
        min: 0,
      },
      {
        key: "rpo_seconds",
        label: "RPO Target (seconds)",
        description: "Recovery Point Objective target in seconds.",
        type: "number",
        defaultValue: 60,
        min: 0,
      },
      {
        key: "infrastructure_profile",
        label: "Infrastructure Profile",
        description: "Container deployment and orchestration profile.",
        type: "select",
        defaultValue: "swarm",
        options: [
          { label: "Docker Swarm", value: "swarm" },
          { label: "Kubernetes (k8s)", value: "kubernetes" },
          { label: "Standalone Compose", value: "standalone_compose" },
          { label: "Cloud Native", value: "cloud_native" },
        ],
      },
      {
        key: "policy_strictness",
        label: "Policy Strictness",
        description: "Security and isolation policy enforcement level.",
        type: "select",
        defaultValue: "strict",
        options: [
          { label: "Permissive", value: "permissive" },
          { label: "Standard", value: "standard" },
          { label: "Strict", value: "strict" },
          { label: "Airgapped", value: "airgapped" },
        ],
      },
      {
        key: "deploy_strategy",
        label: "Deploy Strategy",
        description: "Application rollout strategy.",
        type: "select",
        defaultValue: "rolling",
        options: [
          { label: "Rolling Update", value: "rolling" },
          { label: "Blue / Green", value: "blue_green" },
          { label: "Canary", value: "canary" },
          { label: "Recreate", value: "recreate" },
        ],
      },
    ],
  },

  uiux: {
    role: "uiux",
    cargo: 6,
    slug: "uiux",
    name: "Fênix — UI/UX Specialist",
    title: "UI/UX Design Systems Lead",
    schema: uiuxContractSchema,
    fields: [
      {
        key: "design_system_theme",
        label: "Design System Theme",
        description: "Default visual theme foundation.",
        type: "select",
        defaultValue: "default",
        options: [
          { label: "Default", value: "default" },
          { label: "Dark", value: "dark" },
          { label: "Light", value: "light" },
          { label: "High Contrast", value: "high_contrast" },
        ],
      },
      {
        key: "component_density",
        label: "Component Density",
        description: "Information density and component spacing.",
        type: "select",
        defaultValue: "comfortable",
        options: [
          { label: "Compact", value: "compact" },
          { label: "Comfortable", value: "comfortable" },
          { label: "Spacious", value: "spacious" },
        ],
      },
      {
        key: "wcag_compliance_level",
        label: "WCAG Compliance Target",
        description: "Accessibility standard compliance level.",
        type: "select",
        defaultValue: "AA",
        options: [
          { label: "WCAG A", value: "A" },
          { label: "WCAG AA", value: "AA" },
          { label: "WCAG AAA", value: "AAA" },
        ],
      },
      {
        key: "motion_reduced",
        label: "Reduced Motion Mode",
        description: "Enforce prefers-reduced-motion across animations.",
        type: "boolean",
        defaultValue: false,
      },
      {
        key: "figma_sync_enabled",
        label: "Figma Token Sync Enabled",
        description: "Automate design token synchronization with Figma APIs.",
        type: "boolean",
        defaultValue: false,
      },
    ],
  },

  copywriter: {
    role: "copywriter",
    cargo: 8,
    slug: "copywriter",
    name: "Fênix — Copywriter Specialist",
    title: "Senior Copywriter & UX Writer",
    schema: copywriterContractSchema,
    fields: [
      {
        key: "tone_of_voice",
        label: "Tone of Voice",
        description: "Editorial tone profile for UI copy and communications.",
        type: "select",
        defaultValue: "conversational",
        options: [
          { label: "Conversational", value: "conversational" },
          { label: "Professional", value: "professional" },
          { label: "Bold", value: "bold" },
          { label: "Minimalist", value: "minimalist" },
          { label: "Empathetic", value: "empathetic" },
        ],
      },
      {
        key: "reading_level",
        label: "Target Reading Level",
        description: "Flesch-Kincaid / readability index target.",
        type: "select",
        defaultValue: "grade_8",
        options: [
          { label: "Grade 6 (Accessible)", value: "grade_6" },
          { label: "Grade 8 (Standard)", value: "grade_8" },
          { label: "High School", value: "high_school" },
          { label: "Technical Specialist", value: "technical_specialist" },
        ],
      },
      {
        key: "cta_density",
        label: "CTA Density",
        description: "Frequency of Call-to-Action prompts.",
        type: "select",
        defaultValue: "medium",
        options: [
          { label: "Low", value: "low" },
          { label: "Medium", value: "medium" },
          { label: "High", value: "high" },
        ],
      },
      {
        key: "brand_vocabulary_whitelist",
        label: "Brand Vocabulary Whitelist",
        description: "Approved brand words and key terminology.",
        type: "string_list",
        defaultValue: ["acesse.la", "ágil", "seguro", "transparente"],
      },
      {
        key: "emoji_usage",
        label: "Emoji Usage Policy",
        description: "Guidelines for emoji inclusion in content.",
        type: "select",
        defaultValue: "conservative",
        options: [
          { label: "None", value: "none" },
          { label: "Conservative", value: "conservative" },
          { label: "Frequent", value: "frequent" },
        ],
      },
    ],
  },

  growth: {
    role: "growth",
    cargo: 9,
    slug: "growth",
    name: "Fênix — Growth Specialist",
    title: "Growth & Product Strategy Senior",
    schema: growthContractSchema,
    fields: [
      {
        key: "target_keywords",
        label: "Target Growth Keywords",
        description: "Strategic search terms and growth concepts.",
        type: "string_list",
        defaultValue: ["growth loops", "viral coefficient", "retention"],
      },
      {
        key: "max_daily_budget_cents",
        label: "Max Daily Budget (cents)",
        description: "Maximum daily experimentation budget in cents.",
        type: "number",
        defaultValue: 10000,
        min: 0,
      },
      {
        key: "max_cac_cents",
        label: "Max CAC Target (cents)",
        description: "Target Customer Acquisition Cost cap in cents.",
        type: "number",
        defaultValue: 2000,
        min: 0,
      },
      {
        key: "target_channels",
        label: "Target Growth Channels",
        description: "Active user acquisition and activation channels.",
        type: "string_list",
        defaultValue: ["in_product", "email", "referrals", "paid"],
      },
      {
        key: "funnel_focus",
        label: "Primary Funnel Focus",
        description: "Priority conversion stage in the AARRR funnel.",
        type: "select",
        defaultValue: "activation",
        options: [
          { label: "Acquisition", value: "acquisition" },
          { label: "Activation", value: "activation" },
          { label: "Retention", value: "retention" },
          { label: "Referral", value: "referral" },
          { label: "Revenue", value: "revenue" },
        ],
      },
    ],
  },

  code_qa: {
    role: "code_qa",
    cargo: 9,
    slug: "code_qa",
    name: "Fênix — Code QA Specialist",
    title: "Code QA & Test Architect",
    schema: codeQaContractSchema,
    fields: [
      {
        key: "coverage_threshold_pct",
        label: "Code Coverage Threshold (%)",
        description: "Minimum automated test line coverage percentage required.",
        type: "number",
        defaultValue: 85,
        min: 0,
        max: 100,
      },
      {
        key: "sast_severity_level",
        label: "SAST Severity Gate Level",
        description: "Minimum SAST vulnerability severity level that fails builds.",
        type: "select",
        defaultValue: "high",
        options: [
          { label: "Low", value: "low" },
          { label: "Medium", value: "medium" },
          { label: "High", value: "high" },
          { label: "Critical", value: "critical" },
        ],
      },
      {
        key: "mutation_testing_enabled",
        label: "Mutation Testing Enabled",
        description: "Run mutation testing (e.g. Stryker) on critical code paths.",
        type: "boolean",
        defaultValue: false,
      },
      {
        key: "fpy_target",
        label: "First Pass Yield Target (%)",
        description: "Target percentage for builds passing on the first attempt.",
        type: "number",
        defaultValue: 95,
        min: 0,
        max: 100,
      },
      {
        key: "flaky_retry_attempts",
        label: "Flaky Test Retry Attempts",
        description: "Automatic retry count before declaring a test suite failure.",
        type: "number",
        defaultValue: 2,
        min: 0,
        max: 10,
      },
    ],
  },

  seo: {
    role: "seo",
    cargo: 10,
    slug: "seo",
    name: "Fênix — SEO Specialist",
    title: "Technical SEO Specialist",
    schema: seoContractSchema,
    fields: [
      {
        key: "target_keywords",
        label: "Target SEO Keywords",
        description: "Keywords monitored for indexing and organic search rankings.",
        type: "string_list",
        defaultValue: ["acesse.la", "link shortener", "bio link"],
      },
      {
        key: "max_daily_budget_cents",
        label: "Max Daily SEO Budget (cents)",
        description: "Daily budget in cents for SEO tooling and content syndication.",
        type: "number",
        defaultValue: 5000,
        min: 0,
      },
      {
        key: "max_cac_cents",
        label: "Max Organic CAC (cents)",
        description: "Blended acquisition cost cap for organic conversions.",
        type: "number",
        defaultValue: 1500,
        min: 0,
      },
      {
        key: "target_channels",
        label: "Target Search Engines",
        description: "Search engines targeted for sitemaps and indexation.",
        type: "string_list",
        defaultValue: ["google_organic", "bing", "yandex"],
      },
      {
        key: "crawl_budget_priority",
        label: "Crawl Budget Priority",
        description: "Strategy for crawler resource allocation.",
        type: "select",
        defaultValue: "balanced",
        options: [
          { label: "Speed (Low Latency)", value: "speed" },
          { label: "Depth (Comprehensive)", value: "depth" },
          { label: "Balanced", value: "balanced" },
        ],
      },
    ],
  },

  brand_sentinel: {
    role: "brand_sentinel",
    cargo: 10,
    slug: "brand_sentinel",
    name: "Fênix — Brand Sentinel",
    title: "Brand Sentinel & Compliance Gate",
    schema: brandSentinelContractSchema,
    fields: [
      {
        key: "forbidden_words",
        label: "Forbidden Terminology",
        description: "Terms prohibited from customer-facing copy and materials.",
        type: "string_list",
        defaultValue: ["garantido", "revolucionário", "infalível"],
      },
      {
        key: "enforce_inclusive_language",
        label: "Enforce Inclusive Language",
        description: "Verify that copy complies with gender-neutral and inclusive standards.",
        type: "boolean",
        defaultValue: true,
      },
      {
        key: "trademark_notice_required",
        label: "Trademark Notice Required",
        description: "Enforce registered trademark indicators on first mention.",
        type: "boolean",
        defaultValue: true,
      },
      {
        key: "tone_audit_strictness",
        label: "Tone Audit Strictness",
        description: "Strictness of brand voice automated validation checks.",
        type: "select",
        defaultValue: "strict",
        options: [
          { label: "Lenient", value: "lenient" },
          { label: "Balanced", value: "balanced" },
          { label: "Strict", value: "strict" },
        ],
      },
      {
        key: "brand_voice_profile",
        label: "Brand Voice Profile",
        description: "Canonical description of brand character and values.",
        type: "string",
        defaultValue: "Direct, technical, evidence-first",
      },
    ],
  },

  paid_traffic: {
    role: "paid_traffic",
    cargo: 11,
    slug: "paid_traffic",
    name: "Fênix — Paid Traffic Specialist",
    title: "Paid Acquisition Strategist",
    schema: paidTrafficContractSchema,
    fields: [
      {
        key: "target_keywords",
        label: "Target Search & PPC Keywords",
        description: "Keywords targeted in paid search campaigns.",
        type: "string_list",
        defaultValue: ["url shortener pro", "custom domains"],
      },
      {
        key: "max_daily_budget_cents",
        label: "Max Daily Ad Budget (cents)",
        description: "Total combined daily budget ceiling in cents.",
        type: "number",
        defaultValue: 15000,
        min: 0,
      },
      {
        key: "max_cac_cents",
        label: "Max Target CAC (cents)",
        description: "Target Customer Acquisition Cost ceiling in cents.",
        type: "number",
        defaultValue: 3000,
        min: 0,
      },
      {
        key: "target_channels",
        label: "Target Ad Networks",
        description: "Active paid ad platforms.",
        type: "string_list",
        defaultValue: ["google_ads", "meta_ads", "linkedin_ads"],
      },
      {
        key: "bid_strategy",
        label: "Bidding Strategy",
        description: "Automated bidding algorithm setting.",
        type: "select",
        defaultValue: "target_cpa",
        options: [
          { label: "Target CPA", value: "target_cpa" },
          { label: "Maximize Conversions", value: "maximize_conversions" },
          { label: "Target ROAS", value: "target_roas" },
          { label: "Manual CPC", value: "manual_cpc" },
        ],
      },
    ],
  },

  legal_security: {
    role: "legal_security",
    cargo: 11,
    slug: "legal_security",
    name: "Fênix — Legal & Security Specialist",
    title: "Legal & Information Security Officer",
    schema: legalSecurityContractSchema,
    fields: [
      {
        key: "data_classification_default",
        label: "Default Data Classification",
        description: "Default sensitivity classification for system assets.",
        type: "select",
        defaultValue: "confidential",
        options: [
          { label: "Public", value: "public" },
          { label: "Internal", value: "internal" },
          { label: "Confidential", value: "confidential" },
          { label: "Restricted", value: "restricted" },
        ],
      },
      {
        key: "pii_masking_mode",
        label: "PII Masking Strategy",
        description: "Level of data transformation for sensitive personal information.",
        type: "select",
        defaultValue: "pseudonymization",
        options: [
          { label: "Pseudonymization", value: "pseudonymization" },
          { label: "Anonymization", value: "anonymization" },
          { label: "Redaction", value: "redaction" },
          { label: "None", value: "none" },
        ],
      },
      {
        key: "threat_model_framework",
        label: "Threat Modeling Framework",
        description: "Standard methodology for evaluating security threats.",
        type: "select",
        defaultValue: "owasp_asvs",
        options: [
          { label: "STRIDE", value: "stride" },
          { label: "DREAD", value: "dread" },
          { label: "OWASP ASVS", value: "owasp_asvs" },
          { label: "PASTA", value: "pasta" },
        ],
      },
      {
        key: "regulatory_scope",
        label: "Regulatory Scope",
        description: "Applicable legal frameworks and standards.",
        type: "string_list",
        defaultValue: ["lgpd", "iso27001", "owasp_asvs_l2"],
      },
      {
        key: "require_crypto_signing",
        label: "Enforce Cryptographic Signing",
        description: "Require digital signatures on code releases and deployments.",
        type: "boolean",
        defaultValue: true,
      },
    ],
  },

  dpo: {
    role: "dpo",
    cargo: 12,
    slug: "dpo",
    name: "Fênix — DPO Specialist",
    title: "Data Protection Officer (LGPD/GDPR)",
    schema: dpoContractSchema,
    fields: [
      {
        key: "data_classification_default",
        label: "Default Data Classification",
        description: "Default classification under privacy regulations.",
        type: "select",
        defaultValue: "confidential",
        options: [
          { label: "Public", value: "public" },
          { label: "Internal", value: "internal" },
          { label: "Confidential", value: "confidential" },
          { label: "Restricted", value: "restricted" },
        ],
      },
      {
        key: "pii_masking_mode",
        label: "PII Masking Mode",
        description: "Enforced masking format for user data.",
        type: "select",
        defaultValue: "anonymization",
        options: [
          { label: "Pseudonymization", value: "pseudonymization" },
          { label: "Anonymization", value: "anonymization" },
          { label: "Redaction", value: "redaction" },
          { label: "None", value: "none" },
        ],
      },
      {
        key: "threat_model_framework",
        label: "Privacy Impact Framework",
        description: "Framework for Data Protection Impact Assessments (DPIA/RIPD).",
        type: "select",
        defaultValue: "stride",
        options: [
          { label: "STRIDE", value: "stride" },
          { label: "DREAD", value: "dread" },
          { label: "OWASP ASVS", value: "owasp_asvs" },
          { label: "PASTA", value: "pasta" },
        ],
      },
      {
        key: "regulatory_scope",
        label: "Data Protection Regulations",
        description: "Governing privacy laws in target jurisdictions.",
        type: "string_list",
        defaultValue: ["lgpd", "gdpr"],
      },
      {
        key: "data_retention_days",
        label: "Data Retention Period (days)",
        description: "Maximum retention days for personal event logs.",
        type: "number",
        defaultValue: 180,
        min: 1,
      },
    ],
  },

  localization: {
    role: "localization",
    cargo: 13,
    slug: "localization",
    name: "Fênix — Localization Specialist",
    title: "Localization & i18n Engineer",
    schema: localizationContractSchema,
    fields: [
      {
        key: "source_locale",
        label: "Source Base Locale",
        description: "Primary authoring locale for extracted strings.",
        type: "string",
        defaultValue: "pt-BR",
      },
      {
        key: "target_locales",
        label: "Target Locales",
        description: "Locales supported for translation Catalogs.",
        type: "string_list",
        defaultValue: ["en-US", "es-ES"],
      },
      {
        key: "date_format_locale",
        label: "Date Format Locale",
        description: "Default locale for date and time representation.",
        type: "string",
        defaultValue: "pt-BR",
      },
      {
        key: "currency_code",
        label: "Default Currency Code",
        description: "ISO 4217 currency code.",
        type: "string",
        defaultValue: "BRL",
      },
      {
        key: "missing_translation_fallback",
        label: "Fallback on Missing Key",
        description: "Handling strategy when a target string translation is missing.",
        type: "select",
        defaultValue: "source_locale",
        options: [
          { label: "Use Source Locale Text", value: "source_locale" },
          { label: "Leave Blank", value: "blank" },
          { label: "Throw Error in Development", value: "throw_error" },
        ],
      },
    ],
  },

  data_analyst: {
    role: "data_analyst",
    cargo: 14,
    slug: "data_analyst",
    name: "Fênix — Data Analyst Specialist",
    title: "Data Analyst & Telemetry Engineer",
    schema: dataAnalystContractSchema,
    fields: [
      {
        key: "olap_engine",
        label: "OLAP Engine",
        description: "Target columnar database engine for telemetry queries.",
        type: "select",
        defaultValue: "clickhouse",
        options: [
          { label: "ClickHouse", value: "clickhouse" },
          { label: "DuckDB", value: "duckdb" },
          { label: "Google BigQuery", value: "bigquery" },
          { label: "PostgreSQL", value: "postgres" },
        ],
      },
      {
        key: "aggregation_window_seconds",
        label: "Aggregation Window (seconds)",
        description: "Time bucket window size for operational rollups.",
        type: "number",
        defaultValue: 300,
        min: 1,
      },
      {
        key: "sampling_rate_pct",
        label: "Telemetry Sampling Rate (%)",
        description: "Sample percentage of high-volume telemetry events.",
        type: "number",
        defaultValue: 100,
        min: 1,
        max: 100,
      },
      {
        key: "metrics_export_format",
        label: "Metrics Export Format",
        description: "Serialization format for metric sink pipelines.",
        type: "select",
        defaultValue: "prometheus",
        options: [
          { label: "Prometheus Exposition", value: "prometheus" },
          { label: "Apache Parquet", value: "parquet" },
          { label: "JSON Stream", value: "json" },
          { label: "CSV", value: "csv" },
        ],
      },
      {
        key: "retention_period_days",
        label: "Analytics Retention (days)",
        description: "Raw event data partition TTL in days.",
        type: "number",
        defaultValue: 90,
        min: 1,
      },
    ],
  },

  crm: {
    role: "crm",
    cargo: 15,
    slug: "crm",
    name: "Fênix — CRM Specialist",
    title: "CRM & Lifecycle Operations Lead",
    schema: crmContractSchema,
    fields: [
      {
        key: "lifecycle_stages",
        label: "Customer Lifecycle Stages",
        description: "Ordered customer pipeline stages.",
        type: "string_list",
        defaultValue: ["lead", "mql", "sql", "opportunity", "customer", "churned"],
      },
      {
        key: "webhook_retry_limit",
        label: "Webhook Retry Limit",
        description: "Maximum delivery attempts for failed webhook payloads.",
        type: "number",
        defaultValue: 5,
        min: 0,
      },
      {
        key: "rate_limit_per_minute",
        label: "Rate Limit (requests / min)",
        description: "Max outbound webhook dispatches per minute.",
        type: "number",
        defaultValue: 60,
        min: 1,
      },
      {
        key: "lead_scoring_model",
        label: "Lead Scoring Algorithm",
        description: "Scoring methodology for customer qualification.",
        type: "select",
        defaultValue: "rule_based",
        options: [
          { label: "Rule-Based", value: "rule_based" },
          { label: "Predictive Machine Learning", value: "predictive" },
          { label: "RFM (Recency, Frequency, Monetary)", value: "rfm" },
        ],
      },
      {
        key: "sync_interval_seconds",
        label: "Sync Interval (seconds)",
        description: "Interval between CRM data updates.",
        type: "number",
        defaultValue: 60,
        min: 1,
      },
    ],
  },

  model_risk: {
    role: "model_risk",
    cargo: 16,
    slug: "model_risk",
    name: "Fênix — Model Risk Specialist",
    title: "Model Risk & AI Safety Auditor",
    schema: modelRiskContractSchema,
    fields: [
      {
        key: "adversarial_testing_suite",
        label: "Adversarial Testing Suite",
        description: "Benchmark framework for red-teaming LLM prompts.",
        type: "select",
        defaultValue: "owasp_llm_top10",
        options: [
          { label: "OWASP Top 10 for LLM", value: "owasp_llm_top10" },
          { label: "NIST AI RMF", value: "nist_ai_rmf" },
          { label: "MITRE ATLAS", value: "mitre_atlas" },
        ],
      },
      {
        key: "hallucination_threshold",
        label: "Hallucination Error Ceiling",
        description: "Maximum acceptable hallucination score (0.0 to 1.0).",
        type: "number",
        defaultValue: 0.05,
        min: 0,
        max: 1,
        step: 0.01,
      },
      {
        key: "jailbreak_sensitivity",
        label: "Jailbreak Detection Sensitivity",
        description: "Detection sensitivity for adversarial jailbreak payloads.",
        type: "select",
        defaultValue: "high",
        options: [
          { label: "Low", value: "low" },
          { label: "Medium", value: "medium" },
          { label: "High", value: "high" },
          { label: "Paranoid", value: "paranoid" },
        ],
      },
      {
        key: "prompt_injection_detection",
        label: "Active Prompt Injection Filter",
        description: "Block inputs matching known indirect prompt injection patterns.",
        type: "boolean",
        defaultValue: true,
      },
      {
        key: "audit_sampling_rate_pct",
        label: "Safety Audit Sample Rate (%)",
        description: "Percentage of runs routed through model risk evaluation.",
        type: "number",
        defaultValue: 100,
        min: 1,
        max: 100,
      },
    ],
  },

  graphic_designer: {
    role: "graphic_designer",
    cargo: 17,
    slug: "graphic_designer",
    name: "Fênix — Graphic Designer",
    title: "Graphic & Visual Designer",
    schema: graphicDesignerContractSchema,
    fields: [
      {
        key: "primary_color_palette",
        label: "Primary Color Palette",
        description: "Hex or CSS color codes for branding assets.",
        type: "string_list",
        defaultValue: ["#4F46E5", "#06B6D4", "#10B981", "#F59E0B"],
      },
      {
        key: "aspect_ratios",
        label: "Export Aspect Ratios",
        description: "Target canvas aspect ratios for generated media.",
        type: "string_list",
        defaultValue: ["1:1", "16:9", "9:16", "4:5"],
      },
      {
        key: "output_format",
        label: "Default Output Format",
        description: "Primary image format for exported graphics.",
        type: "select",
        defaultValue: "svg",
        options: [
          { label: "SVG (Scalable Vector)", value: "svg" },
          { label: "PNG", value: "png" },
          { label: "WebP", value: "webp" },
          { label: "PDF", value: "pdf" },
        ],
      },
      {
        key: "optimize_vectors",
        label: "Optimize Vector Markup (SVGO)",
        description: "Strip metadata and minimize SVG path sizes.",
        type: "boolean",
        defaultValue: true,
      },
      {
        key: "dpi_resolution",
        label: "Raster DPI Resolution",
        description: "DPI density for raster asset generation.",
        type: "number",
        defaultValue: 300,
        min: 72,
        max: 600,
      },
    ],
  },

  accessibility: {
    role: "accessibility",
    cargo: 18,
    slug: "accessibility",
    name: "Fênix — Accessibility Specialist",
    title: "Accessibility (a11y) Specialist",
    schema: accessibilityContractSchema,
    fields: [
      {
        key: "wcag_target_level",
        label: "Target WCAG Level",
        description: "Target WCAG 2.1 conformance tier.",
        type: "select",
        defaultValue: "AA",
        options: [
          { label: "Level A", value: "A" },
          { label: "Level AA", value: "AA" },
          { label: "Level AAA", value: "AAA" },
        ],
      },
      {
        key: "screen_reader_verbosity",
        label: "Screen Reader Verbosity",
        description: "Detail level for aria-live announcements and alt texts.",
        type: "select",
        defaultValue: "standard",
        options: [
          { label: "Minimal", value: "minimal" },
          { label: "Standard", value: "standard" },
          { label: "Verbose", value: "verbose" },
        ],
      },
      {
        key: "contrast_ratio_minimum",
        label: "Minimum Contrast Ratio",
        description: "Minimum required contrast ratio against background (4.5 for AA, 7.0 for AAA).",
        type: "number",
        defaultValue: 4.5,
        min: 1,
        max: 21,
        step: 0.1,
      },
      {
        key: "keyboard_navigation_strict",
        label: "Strict Keyboard Traversal",
        description: "Disallow non-focusable interactive elements and broken tab orders.",
        type: "boolean",
        defaultValue: true,
      },
      {
        key: "focus_indicator_visible",
        label: "Enforce Visible Focus Rings",
        description: "Require prominent focus indicators on all interactive components.",
        type: "boolean",
        defaultValue: true,
      },
    ],
  },

  api_contract: {
    role: "api_contract",
    cargo: 18,
    slug: "api_contract",
    name: "Fênix — API Contract Specialist",
    title: "API Contract Engineer",
    schema: apiContractContractSchema,
    fields: [
      {
        key: "openapi_version",
        label: "OpenAPI Specification Version",
        description: "Target OpenAPI schema version for spec documents.",
        type: "select",
        defaultValue: "3.1.0",
        options: [
          { label: "OpenAPI 3.1.0", value: "3.1.0" },
          { label: "OpenAPI 3.0.3", value: "3.0.3" },
        ],
      },
      {
        key: "breaking_change_policy",
        label: "Breaking Change Policy",
        description: "Validation strictness when API spec differences are detected.",
        type: "select",
        defaultValue: "forbid",
        options: [
          { label: "Forbid (Strict SemVer)", value: "forbid" },
          { label: "Warn on CI", value: "warn" },
          { label: "Allow with Major Version Bump", value: "allow_major_bump" },
        ],
      },
      {
        key: "naming_convention",
        label: "Property Naming Convention",
        description: "Required JSON casing standard for API schemas.",
        type: "select",
        defaultValue: "camelCase",
        options: [
          { label: "camelCase", value: "camelCase" },
          { label: "snake_case", value: "snake_case" },
          { label: "kebab-case", value: "kebab-case" },
        ],
      },
      {
        key: "spectral_ruleset",
        label: "Spectral Lint Ruleset",
        description: "Linter ruleset enforced for OpenAPI schemas.",
        type: "select",
        defaultValue: "strict",
        options: [
          { label: "Strict (Full SemVer & Docs)", value: "strict" },
          { label: "Recommended", value: "recommended" },
          { label: "Minimal", value: "minimal" },
        ],
      },
      {
        key: "mock_server_enabled",
        label: "Automatic Mock Server Generation",
        description: "Generate prism mock server endpoints from specs.",
        type: "boolean",
        defaultValue: true,
      },
    ],
  },

  frontend: {
    role: "frontend",
    cargo: 20,
    slug: "frontend",
    name: "Fênix — Frontend Senior Engineer",
    title: "Frontend Senior Engineer",
    schema: frontendContractSchema,
    fields: [
      {
        key: "framework",
        label: "UI Framework",
        description: "Client application frontend framework.",
        type: "select",
        defaultValue: "react",
        options: [
          { label: "React", value: "react" },
          { label: "Next.js", value: "nextjs" },
          { label: "Vue 3", value: "vue" },
          { label: "Svelte", value: "svelte" },
        ],
      },
      {
        key: "state_management",
        label: "State Management Library",
        description: "Architectural state management solution.",
        type: "select",
        defaultValue: "zustand",
        options: [
          { label: "Zustand", value: "zustand" },
          { label: "TanStack Query", value: "tanstack_query" },
          { label: "Redux Toolkit", value: "redux" },
          { label: "React Context", value: "context" },
        ],
      },
      {
        key: "max_bundle_size_kb",
        label: "Max Bundle Size (KB)",
        description: "Initial client chunk size budget in Kilobytes.",
        type: "number",
        defaultValue: 250,
        min: 10,
        max: 5000,
      },
      {
        key: "strict_typescript",
        label: "Strict TypeScript Mode",
        description: "Enable noImplicitAny, strictNullChecks, and full typing.",
        type: "boolean",
        defaultValue: true,
      },
      {
        key: "css_strategy",
        label: "Styling Architecture",
        description: "CSS styling and design token engine.",
        type: "select",
        defaultValue: "tailwind",
        options: [
          { label: "Tailwind CSS", value: "tailwind" },
          { label: "CSS Modules", value: "css_modules" },
          { label: "Styled Components", value: "styled_components" },
        ],
      },
    ],
  },
};

// ============================================================================
// Helper Functions for Specialist Contract Resolution & Validation
// ============================================================================

/**
 * Normalizes any role string, cargo number, or slug to one of the 20 canonical SpecialistRoles.
 */
export function resolveSpecialistRole(
  input: string | number | undefined | null,
): SpecialistRole | undefined {
  if (input === undefined || input === null) return undefined;

  // If number, match cargo
  if (typeof input === "number") {
    const cargoMatches: Record<number, SpecialistRole> = {
      1: "solution_architect",
      2: "backend",
      4: "devops",
      6: "uiux",
      8: "copywriter",
      9: "code_qa", // default 9 to code_qa or growth if specified
      10: "brand_sentinel",
      11: "legal_security",
      12: "dpo",
      13: "localization",
      14: "data_analyst",
      15: "crm",
      16: "model_risk",
      17: "graphic_designer",
      18: "api_contract",
      20: "frontend",
    };
    return cargoMatches[input];
  }

  const raw = String(input).trim().toLowerCase();

  // Direct key lookup
  if (raw in SPECIALIST_CONTRACT_REGISTRY) {
    return raw as SpecialistRole;
  }

  // Aliases and slug mappings
  const aliases: Record<string, SpecialistRole> = {
    backend_senior: "backend",
    backend_developer: "backend",
    be: "backend",
    fe: "frontend",
    frontend_senior: "frontend",
    frontend_developer: "frontend",
    solution_architect: "solution_architect",
    architect: "solution_architect",
    devops: "devops",
    sre: "devops",
    infrastructure: "devops",
    uiux: "uiux",
    ui_ux: "uiux",
    designer: "uiux",
    web_designer: "uiux",
    copywriter: "copywriter",
    copy: "copywriter",
    growth: "growth",
    growth_specialist: "growth",
    code_qa: "code_qa",
    qa: "code_qa",
    tester: "code_qa",
    seo: "seo",
    seo_specialist: "seo",
    brand_sentinel: "brand_sentinel",
    brand: "brand_sentinel",
    paid_traffic: "paid_traffic",
    paid_ads: "paid_traffic",
    traffic: "paid_traffic",
    legal_security: "legal_security",
    legal: "legal_security",
    security: "legal_security",
    dpo: "dpo",
    dpo_specialist: "dpo",
    privacy: "dpo",
    localization: "localization",
    i18n: "localization",
    data_analyst: "data_analyst",
    analytics: "data_analyst",
    telemetry: "data_analyst",
    crm: "crm",
    crm_specialist: "crm",
    model_risk: "model_risk",
    ai_safety: "model_risk",
    graphic_designer: "graphic_designer",
    graphics: "graphic_designer",
    accessibility: "accessibility",
    a11y: "accessibility",
    api_contract: "api_contract",
    api: "api_contract",
  };

  if (raw in aliases) {
    return aliases[raw];
  }

  // Try substring or prefix matching
  for (const [key, entry] of Object.entries(SPECIALIST_CONTRACT_REGISTRY)) {
    if (raw.includes(key) || raw.includes(entry.slug) || raw === entry.title.toLowerCase()) {
      return key as SpecialistRole;
    }
  }

  return undefined;
}

/**
 * Returns the Zod schema for a specialist role or undefined if not found.
 */
export function getSpecialistContractSchema(
  roleOrCargo: string | number | undefined | null,
): z.ZodTypeAny | undefined {
  const role = resolveSpecialistRole(roleOrCargo);
  if (!role) return undefined;
  return SPECIALIST_CONTRACT_REGISTRY[role].schema;
}

/**
 * Returns the field definitions for a specialist role to render forms dynamically.
 */
export function getSpecialistContractFields(
  roleOrCargo: string | number | undefined | null,
): readonly SpecialistFieldDefinition[] {
  const role = resolveSpecialistRole(roleOrCargo);
  if (!role) return [];
  return SPECIALIST_CONTRACT_REGISTRY[role].fields;
}

/**
 * Returns default contract parameter values for a specialist role.
 */
export function getSpecialistDefaultContract(
  roleOrCargo: string | number | undefined | null,
): Record<string, unknown> {
  const role = resolveSpecialistRole(roleOrCargo);
  if (!role) return {};
  const schema = SPECIALIST_CONTRACT_REGISTRY[role].schema;
  return (schema.parse({}) as Record<string, unknown>) ?? {};
}

/**
 * Validates and normalizes specialist contract data against its canonical schema.
 */
export function validateSpecialistContract<T = Record<string, unknown>>(
  roleOrCargo: string | number | undefined | null,
  data: unknown,
): { success: true; data: T } | { success: false; errors: string[] } {
  const schema = getSpecialistContractSchema(roleOrCargo);
  if (!schema) {
    return { success: false, errors: [`Unrecognized specialist role or cargo: ${String(roleOrCargo)}`] };
  }
  const result = schema.safeParse(data ?? {});
  if (result.success) {
    return { success: true, data: result.data as T };
  }
  return {
    success: false,
    errors: result.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`),
  };
}

/**
 * Helper to produce a full specialist configuration object (contract parameters + LLM settings).
 */
export interface FullSpecialistConfig {
  contract: Record<string, unknown>;
  systemPrompt?: string;
  temperature?: number;
  model?: string;
  provider?: string;
}
