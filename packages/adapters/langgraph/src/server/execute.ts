import type {
  AdapterExecutionContext,
  AdapterExecutionResult,
  AdapterRuntimeEvent,
  PaperclipQuestionResponse,
  UsageSummary,
} from "@paperclipai/adapter-utils";
import type {
  JsonValue,
  LangGraphInterrupt,
  LangGraphRunRequest,
  LangGraphRunResponse,
  LangGraphSessionParams,
  LangGraphThreadResponse,
} from "../types.js";
import { parseLangGraphAdapterConfig } from "./config.js";
import {
  buildResumePayload,
  extractInterrupt,
  parseLangGraphInterrupt,
  toQuestionSet,
} from "./interrupt.js";

export {
  buildResumePayload,
  extractInterrupt,
  parseLangGraphInterrupt,
  toQuestionSet,
};

function extractUsage(runResponse: LangGraphRunResponse): UsageSummary | undefined {
  if (!runResponse.usage) return undefined;
  const inTokens =
    runResponse.usage.inputTokens ?? runResponse.usage.input_tokens ?? 0;
  const outTokens =
    runResponse.usage.outputTokens ?? runResponse.usage.output_tokens ?? 0;
  const cachedTokens =
    runResponse.usage.cachedInputTokens ??
    runResponse.usage.cached_input_tokens;

  if (inTokens > 0 || outTokens > 0) {
    return {
      inputTokens: inTokens,
      outputTokens: outTokens,
      cachedInputTokens: cachedTokens,
    };
  }
  return undefined;
}

function extractSummary(runResponse: LangGraphRunResponse): string {
  if (runResponse.values && typeof runResponse.values === "object") {
    const vals = runResponse.values;
    if (typeof vals.summary === "string" && vals.summary.trim().length > 0) {
      return vals.summary.trim();
    }
    if (typeof vals.output === "string" && vals.output.trim().length > 0) {
      return vals.output.trim();
    }
    if (Array.isArray(vals.messages) && vals.messages.length > 0) {
      const lastMsg = vals.messages[vals.messages.length - 1];
      if (
        lastMsg &&
        typeof lastMsg === "object" &&
        !Array.isArray(lastMsg) &&
        typeof lastMsg.content === "string"
      ) {
        return lastMsg.content.trim();
      }
    }
  }
  return "LangGraph run completed successfully.";
}

