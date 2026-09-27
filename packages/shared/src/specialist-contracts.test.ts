import { describe, expect, it } from "vitest";
import {
  SPECIALIST_CONTRACT_REGISTRY,
  SPECIALIST_MODEL_PRESETS,
  getSpecialistContractFields,
  getSpecialistDefaultContract,
  resolveSpecialistRole,
  validateSpecialistContract,
  devopsContractSchema,
  solutionArchitectContractSchema,
  codeQaContractSchema,
  legalSecurityContractSchema,
  dpoContractSchema,
  seoContractSchema,
  paidTrafficContractSchema,
  growthContractSchema,
} from "./specialist-contracts.js";

describe("Fênix Specialist Contracts", () => {
  it("registers all 20 canonical specialist roles", () => {
    const roles = Object.keys(SPECIALIST_CONTRACT_REGISTRY);
    expect(roles).toHaveLength(20);
    expect(roles).toEqual(
      expect.arrayContaining([
        "solution_architect",
        "backend",
        "devops",
        "uiux",
        "copywriter",
        "growth",
        "code_qa",
        "seo",
        "brand_sentinel",
        "paid_traffic",
        "legal_security",
        "dpo",
        "localization",
        "data_analyst",
        "crm",
        "model_risk",
        "graphic_designer",
        "accessibility",
        "api_contract",
        "frontend",
      ]),
    );
  });

  it("resolves roles by string name, alias, or cargo number", () => {
    expect(resolveSpecialistRole("devops")).toBe("devops");
    expect(resolveSpecialistRole("DevOps")).toBe("devops");
    expect(resolveSpecialistRole(4)).toBe("devops");
    expect(resolveSpecialistRole("backend_senior")).toBe("backend");
    expect(resolveSpecialistRole("backend")).toBe("backend");
    expect(resolveSpecialistRole(2)).toBe("backend");
    expect(resolveSpecialistRole("solution_architect")).toBe("solution_architect");
    expect(resolveSpecialistRole(1)).toBe("solution_architect");
    expect(resolveSpecialistRole("code_qa")).toBe("code_qa");
    expect(resolveSpecialistRole("qa")).toBe("code_qa");
    expect(resolveSpecialistRole("seo")).toBe("seo");
    expect(resolveSpecialistRole(10)).toBe("brand_sentinel"); // Cargo 10 defaults to registered or mapped
  });

  it("validates DevOps parameters according to canonical contract", () => {
    const defaultDevOps = devopsContractSchema.parse({});
    expect(defaultDevOps).toEqual({
      rto_seconds: 300,
      rpo_seconds: 60,
      infrastructure_profile: "swarm",
      policy_strictness: "strict",
      deploy_strategy: "rolling",
    });

    const custom = devopsContractSchema.parse({
      rto_seconds: 120,
      rpo_seconds: 30,
      infrastructure_profile: "kubernetes",
      policy_strictness: "airgapped",
      deploy_strategy: "blue_green",
    });
    expect(custom.rto_seconds).toBe(120);
    expect(custom.infrastructure_profile).toBe("kubernetes");
  });

  it("validates Solution Architect parameters according to canonical contract", () => {
    const defaultSA = solutionArchitectContractSchema.parse({});
    expect(defaultSA.target_audience).toBe("b2b_saas");
    expect(defaultSA.architecture_style).toBe("modular_monolith");
    expect(defaultSA.compliance_frameworks).toContain("lgpd");
    expect(defaultSA.nfr_thresholds).toMatchObject({ latency_p99_ms: 250 });
  });

  it("validates Code QA parameters according to canonical contract", () => {
    const defaultQA = codeQaContractSchema.parse({});
    expect(defaultQA.coverage_threshold_pct).toBe(85);
    expect(defaultQA.sast_severity_level).toBe("high");
    expect(defaultQA.mutation_testing_enabled).toBe(false);
    expect(defaultQA.fpy_target).toBe(95);
    expect(defaultQA.flaky_retry_attempts).toBe(2);
  });

  it("validates Legal & Security and DPO parameters according to canonical contract", () => {
    const legal = legalSecurityContractSchema.parse({});
    expect(legal.data_classification_default).toBe("confidential");
    expect(legal.pii_masking_mode).toBe("pseudonymization");
    expect(legal.threat_model_framework).toBe("owasp_asvs");
    expect(legal.regulatory_scope).toContain("lgpd");
    expect(legal.require_crypto_signing).toBe(true);

    const dpo = dpoContractSchema.parse({});
    expect(dpo.data_classification_default).toBe("confidential");
    expect(dpo.pii_masking_mode).toBe("anonymization");
    expect(dpo.threat_model_framework).toBe("stride");
    expect(dpo.data_retention_days).toBe(180);
  });

  it("validates SEO, Paid Traffic, and Growth parameters according to canonical contract", () => {
    const seo = seoContractSchema.parse({});
    expect(seo.target_keywords).toContain("acesse.la");
    expect(seo.max_daily_budget_cents).toBe(5000);
    expect(seo.max_cac_cents).toBe(1500);
    expect(seo.target_channels).toContain("google_organic");

    const paid = paidTrafficContractSchema.parse({});
    expect(paid.max_daily_budget_cents).toBe(15000);
    expect(paid.max_cac_cents).toBe(3000);
    expect(paid.bid_strategy).toBe("target_cpa");

    const growth = growthContractSchema.parse({});
    expect(growth.funnel_focus).toBe("activation");
    expect(growth.max_daily_budget_cents).toBe(10000);
  });

  it("returns default contract objects for all 20 roles", () => {
    for (const role of Object.keys(SPECIALIST_CONTRACT_REGISTRY)) {
      const defaults = getSpecialistDefaultContract(role);
      expect(defaults).toBeDefined();
      expect(typeof defaults).toBe("object");

      const fields = getSpecialistContractFields(role);
      expect(fields.length).toBeGreaterThanOrEqual(4);
      for (const field of fields) {
        expect(field.key).toBeDefined();
        expect(field.label).toBeDefined();
        expect(field.type).toBeDefined();
      }

      const validated = validateSpecialistContract(role, defaults);
      expect(validated.success).toBe(true);
    }
  });

  it("exports valid Antigravity and OMP model presets", () => {
    expect(SPECIALIST_MODEL_PRESETS.length).toBeGreaterThan(0);
    const flash = SPECIALIST_MODEL_PRESETS.find((m) => m.id === "google-antigravity/gemini-3.8-flash");
    expect(flash).toBeDefined();
    expect(flash?.provider).toBe("antigravity");
  });
});
