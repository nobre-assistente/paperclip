import type { AdapterAgent } from "@paperclipai/adapter-utils";

/**
 * Pure function deriving tenantId deterministically and exclusively from agent.companyId.
 *
 * Negative Constraints:
 * - PROIBIDO tenantId de entrada do usuário ou adapter config.
 * - Deve derivar tenant EXCLUSIVAMENTE de ctx.agent.companyId.
 */
export function deriveTenantId(agent: AdapterAgent): string {
  if (!agent || typeof agent.companyId !== "string") {
    throw new Error("Cannot derive tenantId: agent.companyId is required and must be a string");
  }
  const companyId = agent.companyId.trim();
  if (companyId.length === 0) {
    throw new Error("Cannot derive tenantId: agent.companyId cannot be empty");
  }
  return companyId;
}
