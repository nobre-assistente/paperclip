import { test, expect } from "@playwright/test";

test.describe("Canvas - LangGraph Execution Topology", () => {
  test("canvas renders langgraph nodes", async ({ page, request }) => {
    test.setTimeout(120_000);
    // 1. Create a dedicated test company
    const companyRes = await request.post("/api/companies", {
      data: { name: `Canvas Test Company ${Date.now()}` },
    });
    expect(companyRes.ok(), `create company failed: ${await companyRes.text()}`).toBe(true);
    const company = await companyRes.json();
    const prefix = company.issuePrefix ?? company.prefix ?? "CANVAS";

    // 2. Define mock LangGraph topology with distinct node types
    const mockTopology = {
      nodes: [
        { id: "__start__", type: "start", data: {} },
        { id: "planner", type: "agent", data: { role: "Planner Agent", model: "claude-3-5-sonnet" } },
        { id: "evaluator", type: "conditional", data: { routeKey: "check_condition" } },
        { id: "human_review", type: "interrupt", data: { prompt: "Approve action plan" } },
        { id: "__end__", type: "end", data: {} },
      ],
      edges: [
        { source: "__start__", target: "planner", conditional: false },
        { source: "planner", target: "evaluator", conditional: false },
        { source: "evaluator", target: "human_review", conditional: true },
        { source: "human_review", target: "__end__", conditional: false },
      ],
    };

    // 3. Intercept graph topology endpoint to return mock topology
    await page.route("**/api/assistants/*/graph", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockTopology),
      });
    });

    // 4. Navigate to canvas with assistantId query parameter
    await page.goto(`/${prefix}/canvas?assistantId=test-assistant`, {
      waitUntil: "domcontentloaded",
    });

    // 5. Verify N nodes rendered in React Flow equals N nodes in topology
    const nodes = page.locator(".react-flow__node");
    await expect(nodes).toHaveCount(mockTopology.nodes.length);

    // Verify each node ID is rendered in canvas
    for (const node of mockTopology.nodes) {
      await expect(page.locator(`[data-testid="canvas-node-${node.id}"]`)).toBeVisible();
    }

    // 6. Verify distinct node types rendered with proper data attributes
    await expect(page.locator('[data-testid="canvas-node-__start__"]')).toHaveAttribute("data-node-type", "terminal");
    await expect(page.locator('[data-testid="canvas-node-planner"]')).toHaveAttribute("data-node-type", "executor");
    await expect(page.locator('[data-testid="canvas-node-evaluator"]')).toHaveAttribute("data-node-type", "conditional");
    await expect(page.locator('[data-testid="canvas-node-human_review"]')).toHaveAttribute("data-node-type", "interrupt");
    await expect(page.locator('[data-testid="canvas-node-__end__"]')).toHaveAttribute("data-node-type", "terminal");

    // 7. Test selecting a node opens the read-only property panel
    await page.locator('[data-testid="canvas-node-planner"]').click();
    const propertyPanel = page.locator('[data-testid="property-panel"]');
    await expect(propertyPanel).toBeVisible();

    // Verify property panel displays read-only fields
    await expect(propertyPanel.getByText("planner").first()).toBeVisible();
    await expect(propertyPanel.getByText("Planner Agent")).toBeVisible();
    await expect(propertyPanel.getByText("claude-3-5-sonnet")).toBeVisible();
    await expect(propertyPanel.getByText("Read-only", { exact: true })).toBeVisible();
  });
});
