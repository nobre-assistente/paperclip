// @vitest-environment jsdom

import { flushSync } from "react-dom";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NodePropertiesPanel } from "./NodePropertiesPanel";
import type { NodeDetail, NodeExecutionRecord } from "./types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  flushSync(() => root.unmount());
  container.remove();
});

function setInputValue(el: HTMLInputElement | HTMLTextAreaElement, value: string) {
  const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
  setter?.call(el, value);
  el.dispatchEvent(new Event("input", { bubbles: true }));
  el.dispatchEvent(new Event("change", { bubbles: true }));
  el.dispatchEvent(new Event("blur", { bubbles: true }));
}

function makeSampleNodeDetail(overrides?: Partial<NodeDetail>): NodeDetail {
  return {
    id: "devops",
    type: "executor",
    fields: [
      { label: "ID", value: "devops" },
      { label: "Canvas Role", value: "executor" },
    ],
    state: "completed",
    tokensConsumed: { prompt: 400, completion: 150, total: 550 },
    durationMs: 320,
    executionLogs: ["[Step 1] Loading cloud config", "[Step 2] Validating RTO/RPO SLA"],
    controls: { bypass: false, forceHitl: false },
    parameters: {
      assistantId: "fenix-devops",
      model: "google-antigravity/gemini-3.8-flash",
      temperature: 0.7,
      systemPrompt: "DevOps automation guidelines",
      timeoutMs: 30000,
      specialistRole: "devops",
      specialistContract: {
        rto_seconds: 300,
        rpo_seconds: 60,
      },
    },
    history: [
      {
        id: "run-devops-001",
        nodeId: "devops",
        timestamp: "2026-09-27T12:00:00Z",
        status: "success",
        durationMs: 320,
        tokensConsumed: { prompt: 400, completion: 150, total: 550 },
      },
    ],
    agentId: "devops-agent-uuid",
    agentName: "Fênix — DevOps Lead",
    ...overrides,
  };
}

