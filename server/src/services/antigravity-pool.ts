import { execFile } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { DatabaseSync } from "node:sqlite";

export interface QuotaBucketInfo {
  id: string;
  name: string;
  remaining_fraction: number;
  percentage: number;
  used_percentage: number;
  reset_time: string;
  reset_status: string;
  virtual_reset?: boolean;
  used?: number;
  limit?: number;
}

export interface AntigravityAccount {
  account: string;
  active: boolean;
  requests?: number | null;
  rate_limits?: number | null;
  last_used?: string | null;
  cooldown_until?: string | null;
  cooldown_reason?: string | null;
  auth: string;
  auth_label: string;
  healthy: boolean;
  unhealthy_reason?: string | null;
  saved_at?: string;
  quota: {
    "gemini-5h"?: QuotaBucketInfo;
    "gemini-weekly"?: QuotaBucketInfo;
    [key: string]: QuotaBucketInfo | undefined;
  };
  quota_5h?: QuotaBucketInfo;
  quota_weekly?: QuotaBucketInfo;
  quota_score: number;
  quota_updated_at?: string | null;
}

export interface PacerStats {
  total_monitored: number;
  bursts_smoothed: number;
  avg_delay_ms: number;
  total_rate_limits_vault: number;
}

export interface SessionLockInfo {
  task_id: string;
  provider: string;
  account: string;
  size: "light" | "medium" | "heavy" | string;
  required_quota: number;
  start_quota: number;
  locked_at: string;
  mid_flight_switch: boolean;
  is_batch?: boolean;
}

export interface AntigravityPoolStatus {
  provider: string;
  active: string;
  accounts: AntigravityAccount[];
  quota_score: number;
  ban_risk_score: number;
  session_lock: SessionLockInfo | null;
  pacer_stats: PacerStats;
  healthy: boolean;
  auth_label: string;
  telemetry?: Record<string, unknown>;
  updated_at: string;
}

export interface SwitchAccountResult {
  ok: boolean;
  action: "switch";
  provider: string;
  account: string;
  previous?: string | null;
  db_promoted_id_1: boolean;
  trigger_verified: boolean;
  message?: string;
}

export interface RotateNextResult {
  ok: boolean;
  action: "next";
  provider: string;
  account: string;
  previous?: string | null;
  db_promoted_id_1: boolean;
  trigger_verified: boolean;
  message?: string;
}

export interface RefreshOAuthResult {
  ok: boolean;
  action: "refresh";
  provider: string;
  refreshed: Array<{ account: string; ok: boolean; message: string }>;
  db_synchronized: boolean;
  message?: string;
}

export interface GateLockResult {
  ok: boolean;
  provider: string;
  account: string;
  quota_pct: number;
  min_quota: number;
  size: "light" | "medium" | "heavy" | string;
  locked: boolean;
  task_id: string;
  is_batch?: boolean;
  bucket?: string;
  rotated?: boolean;
}

export interface GateUnlockResult {
  ok: boolean;
  action: "unlock";
  task_id?: string;
  provider?: string;
  account?: string;
  size?: string;
  required_quota?: number;
  start_quota?: number;
  end_quota?: number;
  delta_quota?: number;
  duration_s?: number;
  mid_flight_switch?: boolean;
  finished_at?: string;
  message?: string;
}

interface StatusCliAccount {
  account: string;
  active?: boolean;
  requests?: number | null;
  rate_limits?: number | null;
  last_used?: string | null;
  cooldown_until?: string | null;
  cooldown_reason?: string | null;
  auth?: string;
  auth_label?: string;
  healthy?: boolean;
  unhealthy_reason?: string | null;
  saved_at?: string;
  quota?: Record<string, QuotaBucketInfo>;
  quota_score?: number;
  quota_updated_at?: string | null;
}

interface StatusCliProvider {
  provider: string;
  label?: string;
  active?: string;
  accounts?: StatusCliAccount[];
  metrics?: Record<string, unknown>;
  daemon_pid?: number | null;
}

interface StatusCliOutput {
  providers?: StatusCliProvider[];
}

interface TelemetryCliOutput {
  pacer?: PacerStats;
  tasks?: Record<string, unknown>;
  ban_risk_score?: number;
  active_lock?: SessionLockInfo | null;
}

interface SwitchCliOutput {
  ok?: boolean;
  action?: string;
  provider?: string;
  account?: string;
  previous?: string | null;
  noop?: boolean;
  error?: string;
}

