import { describe, expect, it } from "vitest";
import { AGENT_ICON_NAMES } from "../constants.js";
import {
  FENIX_GENESIS_COMPANY_ID,
  FENIX_ORCHESTRATOR_AGENT_ID,
  FENIX_SOLUTION_ARCHITECT_ID,
  FENIX_WAVE6_SPECIALISTS,
  generateDeterministicUuid,
} from "./fenix-wave6-specialists.js";

const UUID_V4_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

describe("Fênix Wave 6 Specialists Seeds", () => {
  it("defines exactly 20 specialists", () => {
    expect(FENIX_WAVE6_SPECIALISTS).toHaveLength(20);
  });

  it("assigns valid deterministic UUID v4 to each specialist", () => {
    const ids = new Set<string>();
    for (const spec of FENIX_WAVE6_SPECIALISTS) {
      expect(spec.id).toMatch(UUID_V4_REGEX);
      expect(ids.has(spec.id)).toBe(false);
      ids.add(spec.id);
    }
    expect(ids.size).toBe(20);
  });

  it("assigns all specialists to Genesis company ID", () => {
    for (const spec of FENIX_WAVE6_SPECIALISTS) {
      expect(spec.companyId).toBe(FENIX_GENESIS_COMPANY_ID);
    }
  });

  it("configures langgraph adapter pointing to local server for all specialists", () => {
    for (const spec of FENIX_WAVE6_SPECIALISTS) {
      expect(spec.adapterType).toBe("langgraph");
      expect(spec.adapterConfig.baseUrl).toBe("http://127.0.0.1:2024");
      expect(spec.adapterConfig.assistantId).toBe(spec.slug);
      expect(spec.status).toBe("idle");
    }
  });

  it("uses valid icons from AGENT_ICON_NAMES", () => {
    for (const spec of FENIX_WAVE6_SPECIALISTS) {
      expect(AGENT_ICON_NAMES).toContain(spec.icon);
    }
  });

  it("establishes valid reports_to hierarchy", () => {
    const sa = FENIX_WAVE6_SPECIALISTS.find((s) => s.slug === "solution_architect");
    expect(sa).toBeDefined();
    expect(sa?.id).toBe(FENIX_SOLUTION_ARCHITECT_ID);
    expect(sa?.reportsTo).toBe(FENIX_ORCHESTRATOR_AGENT_ID);

    const nonSa = FENIX_WAVE6_SPECIALISTS.filter((s) => s.slug !== "solution_architect");
    expect(nonSa).toHaveLength(19);
    for (const spec of nonSa) {
      expect(spec.reportsTo).toBe(FENIX_SOLUTION_ARCHITECT_ID);
    }
  });

  it("produces deterministic UUIDs from namespace and name", () => {
    const id1 = generateDeterministicUuid(FENIX_GENESIS_COMPANY_ID, "test-agent");
    const id2 = generateDeterministicUuid(FENIX_GENESIS_COMPANY_ID, "test-agent");
    expect(id1).toBe(id2);
    expect(id1).toMatch(UUID_V4_REGEX);
  });
});
