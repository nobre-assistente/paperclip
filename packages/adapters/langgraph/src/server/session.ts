import type { AdapterSessionCodec } from "@paperclipai/adapter-utils";

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export const sessionCodec: AdapterSessionCodec = {
  serialize(params: Record<string, unknown> | null): Record<string, unknown> | null {
    if (!isObjectRecord(params)) return null;

    const threadId = typeof params.threadId === "string" ? params.threadId.trim() : "";
    const assistantId = typeof params.assistantId === "string" ? params.assistantId.trim() : "";
    const tenantId = typeof params.tenantId === "string" ? params.tenantId.trim() : "";

    if (!threadId || !assistantId || !tenantId) {
      return null;
    }

    const result: Record<string, unknown> = {
      threadId,
      assistantId,
      tenantId,
    };

    if (typeof params.interruptId === "string" && params.interruptId.trim().length > 0) {
      result.interruptId = params.interruptId.trim();
    }

    if (isObjectRecord(params.pendingResume)) {
      const interruptId =
        typeof params.pendingResume.interruptId === "string"
          ? params.pendingResume.interruptId.trim()
          : "";
      const requestId =
        typeof params.pendingResume.requestId === "string"
          ? params.pendingResume.requestId.trim()
          : "";

      if (interruptId && requestId) {
        result.pendingResume = {
          interruptId,
          requestId,
        };
      }
    }

    return result;
  },

  deserialize(raw: unknown): Record<string, unknown> | null {
    if (!isObjectRecord(raw)) return null;

    const threadId = typeof raw.threadId === "string" ? raw.threadId.trim() : "";
    const assistantId = typeof raw.assistantId === "string" ? raw.assistantId.trim() : "";
    const tenantId = typeof raw.tenantId === "string" ? raw.tenantId.trim() : "";

    if (!threadId || !assistantId || !tenantId) {
      return null;
    }

    const result: Record<string, unknown> = {
      threadId,
      assistantId,
      tenantId,
    };

    if (typeof raw.interruptId === "string" && raw.interruptId.trim().length > 0) {
      result.interruptId = raw.interruptId.trim();
    }

    if (isObjectRecord(raw.pendingResume)) {
      const interruptId =
        typeof raw.pendingResume.interruptId === "string"
          ? raw.pendingResume.interruptId.trim()
          : "";
      const requestId =
        typeof raw.pendingResume.requestId === "string"
          ? raw.pendingResume.requestId.trim()
          : "";

      if (interruptId && requestId) {
        result.pendingResume = {
          interruptId,
          requestId,
        };
      }
    }

    return result;
  },

  getDisplayId(params: Record<string, unknown> | null): string | null {
    if (!isObjectRecord(params)) return null;
    return typeof params.threadId === "string" && params.threadId.trim().length > 0
      ? params.threadId.trim()
      : null;
  },
};
