import { describe, expect, it } from "vitest";
import type { AdapterAgent } from "@paperclipai/adapter-utils";
import { deriveTenantId } from "./tenant.js";

describe("deriveTenantId()", () => {
  it("tenantId derived only from companyId", () => {
    const agent: AdapterAgent = {
      id: "agent-uuid-1",
      companyId: "company-alpha-123",
      name: "Alpha Agent",
      adapterType: "langgraph",
      adapterConfig: {
        tenantId: "malicious-injected-tenant",
        tenant_id: "fake-tenant",
      },
    };

    const tenantId = deriveTenantId(agent);
    expect(tenantId).toBe("company-alpha-123");
    expect(tenantId).not.toBe("malicious-injected-tenant");
    expect(tenantId).not.toBe("fake-tenant");
  });

  it("trims whitespace from companyId", () => {
    const agent: AdapterAgent = {
      id: "agent-1",
      companyId: "  company-trimmed  ",
      name: "Agent",
      adapterType: "langgraph",
      adapterConfig: null,
    };

    expect(deriveTenantId(agent)).toBe("company-trimmed");
  });

  it("throws when agent is null or undefined", () => {
    expect(() => deriveTenantId(null as unknown as AdapterAgent)).toThrow(
      /Cannot derive tenantId/,
    );
    expect(() => deriveTenantId(undefined as unknown as AdapterAgent)).toThrow(
      /Cannot derive tenantId/,
    );
  });

  it("throws when companyId is missing, empty, or not a string", () => {
    expect(() =>
      deriveTenantId({
        id: "a1",
        name: "A",
        adapterType: "langgraph",
        adapterConfig: null,
      } as unknown as AdapterAgent),
    ).toThrow(/companyId is required/);

    expect(() =>
      deriveTenantId({
        id: "a1",
        companyId: "",
        name: "A",
        adapterType: "langgraph",
        adapterConfig: null,
      }),
    ).toThrow(/companyId cannot be empty/);

    expect(() =>
      deriveTenantId({
        id: "a1",
        companyId: "   ",
        name: "A",
        adapterType: "langgraph",
        adapterConfig: null,
      }),
    ).toThrow(/companyId cannot be empty/);

    expect(() =>
      deriveTenantId({
        id: "a1",
        companyId: 12345 as unknown as string,
        name: "A",
        adapterType: "langgraph",
        adapterConfig: null,
      }),
    ).toThrow(/must be a string/);
  });
});
