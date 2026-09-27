// @vitest-environment jsdom

import { flushSync } from "react-dom";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SpecialistContractForm } from "./SpecialistContractForm";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { Agent } from "@paperclipai/shared";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

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

function makeTestSpecialistAgent(role = "devops", cargo = 4): Agent {
  return {
    id: "spec-agent-uuid-1",
    companyId: "comp-1",
    name: "Fênix — DevOps Specialist",
    role: "devops",
    title: "DevOps Specialist",
    icon: "terminal",
    status: "active",
    reportsTo: null,
    capabilities: "DevOps automation",
    adapterType: "langgraph",
    adapterConfig: {
      baseUrl: "http://127.0.0.1:2024",
      assistantId: role,
      specialistContract: {
        rto_seconds: 300,
        rpo_seconds: 60,
        infrastructure_profile: "swarm",
        policy_strictness: "strict",
        deploy_strategy: "rolling",
      },
    },
    runtimeConfig: {},
    budgetMonthlyCents: 0,
    spentMonthlyCents: 0,
    pauseReason: null,
    pausedAt: null,
    lastHeartbeatAt: null,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    urlKey: "fenix-devops",
    permissions: {
      canCreateAgents: false,
    },
    metadata: {
      cargo,
      cargoName: role,
      wave: 6,
    },
  };
}

describe("SpecialistContractForm", () => {
  it("renders specialized contract fields for DevOps agent", () => {
    const agent = makeTestSpecialistAgent("devops", 4);
    flushSync(() => {
      root.render(
        <TooltipProvider>
          <SpecialistContractForm
            agent={agent}
            config={agent.adapterConfig}
          />
        </TooltipProvider>,
      );
    });

    expect(container.textContent).toContain("Contrato Especializado & Modelo LLM");
    expect(container.textContent).toContain("Cargo 04");
    expect(container.textContent).toContain("RTO Target (seconds)");
    expect(container.textContent).toContain("RPO Target (seconds)");
    expect(container.textContent).toContain("Infrastructure Profile");
    expect(container.textContent).toContain("Policy Strictness");
    expect(container.textContent).toContain("Deploy Strategy");
  });

  it("renders specialized contract fields for Solution Architect agent", () => {
    const agent = makeTestSpecialistAgent("solution_architect", 1);
    flushSync(() => {
      root.render(
        <TooltipProvider>
          <SpecialistContractForm
            agent={agent}
            config={agent.adapterConfig}
          />
        </TooltipProvider>,
      );
    });

    expect(container.textContent).toContain("Cargo 01");
    expect(container.textContent).toContain("Target Audience");
    expect(container.textContent).toContain("Architecture Style");
    expect(container.textContent).toContain("NFR Thresholds");
    expect(container.textContent).toContain("Compliance Frameworks");
  });

  it("updates contract parameter and marks adapterConfig and metadata", () => {
    const agent = makeTestSpecialistAgent("devops", 4);
    const mark = vi.fn();
    const eff = <T,>(_group: "adapterConfig" | "metadata", field: string, original: T): T => {
      return ((agent.adapterConfig as Record<string, unknown>)[field] as T) ?? original;
    };

    flushSync(() => {
      root.render(
        <TooltipProvider>
          <SpecialistContractForm
            agent={agent}
            config={agent.adapterConfig}
            mark={mark}
            eff={eff}
          />
        </TooltipProvider>,
      );
    });

    const inputs = container.querySelectorAll("input");
    const rtoInput = Array.from(inputs).find((inp) => inp.value === "300");
    expect(rtoInput).toBeDefined();

    flushSync(() => {
      setInputValue(rtoInput!, "120");
    });

    expect(mark).toHaveBeenCalledWith(
      "adapterConfig",
      "specialistContract",
      expect.objectContaining({ rto_seconds: 120 }),
    );
    expect(mark).toHaveBeenCalledWith(
      "metadata",
      "specialistContract",
      expect.objectContaining({ rto_seconds: 120 }),
    );
  });

  it("updates model, temperature, and system prompt and marks both adapterConfig and metadata", () => {
    const agent = makeTestSpecialistAgent("devops", 4);
    const mark = vi.fn();

    flushSync(() => {
      root.render(
        <TooltipProvider>
          <SpecialistContractForm
            agent={agent}
            config={agent.adapterConfig}
            mark={mark}
          />
        </TooltipProvider>,
      );
    });

    // Model selection
    const selects = container.querySelectorAll("select");
    const modelSelect = Array.from(selects).find((s) =>
      Array.from(s.options).some((opt) => opt.value === "omp/gemini-3.8-flash"),
    );
    expect(modelSelect).toBeDefined();

    flushSync(() => {
      modelSelect!.value = "omp/gemini-3.8-flash";
      modelSelect!.dispatchEvent(new Event("change", { bubbles: true }));
    });

    expect(mark).toHaveBeenCalledWith("adapterConfig", "model", "omp/gemini-3.8-flash");
    expect(mark).toHaveBeenCalledWith("metadata", "model", "omp/gemini-3.8-flash");

    // System prompt textarea
    const textarea = container.querySelector("textarea");
    expect(textarea).toBeDefined();

    flushSync(() => {
      setInputValue(textarea!, "Custom system prompt for DevOps specialist.");
    });

    expect(mark).toHaveBeenCalledWith(
      "adapterConfig",
      "systemPrompt",
      "Custom system prompt for DevOps specialist.",
    );
    expect(mark).toHaveBeenCalledWith(
      "metadata",
      "systemPrompt",
      "Custom system prompt for DevOps specialist.",
    );
  });
});
