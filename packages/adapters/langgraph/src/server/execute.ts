import type {
  AdapterExecutionContext,
  AdapterExecutionResult,
  AdapterRuntimeEvent,
  UsageSummary,
} from "@paperclipai/adapter-utils";
import type {
  JsonValue,
  LangGraphRunRequest,
  LangGraphRunResponse,
  LangGraphSessionParams,
  LangGraphThreadResponse,
} from "../types.js";
import { parseLangGraphAdapterConfig } from "./config.js";
import {
  extractInterrupt,
  parseLangGraphInterrupt,
  toQuestionSet,
} from "./interrupt.js";

export { extractInterrupt, parseLangGraphInterrupt, toQuestionSet };

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
    const candidateId =
      (typeof ctx.runtime.sessionParams?.sessionId === "string" && ctx.runtime.sessionParams.sessionId.trim()) ||
      (typeof ctx.runtime.sessionDisplayId === "string" && ctx.runtime.sessionDisplayId.trim()) ||
      (typeof ctx.runtime.sessionId === "string" && ctx.runtime.sessionId.trim()) ||
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

  const runRequest: LangGraphRunRequest = {
    assistant_id: config.assistantId,
    input: inputPayload,
    config: {
      configurable: {
        tenant_id: tenantId,
        company_id: tenantId,
        agent_id: ctx.agent.id,
        run_id: ctx.runId,
      },
    },
  };

  await ctx.onMeta?.({
    adapterType: "langgraph",
    command: `POST ${config.baseUrl}/threads/${threadId}/runs/wait`,
  });

  ctx.onDispatch?.();
  await ctx.onLog(
    "stdout",
    `[langgraph] Executing run on thread "${threadId}" for assistant "${config.assistantId}"...\n`,
  );

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
    if (runData.status === "interrupted" || interrupt !== null) {
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