interface GateCliOutput {
  ok?: boolean;
  action?: string;
  provider?: string;
  account?: string;
  quota_pct?: number;
  min_quota?: number;
  size?: string;
  locked?: boolean;
  task_id?: string;
  is_batch?: boolean;
  bucket?: string;
  rotated?: boolean;
  required_quota?: number;
  start_quota?: number;
  end_quota?: number;
  delta_quota?: number;
  duration_s?: number;
  mid_flight_switch?: boolean;
  finished_at?: string;
  message?: string;
}

export function getSwitcherScriptPath(): string {
  if (process.env.ACCOUNT_SWITCHER_PATH && fs.existsSync(process.env.ACCOUNT_SWITCHER_PATH)) {
    return process.env.ACCOUNT_SWITCHER_PATH;
  }
  return path.join(os.homedir(), ".orca", "account-switcher", "account_switcher.py");
}

export function getAgentDbPath(): string {
  if (process.env.OMP_AGENT_DB_PATH && fs.existsSync(process.env.OMP_AGENT_DB_PATH)) {
    return process.env.OMP_AGENT_DB_PATH;
  }
  return path.join(os.homedir(), ".omp", "agent", "agent.db");
}

export function getPythonBin(): string {
  if (process.env.PYTHON_BIN && fs.existsSync(process.env.PYTHON_BIN)) {
    return process.env.PYTHON_BIN;
  }
  const venvPython = "/home/orca/.venv-fenix/bin/python";
  if (fs.existsSync(venvPython)) {
    return venvPython;
  }
  return "python3";
}

function parseJsonOutput<T = unknown>(raw: string): T {
  const trimmed = raw.trim();
  try {
    return JSON.parse(trimmed) as T;
  } catch {
    const firstBrace = trimmed.indexOf("{");
    const lastBrace = trimmed.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      try {
        return JSON.parse(trimmed.slice(firstBrace, lastBrace + 1)) as T;
      } catch {
        // continue
      }
    }
    const firstBracket = trimmed.indexOf("[");
    const lastBracket = trimmed.lastIndexOf("]");
    if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
      try {
        return JSON.parse(trimmed.slice(firstBracket, lastBracket + 1)) as T;
      } catch {
        // continue
      }
    }
    throw new Error(`Failed to parse JSON from output: ${raw.slice(0, 300)}...`);
  }
}

async function runSwitcherCommand(
  args: string[],
  timeoutMs: number = 60000,
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  const pythonBin = getPythonBin();
  const scriptPath = getSwitcherScriptPath();
  const { promise, resolve } = Promise.withResolvers<{ stdout: string; stderr: string; exitCode: number }>();

  execFile(
    pythonBin,
    [scriptPath, ...args],
    {
      timeout: timeoutMs,
      maxBuffer: 10 * 1024 * 1024,
      env: {
        ...process.env,
        PYTHONUNBUFFERED: "1",
      },
    },
    (error, stdout, stderr) => {
      const exitCode = error
        ? typeof (error as unknown as { code?: unknown }).code === "number"
          ? (error as unknown as { code: number }).code
          : 1
        : 0;
      resolve({ stdout: stdout || "", stderr: stderr || "", exitCode });
    },
  );

  return promise;
}

/**
 * Promotes active account to ID 1 in agent.db and guarantees presence of
 * trigger purge_antigravity_blocks.
 */
