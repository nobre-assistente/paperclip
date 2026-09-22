import type {
  AdapterEnvironmentCheck,
  AdapterEnvironmentTestContext,
  AdapterEnvironmentTestResult,
  AdapterEnvironmentTestStatus,
} from "@paperclipai/adapter-utils";
import { parseLangGraphAdapterConfig } from "./config.js";

function isValidHttpUrl(candidate: string): boolean {
  try {
    const url = new URL(candidate);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export async function testEnvironment(
  ctx: AdapterEnvironmentTestContext,
): Promise<AdapterEnvironmentTestResult> {
  const config = parseLangGraphAdapterConfig(ctx.config);
  const checks: AdapterEnvironmentCheck[] = [];

  const validUrl = isValidHttpUrl(config.baseUrl);
  if (!validUrl) {
    checks.push({
      code: "LANGGRAPH_CONFIG_BASE_URL_INVALID",
      level: "error",
      message: "LangGraph baseUrl must be a valid http or https URL",
      detail: `Configured baseUrl: "${config.baseUrl}"`,
      hint: "Configure a valid URL, e.g. http://localhost:2024",
    });
  }

  if (!config.assistantId) {
    checks.push({
      code: "LANGGRAPH_CONFIG_ASSISTANT_ID_MISSING",
      level: "error",
      message: "LangGraph assistantId is required",
      hint: "Set assistantId in agent configuration matching a graph defined on the server",
    });
  }

  if (validUrl) {
    let serverReachable = false;
    try {
      const response = await fetch(`${config.baseUrl}/ok`, {
        method: "GET",
        signal: AbortSignal.timeout(5_000),
      });

      if (response.ok) {
        serverReachable = true;
        checks.push({
          code: "LANGGRAPH_SERVER_REACHABLE",
          level: "info",
          message: `LangGraph server is reachable and healthy at ${config.baseUrl}`,
        });
      } else {
        checks.push({
          code: "LANGGRAPH_SERVER_UNHEALTHY",
          level: "error",
          message: `LangGraph server health endpoint /ok returned HTTP ${response.status}`,
          hint: "Check LangGraph server process logs and health status",
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      checks.push({
        code: "LANGGRAPH_SERVER_UNREACHABLE",
        level: "error",
        message: `Failed to reach LangGraph server at ${config.baseUrl}`,
        detail: message,
        hint: "Ensure LangGraph server is running and accessible (default http://127.0.0.1:2024)",
      });
    }

    if (serverReachable && config.assistantId) {
      try {
        const assistantResponse = await fetch(
          `${config.baseUrl}/assistants/${encodeURIComponent(config.assistantId)}/graph`,
          {
            method: "GET",
            signal: AbortSignal.timeout(5_000),
          },
        );

        if (assistantResponse.ok) {
          checks.push({
            code: "LANGGRAPH_ASSISTANT_VERIFIED",
            level: "info",
            message: `Assistant "${config.assistantId}" graph verified on server`,
          });
        } else if (assistantResponse.status === 404) {
          checks.push({
            code: "LANGGRAPH_ASSISTANT_NOT_FOUND",
            level: "warn",
            message: `Assistant "${config.assistantId}" was not found on the LangGraph server`,
            hint: "Verify that the assistantId matches the graph registered in langgraph.json",
          });
        } else {
          checks.push({
            code: "LANGGRAPH_ASSISTANT_CHECK_FAILED",
            level: "warn",
            message: `Assistant check returned HTTP ${assistantResponse.status}`,
          });
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        checks.push({
          code: "LANGGRAPH_ASSISTANT_CHECK_ERROR",
          level: "warn",
          message: `Failed to probe assistant graph: ${message}`,
        });
      }
    }
  }

  const hasError = checks.some((c) => c.level === "error");
  const hasWarn = checks.some((c) => c.level === "warn");
  const status: AdapterEnvironmentTestStatus = hasError ? "fail" : hasWarn ? "warn" : "pass";

  return {
    adapterType: "langgraph",
    status,
    checks,
    testedAt: new Date().toISOString(),
  };
}