describe("NodePropertiesPanel", () => {
  it("renders null when nodeDetail is null", () => {
    flushSync(() => {
      root.render(<NodePropertiesPanel nodeDetail={null} onClose={vi.fn()} />);
    });
    expect(container.querySelector('[data-testid="property-panel"]')).toBeNull();
  });

  it("renders header, node identification, and parameters tab by default", () => {
    const nodeDetail = makeSampleNodeDetail();
    flushSync(() => {
      root.render(<NodePropertiesPanel nodeDetail={nodeDetail} onClose={vi.fn()} />);
    });

    const panel = container.querySelector('[data-testid="property-panel"]');
    expect(panel).not.toBeNull();
    expect(container.textContent).toContain("Estúdio de Nó: devops");
    expect(container.textContent).toContain("Agente: Fênix — DevOps Lead");
    expect(container.textContent).toContain("Parâmetros");
    expect(container.textContent).toContain("Controles");
    expect(container.textContent).toContain("Telemetria");

    // Assistant ID input
    const inputs = container.querySelectorAll("input");
    const asstInput = Array.from(inputs).find((i) => i.value === "fenix-devops");
    expect(asstInput).toBeDefined();

    // System prompt textarea
    const textarea = container.querySelector("textarea");
    expect(textarea?.value).toBe("DevOps automation guidelines");

    // Contract fields section
    expect(container.textContent).toContain("Contrato do Cargo: devops");
  });

  it("calls onUpdateParameters when inputs change", () => {
    const nodeDetail = makeSampleNodeDetail();
    const onUpdateParams = vi.fn();

    flushSync(() => {
      root.render(
        <NodePropertiesPanel
          nodeDetail={nodeDetail}
          onClose={vi.fn()}
          onUpdateParameters={onUpdateParams}
        />,
      );
    });

    const textarea = container.querySelector("textarea") as HTMLTextAreaElement;
    expect(textarea).not.toBeNull();
    setInputValue(textarea, "New customized system prompt");

    expect(onUpdateParams).toHaveBeenCalled();
    const lastCall = onUpdateParams.mock.calls[onUpdateParams.mock.calls.length - 1];
    expect(lastCall[0]).toBe("devops");
    expect(lastCall[1].systemPrompt).toBe("New customized system prompt");
  });

  it("switches to Controles tab and triggers isolated node run", () => {
    const nodeDetail = makeSampleNodeDetail();
    const onExecuteIsolatedNode = vi.fn();
    const onUpdateControls = vi.fn();

    flushSync(() => {
      root.render(
        <NodePropertiesPanel
          nodeDetail={nodeDetail}
          onClose={vi.fn()}
          onExecuteIsolatedNode={onExecuteIsolatedNode}
          onUpdateControls={onUpdateControls}
        />,
      );
    });

    // Switch to controls tab
    const tabs = container.querySelectorAll('[role="tab"]');
    const controlsTab = Array.from(tabs).find((t) => t.textContent?.includes("Controles"));
    expect(controlsTab).toBeDefined();

    flushSync(() => {
      controlsTab?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(container.textContent).toContain("Executar Nó Isolado");
    expect(container.textContent).toContain("Bypass / Mock");
    expect(container.textContent).toContain("Forçar Pausa (HITL)");

    // Click "Disparar Execução de Teste"
    const executeBtn = Array.from(container.querySelectorAll("button")).find(
      (b) => b.textContent?.includes("Disparar Execução de Teste"),
    );
    expect(executeBtn).toBeDefined();

    flushSync(() => {
      executeBtn?.click();
    });

    expect(onExecuteIsolatedNode).toHaveBeenCalledWith("devops");
  });

  it("toggles Bypass/Mock and Force HITL controls", () => {
    const nodeDetail = makeSampleNodeDetail();
    const onUpdateControls = vi.fn();

    flushSync(() => {
      root.render(
        <NodePropertiesPanel
          nodeDetail={nodeDetail}
          onClose={vi.fn()}
          onUpdateControls={onUpdateControls}
        />,
      );
    });

    // Switch to controls tab
    const tabs = container.querySelectorAll('[role="tab"]');
    const controlsTab = Array.from(tabs).find((t) => t.textContent?.includes("Controles"));
    flushSync(() => {
      controlsTab?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    // Switches / toggles
    const toggles = container.querySelectorAll('[role="switch"]');
    expect(toggles.length).toBeGreaterThanOrEqual(2);

    // Toggle Bypass (first toggle)
    flushSync(() => {
      (toggles[0] as HTMLElement).click();
    });

    expect(onUpdateControls).toHaveBeenCalledWith(
      "devops",
      expect.objectContaining({ bypass: true }),
    );

    // Toggle HITL (second toggle)
    flushSync(() => {
      (toggles[1] as HTMLElement).click();
    });

    expect(onUpdateControls).toHaveBeenCalledWith(
      "devops",
      expect.objectContaining({ forceHitl: true }),
    );
  });

  it("switches to Telemetria tab and renders tokens, logs, artifacts, and history", () => {
    const execResult: NodeExecutionRecord = {
      id: "run-recent-123",
      nodeId: "devops",
      timestamp: "2026-09-27T12:30:00Z",
      status: "success",
      durationMs: 280,
      tokensConsumed: { prompt: 500, completion: 200, total: 700 },
      outputs: { status: "ok", deployed: true },
      artifacts: [
        {
          name: "devops_output.json",
          type: "json",
          size: "1.2 KB",
          content: { deployed: true },
        },
      ],
      logs: ["[DevOps] Deployment verified"],
    };

    const nodeDetail = makeSampleNodeDetail({
      history: [execResult],
    });

    flushSync(() => {
      root.render(
        <NodePropertiesPanel
          nodeDetail={nodeDetail}
          onClose={vi.fn()}
          executionResult={execResult}
        />,
      );
    });

    // Switch to Telemetria tab
    const tabs = container.querySelectorAll('[role="tab"]');
    const telemetryTab = Array.from(tabs).find((t) => t.textContent?.includes("Telemetria"));
    flushSync(() => {
      telemetryTab?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(container.textContent).toContain("Tokens Consumidos");
    expect(container.textContent).toContain("Artefatos de Entrada & Saída");
    expect(container.textContent).toContain("devops_output.json");
    expect(container.textContent).toContain("Logs de Execução");
    expect(container.textContent).toContain("Histórico de Execuções");
    expect(container.textContent).toContain("run-recent-123");
  });

  it("invokes onClose when close button clicked", () => {
    const onClose = vi.fn();
    const nodeDetail = makeSampleNodeDetail();

    flushSync(() => {
      root.render(<NodePropertiesPanel nodeDetail={nodeDetail} onClose={onClose} />);
    });

    const closeBtn = container.querySelector('button[aria-label="Close properties panel"]') as HTMLButtonElement;
    expect(closeBtn).not.toBeNull();

    flushSync(() => {
      closeBtn.click();
    });

    expect(onClose).toHaveBeenCalled();
  });
});
