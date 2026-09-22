import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type {
  AdapterExecutionContext,
  AdapterExecutionResult,
} from "@paperclipai/adapter-utils";
import { execute } from "./execute.js";
import { testEnvironment } from "./test.js";
import { sessionCodec } from "./session.js";
import { getConfigSchema } from "./config.js";

describe("execute()", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  function createTestContext(
    overrides?: Partial<AdapterExecutionContext>,
  ): AdapterExecutionContext {
    return {
      runId: "run-123",
      agent: {
        id: "agent-1",
        companyId: "company-real-tenant",
        name: "Test LangGraph Agent",
        adapterType: "langgraph",
        adapterConfig: {},
      },
      runtime: {
        sessionId: null,
        sessionParams: null,
        sessionDisplayId: null,
        taskKey: null,
      },
      config: {
        baseUrl: "http://127.0.0.1:2024",
        assistantId: "assistant-graph-1",
      },
      context: {
        taskId: "task-abc",
        wakeReason: "manual",
      },
      onLog: vi.fn().mockResolvedValue(undefined),
      onMeta: vi.fn().mockResolvedValue(undefined),
      ...overrides,
    };
  }

  it("creates a new thread and completes a blocking wait run successfully", async () => {
    const fetchMock = vi.fn().mockImplementation((input: string | URL | Request) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;

      if (url.endsWith("/threads")) {
        return Promise.resolve(
          new Response(JSON.stringify({ thread_id: "thread-uuid-1234" }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }),
        );
      }

      if (url.includes("/threads/thread-uuid-1234/runs/wait")) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              run_id: "run-lg-1",
              thread_id: "thread-uuid-1234",
              status: "success",
              values: {
                summary: "LangGraph run succeeded with full output.",
              },
              usage: {
                input_tokens: 150,
                output_tokens: 75,
              },
            }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" },
            },
          ),
        );
      }

      return Promise.resolve(new Response("Not found", { status: 404 }));
    });

    globalThis.fetch = fetchMock;

    const ctx = createTestContext();
    const result = await execute(ctx);

    expect(result.exitCode).toBe(0);
    expect(result.timedOut).toBe(false);
    expect(result.provider).toBe("langgraph");
    expect(result.summary).toBe("LangGraph run succeeded with full output.");
    expect(result.usage).toEqual({
      inputTokens: 150,
      outputTokens: 75,
      cachedInputTokens: undefined,
    });
    expect(result.sessionParams).toEqual({
      threadId: "thread-uuid-1234",
      assistantId: "assistant-graph-1",
      tenantId: "company-real-tenant",
    });

    expect(ctx.onLog).toHaveBeenCalledWith(
      "stdout",
      expect.stringContaining("thread-uuid-1234"),
    );
  });

  it("sessionParams persists threadId across runs", async () => {
    const executedUrls: string[] = [];

    const fetchMock = vi.fn().mockImplementation((input: string | URL | Request) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
      executedUrls.push(url);

      if (url.includes("/threads/persisted-thread-999/runs/wait")) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              run_id: "run-lg-2",
              thread_id: "persisted-thread-999",
              status: "success",
              values: {
                summary: "Second heartbeat reuse verified.",
              },
            }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" },
            },
          ),
        );
      }

      return Promise.resolve(new Response("Not found", { status: 404 }));
    });

    globalThis.fetch = fetchMock;

    const ctx = createTestContext({
      runtime: {
        sessionId: "persisted-thread-999",
        sessionDisplayId: "persisted-thread-999",
        taskKey: null,
        sessionParams: {
          threadId: "persisted-thread-999",
          assistantId: "assistant-graph-1",
          tenantId: "company-real-tenant",
        },
      },
    });

    const result = await execute(ctx);

    expect(result.exitCode).toBe(0);
    expect(result.sessionParams?.threadId).toBe("persisted-thread-999");
    expect(result.sessionParams?.tenantId).toBe("company-real-tenant");
    // Ensure POST /threads was NOT called because thread was reused
    expect(executedUrls.some((u) => u.endsWith("/threads"))).toBe(false);
    expect(executedUrls.some((u) => u.includes("/runs/wait"))).toBe(true);
  });

  it("never derives tenantId from user config", async () => {
    let capturedBody = "";

    const fetchMock = vi.fn().mockImplementation((input: string | URL | Request, init?: RequestInit) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;

      if (url.endsWith("/threads")) {
        return Promise.resolve(
          new Response(JSON.stringify({ thread_id: "thread-safe-tenant" }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }),
        );
      }

      if (url.includes("/runs/wait")) {
        capturedBody = typeof init?.body === "string" ? init.body : "";
        return Promise.resolve(
          new Response(
            JSON.stringify({
              status: "success",
              values: { summary: "Tenant isolated." },
            }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" },
            },
          ),
        );
      }

      return Promise.resolve(new Response("Not found", { status: 404 }));
    });

    globalThis.fetch = fetchMock;

    const ctx = createTestContext({
      config: {
        baseUrl: "http://127.0.0.1:2024",
        assistantId: "assistant-graph-1",
        tenantId: "malicious-user-injected-tenant",
      },
    });

    const result = await execute(ctx);

    expect(result.sessionParams?.tenantId).toBe("company-real-tenant");
    expect(result.sessionParams?.tenantId).not.toBe("malicious-user-injected-tenant");

    const parsedBody = JSON.parse(capturedBody) as {
      config?: { configurable?: { tenant_id?: string; company_id?: string } };
    };
    expect(parsedBody.config?.configurable?.tenant_id).toBe("company-real-tenant");
    expect(parsedBody.config?.configurable?.company_id).toBe("company-real-tenant");
  });

  it("fails gracefully when assistantId is missing", async () => {
    const ctx = createTestContext({
      config: {
        baseUrl: "http://127.0.0.1:2024",
      },
    });

    const result = await execute(ctx);

    expect(result.exitCode).toBe(1);
    expect(result.errorMessage).toContain("assistantId");
  });

  it("handles LangGraph error response cleanly", async () => {
    const fetchMock = vi.fn().mockImplementation((input: string | URL | Request) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;

      if (url.endsWith("/threads")) {
        return Promise.resolve(
          new Response(JSON.stringify({ thread_id: "thread-err" }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }),
        );
      }

      if (url.includes("/runs/wait")) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              status: "error",
              error: "Graph node execution failed: division by zero",
            }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" },
            },
          ),
        );
      }

      return Promise.resolve(new Response("Not found", { status: 404 }));
    });

    globalThis.fetch = fetchMock;

    const ctx = createTestContext();
    const result = await execute(ctx);

    expect(result.exitCode).toBe(1);
    expect(result.errorMessage).toContain("division by zero");
    expect(result.sessionParams?.threadId).toBe("thread-err");
  });

  it("handles timeout correctly", async () => {
    const fetchMock = vi.fn().mockImplementation((input: string | URL | Request, init?: RequestInit) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;

      if (url.endsWith("/threads")) {
        return Promise.resolve(
          new Response(JSON.stringify({ thread_id: "thread-to" }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }),
        );
      }

      return new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => {
          const err = new Error("This operation was aborted");
          err.name = "AbortError";
          reject(err);
        });
      });
    });

    globalThis.fetch = fetchMock;

    const ctx = createTestContext({
      config: {
        baseUrl: "http://127.0.0.1:2024",
        assistantId: "assistant-graph-1",
        runTimeoutMs: 50,
      },
    });

    const result = await execute(ctx);

    expect(result.timedOut).toBe(true);
    expect(result.errorMessage).toContain("timed out after 50ms");
  });
});