export function ensureAgentDbConsistency(activeAccount?: string): {
  promotedId1: boolean;
  triggerVerified: boolean;
  id1Account?: string;
} {
  const dbPath = getAgentDbPath();
  if (!fs.existsSync(dbPath)) {
    return { promotedId1: false, triggerVerified: false };
  }

  let db: DatabaseSync | null = null;
  try {
    db = new DatabaseSync(dbPath);

    // 1. Ensure trigger purge_antigravity_blocks is present
    db.exec(`
      CREATE TRIGGER IF NOT EXISTS purge_antigravity_blocks
      AFTER INSERT ON auth_credential_blocks
      FOR EACH ROW
      WHEN NEW.provider_key LIKE '%google-antigravity%' OR NEW.block_scope = 'counter:google'
      BEGIN
          DELETE FROM auth_credential_blocks WHERE rowid = NEW.rowid;
      END;
    `);

    // 2. Clear any lingering blocks for antigravity and sticky cache
    db.exec(`
      DELETE FROM auth_credential_blocks WHERE provider_key LIKE '%google-antigravity%' OR block_scope = 'counter:google';
      DELETE FROM cache WHERE key LIKE 'session:sticky:google-antigravity:%';
    `);

    let promoted = false;
    let currentId1Key: string | undefined;

    const row1 = db.prepare("SELECT id, identity_key FROM auth_credentials WHERE id = 1").get() as
      | { id: number; identity_key: string }
      | undefined;

    if (row1) {
      currentId1Key = row1.identity_key;
    }

    if (activeAccount) {
      const targetIdentity = `email:${activeAccount}`;
      if (row1 && row1.identity_key === targetIdentity) {
        promoted = true;
      } else {
        const targetRow = db
          .prepare("SELECT id, identity_key FROM auth_credentials WHERE identity_key = ?")
          .get(targetIdentity) as { id: number; identity_key: string } | undefined;

        if (targetRow) {
          const tempId = 999999;
          db.exec("BEGIN TRANSACTION;");
          if (row1) {
            db.prepare("UPDATE auth_credentials SET id = ? WHERE id = 1").run(tempId);
            db.prepare("UPDATE auth_credentials SET id = 1 WHERE id = ?").run(targetRow.id);
            db.prepare("UPDATE auth_credentials SET id = ? WHERE id = ?").run(targetRow.id, tempId);
          } else {
            db.prepare("UPDATE auth_credentials SET id = 1 WHERE id = ?").run(targetRow.id);
          }
          db.exec("COMMIT;");
          promoted = true;
          currentId1Key = targetIdentity;
        }
      }
    } else if (row1) {
      promoted = true;
    }

    return {
      promotedId1: promoted,
      triggerVerified: true,
      id1Account: currentId1Key ? currentId1Key.replace(/^email:/, "") : undefined,
    };
  } catch {
    return { promotedId1: false, triggerVerified: false };
  } finally {
    if (db) {
      try {
        db.close();
      } catch {
        // ignore
      }
    }
  }
}

/**
 * getPoolStatus()
 * Consolidates Antigravity pool status: accounts, active, gemini-5h, gemini-weekly,
 * quota_score, healthy, auth_label + telemetry (ban_risk_score, session_lock, pacer_stats).
 */
export async function getPoolStatus(refresh: boolean = false): Promise<AntigravityPoolStatus> {
  const statusArgs = refresh
    ? ["status", "--json", "--no-color"]
    : ["status", "--cached", "--json", "--no-color"];

  const [statusRes, telemetryRes] = await Promise.all([
    runSwitcherCommand(statusArgs, 30000),
    runSwitcherCommand(["telemetry", "--json", "--no-color"], 15000),
  ]);

  let statusData: StatusCliOutput | null = null;
  try {
    statusData = parseJsonOutput<StatusCliOutput>(statusRes.stdout);
  } catch {
    // Fallback without --cached if cached failed
    if (!refresh) {
      const fallback = await runSwitcherCommand(["status", "--json", "--no-color"], 45000);
      statusData = parseJsonOutput<StatusCliOutput>(fallback.stdout);
    } else {
      throw new Error(`Failed to retrieve pool status: ${statusRes.stderr || statusRes.stdout}`);
    }
  }

  let telemetryData: TelemetryCliOutput = {};
  try {
    telemetryData = parseJsonOutput<TelemetryCliOutput>(telemetryRes.stdout);
  } catch {
    telemetryData = {};
  }

  const providers = statusData?.providers || [];
  const antigravity = providers.find((p) => p.provider === "antigravity") || {
    provider: "antigravity",
    active: "",
    accounts: [],
  };

  const accounts: AntigravityAccount[] = (antigravity.accounts || []).map((acc) => {
    const quotaMap = acc.quota || {};
    const quota5h = quotaMap["gemini-5h"];
    const quotaWeekly = quotaMap["gemini-weekly"];
    return {
      account: acc.account,
      active: Boolean(acc.active),
      requests: acc.requests ?? 0,
      rate_limits: acc.rate_limits ?? 0,
      last_used: acc.last_used ?? null,
      cooldown_until: acc.cooldown_until ?? null,
      cooldown_reason: acc.cooldown_reason ?? null,
      auth: acc.auth ?? "ok",
      auth_label: acc.auth_label ?? "OK",
      healthy: Boolean(acc.healthy),
      unhealthy_reason: acc.unhealthy_reason ?? null,
      saved_at: acc.saved_at,
      quota: quotaMap,
      quota_5h: quota5h,
      quota_weekly: quotaWeekly,
      quota_score: typeof acc.quota_score === "number" ? acc.quota_score : 1.0,
      quota_updated_at: acc.quota_updated_at ?? null,
    };
  });

  const activeAccObj = accounts.find((a) => a.active);
  const activeEmail = activeAccObj?.account || antigravity.active || "";
  const overallHealthy = accounts.some((a) => a.healthy && a.active);
  const quotaScore = activeAccObj?.quota_score ?? (accounts.length > 0 ? accounts[0]?.quota_score ?? 1.0 : 1.0);
  const authLabel = activeAccObj?.auth_label ?? (accounts.length > 0 ? accounts[0]?.auth_label ?? "OK" : "NO_ACCOUNTS");

  const banRiskScore = typeof telemetryData.ban_risk_score === "number" ? telemetryData.ban_risk_score : 0;
  const sessionLock = telemetryData.active_lock || null;
  const pacerStats: PacerStats = telemetryData.pacer || {
    total_monitored: 0,
    bursts_smoothed: 0,
    avg_delay_ms: 0,
    total_rate_limits_vault: 0,
  };

  return {
    provider: "antigravity",
    active: activeEmail,
    accounts,
    quota_score: quotaScore,
    ban_risk_score: banRiskScore,
    session_lock: sessionLock,
    pacer_stats: pacerStats,
    healthy: overallHealthy,
    auth_label: authLabel,
    telemetry: telemetryData as Record<string, unknown>,
    updated_at: new Date().toISOString(),
  };
}

