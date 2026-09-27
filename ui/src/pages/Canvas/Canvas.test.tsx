// @vitest-environment jsdom

import { flushSync } from "react-dom";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Canvas } from "./index";
import { langgraphTopologyApi } from "@/api/langgraph-topology";
import { agentsApi } from "@/api/agents";
import type { Agent } from "@paperclipai/shared";

const globalTarget = globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT?: boolean };
globalTarget.IS_REACT_ACT_ENVIRONMENT = true;

class MockResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
(globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver = MockResizeObserver;

vi.mock("@/context/CompanyContext", () => ({
  useCompany: () => ({ selectedCompanyId: "test-company-1" }),
}));

vi.mock("@/context/BreadcrumbContext", () => ({
  useBreadcrumbs: () => ({ setBreadcrumbs: vi.fn() }),
}));

vi.mock("@/lib/router", () => ({
  useParams: () => ({ assistantId: "fenix-orchestrator" }),
  useSearchParams: () => [new URLSearchParams(), vi.fn()],
}));

let container: HTMLDivElement;
let root: Root;
let queryClient: QueryClient;

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
});

afterEach(() => {
  flushSync(() => root.unmount());
  container.remove();
  vi.restoreAllMocks();
});

describe("Canvas Page & Operational Toolbar", () => {
  it("renders toolbar operational buttons: Salvar, Homologar, and Exportar", async () => {
    vi.spyOn(agentsApi, "list").mockResolvedValueOnce([
      {
        id: "agent-1",
        companyId: "test-company-1",
        name: "Fênix — DevOps",
        role: "devops",
        title: "DevOps Lead",
        icon: "terminal",
        status: "active",
        reportsTo: null,
        capabilities: "DevOps",
        adapterType: "langgraph",
        adapterConfig: { assistantId: "fenix-devops" },
      } as unknown as Agent,
    ]);

    vi.spyOn(langgraphTopologyApi, "getGraph").mockResolvedValueOnce({
      nodes: [
        { id: "__start__", type: "start", data: {} },
        { id: "devops", type: "executor", data: {} },
        { id: "__end__", type: "end", data: {} },
      ],
      edges: [
        { source: "__start__", target: "devops", conditional: false },
        { source: "devops", target: "__end__", conditional: false },
      ],
    });

    flushSync(() => {
      root.render(
        <QueryClientProvider client={queryClient}>
          <Canvas />
        </QueryClientProvider>,
      );
    });

    expect(container.textContent).toContain("Canvas Low-Code Operante");
    expect(container.textContent).toContain("Salvar Parâmetros / Topologia");
    expect(container.textContent).toContain("Homologar Fluxo");
    expect(container.textContent).toContain("Exportar Topologia");
  });

  it("triggers homologateFlow and displays success report card", async () => {
    vi.spyOn(agentsApi, "list").mockResolvedValueOnce([]);
    const mockTopology = {
      nodes: [{ id: "devops", type: "executor", data: {} }],
      edges: [],
    };
    queryClient.setQueryData(["langgraph", "topology", "fenix-orchestrator"], mockTopology);

    const homologateSpy = vi.spyOn(langgraphTopologyApi, "homologateFlow").mockResolvedValueOnce({
      id: "homo-run-001",
      assistantId: "fenix-orchestrator",
      status: "success",
      timestamp: "2026-09-27T14:00:00Z",
      durationMs: 650,
      nodesCount: 20,
      edgesCount: 24,
      summary: "Esteira completa homologada com sucesso.",
      validationResults: [
        { phase: "Topology Graph Validation", status: "passed", message: "DAG verificado" },
        { phase: "Specialist Contracts Validation", status: "passed", message: "20 contratos conformes" },
      ],
    });

    flushSync(() => {
      root.render(
        <QueryClientProvider client={queryClient}>
          <Canvas />
        </QueryClientProvider>,
      );
    });

    const homologateBtn = Array.from(container.querySelectorAll("button")).find((b) =>
      b.textContent?.includes("Homologar Fluxo"),
    );
    expect(homologateBtn).toBeDefined();

    homologateBtn?.click();
    await homologateSpy.mock.results[0]?.value;
    await new Promise<void>((resolve) => setTimeout(resolve, 20));
    expect(homologateSpy).toHaveBeenCalledWith(
      "fenix-orchestrator",
      expect.objectContaining({ topology: mockTopology }),
    );

    expect(container.textContent).toContain("Homologação Concluída com Sucesso");
    expect(container.textContent).toContain("650 ms");
    expect(container.textContent).toContain("20 nós • 24 conexões");
    expect(container.textContent).toContain("Topology Graph Validation");
  });

  it("triggers exportTopology downloading graph JSON", () => {
    vi.spyOn(agentsApi, "list").mockResolvedValueOnce([]);
    const mockTopology = {
      nodes: [{ id: "devops", type: "executor", data: {} }],
      edges: [],
    };
    queryClient.setQueryData(["langgraph", "topology", "fenix-orchestrator"], mockTopology);

    const createObjectURLSpy = vi.fn().mockReturnValue("blob:mock-url");
    const revokeObjectURLSpy = vi.fn();
    window.URL.createObjectURL = createObjectURLSpy;
    window.URL.revokeObjectURL = revokeObjectURLSpy;

    flushSync(() => {
      root.render(
        <QueryClientProvider client={queryClient}>
          <Canvas />
        </QueryClientProvider>,
      );
    });

    const exportBtn = Array.from(container.querySelectorAll("button")).find((b) =>
      b.textContent?.includes("Exportar Topologia"),
    );
    expect(exportBtn).toBeDefined();

    flushSync(() => {
      exportBtn?.click();
    });

    expect(createObjectURLSpy).toHaveBeenCalled();
    expect(revokeObjectURLSpy).toHaveBeenCalled();
  });
});
