import { describe, expect, it } from "vitest";
import { getConfigSchema, parseLangGraphAdapterConfig, DEFAULT_BASE_URL, DEFAULT_RUN_TIMEOUT_MS } from "./config.js";

describe("getConfigSchema", () => {
  it("exposes expected fields sorted as assistantId,baseUrl,runTimeoutMs", () => {
    const schema = getConfigSchema();
    const keys = schema.fields.map((f) => f.key).sort().join(",");
    expect(keys).toBe("assistantId,baseUrl,runTimeoutMs");
  });

  it("defines expected schema types, defaults, and requirements", () => {
    const schema = getConfigSchema();

    const baseUrlField = schema.fields.find((f) => f.key === "baseUrl");
    expect(baseUrlField).toBeDefined();
    expect(baseUrlField?.type).toBe("text");
    expect(baseUrlField?.required).toBe(true);
    expect(baseUrlField?.default).toBe("http://localhost:2024");

    const assistantIdField = schema.fields.find((f) => f.key === "assistantId");
    expect(assistantIdField).toBeDefined();
    expect(assistantIdField?.type).toBe("text");
    expect(assistantIdField?.required).toBe(true);

    const runTimeoutField = schema.fields.find((f) => f.key === "runTimeoutMs");
    expect(runTimeoutField).toBeDefined();
    expect(runTimeoutField?.type).toBe("number");
    expect(runTimeoutField?.default).toBe(120_000);
  });
});

describe("parseLangGraphAdapterConfig", () => {
  it("uses defaults when raw is null, undefined, or empty", () => {
    expect(parseLangGraphAdapterConfig(null)).toEqual({
      baseUrl: DEFAULT_BASE_URL,
      assistantId: "",
      runTimeoutMs: DEFAULT_RUN_TIMEOUT_MS,
    });

    expect(parseLangGraphAdapterConfig(undefined)).toEqual({
      baseUrl: DEFAULT_BASE_URL,
      assistantId: "",
      runTimeoutMs: DEFAULT_RUN_TIMEOUT_MS,
    });

    expect(parseLangGraphAdapterConfig({})).toEqual({
      baseUrl: DEFAULT_BASE_URL,
      assistantId: "",
      runTimeoutMs: DEFAULT_RUN_TIMEOUT_MS,
    });
  });

  it("parses valid config correctly and trims trailing slashes", () => {
    const parsed = parseLangGraphAdapterConfig({
      baseUrl: "http://127.0.0.1:2024///",
      assistantId: "agent-graph-v1",
      runTimeoutMs: 60_000,
    });

    expect(parsed).toEqual({
      baseUrl: "http://127.0.0.1:2024",
      assistantId: "agent-graph-v1",
      runTimeoutMs: 60_000,
    });
  });

  it("parses string runTimeoutMs gracefully", () => {
    const parsed = parseLangGraphAdapterConfig({
      baseUrl: "http://127.0.0.1:2024",
      assistantId: "agent-graph-v1",
      runTimeoutMs: "45000" as unknown as number,
    });

    expect(parsed.runTimeoutMs).toBe(45_000);
  });
});
