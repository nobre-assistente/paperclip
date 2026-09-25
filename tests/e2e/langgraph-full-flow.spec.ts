import { test, expect } from "@playwright/test";
import child_process from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
test.describe("Wave 11 - LangGraph Full Flow E2E", () => {
  test("wave11 langgraph full flow", async ({ page, request }) => {
    test.setTimeout(180_000);

    const isLangGraphAvailable = await fetch("http://127.0.0.1:2024/ok")
      .then((r) => r.ok)
      .catch(() => false);
    test.skip(
      !isLangGraphAvailable,
      "Live LangGraph server at http://127.0.0.1:2024 (via SSH tunnel to Oracle VM) is required for this E2E test",
    );
    // 1. Create a dedicated test company
    const companyRes = await request.post("/api/companies", {
      data: { name: `Wave11 Full Flow Company ${Date.now()}` },
    });
    expect(companyRes.ok(), `create company failed: ${await companyRes.text()}`).toBe(true);
    const company = await companyRes.json();
    const companyId = company.id;
    const prefix = company.issuePrefix ?? company.prefix ?? "WAVE11";

    // 2. Define assistant and artifact manifest for multi-tenant graph
    const assistantId = "224cf0be-a5c6-522f-86f0-b84379f45109";
    const manifest = {
      artifact_id: crypto.randomUUID(),
      uri: `s3://tenant-artifacts/${companyId}/manifest/brief.json`,
      media_type: "application/json",
      byte_size: 1024,
      sha256: "a".repeat(64),
      schema_name: "CorporateBrief",
      schema_version: "1.0.0",
      immutable: true,
      classification: "internal",
      tenant_id: companyId,
    };

    // 3. Create agent configured with real LangGraph server and assistant
    const agentRes = await request.post(`/api/companies/${companyId}/agents`, {
      data: {
        name: "Wave 11 LangGraph Orchestrator",
        role: "general",
        adapterType: "langgraph",
        adapterConfig: {
          baseUrl: "http://127.0.0.1:2024",
          assistantId,
          runTimeoutMs: 60_000,
          input: {
            active_schema_version: "1.0.0",
            max_refinement_attempts: 3,
            model_candidates: ["claude-3-5-sonnet", "gpt-4o"],
            input_manifest: manifest,
            evaluation_dataset: manifest,
            evaluation_rubric: manifest,
            force_brand_edge_case: true,
          },
        },
      },
    });
    expect(agentRes.ok(), `create agent failed: ${await agentRes.text()}`).toBe(true);
    const agent = await agentRes.json();
    fs.writeFileSync(path.resolve(process.cwd(), "last_agent_id.txt"), agent.id, "utf-8");
    console.log(`REAL_AGENT_ID:${agent.id}`);

    // 4. Trigger initial heartbeat run (which executes until interrupt at human_escalation)
    const heartbeatRes = await request.post(`/api/agents/${agent.id}/heartbeat/invoke`, {
      data: {},
    });
    console.log(`HEARTBEAT_RES_STATUS: ${heartbeatRes.status()}`);
    const heartbeatJson = (await heartbeatRes.json().catch(() => ({}))) as Record<string, unknown>;
    console.log(`HEARTBEAT_RES_BODY: ${JSON.stringify(heartbeatJson)}`);
    expect(heartbeatRes.ok(), `invoke heartbeat failed: ${JSON.stringify(heartbeatJson)}`).toBe(true);
    const initialRunId = String(heartbeatJson.id ?? "");
    // 5. Poll for the pending approval created by Paperclip from the LangGraph interrupt
    let pendingApproval: Record<string, unknown> | null = null;
    const approvalDeadline = Date.now() + 60_000;
    while (Date.now() < approvalDeadline) {
      const approvalsRes = await request.get(`/api/companies/${companyId}/approvals?status=pending`);
      if (approvalsRes.ok()) {
        const approvals = await approvalsRes.json();
        if (Array.isArray(approvals) && approvals.length > 0) {
          pendingApproval = approvals[0];
          console.log(`FOUND_APPROVAL: ${JSON.stringify(pendingApproval)}`);
          break;
        }
      }

      // Also check run status
      const runsRes = await request.get(`/api/agents/${agent.id}/runs?limit=3`);
      if (runsRes.ok()) {
        const runs = await runsRes.json();
        console.log(`CURRENT_RUNS: ${JSON.stringify(runs.map((r: any) => ({ id: r.id, status: r.status, summary: r.summary, error: r.error })))}`);
      }

      await page.waitForTimeout(2000);
    }

    expect(pendingApproval, "Expected pending approval to be generated from LangGraph interrupt").not.toBeNull();
    expect(pendingApproval.status).toBe("pending");
    expect(pendingApproval.requestedByAgentId).toBe(agent.id);

    // 6. Approve the pending approval via Paperclip API
    const approveRes = await request.post(`/api/approvals/${pendingApproval.id}/approve`, {
      data: { decisionNote: "Approved via E2E test" },
    });
    expect(approveRes.ok(), `approve failed: ${await approveRes.text()}`).toBe(true);
    const resolvedApproval = await approveRes.json();
    expect(resolvedApproval.status).toBe("approved");

    // 7. Await the auto-woken resume run to complete to terminal status 'succeeded'
    let finalRun: Record<string, unknown> | null = null;
    const resumeDeadline = Date.now() + 90_000;
    while (Date.now() < resumeDeadline) {
      const runsRes = await request.get(`/api/agents/${agent.id}/runs?limit=5`);
      if (runsRes.ok()) {
        const runs = (await runsRes.json()) as Array<Record<string, unknown>>;
        console.log(`RESUME_POLL_RUNS: ${JSON.stringify(runs.map((r) => ({ id: r.id, status: r.status, summary: r.summary, error: r.error })))}`);
        const resumeRun = runs.find((r) => r.id !== initialRunId);
        if (resumeRun) {
          if (resumeRun.status === "succeeded") {
            finalRun = resumeRun;
            break;
          }
          if (resumeRun.status === "failed") {
            throw new Error(`Resumed run failed: ${resumeRun.error ?? resumeRun.summary}`);
          }
        }
      }
      await page.waitForTimeout(2000);
    }

    expect(finalRun, "Expected final run to finish with status succeeded").not.toBeNull();
    expect(finalRun?.status).toBe("succeeded");

    // 8. Render topology in Canvas and verify nodes
    await page.goto(`/${prefix}/canvas?assistantId=${assistantId}`, {
      waitUntil: "domcontentloaded",
    });

    const nodes = page.locator(".react-flow__node");
    await expect(nodes).toHaveCount(27, { timeout: 30_000 });

    // Verify key nodes are rendered
    await expect(page.locator('[data-testid="canvas-node-__start__"]')).toBeVisible();
    await expect(page.locator('[data-testid="canvas-node-human_escalation"]')).toBeVisible();
    await expect(page.locator('[data-testid="canvas-node-__end__"]')).toBeVisible();

    // Verify selecting a node opens the read-only property panel
    await page.locator('[data-testid="canvas-node-human_escalation"]').click();
    const propertyPanel = page.locator('[data-testid="property-panel"]');
    await expect(propertyPanel).toBeVisible();
    await expect(propertyPanel.getByText("human_escalation").first()).toBeVisible();
    // 9. AC2: Real curl against /api/agents/<agentId>/runs to confirm terminal success status
    const curlOutput = child_process.execSync(
      `curl -s "http://127.0.0.1:3199/api/agents/${agent.id}/runs?limit=3"`,
      { encoding: "utf-8" },
    );
    console.log(`REAL_CURL_OUTPUT:\n${curlOutput}`);
    fs.writeFileSync(path.resolve(process.cwd(), "last_runs_curl.json"), curlOutput, "utf-8");
    const parsedRuns = JSON.parse(curlOutput) as Array<Record<string, unknown>>;
    expect(Array.isArray(parsedRuns)).toBe(true);
    expect(parsedRuns.some((r) => r.status === "succeeded")).toBe(true);
  });
});