describe("testEnvironment()", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("passes when server is reachable and assistant exists", async () => {
    globalThis.fetch = vi.fn().mockImplementation((input: string | URL | Request) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;

      if (url.endsWith("/ok")) {
        return Promise.resolve(new Response(JSON.stringify({ ok: true }), { status: 200 }));
      }
      if (url.includes("/assistants/my-assistant/graph")) {
        return Promise.resolve(new Response(JSON.stringify({ nodes: [], edges: [] }), { status: 200 }));
      }
      return Promise.resolve(new Response("Not found", { status: 404 }));
    });

    const res = await testEnvironment({
      companyId: "comp-1",
      adapterType: "langgraph",
      config: {
        baseUrl: "http://127.0.0.1:2024",
        assistantId: "my-assistant",
      },
    });

    expect(res.status).toBe("pass");
    expect(res.checks.some((c) => c.code === "LANGGRAPH_SERVER_REACHABLE")).toBe(true);
    expect(res.checks.some((c) => c.code === "LANGGRAPH_ASSISTANT_VERIFIED")).toBe(true);
  });

  it("fails when server is unreachable", async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error("connect ECONNREFUSED 127.0.0.1:2024"));

    const res = await testEnvironment({
      companyId: "comp-1",
      adapterType: "langgraph",
      config: {
        baseUrl: "http://127.0.0.1:2024",
        assistantId: "my-assistant",
      },
    });

    expect(res.status).toBe("fail");
    expect(res.checks.some((c) => c.code === "LANGGRAPH_SERVER_UNREACHABLE")).toBe(true);
  });

  it("reports error when assistantId is missing", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }));

    const res = await testEnvironment({
      companyId: "comp-1",
      adapterType: "langgraph",
      config: {
        baseUrl: "http://127.0.0.1:2024",
      },
    });

    expect(res.status).toBe("fail");
    expect(res.checks.some((c) => c.code === "LANGGRAPH_CONFIG_ASSISTANT_ID_MISSING")).toBe(true);
  });
});

describe("sessionCodec", () => {
  it("sessionCodec round-trip preserves all fields", () => {
    const original = {
      threadId: "thread-abc",
      assistantId: "assistant-xyz",
      tenantId: "company-123",
    };

    const serialized = sessionCodec.serialize(original);
    expect(serialized).toEqual(original);

    const deserialized = sessionCodec.deserialize(serialized);
    expect(deserialized).toEqual(original);
  });

  it("sessionCodec rejects malformed payloads returning null", () => {
    expect(sessionCodec.deserialize(null)).toBeNull();
    expect(sessionCodec.deserialize("not an object")).toBeNull();
    expect(sessionCodec.deserialize({})).toBeNull();
    expect(
      sessionCodec.deserialize({
        threadId: "only-thread",
      }),
    ).toBeNull();
    expect(
      sessionCodec.deserialize({
        threadId: "thread",
        assistantId: "",
        tenantId: "tenant",
      }),
    ).toBeNull();
  });

  it("getDisplayId returns threadId", () => {
    expect(
      sessionCodec.getDisplayId?.({
        threadId: "th-display-1",
        assistantId: "as-1",
        tenantId: "ten-1",
      }),
    ).toBe("th-display-1");

    expect(sessionCodec.getDisplayId?.(null)).toBeNull();
  });
});

describe("getConfigSchema", () => {
  it("exposes expected fields sorted as assistantId,baseUrl,runTimeoutMs", () => {
    const schema = getConfigSchema();
    const keys = schema.fields.map((f) => f.key).sort().join(",");
    expect(keys).toBe("assistantId,baseUrl,runTimeoutMs");
  });
});
