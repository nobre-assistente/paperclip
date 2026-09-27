#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import process from "node:process";
import {
  FENIX_GENESIS_COMPANY_ID,
  FENIX_ORCHESTRATOR_AGENT_ID,
  FENIX_WAVE6_SPECIALISTS,
} from "../packages/shared/src/seeds/fenix-wave6-specialists.js";

const DATABASE_URL =
  process.env.DATABASE_URL ||
  "postgres://paperclip:paperclip@127.0.0.1:5432/paperclip";

function parseDatabaseUrl(urlStr: string) {
  try {
    const parsed = new URL(urlStr);
    return {
      host: parsed.hostname || "127.0.0.1",
      port: parsed.port || "5432",
      user: decodeURIComponent(parsed.username || "paperclip"),
      password: decodeURIComponent(parsed.password || "paperclip"),
      database: parsed.pathname.replace(/^\//, "") || "paperclip",
    };
  } catch {
    return {
      host: "127.0.0.1",
      port: "5432",
      user: "paperclip",
      password: "paperclip",
      database: "paperclip",
    };
  }
}

export function executeSql(
  sqlContent: string,
  databaseUrl = DATABASE_URL,
): string {
  const dbParams = parseDatabaseUrl(databaseUrl);
  const args = [
    "-h",
    dbParams.host,
    "-p",
    dbParams.port,
    "-U",
    dbParams.user,
    "-d",
    dbParams.database,
  ];

  const env = {
    ...process.env,
    PGPASSWORD: dbParams.password,
  };

  return execFileSync("psql", args, {
    input: sqlContent,
    env,
    encoding: "utf-8",
  });
}

function escapeSqlString(str: string): string {
  return str.replace(/'/g, "''");
}

function escapeSqlJson(obj: unknown): string {
  return `'${escapeSqlString(JSON.stringify(obj))}'::jsonb`;
}

export function buildSpecialistsSeedSql(): string {
  const statements: string[] = [
    "-- Seeding Idempotente dos 20 Especialistas da Wave 6 no Paperclip",
    "BEGIN;",
  ];

  for (const spec of FENIX_WAVE6_SPECIALISTS) {
    const reportsToSql = spec.reportsTo
      ? `'${spec.reportsTo}'::uuid`
      : "NULL";

    statements.push(`
      -- Cargo ${spec.cargo}: ${spec.name} (${spec.role})
      INSERT INTO agents (
        id,
        company_id,
        name,
        role,
        title,
        status,
        reports_to,
        capabilities,
        adapter_type,
        adapter_config,
        runtime_config,
        permissions,
        icon,
        metadata,
        created_at,
        updated_at
      ) VALUES (
        '${spec.id}'::uuid,
        '${spec.companyId}'::uuid,
        '${escapeSqlString(spec.name)}',
        '${escapeSqlString(spec.role)}',
        '${escapeSqlString(spec.title)}',
        '${spec.status}',
        ${reportsToSql},
        '${escapeSqlString(spec.capabilities)}',
        '${spec.adapterType}',
        ${escapeSqlJson(spec.adapterConfig)},
        ${escapeSqlJson(spec.runtimeConfig)},
        ${escapeSqlJson(spec.permissions)},
        '${spec.icon}',
        ${escapeSqlJson(spec.metadata)},
        NOW(),
        NOW()
      )
      ON CONFLICT (id) DO UPDATE SET
        company_id = EXCLUDED.company_id,
        name = EXCLUDED.name,
        role = EXCLUDED.role,
        title = EXCLUDED.title,
        status = EXCLUDED.status,
        reports_to = EXCLUDED.reports_to,
        capabilities = EXCLUDED.capabilities,
        adapter_type = EXCLUDED.adapter_type,
        adapter_config = EXCLUDED.adapter_config,
        runtime_config = EXCLUDED.runtime_config,
        permissions = EXCLUDED.permissions,
        icon = EXCLUDED.icon,
        metadata = EXCLUDED.metadata,
        updated_at = NOW();

      INSERT INTO company_memberships (
        company_id,
        principal_type,
        principal_id,
        status,
        membership_role,
        created_at,
        updated_at
      ) VALUES (
        '${spec.companyId}'::uuid,
        'agent',
        '${spec.id}',
        'active',
        'member',
        NOW(),
        NOW()
      )
      ON CONFLICT (company_id, principal_type, principal_id) DO UPDATE SET
        status = 'active',
        membership_role = 'member',
        updated_at = NOW();
    `);
  }

  statements.push("COMMIT;");
  return statements.join("\n");
}

export function seedFenixSpecialists(databaseUrl = DATABASE_URL) {
  console.log("=== SEEDING FÊNIX WAVE 6 SPECIALISTS ===");
  console.log(`Target Database: ${databaseUrl.replace(/:[^:@]+@/, ":***@")}`);
  console.log(`Target Company:  ${FENIX_GENESIS_COMPANY_ID}`);

  // 1. Verify company exists
  const checkCompanySql = `SELECT id, name FROM companies WHERE id = '${FENIX_GENESIS_COMPANY_ID}'::uuid;`;
  const companyOutput = executeSql(checkCompanySql, databaseUrl);
  if (!companyOutput.includes(FENIX_GENESIS_COMPANY_ID)) {
    throw new Error(
      `Company ${FENIX_GENESIS_COMPANY_ID} not found in database!`,
    );
  }
  console.log(`Found target company: ${FENIX_GENESIS_COMPANY_ID}`);

  // 2. Verify orchestrator agent exists
  const checkOrchestratorSql = `SELECT id, name, role FROM agents WHERE id = '${FENIX_ORCHESTRATOR_AGENT_ID}'::uuid;`;
  const orchestratorOutput = executeSql(checkOrchestratorSql, databaseUrl);
  if (orchestratorOutput.includes(FENIX_ORCHESTRATOR_AGENT_ID)) {
    console.log(`Found existing orchestrator: ${FENIX_ORCHESTRATOR_AGENT_ID}`);
  } else {
    console.warn(`Warning: Orchestrator ${FENIX_ORCHESTRATOR_AGENT_ID} not found.`);
  }

  // 3. Execute Seeding
  console.log(`\nSeeding ${FENIX_WAVE6_SPECIALISTS.length} specialists idempotently...`);
  const seedSql = buildSpecialistsSeedSql();
  executeSql(seedSql, databaseUrl);

  for (const spec of FENIX_WAVE6_SPECIALISTS) {
    console.log(
      `  [UPSERT] Cargo ${String(spec.cargo).padStart(2)}: ${spec.name.padEnd(35)} (${spec.role.padEnd(18)}) -> ${spec.id}`,
    );
  }

  // 4. Verify count
  const countSql = `SELECT COUNT(*)::text AS count FROM agents WHERE company_id = '${FENIX_GENESIS_COMPANY_ID}'::uuid;`;
  const countRaw = executeSql(countSql, databaseUrl);
  const match = countRaw.match(/\b(\d+)\b/);
  const totalAgents = match ? Number.parseInt(match[1], 10) : -1;

  console.log(`\nTotal agents in company ${FENIX_GENESIS_COMPANY_ID}: ${totalAgents}`);

  if (totalAgents !== 21) {
    throw new Error(
      `Verification failed: expected exactly 21 agents in company, got ${totalAgents}!`,
    );
  }

  console.log("SUCCESS: Exactly 21 agents verified in company Genesis (1 orchestrator + 20 specialists).\n");

  // 5. Query and format summary list
  const listSql = `
    SELECT
      id,
      name,
      role,
      title,
      status,
      adapter_type,
      adapter_config->>'assistantId' AS assistant_id
    FROM agents
    WHERE company_id = '${FENIX_GENESIS_COMPANY_ID}'::uuid
    ORDER BY
      CASE WHEN role = 'general' AND name LIKE '%Orchestrator%' THEN 0 ELSE 1 END,
      name ASC;
  `;
  const listOutput = executeSql(listSql, databaseUrl);
  console.log(listOutput);

  return {
    success: true,
    totalAgents,
    count: totalAgents,
  };
}

// Run directly when called from CLI
const isDirectExecution =
  process.argv[1] &&
  (process.argv[1].endsWith("seed-fenix-specialists.ts") ||
    process.argv[1].endsWith("seed-fenix-specialists.js") ||
    process.argv[1].endsWith("seed-fenix-specialists.mjs"));

if (isDirectExecution) {
  try {
    seedFenixSpecialists();
    process.exit(0);
  } catch (err) {
    console.error("FATAL ERROR seeding Fênix specialists:", err);
    process.exit(1);
  }
}
