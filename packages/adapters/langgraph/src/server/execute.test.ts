import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type {
  AdapterExecutionContext,
  AdapterExecutionResult,
  PaperclipQuestionResponse,
} from "@paperclipai/adapter-utils";
import {
  buildResumePayload,
  execute,
  extractInterrupt,
  toQuestionSet,
} from "./execute.js";
import { testEnvironment } from "./test.js";
import type { LangGraphInterrupt } from "../types.js";

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

  it("tenantId derived only from companyId", async () => {
    let capturedBody = "";
    let capturedCreateHeaders: Record<string, string> = {};
    let capturedRunHeaders: Record<string, string> = {};

    const fetchMock = vi.fn().mockImplementation((input: string | URL | Request, init?: RequestInit) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;

      if (url.endsWith("/threads")) {
        capturedCreateHeaders = (init?.headers as Record<string, string>) || {};
        return Promise.resolve(
          new Response(JSON.stringify({ thread_id: "thread-safe-tenant" }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }),
        );
      }

      if (url.includes("/runs/wait")) {
        capturedRunHeaders = (init?.headers as Record<string, string>) || {};
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
      agent: {
        id: "agent-1",
        companyId: "company-real-tenant",
        name: "Test Agent",
        adapterType: "langgraph",
        adapterConfig: {
          tenantId: "malicious-user-injected-tenant-in-adapter-config",
        },
      },
      config: {
        baseUrl: "http://127.0.0.1:2024",
        assistantId: "assistant-graph-1",
        tenantId: "malicious-user-injected-tenant",
        context: {
          tenant_id: "malicious-user-injected-tenant",
          company_id: "malicious-user-injected-tenant",
        },
        input: {
          tenantId: "malicious-injected-input-tenant",
        },
      },
    });

    const result = await execute(ctx);

    expect(result.exitCode).toBe(0);
    expect(result.sessionParams?.tenantId).toBe("company-real-tenant");
    expect(result.sessionParams?.tenantId).not.toBe("malicious-user-injected-tenant");
    expect(result.sessionParams?.tenantId).not.toBe("malicious-user-injected-tenant-in-adapter-config");

    // Headers must carry strictly companyId as x-tenant-id
    expect(capturedCreateHeaders["x-tenant-id"]).toBe("company-real-tenant");
    expect(capturedRunHeaders["x-tenant-id"]).toBe("company-real-tenant");

    const parsedBody = JSON.parse(capturedBody) as {
      context?: { tenant_id?: string; company_id?: string };
      config?: { configurable?: { tenant_id?: string; company_id?: string } };
    };
    expect(parsedBody.context?.tenant_id).toBe("company-real-tenant");
    expect(parsedBody.context?.company_id).toBe("company-real-tenant");
    expect(parsedBody.config).toBeUndefined();
  });

  it("does not reuse existing thread across different tenants", async () => {
    let createdNewThread = false;

    const fetchMock = vi.fn().mockImplementation((input: string | URL | Request) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;

      if (url.endsWith("/threads")) {
        createdNewThread = true;
        return Promise.resolve(
          new Response(JSON.stringify({ thread_id: "thread-new-tenant" }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }),
        );
      }

      if (url.includes("/runs/wait")) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              status: "success",
              values: { summary: "New thread created for different tenant." },
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
      agent: {
        id: "agent-1",
        companyId: "company-b",
        name: "Tenant B Agent",
        adapterType: "langgraph",
        adapterConfig: {},
      },
      runtime: {
        sessionId: "thread-tenant-a",
        sessionDisplayId: "thread-tenant-a",
        taskKey: null,
        sessionParams: {
          threadId: "thread-tenant-a",
          assistantId: "assistant-graph-1",
          tenantId: "company-a",
        },
      },
    });

    const result = await execute(ctx);

    expect(result.exitCode).toBe(0);
    expect(createdNewThread).toBe(true);
    expect(result.sessionParams?.threadId).toBe("thread-new-tenant");
    expect(result.sessionParams?.tenantId).toBe("company-b");
  });

  it("fails execution cleanly when agent.companyId is missing or empty", async () => {
    const ctx = createTestContext({
      agent: {
        id: "agent-1",
        companyId: "",
        name: "Invalid Agent",
        adapterType: "langgraph",
        adapterConfig: {},
      },
    });

    const result = await execute(ctx);

    expect(result.exitCode).toBe(1);
    expect(result.errorMessage).toContain("companyId");
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

  it("interrupt maps to question in execute result", async () => {
    const fetchMock = vi.fn().mockImplementation((input: string | URL | Request) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;

      if (url.endsWith("/threads")) {
        return Promise.resolve(
          new Response(JSON.stringify({ thread_id: "thread-interrupt-1" }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }),
        );
      }

      if (url.includes("/runs/wait")) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              run_id: "run-lg-interrupt-1",
              thread_id: "thread-interrupt-1",
              status: "interrupted",
              interrupts: [
                {
                  value: {
                    interrupt_id: "int-confirm-deploy",
                    kind: "approval",
                    prompt: "Do you approve deploying to production?",
                    options: [
                      { id: "opt-approve", label: "Approve deploy", description: "Deploy immediately" },
                      { id: "opt-reject", label: "Reject deploy", description: "Do not deploy" },
                    ],
                  },
                },
              ],
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
    expect(result.question).toBeDefined();
    expect(result.question).toEqual({
      prompt: "Do you approve deploying to production?",
      choices: [
        { key: "opt-approve", label: "Approve deploy", description: "Deploy immediately" },
        { key: "opt-reject", label: "Reject deploy", description: "Do not deploy" },
      ],
    });
    expect(result.sessionParams?.threadId).toBe("thread-interrupt-1");
    expect(result.sessionParams?.interruptId).toBe("int-confirm-deploy");
    expect(result.summary).toContain("Do you approve deploying to production?");
  });

  it("runtime_request emitted on interrupt with questionSet v1 schema", async () => {
    const onEventMock = vi.fn().mockResolvedValue(undefined);

    const fetchMock = vi.fn().mockImplementation((input: string | URL | Request) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;

      if (url.endsWith("/threads")) {
        return Promise.resolve(
          new Response(JSON.stringify({ thread_id: "thread-interrupt-2" }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }),
        );
      }

      if (url.includes("/runs/wait")) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              run_id: "run-lg-interrupt-2",
              thread_id: "thread-interrupt-2",
              status: "interrupted",
              interrupt: {
                interrupt_id: "int-runtime-req-1",
                kind: "approval",
                prompt: "Authorize sensitive data export?",
                options: [
                  { id: "yes", label: "Yes" },
                  { id: "no", label: "No" },
                ],
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
      onEvent: onEventMock,
    });
    const result = await execute(ctx);

    expect(result.exitCode).toBe(0);
    expect(onEventMock).toHaveBeenCalledTimes(1);
    const emittedEvent = onEventMock.mock.calls[0][0];
    expect(emittedEvent).toMatchObject({
      eventType: "runtime_request",
      status: "pending",
    });
    const questionSet = emittedEvent.questionSet ?? emittedEvent.payload?.questionSet;
    expect(questionSet).toBeDefined();
    expect(questionSet.schema).toBe("paperclip.question_set.v1");
    expect(questionSet.questions).toHaveLength(1);
    expect(questionSet.questions[0].id).toBe("int-runtime-req-1");
    expect(questionSet.questions[0].prompt).toBe("Authorize sensitive data export?");
    expect(questionSet.questions[0].required).toBe(true);
    expect(questionSet.questions[0].answerMode).toBe("single_select");
    expect(questionSet.questions[0].options).toEqual([
      { id: "yes", label: "Yes" },
      { id: "no", label: "No" },
    ]);
  });

  it("handles interrupted run with missing interrupt payload gracefully", async () => {
    const fetchMock = vi.fn().mockImplementation((input: string | URL | Request) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;

      if (url.endsWith("/threads")) {
        return Promise.resolve(
          new Response(JSON.stringify({ thread_id: "thread-missing-payload" }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }),
        );
      }

      if (url.includes("/runs/wait")) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              run_id: "run-lg-empty-interrupt",
              thread_id: "thread-missing-payload",
              status: "interrupted",
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
    expect(result.errorMessage).toContain("not contain a valid interrupt");
    expect(result.sessionParams?.threadId).toBe("thread-missing-payload");
  });

  it("resumes run carrying Command(resume=payload) when approval_approved wake occurs", async () => {
    let capturedBody = "";
    let capturedUrl = "";

    const fetchMock = vi.fn().mockImplementation((input: string | URL | Request, init?: RequestInit) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
      capturedUrl = url;
      if (init?.body) {
        capturedBody = init.body.toString();
      }

      if (url.includes("/runs/wait")) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              run_id: "run-resumed-1",
              thread_id: "thread-resume-hitl",
              status: "success",
              values: {
                release_decision: "approved",
                status: "released",
                summary: "Cryptographic release executed successfully after approval.",
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
        sessionId: "thread-resume-hitl",
        sessionDisplayId: "thread-resume-hitl",
        taskKey: "task-abc",
        sessionParams: {
          threadId: "thread-resume-hitl",
          assistantId: "assistant-graph-1",
          tenantId: "company-real-tenant",
          interruptId: "int-exec-approval",
          pendingResume: {
            interruptId: "int-exec-approval",
            requestId: "req-approval-1",
          },
        },
      },
      context: {
        taskId: "task-abc",
        wakeReason: "approval_approved",
        approvalId: "approval-uuid-1",
        approvalStatus: "approved",
      },
    });

    const result = await execute(ctx);

    expect(result.exitCode).toBe(0);
    expect(result.summary).toContain("Cryptographic release executed successfully");
    expect(capturedUrl).toContain("/threads/thread-resume-hitl/runs/wait");

    const parsedBody = JSON.parse(capturedBody) as {
      assistant_id?: string;
      command?: { resume?: { action?: string } };
      input?: unknown;
    };
    expect(parsedBody.assistant_id).toBe("assistant-graph-1");
    expect(parsedBody.command?.resume?.action).toBe("approve");
    expect(parsedBody.input).toBeUndefined();

    // pendingResume is cleared from sessionParams upon successful resume completion
    expect(result.sessionParams?.pendingResume).toBeUndefined();
    expect(result.sessionParams?.threadId).toBe("thread-resume-hitl");
  });

  it("resumes run with answer response from paperclip question response", async () => {
    let capturedBody = "";

    const fetchMock = vi.fn().mockImplementation((input: string | URL | Request, init?: RequestInit) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
      if (init?.body) {
        capturedBody = init.body.toString();
      }

      if (url.includes("/runs/wait")) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              run_id: "run-resumed-2",
              thread_id: "thread-resume-answer",
              status: "success",
              values: {
                output: "Exception approved and processed.",
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

    const questionResponse: PaperclipQuestionResponse = {
      schema: "paperclip.question_response.v1",
      answers: {
        "int-exception-1": {
          selectedOptionIds: ["approve_exception"],
        },
      },
    };

    const ctx = createTestContext({
      runtime: {
        sessionId: "thread-resume-answer",
        sessionDisplayId: "thread-resume-answer",
        taskKey: "task-abc",
        sessionParams: {
          threadId: "thread-resume-answer",
          assistantId: "assistant-graph-1",
          tenantId: "company-real-tenant",
          interruptId: "int-exception-1",
          pendingResume: {
            interruptId: "int-exception-1",
            requestId: "int-exception-1",
          },
        },
      },
      context: {
        taskId: "task-abc",
        response: questionResponse,
      },
    });

    const result = await execute(ctx);

    expect(result.exitCode).toBe(0);
    const parsedBody = JSON.parse(capturedBody) as {
      command?: { resume?: { action?: string } };
    };
    expect(parsedBody.command?.resume?.action).toBe("approve_exception");
  });

  it("rejects resume attempt when resume-token is invalid or missing", async () => {
    const fetchMock = vi.fn();
    globalThis.fetch = fetchMock;

    // Has approval context but sessionParams has no interruptId or pendingResume
    const ctx = createTestContext({
      runtime: {
        sessionId: "thread-no-token",
        sessionDisplayId: "thread-no-token",
        taskKey: "task-abc",
        sessionParams: {
          threadId: "thread-no-token",
          assistantId: "assistant-graph-1",
          tenantId: "company-real-tenant",
        },
      },
      context: {
        taskId: "task-abc",
        wakeReason: "approval_approved",
        approvalId: "approval-xyz",
        approvalStatus: "approved",
      },
    });

    const result = await execute(ctx);

    expect(result.exitCode).toBe(1);
    expect(result.errorMessage).toContain("missing or invalid resume-token");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("toQuestionSet() and extractInterrupt()", () => {
  it("approval kind maps single_select in toQuestionSet", () => {
    const approvalInterrupt: LangGraphInterrupt = {
      interrupt_id: "int-approval-mode",
      kind: "approval",
      prompt: "Approve release v1.0?",
      options: [
        { id: "approve", label: "Approve" },
        { id: "reject", label: "Reject" },
      ],
    };

    const questionSet = toQuestionSet(approvalInterrupt);

    expect(questionSet.schema).toBe("paperclip.question_set.v1");
    expect(questionSet.questions).toHaveLength(1);
    expect(questionSet.questions[0].id).toBe("int-approval-mode");
    expect(questionSet.questions[0].prompt).toBe("Approve release v1.0?");
    expect(questionSet.questions[0].required).toBe(true);
    expect(questionSet.questions[0].answerMode).toBe("single_select");
    expect(questionSet.questions[0].options).toEqual([
      { id: "approve", label: "Approve" },
      { id: "reject", label: "Reject" },
    ]);
  });

  it("input kind maps to text mode without options", () => {
    const inputInterrupt: LangGraphInterrupt = {
      interrupt_id: "int-text-input",
      kind: "input",
      prompt: "Please provide your API secret token",
      options: [],
    };

    const questionSet = toQuestionSet(inputInterrupt);

    expect(questionSet.schema).toBe("paperclip.question_set.v1");
    expect(questionSet.questions).toHaveLength(1);
    expect(questionSet.questions[0].id).toBe("int-text-input");
    expect(questionSet.questions[0].prompt).toBe("Please provide your API secret token");
    expect(questionSet.questions[0].required).toBe(true);
    expect(questionSet.questions[0].answerMode).toBe("text");
    expect(questionSet.questions[0].options).toBeUndefined();
  });

  it("elicitation kind maps to single_select with options and text without options", () => {
    const elicitationWithOptions: LangGraphInterrupt = {
      interrupt_id: "int-elicit-1",
      kind: "elicitation",
      prompt: "Select target cloud environment",
      options: [
        { id: "aws", label: "Amazon Web Services" },
        { id: "gcp", label: "Google Cloud Platform" },
      ],
    };

    const qSetWithOptions = toQuestionSet(elicitationWithOptions);
    expect(qSetWithOptions.questions[0].answerMode).toBe("single_select");
    expect(qSetWithOptions.questions[0].options).toHaveLength(2);

    const elicitationWithoutOptions: LangGraphInterrupt = {
      interrupt_id: "int-elicit-2",
      kind: "elicitation",
      prompt: "Specify the database connection string",
      options: [],
    };

    const qSetWithoutOptions = toQuestionSet(elicitationWithoutOptions);
    expect(qSetWithoutOptions.questions[0].answerMode).toBe("text");
    expect(qSetWithoutOptions.questions[0].options).toBeUndefined();
  });

  it("strictly preserves payload options and never invents options", () => {
    const singleOptionInterrupt: LangGraphInterrupt = {
      interrupt_id: "int-exact-opts",
      kind: "approval",
      prompt: "Confirm one-way wipe?",
      options: [
        { id: "proceed", label: "Proceed with wipe", description: "Irreversible operation" },
      ],
    };

    const qSet = toQuestionSet(singleOptionInterrupt);
    expect(qSet.questions[0].options).toHaveLength(1);
    expect(qSet.questions[0].options?.[0]).toEqual({
      id: "proceed",
      label: "Proceed with wipe",
      description: "Irreversible operation",
    });
    // Confirm no invented default options (like cancel or reject)
    expect(qSet.questions[0].options?.some((o) => o.id === "cancel" || o.id === "reject")).toBe(false);
  });

  it("extracts interrupt from tasks structure", () => {
    const responseWithTasks = {
      run_id: "run-tasks-1",
      thread_id: "thread-tasks",
      status: "interrupted",
      tasks: [
        {
          id: "task-sub-1",
          interrupts: [
            {
              value: {
                interrupt_id: "int-task-nested",
                kind: "approval" as const,
                prompt: "Approval in nested graph task",
                options: [{ id: "ok", label: "OK" }],
              },
            },
          ],
        },
      ],
    };

    const extracted = extractInterrupt(responseWithTasks);
    expect(extracted).not.toBeNull();
    expect(extracted?.interrupt_id).toBe("int-task-nested");
    expect(extracted?.kind).toBe("approval");
    expect(extracted?.prompt).toBe("Approval in nested graph task");
    expect(extracted?.options).toEqual([{ id: "ok", label: "OK" }]);
  });

  it("extractInterrupt returns null for non-interrupt runs", () => {
    expect(extractInterrupt({ status: "success", values: { summary: "Done" } })).toBeNull();
    expect(extractInterrupt({ status: "error", error: "Failed" })).toBeNull();
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

describe("buildResumePayload", () => {
  it("answer builds deterministic resume payload", () => {
    // 1. Approval kind with selected option
    const approvalInterrupt: LangGraphInterrupt = {
      interrupt_id: "int-approval-1",
      kind: "approval",
      prompt: "Approve executive release?",
      options: [
        { id: "approve", label: "Approve release" },
        { id: "reject", label: "Reject release" },
      ],
    };

    const approveResponse: PaperclipQuestionResponse = {
      schema: "paperclip.question_response.v1",
      answers: {
        "int-approval-1": {
          selectedOptionIds: ["approve"],
        },
      },
    };

    const approvePayload = buildResumePayload(approveResponse, approvalInterrupt);
    expect(approvePayload).toEqual({ action: "approve" });

    const rejectResponse: PaperclipQuestionResponse = {
      schema: "paperclip.question_response.v1",
      answers: {
        "int-approval-1": {
          selectedOptionIds: ["reject"],
        },
      },
    };

    const rejectPayload = buildResumePayload(rejectResponse, approvalInterrupt);
    expect(rejectPayload).toEqual({ action: "reject" });

    // 2. Exception approval action
    const exceptionResponse: PaperclipQuestionResponse = {
      schema: "paperclip.question_response.v1",
      answers: {
        "int-approval-1": {
          selectedOptionIds: ["approve_exception"],
        },
      },
    };
    const exceptionPayload = buildResumePayload(exceptionResponse, approvalInterrupt);
    expect(exceptionPayload).toEqual({ action: "approve_exception" });

    // 3. Input kind with text
    const inputInterrupt: LangGraphInterrupt = {
      interrupt_id: "int-input-secret",
      kind: "input",
      prompt: "Enter cryptographic signing key",
      options: [],
    };

    const inputResponse: PaperclipQuestionResponse = {
      schema: "paperclip.question_response.v1",
      answers: {
        "int-input-secret": {
          text: "sec-key-998877",
        },
      },
    };

    const inputPayload = buildResumePayload(inputResponse, inputInterrupt);
    expect(inputPayload).toEqual({
      action: "sec-key-998877",
      text: "sec-key-998877",
      value: "sec-key-998877",
    });

    // 4. Elicitation kind
    const elicitInterrupt: LangGraphInterrupt = {
      interrupt_id: "int-elicit-1",
      kind: "elicitation",
      prompt: "Select cloud region and cluster name",
      options: [
        { id: "us-east-1", label: "US East (N. Virginia)" },
        { id: "sa-east-1", label: "South America (Sao Paulo)" },
      ],
    };

    const elicitResponse: PaperclipQuestionResponse = {
      schema: "paperclip.question_response.v1",
      answers: {
        "int-elicit-1": {
          selectedOptionIds: ["sa-east-1"],
          customText: "cluster-fenix-prod",
        },
      },
    };

    const elicitPayload = buildResumePayload(elicitResponse, elicitInterrupt);
    expect(elicitPayload).toEqual({
      action: "sa-east-1",
      customText: "cluster-fenix-prod",
      value: "cluster-fenix-prod",
    });

    // 5. Strict determinism check across 100 runs
    const baseline = JSON.stringify(buildResumePayload(elicitResponse, elicitInterrupt));
    for (let i = 0; i < 100; i++) {
      const current = JSON.stringify(buildResumePayload(elicitResponse, elicitInterrupt));
      expect(current).toBe(baseline);
    }

    // Key ordering must be strictly alphabetical
    const keys = Object.keys(elicitPayload);
    const sortedKeys = [...keys].sort();
    expect(keys).toEqual(sortedKeys);
  });
});