/**
 * switchAccount(accountEmail: string, force?: boolean)
 * Invokes `account_switcher.py switch antigravity <email>` and `sync-omp`,
 * promoting the account to ID 1 in `agent.db` and ensuring trigger `purge_antigravity_blocks`.
 */
export async function switchAccount(accountEmail: string, force?: boolean): Promise<SwitchAccountResult> {
  if (!accountEmail || typeof accountEmail !== "string") {
    throw new Error("accountEmail is required");
  }

  const switchArgs = ["switch", "antigravity", accountEmail, "--no-kill", "--json"];
  if (force) {
    switchArgs.push("--force");
  }

  const switchRes = await runSwitcherCommand(switchArgs, 45000);
  let parsedSwitch: SwitchCliOutput | null = null;
  try {
    parsedSwitch = parseJsonOutput<SwitchCliOutput>(switchRes.stdout);
  } catch {
    // continue
  }

  // Always invoke sync-omp to ensure agent.db ordering
  const syncArgs = ["sync-omp", "--json"];
  await runSwitcherCommand(syncArgs, 45000);

  // Guarantee ID 1 promotion and trigger purge_antigravity_blocks directly on agent.db
  const dbConsistency = ensureAgentDbConsistency(accountEmail);

  const ok = (switchRes.exitCode === 0 || parsedSwitch?.ok === true) && dbConsistency.promotedId1;

  return {
    ok,
    action: "switch",
    provider: "antigravity",
    account: accountEmail,
    previous: parsedSwitch?.previous ?? null,
    db_promoted_id_1: dbConsistency.promotedId1,
    trigger_verified: dbConsistency.triggerVerified,
    message: parsedSwitch?.noop
      ? "Account was already active"
      : parsedSwitch?.ok
        ? "Account switched and promoted to ID 1 successfully"
        : switchRes.stderr || "Switch completed",
  };
}

/**
 * rotateNextHealthy(tier?: string, force?: boolean)
 * Invokes `account_switcher.py next antigravity`, selecting mathematically the healthy account
 * with the highest remaining quota.
 */
export async function rotateNextHealthy(tier?: string, force?: boolean): Promise<RotateNextResult> {
  const nextArgs = ["next", "antigravity", "--no-kill", "--json"];
  if (tier) {
    nextArgs.push("--tier", tier);
  }
  if (force) {
    nextArgs.push("--force");
  }

  const nextRes = await runSwitcherCommand(nextArgs, 45000);
  let parsedNext: SwitchCliOutput | null = null;
  try {
    parsedNext = parseJsonOutput<SwitchCliOutput>(nextRes.stdout);
  } catch {
    // continue
  }

  // Sincroniza OMP se foi rotacionado
  await runSwitcherCommand(["sync-omp", "--json"], 30000);

  // Lê a conta ativa atual
  const status = await getPoolStatus(false);
  const activeEmail = status.active;

  const dbConsistency = ensureAgentDbConsistency(activeEmail);

  return {
    ok: nextRes.exitCode === 0 || parsedNext?.ok === true,
    action: "next",
    provider: "antigravity",
    account: activeEmail,
    previous: parsedNext?.previous ?? null,
    db_promoted_id_1: dbConsistency.promotedId1,
    trigger_verified: dbConsistency.triggerVerified,
    message: parsedNext?.error
      ? `Rotation warning/error: ${parsedNext.error}`
      : "Rotated to next healthy account with highest quota",
  };
}