export async function execute(
  ctx: AdapterExecutionContext,
): Promise<AdapterExecutionResult> {
  const config = parseLangGraphAdapterConfig(ctx.config);

  if (!config.assistantId) {
    const errorMsg =
      "Missing required assistantId in LangGraph adapter configuration";
    await ctx.onLog("stderr", `[langgraph] ${errorMsg}\n`);
    return {
      exitCode: 1,
      signal: null,
      timedOut: false,
      provider: "langgraph",
      errorMessage: errorMsg,
    };
  }

  // Tenant ID is strictly derived from agent.companyId, never from user config
  const tenantId = ctx.agent.companyId;

  // Resolve existing thread or create a new one
  let threadId: string | null = null;
  if (
    ctx.runtime.sessionParams &&
    typeof ctx.runtime.sessionParams.threadId === "string" &&
    ctx.runtime.sessionParams.threadId.trim().length > 0
  ) {
    const storedTenantId =
      typeof ctx.runtime.sessionParams.tenantId === "string"
        ? ctx.runtime.sessionParams.tenantId.trim()
        : null;
    const storedAssistantId =
      typeof ctx.runtime.sessionParams.assistantId === "string"
        ? ctx.runtime.sessionParams.assistantId.trim()
        : null;

    if (
      (!storedTenantId || storedTenantId === tenantId) &&
      (!storedAssistantId || storedAssistantId === config.assistantId)
    ) {
      threadId = ctx.runtime.sessionParams.threadId.trim();
    }
  }

  if (!threadId) {
    const rawCtxApprovalPayload =
      ctx.context.approvalPayload && typeof ctx.context.approvalPayload === "object"
        ? (ctx.context.approvalPayload as Record<string, unknown>)
        : null;
    const rawResumeParams =
      ctx.context.resumeSessionParams && typeof ctx.context.resumeSessionParams === "object"
        ? (ctx.context.resumeSessionParams as Record<string, unknown>)
        : null;
    const candidateId =
      (typeof ctx.runtime.sessionParams?.sessionId === "string" && ctx.runtime.sessionParams.sessionId.trim()) ||
      (typeof ctx.runtime.sessionDisplayId === "string" && ctx.runtime.sessionDisplayId.trim()) ||
      (typeof ctx.runtime.sessionId === "string" && ctx.runtime.sessionId.trim()) ||
      (typeof ctx.context.threadId === "string" && ctx.context.threadId.trim()) ||
      (typeof rawCtxApprovalPayload?.threadId === "string" && (rawCtxApprovalPayload.threadId as string).trim()) ||
      (typeof rawResumeParams?.threadId === "string" && (rawResumeParams.threadId as string).trim()) ||
      null;
    if (candidateId) {
      threadId = candidateId;
    }
  }

  if (!threadId) {
    try {
      const createThreadRes = await fetch(`${config.baseUrl}/threads`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          metadata: {
            company_id: tenantId,
            agent_id: ctx.agent.id,
          },
        }),
        signal: ctx.signal ? ctx.signal : AbortSignal.timeout(15_000),
      });

      if (!createThreadRes.ok) {
        const errText = await createThreadRes.text();
        const msg = `Failed to create LangGraph thread: HTTP ${createThreadRes.status} ${errText}`;
        await ctx.onLog("stderr", `[langgraph] ${msg}\n`);
        return {
          exitCode: 1,
          signal: null,
          timedOut: false,
          provider: "langgraph",
          errorMessage: msg,
        };
      }

      const threadData =
        (await createThreadRes.json()) as LangGraphThreadResponse;
      if (!threadData || typeof threadData.thread_id !== "string") {
        const msg = "Invalid thread response from LangGraph server: missing thread_id";
        await ctx.onLog("stderr", `[langgraph] ${msg}\n`);
        return {
          exitCode: 1,
          signal: null,
          timedOut: false,
          provider: "langgraph",
          errorMessage: msg,
        };
      }

      threadId = threadData.thread_id;
    } catch (err) {
      const msg = `Network error creating LangGraph thread: ${err instanceof Error ? err.message : String(err)}`;
      await ctx.onLog("stderr", `[langgraph] ${msg}\n`);
      return {
        exitCode: 1,
        signal: null,
        timedOut: false,
        provider: "langgraph",
        errorMessage: msg,
      };
    }
  }

  const sessionParams: LangGraphSessionParams = {
    threadId,
    assistantId: config.assistantId,
    tenantId,
  };

  const rawApprovalPayload =
    ctx.context.approvalPayload && typeof ctx.context.approvalPayload === "object"
      ? (ctx.context.approvalPayload as Record<string, unknown>)
      : null;
  const rawContextResumeParams =
    ctx.context.resumeSessionParams && typeof ctx.context.resumeSessionParams === "object"
      ? (ctx.context.resumeSessionParams as Record<string, unknown>)
      : null;
  const rawPendingResume: { interruptId?: unknown; requestId?: unknown } | null =
    (ctx.runtime.sessionParams?.pendingResume &&
      typeof ctx.runtime.sessionParams.pendingResume === "object"
      ? (ctx.runtime.sessionParams.pendingResume as { interruptId?: unknown; requestId?: unknown })
      : null) ??
    (rawContextResumeParams?.pendingResume &&
      typeof rawContextResumeParams.pendingResume === "object"
      ? (rawContextResumeParams.pendingResume as { interruptId?: unknown; requestId?: unknown })
      : null);
  const pendingInterruptId =
    (typeof rawPendingResume?.interruptId === "string" && rawPendingResume.interruptId.trim()) ||
    (typeof ctx.runtime.sessionParams?.interruptId === "string" && ctx.runtime.sessionParams.interruptId.trim()) ||
    (typeof ctx.context.interruptId === "string" && ctx.context.interruptId.trim()) ||
    (typeof rawApprovalPayload?.interruptId === "string" && (rawApprovalPayload.interruptId as string).trim()) ||
    (typeof rawContextResumeParams?.interruptId === "string" && (rawContextResumeParams.interruptId as string).trim()) ||
    null;
  const wakeReason = typeof ctx.context.wakeReason === "string" ? ctx.context.wakeReason.trim() : "";
  const approvalStatus = typeof ctx.context.approvalStatus === "string" ? ctx.context.approvalStatus.trim() : "";
  const hasApprovalContext =
    wakeReason === "approval_approved" ||
    wakeReason === "approval_rejected" ||
    approvalStatus === "approved" ||
    approvalStatus === "rejected" ||
    typeof ctx.context.approvalId === "string";

  const hasExplicitResponse =
    Boolean(ctx.context.response) ||
    Boolean(ctx.config.response) ||
    Boolean(ctx.context.resumePayload) ||
    Boolean(ctx.config.resumePayload) ||
    Boolean(ctx.context.action) ||
    Boolean(ctx.config.action) ||
    Boolean(ctx.context.command) ||
    Boolean(ctx.config.command) ||
    (Array.isArray(ctx.executionContinuation?.humanResponses) &&
      ctx.executionContinuation.humanResponses.length > 0) ||
    ctx.context.interactionStatus === "answered" ||
    ctx.context.isResume === true ||
    ctx.config.isResume === true;

  const isResumeAttempt =
    hasApprovalContext ||
    hasExplicitResponse ||
    (pendingInterruptId !== null && (ctx.context.resume === true || ctx.config.resume === true));

  if (isResumeAttempt) {
    if (!threadId || !pendingInterruptId) {
      const msg =
        "Cannot resume LangGraph run: missing or invalid resume-token (threadId and interrupt_id required)";
      await ctx.onLog("stderr", `[langgraph] ${msg}\n`);
      return {
        exitCode: 1,
        signal: null,
        timedOut: false,
        provider: "langgraph",
        errorMessage: msg,
        sessionParams: {
          threadId: threadId ?? "",
          assistantId: config.assistantId,
          tenantId,
        },
      };
    }
  }

  let resumePayload: Record<string, unknown> | null = null;
  if (isResumeAttempt) {
    const rawResponse = (ctx.context.response ?? ctx.config.response) as
      | PaperclipQuestionResponse
      | undefined;

    if (rawResponse && typeof rawResponse === "object" && rawResponse.answers) {
      const interruptObj: LangGraphInterrupt = (ctx.context.interrupt as LangGraphInterrupt) ?? {
        interrupt_id: pendingInterruptId!,
        kind: "approval",
        prompt: "",
        options: [],
      };
      resumePayload = buildResumePayload(rawResponse, interruptObj);
    } else if (ctx.context.resumePayload || ctx.config.resumePayload) {
      resumePayload = (ctx.context.resumePayload ?? ctx.config.resumePayload) as Record<string, unknown>;
    } else if (
      (ctx.context.command as { resume?: Record<string, unknown> })?.resume ||
      (ctx.config.command as { resume?: Record<string, unknown> })?.resume
    ) {
      resumePayload = (
        (ctx.context.command as { resume?: Record<string, unknown> })?.resume ??
        (ctx.config.command as { resume?: Record<string, unknown> })?.resume
      )!;
    } else if (hasApprovalContext) {
      if (wakeReason === "approval_rejected" || approvalStatus === "rejected") {
        resumePayload = { action: "reject" };
      } else {
        const approvalPayload = ctx.context.approvalPayload as Record<string, unknown> | undefined;
        const action = typeof approvalPayload?.action === "string" ? approvalPayload.action : "approve";
        resumePayload = { action };
      }
    } else if (ctx.context.action || ctx.config.action) {
      resumePayload = { action: String(ctx.context.action ?? ctx.config.action) };
    } else {
      resumePayload = { action: "approve" };
    }
  }

  const inputPayload: Record<string, JsonValue> = {};
  if (
    ctx.config.input &&
    typeof ctx.config.input === "object" &&
    !Array.isArray(ctx.config.input)
  ) {
    const rawInput = ctx.config.input as Record<string, JsonValue>;
    for (const [k, v] of Object.entries(rawInput)) {
      inputPayload[k] = v;
    }
  }

  if (typeof ctx.context.taskId === "string") {
    inputPayload.task_id = ctx.context.taskId;
  }
  if (typeof ctx.context.issueId === "string") {
    inputPayload.issue_id = ctx.context.issueId;
  }
  if (typeof ctx.context.wakeReason === "string") {
    inputPayload.wake_reason = ctx.context.wakeReason;
  }
  if (ctx.runId) {
    inputPayload.run_id = ctx.runId;
  }

  const requestContext: Record<string, JsonValue> = {
    ...(ctx.config.context && typeof ctx.config.context === "object" && !Array.isArray(ctx.config.context)
      ? (ctx.config.context as Record<string, JsonValue>)
      : {}),
    tenant_id: tenantId,
    company_id: tenantId,
    agent_id: ctx.agent.id,
    project_id:
      ((ctx.config.context as Record<string, JsonValue>)?.project_id as string) ??
      ((ctx.config.input as Record<string, JsonValue>)?.project_id as string) ??
      tenantId,
    principal_id:
      ((ctx.config.context as Record<string, JsonValue>)?.principal_id as string) ??
      ctx.agent.id,
    ...(ctx.runId ? { run_id: ctx.runId } : {}),
  };

  if (!inputPayload.tenant_id) {
    inputPayload.tenant_id = tenantId;
  }
  if (!inputPayload.project_id) {
    inputPayload.project_id = (requestContext.project_id as string) ?? tenantId;
  }
  if (!inputPayload.run_id && ctx.runId) {
    inputPayload.run_id = ctx.runId;
  }
  if (!inputPayload.thread_id) {
    inputPayload.thread_id = `${tenantId}:${inputPayload.project_id}:${ctx.runId ?? threadId}`;
  }

  let runRequest: LangGraphRunRequest;
  if (isResumeAttempt) {
    runRequest = {
      assistant_id: config.assistantId,
      command: {
        resume: resumePayload!,
      },
      context: requestContext,
    };
  } else {
    runRequest = {
      assistant_id: config.assistantId,
      input: inputPayload,
      context: requestContext,
    };
  }

  await ctx.onMeta?.({
    adapterType: "langgraph",
    command: `POST ${config.baseUrl}/threads/${threadId}/runs/wait`,
  });

  ctx.onDispatch?.();
  if (isResumeAttempt) {
    await ctx.onLog(
      "stdout",
      `[langgraph] Resuming run on thread "${threadId}" with Command(resume=...) for interrupt "${pendingInterruptId}"...\n`,
    );
  } else {
    await ctx.onLog(
      "stdout",
      `[langgraph] Executing run on thread "${threadId}" for assistant "${config.assistantId}"...\n`,
    );
  }

  let timedOut = false;
  const timeoutSignal =
    config.runTimeoutMs > 0 ? AbortSignal.timeout(config.runTimeoutMs) : null;
  const onTimeoutAbort = () => {
    timedOut = true;
  };
  if (timeoutSignal) {
    timeoutSignal.addEventListener("abort", onTimeoutAbort, { once: true });
  }

  const signals: AbortSignal[] = [];
  if (timeoutSignal) {
    signals.push(timeoutSignal);
  }
  if (ctx.signal) {
    signals.push(ctx.signal);
  }

  const runAbortSignal =
    signals.length > 0 ? AbortSignal.any(signals) : undefined;

  if (ctx.onCancellationReady) {
    await ctx.onCancellationReady();
  }

  try {
    const runRes = await fetch(
      `${config.baseUrl}/threads/${threadId}/runs/wait`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(runRequest),
        signal: runAbortSignal,
      },
    );

    if (!runRes.ok) {
      const errBody = await runRes.text();
      const msg = `LangGraph run wait failed with HTTP ${runRes.status}: ${errBody}`;
      await ctx.onLog("stderr", `[langgraph] ${msg}\n`);
      return {
        exitCode: 1,
        signal: null,
        timedOut: false,
        provider: "langgraph",
        errorMessage: msg,
        sessionParams: {
          threadId: sessionParams.threadId,
          assistantId: sessionParams.assistantId,
          tenantId: sessionParams.tenantId,
        },
      };
    }

    const runData = (await runRes.json()) as LangGraphRunResponse;

    if (runData.status === "error") {
      const errMsg =
        typeof runData.error === "string"
          ? runData.error
          : typeof runData.message === "string"
            ? runData.message
            : "LangGraph run failed with status 'error'";
      await ctx.onLog("stderr", `[langgraph] Run error: ${errMsg}\n`);
      return {
        exitCode: 1,
        signal: null,
        timedOut: false,
        provider: "langgraph",
        errorMessage: errMsg,
        sessionParams: {
          threadId: sessionParams.threadId,
          assistantId: sessionParams.assistantId,
          tenantId: sessionParams.tenantId,
        },
        resultJson: (runData.values as Record<string, JsonValue>) ?? null,
      };
    }

    const interrupt = extractInterrupt(runData);
    if (runData.status === "interrupted" || runData.status === "human_review" || interrupt !== null) {
      if (!interrupt) {
        const msg =
          "LangGraph run was interrupted but payload did not contain a valid interrupt";
        await ctx.onLog("stderr", `[langgraph] ${msg}\n`);
        return {
          exitCode: 1,
          signal: null,
          timedOut: false,
          provider: "langgraph",
          errorMessage: msg,
          sessionParams: {
            threadId: sessionParams.threadId,
            assistantId: sessionParams.assistantId,
            tenantId: sessionParams.tenantId,
          },
        };
      }

      const questionSet = toQuestionSet(interrupt);
      const choices = (interrupt.options ?? []).map((opt) => ({
        key: opt.id,
        label: opt.label,
        ...(opt.description ? { description: opt.description } : {}),
      }));

      const question = {
        prompt: interrupt.prompt,
        choices,
      };

      const requestKind =
        interrupt.kind === "approval"
          ? "permission_approval"
          : interrupt.kind === "input"
            ? "user_input"
            : "elicitation";
      const requestType =
        interrupt.kind === "approval" ? "permission" : "input";

      await ctx.onEvent?.({
        eventType: "runtime_request",
        requestKind,
        requestType,
        status: "pending",
        questionSet,
        payload: {
          requestId: interrupt.interrupt_id,
          requestKind,
          requestType,
          status: "pending",
          prompt: interrupt.prompt,
          choices,
          questionSet,
        },
      } as unknown as AdapterRuntimeEvent);

      await ctx.onLog(
        "stdout",
        `[langgraph] Run interrupted on thread "${threadId}" requiring human interaction: ${interrupt.prompt}\n`,
      );

      const usage = extractUsage(runData);

      return {
        exitCode: 0,
        signal: null,
        timedOut: false,
        provider: "langgraph",
        usage,
        sessionId: threadId,
        sessionDisplayId: threadId,
        sessionParams: {
          threadId: sessionParams.threadId,
          assistantId: sessionParams.assistantId,
          tenantId: sessionParams.tenantId,
          interruptId: interrupt.interrupt_id,
          pendingResume: {
            interruptId: interrupt.interrupt_id,
            requestId: interrupt.interrupt_id,
          },
        },
        summary: `Paused for user interaction: ${interrupt.prompt}`,
        question,
        resultJson: (runData.values as Record<string, JsonValue>) ?? null,
      };
    }

    const usage = extractUsage(runData);
    const summary = extractSummary(runData);

    await ctx.onLog(
      "stdout",
      `[langgraph] Run completed successfully on thread "${threadId}".\n`,
    );

    return {
      exitCode: 0,
      signal: null,
      timedOut: false,
      provider: "langgraph",
      usage,
      sessionId: threadId,
      sessionDisplayId: threadId,
      sessionParams: {
        threadId: sessionParams.threadId,
        assistantId: sessionParams.assistantId,
        tenantId: sessionParams.tenantId,
      },
      summary,
      resultJson: (runData.values as Record<string, JsonValue>) ?? null,
    };
  } catch (err) {
    if (timedOut) {
      const msg = `LangGraph run timed out after ${config.runTimeoutMs}ms`;
      await ctx.onLog("stderr", `[langgraph] ${msg}\n`);
      return {
        exitCode: null,
        signal: null,
        timedOut: true,
        provider: "langgraph",
        errorMessage: msg,
        sessionParams: {
          threadId: sessionParams.threadId,
          assistantId: sessionParams.assistantId,
          tenantId: sessionParams.tenantId,
        },
      };
    }

    if (ctx.signal?.aborted) {
      const msg = "LangGraph run was cancelled";
      await ctx.onLog("stderr", `[langgraph] ${msg}\n`);
      return {
        exitCode: 130,
        signal: "SIGINT",
        timedOut: false,
        provider: "langgraph",
        errorMessage: msg,
        sessionParams: {
          threadId: sessionParams.threadId,
          assistantId: sessionParams.assistantId,
          tenantId: sessionParams.tenantId,
        },
      };
    }

    const msg = `LangGraph execution error: ${err instanceof Error ? err.message : String(err)}`;
    await ctx.onLog("stderr", `[langgraph] ${msg}\n`);
    return {
      exitCode: 1,
      signal: null,
      timedOut: false,
      provider: "langgraph",
      errorMessage: msg,
      sessionParams: {
        threadId: sessionParams.threadId,
        assistantId: sessionParams.assistantId,
        tenantId: sessionParams.tenantId,
      },
    };
  } finally {
    if (timeoutSignal) {
      timeoutSignal.removeEventListener("abort", onTimeoutAbort);
    }
  }
}
