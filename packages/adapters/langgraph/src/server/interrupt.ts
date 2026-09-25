import type {
  PaperclipQuestion,
  PaperclipQuestionOption,
  PaperclipQuestionResponse,
  PaperclipQuestionSet,
} from "@paperclipai/adapter-utils";
import type {
  InterruptOption,
  LangGraphInterrupt,
  LangGraphRunResponse,
} from "../types.js";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseInterruptOption(value: unknown): InterruptOption | null {
  if (!isRecord(value)) return null;
  if (typeof value.id !== "string" || typeof value.label !== "string") return null;
  const description =
    typeof value.description === "string"
      ? value.description
      : value.description === null
        ? null
        : undefined;
  return {
    id: value.id,
    label: value.label,
    ...(description !== undefined ? { description } : {}),
  };
}

export function parseLangGraphInterrupt(value: unknown): LangGraphInterrupt | null {
  if (!isRecord(value)) return null;

  // 1. Standard Paperclip format: { interrupt_id, kind, prompt, options }
  if (
    typeof value.interrupt_id === "string" &&
    value.interrupt_id.trim().length > 0 &&
    (value.kind === "approval" || value.kind === "input" || value.kind === "elicitation") &&
    typeof value.prompt === "string"
  ) {
    const rawOptions = Array.isArray(value.options) ? value.options : [];
    const options: InterruptOption[] = [];
    for (const opt of rawOptions) {
      const parsed = parseInterruptOption(opt);
      if (parsed) {
        options.push(parsed);
      }
    }
    return {
      interrupt_id: value.interrupt_id.trim(),
      kind: value.kind,
      prompt: value.prompt,
      options,
    };
  }

  // 2. LangGraph native interrupt format: { id, value: { ... } }
  if (typeof value.id === "string" && isRecord(value.value)) {
    const inner = value.value as Record<string, unknown>;
    const interruptId = value.id.trim();
    const prompt =
      typeof inner.prompt === "string"
        ? inner.prompt
        : typeof inner.message === "string"
          ? inner.message
          : typeof inner.type === "string"
            ? `Human approval required: ${inner.type}`
            : "Approval required";

    const allowedActions = Array.isArray(inner.allowed_actions)
      ? inner.allowed_actions.map(String)
      : [];

    const options: InterruptOption[] =
      allowedActions.length > 0
        ? allowedActions.map((action) => ({ id: action, label: action }))
        : Array.isArray(inner.options)
          ? (inner.options as unknown[]).map(parseInterruptOption).filter((o): o is InterruptOption => o !== null)
          : [
              { id: "approve", label: "Approve" },
              { id: "reject", label: "Reject" },
            ];

    return {
      interrupt_id: interruptId,
      kind: "approval",
      prompt,
      options,
    };
  }

  // 3. Unwrapped native interrupt format: { type: "...", allowed_actions: [...] }
  if (
    typeof value.type === "string" &&
    (Array.isArray(value.allowed_actions) || typeof value.run_id === "string")
  ) {
    const interruptId =
      typeof value.interrupt_id === "string"
        ? value.interrupt_id.trim()
        : typeof value.id === "string"
          ? value.id.trim()
          : typeof value.run_id === "string"
            ? String(value.run_id)
            : "interrupt-" + Date.now();

    const prompt =
      typeof value.prompt === "string"
        ? value.prompt
        : typeof value.message === "string"
          ? value.message
          : `Human approval required: ${value.type}`;

    const allowedActions = Array.isArray(value.allowed_actions)
      ? value.allowed_actions.map(String)
      : [];

    const options: InterruptOption[] =
      allowedActions.length > 0
        ? allowedActions.map((action) => ({ id: action, label: action }))
        : [
            { id: "approve", label: "Approve" },
            { id: "reject", label: "Reject" },
          ];

    return {
      interrupt_id: interruptId,
      kind: "approval",
      prompt,
      options,
    };
  }

  return null;
}

export function toQuestionSet(i: LangGraphInterrupt): PaperclipQuestionSet {
  const answerMode: "single_select" | "text" =
    i.kind === "approval"
      ? "single_select"
      : i.kind === "input"
        ? "text"
        : i.options && i.options.length > 0
          ? "single_select"
          : "text";

  const question: PaperclipQuestion = {
    id: i.interrupt_id,
    prompt: i.prompt,
    required: true,
    answerMode,
  };

  if (i.options && i.options.length > 0) {
    question.options = i.options.map((opt: InterruptOption): PaperclipQuestionOption => {
      const option: PaperclipQuestionOption = {
        id: opt.id,
        label: opt.label,
      };
      if (typeof opt.description === "string" && opt.description.trim().length > 0) {
        option.description = opt.description.trim();
      }
      return option;
    });
  }

  return {
    schema: "paperclip.question_set.v1",
    questions: [question],
  };
}