/**
 * refreshPoolOAuth(accountEmail?: string)
 * Invokes `account_switcher.py refresh antigravity`, renewing 3600s OAuth tokens with Google
 * and synchronizing agent.db.
 */
export async function refreshPoolOAuth(accountEmail?: string): Promise<RefreshOAuthResult> {
  const refreshArgs = ["refresh", "antigravity"];
  if (accountEmail) {
    refreshArgs.push(accountEmail);
  }
  refreshArgs.push("--json");

  const refreshRes = await runSwitcherCommand(refreshArgs, 60000);
  let parsed: { refreshed?: Array<{ account: string; ok: boolean; message: string }> } | null = null;
  try {
    parsed = parseJsonOutput<{ refreshed?: Array<{ account: string; ok: boolean; message: string }> }>(refreshRes.stdout);
  } catch {
    // continue
  }

  // Sync OMP
  await runSwitcherCommand(["sync-omp", "--json"], 30000);

  const status = await getPoolStatus(false);
  const dbConsistency = ensureAgentDbConsistency(status.active);

  const refreshedList = parsed?.refreshed || [];

  return {
    ok: refreshRes.exitCode === 0 || Boolean(parsed?.refreshed),
    action: "refresh",
    provider: "antigravity",
    refreshed: refreshedList,
    db_synchronized: dbConsistency.promotedId1 && dbConsistency.triggerVerified,
    message: "OAuth tokens renewed with Google and synced with agent.db",
  };
}

/**
 * gateLock(taskId: string, size?: "light" | "medium" | "heavy")
 * Sets session affinity lock and records starting quota for a Paperclip run.
 */
export async function gateLock(
  taskId: string,
  size: "light" | "medium" | "heavy" = "medium",
): Promise<GateLockResult> {
  if (!taskId || typeof taskId !== "string") {
    throw new Error("taskId is required");
  }

  const validSize = ["light", "medium", "heavy"].includes(size) ? size : "medium";
  const gateArgs = ["gate", "antigravity", "--lock", taskId, "--size", validSize, "--json"];

  const res = await runSwitcherCommand(gateArgs, 30000);
  let parsed: GateCliOutput | null = null;
  try {
    parsed = parseJsonOutput<GateCliOutput>(res.stdout);
  } catch {
    throw new Error(`Failed to apply gate lock: ${res.stderr || res.stdout}`);
  }

  return {
    ok: res.exitCode === 0 || parsed?.ok === true,
    provider: parsed?.provider || "antigravity",
    account: parsed?.account || "",
    quota_pct: parsed?.quota_pct ?? 0,
    min_quota: parsed?.min_quota ?? (validSize === "light" ? 20 : validSize === "heavy" ? 60 : 40),
    size: validSize,
    locked: parsed?.locked ?? true,
    task_id: taskId,
    is_batch: parsed?.is_batch ?? false,
    bucket: parsed?.bucket,
    rotated: parsed?.rotated,
  };
}

/**
 * gateUnlock()
 * Releases session affinity lock and calculates Δ quota consumed during the run.
 */
export async function gateUnlock(): Promise<GateUnlockResult> {
  const gateArgs = ["gate", "antigravity", "--unlock", "--json"];

  const res = await runSwitcherCommand(gateArgs, 30000);
  let parsed: GateCliOutput | null = null;
  try {
    parsed = parseJsonOutput<GateCliOutput>(res.stdout);
  } catch {
    throw new Error(`Failed to release gate lock: ${res.stderr || res.stdout}`);
  }

  return {
    ok: res.exitCode === 0 || parsed?.ok === true,
    action: "unlock",
    task_id: parsed?.task_id,
    provider: parsed?.provider || "antigravity",
    account: parsed?.account,
    size: parsed?.size,
    required_quota: parsed?.required_quota,
    start_quota: parsed?.start_quota,
    end_quota: parsed?.end_quota,
    delta_quota: parsed?.delta_quota,
    duration_s: parsed?.duration_s,
    mid_flight_switch: parsed?.mid_flight_switch,
    finished_at: parsed?.finished_at,
    message: parsed?.message,
  };
}

export const antigravityPoolService = {
  getPoolStatus,
  switchAccount,
  rotateNextHealthy,
  refreshPoolOAuth,
  gateLock,
  gateUnlock,
  ensureAgentDbConsistency,
};

export default antigravityPoolService;