export function extractInterrupt(
  runResponse: LangGraphRunResponse,
): LangGraphInterrupt | null {
  // 1. Direct interrupt property
  if (runResponse.interrupt) {
    const parsed = parseLangGraphInterrupt(runResponse.interrupt);
    if (parsed) return parsed;
    if (isRecord(runResponse.interrupt) && "value" in runResponse.interrupt) {
      const parsedVal = parseLangGraphInterrupt(runResponse.interrupt.value);
      if (parsedVal) return parsedVal;
    }
  }

  // 2. interrupts array
  if (Array.isArray(runResponse.interrupts)) {
    for (const item of runResponse.interrupts) {
      const parsed = parseLangGraphInterrupt(item);
      if (parsed) return parsed;
      if (isRecord(item) && "value" in item) {
        const parsedVal = parseLangGraphInterrupt(item.value);
        if (parsedVal) return parsedVal;
      }
    }
  }

  // 3. tasks array with interrupts
  if (Array.isArray(runResponse.tasks)) {
    for (const task of runResponse.tasks) {
      if (Array.isArray(task.interrupts)) {
        for (const item of task.interrupts) {
          const parsed = parseLangGraphInterrupt(item);
          if (parsed) return parsed;
          if (isRecord(item) && "value" in item) {
            const parsedVal = parseLangGraphInterrupt(item.value);
            if (parsedVal) return parsedVal;
          }
        }
      }
    }
  }

  // 4. values object
  if (isRecord(runResponse.values)) {
    const vals = runResponse.values;
    const directParsed = parseLangGraphInterrupt(vals);
    if (directParsed) return directParsed;

    if ("interrupt" in vals) {
      const parsed = parseLangGraphInterrupt(vals.interrupt);
      if (parsed) return parsed;
      if (isRecord(vals.interrupt) && "value" in vals.interrupt) {
        const parsedVal = parseLangGraphInterrupt(vals.interrupt.value);
        if (parsedVal) return parsedVal;
      }
    }

    if ("__interrupt__" in vals) {
      const parsed = parseLangGraphInterrupt(vals.__interrupt__);
      if (parsed) return parsed;
      if (Array.isArray(vals.__interrupt__)) {
        for (const item of vals.__interrupt__) {
          const p = parseLangGraphInterrupt(item);
          if (p) return p;
          if (isRecord(item) && "value" in item) {
            const pv = parseLangGraphInterrupt(item.value);
            if (pv) return pv;
          }
        }
      }
    }
  }

  // 5. Root __interrupt__ property directly on runResponse
  const rawRoot = runResponse as unknown as Record<string, unknown>;
  if (rawRoot.__interrupt__) {
    const directParsed = parseLangGraphInterrupt(rawRoot.__interrupt__);
    if (directParsed) return directParsed;
    if (Array.isArray(rawRoot.__interrupt__)) {
      for (const item of rawRoot.__interrupt__) {
        const p = parseLangGraphInterrupt(item);
        if (p) return p;
        if (isRecord(item) && "value" in item) {
          const pv = parseLangGraphInterrupt(item.value);
          if (pv) return pv;
        }
      }
    }
  }

  return null;
}

export function buildResumePayload(
  response: PaperclipQuestionResponse,
  interrupt: LangGraphInterrupt,
): Record<string, unknown> {
  const answer =
    response?.answers?.[interrupt.interrupt_id] ??
    (response?.answers ? Object.values(response.answers)[0] : undefined);

  if (!answer) {
    return { action: "cancel" };
  }

  const selectedOptionIds = Array.isArray(answer.selectedOptionIds)
    ? answer.selectedOptionIds
        .map((s) => (typeof s === "string" ? s.trim() : String(s).trim()))
        .filter((s) => s.length > 0)
    : [];

  const text = typeof answer.text === "string" ? answer.text.trim() : undefined;
  const customText =
    typeof answer.customText === "string" ? answer.customText.trim() : undefined;

  let action: string | undefined;
  let value: string | undefined;

  if (interrupt.kind === "approval") {
    if (selectedOptionIds.length > 0) {
      action = selectedOptionIds[0];
    } else if (text !== undefined && text.length > 0) {
      action = text;
    } else if (customText !== undefined && customText.length > 0) {
      action = customText;
    } else {
      action = "approve";
    }
  } else if (interrupt.kind === "input") {
    if (text !== undefined && text.length > 0) {
      action = text;
      value = text;
    } else if (customText !== undefined && customText.length > 0) {
      action = customText;
      value = customText;
    } else if (selectedOptionIds.length > 0) {
      action = selectedOptionIds[0];
      value = selectedOptionIds[0];
    } else {
      action = "";
      value = "";
    }
  } else {
    // elicitation
    if (selectedOptionIds.length > 0) {
      action = selectedOptionIds[0];
    }
    if (text !== undefined && text.length > 0) {
      value = text;
      if (!action) action = text;
    } else if (customText !== undefined && customText.length > 0) {
      value = customText;
      if (!action) action = customText;
    }
    if (!action) {
      action = "approve";
    }
  }

  const entries: [string, unknown][] = [];

  if (action !== undefined) {
    entries.push(["action", action]);
  }
  if (customText !== undefined && customText.length > 0) {
    entries.push(["customText", customText]);
  }
  if (selectedOptionIds.length > 1) {
    entries.push(["selectedOptionIds", [...selectedOptionIds].sort()]);
  }
  if (text !== undefined && text.length > 0) {
    entries.push(["text", text]);
  }
  if (value !== undefined) {
    entries.push(["value", value]);
  }

  entries.sort(([k1], [k2]) => k1.localeCompare(k2));

  const payload: Record<string, unknown> = {};
  for (const [k, v] of entries) {
    payload[k] = v;
  }

  return payload;
}
