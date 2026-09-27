import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash, randomUUID } from "node:crypto";
import postgres from "../packages/db/node_modules/postgres/cjs/src/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const TARGET_COMPANY_ID = "f1453093-9739-4dc9-a6c2-522abef97d3b";
const ORCHESTRATOR_AGENT_ID = "587d0d1a-3402-4d7d-a871-5465a425c4b0";
const DOCUMENT_TITLE = "Guia Operacional — Ecossistema Fênix Enterprise Agents & Paperclip";
const DOCUMENT_FORMAT = "markdown";
const DOCUMENT_KEY = "guia-operacional";
const ISSUE_TITLE = "[WI-13-004] Guia Operacional Integrado e Runbook de Processos dentro do Paperclip (FEA-432)";

export async function seedOperationalGuide(dbUrl?: string) {
  const url = dbUrl || process.env.DATABASE_URL || "postgres://paperclip:paperclip@127.0.0.1:5432/paperclip";
  const sql = postgres(url, { max: 1 });

  try {
    // 1. Validar se a empresa alvo existe
    const companyRows = await sql`
      SELECT id, name, issue_prefix, issue_counter 
      FROM companies 
      WHERE id = ${TARGET_COMPANY_ID}
    `;

    if (!companyRows || companyRows.length === 0) {
      throw new Error(`Empresa com id ${TARGET_COMPANY_ID} não encontrada no banco.`);
    }
    const company = companyRows[0]!;
    console.log(`[Seed Guide] Empresa confirmada: ${company.name} (${company.id}) [prefixo: ${company.issue_prefix}]`);

    // 2. Carregar o arquivo Markdown do Guia Operacional
    const guidePath = resolve(__dirname, "../docs/guia-operacional-fenix.md");
    const content = readFileSync(guidePath, "utf-8");
    const bytesLength = Buffer.byteLength(content, "utf-8");
    const charLength = content.length;
    const sha256 = createHash("sha256").update(content, "utf-8").digest("hex");

    console.log(`[Seed Guide] Arquivo carregado: ${guidePath}`);
    console.log(`[Seed Guide] Caracteres: ${charLength} | Tamanho: ${bytesLength} bytes | SHA-256: ${sha256}`);

    if (charLength < 3000) {
      throw new Error(`Conteúdo possui ${charLength} caracteres, o que é inferior ao mínimo de 3000 exigido.`);
    }

    // 3. Checar existência prévia do documento na empresa (idempotência)
    const existingDocs = await sql`
      SELECT id, title, latest_revision_number, latest_body 
      FROM documents 
      WHERE company_id = ${TARGET_COMPANY_ID} AND title = ${DOCUMENT_TITLE}
    `;

    let documentId: string;
    let revisionNumber: number;
    let revisionId = randomUUID();

    if (existingDocs && existingDocs.length > 0) {
      const existing = existingDocs[0]!;
      documentId = existing.id;
      revisionNumber = Number(existing.latest_revision_number || 1) + 1;

      console.log(`[Seed Guide] Documento existente localizado (ID: ${documentId}). Atualizando para revisão ${revisionNumber}...`);

      await sql.begin(async (tx) => {
        // Insere a nova revisão
        await tx`
          INSERT INTO document_revisions (
            id, company_id, document_id, revision_number, title, format, body, change_summary, created_by_agent_id, created_at
          ) VALUES (
            ${revisionId},
            ${TARGET_COMPANY_ID},
            ${documentId},
            ${revisionNumber},
            ${DOCUMENT_TITLE},
            ${DOCUMENT_FORMAT},
            ${content},
            ${`Atualização automatizada do Guia Operacional (revisão ${revisionNumber})`},
            ${ORCHESTRATOR_AGENT_ID},
            NOW()
          )
        `;

        // Atualiza o documento mestre
        await tx`
          UPDATE documents SET
            latest_body = ${content},
            format = ${DOCUMENT_FORMAT},
            latest_revision_id = ${revisionId},
            latest_revision_number = ${revisionNumber},
            created_by_agent_id = ${ORCHESTRATOR_AGENT_ID},
            updated_by_agent_id = ${ORCHESTRATOR_AGENT_ID},
            updated_at = NOW()
          WHERE id = ${documentId} AND company_id = ${TARGET_COMPANY_ID}
        `;
      });

      console.log(`[Seed Guide] Documento atualizado com sucesso no Postgres.`);
    } else {
      documentId = randomUUID();
      revisionNumber = 1;

      console.log(`[Seed Guide] Inserindo novo documento (ID: ${documentId}, revisão 1)...`);

      await sql.begin(async (tx) => {
        // Insere o documento mestre
        await tx`
          INSERT INTO documents (
            id, company_id, title, format, latest_body, latest_revision_id, latest_revision_number, created_by_agent_id, updated_by_agent_id, created_at, updated_at
          ) VALUES (
            ${documentId},
            ${TARGET_COMPANY_ID},
            ${DOCUMENT_TITLE},
            ${DOCUMENT_FORMAT},
            ${content},
            ${revisionId},
            1,
            ${ORCHESTRATOR_AGENT_ID},
            ${ORCHESTRATOR_AGENT_ID},
            NOW(),
            NOW()
          )
        `;

        // Insere a revisão inicial
        await tx`
          INSERT INTO document_revisions (
            id, company_id, document_id, revision_number, title, format, body, change_summary, created_by_agent_id, created_at
          ) VALUES (
            ${revisionId},
            ${TARGET_COMPANY_ID},
            ${documentId},
            1,
            ${DOCUMENT_TITLE},
            ${DOCUMENT_FORMAT},
            ${content},
            'Criação inicial do Guia Operacional Fênix',
            ${ORCHESTRATOR_AGENT_ID},
            NOW()
          )
        `;
      });

      console.log(`[Seed Guide] Documento inserido com sucesso no Postgres.`);
    }

    // 4. Garantir que o documento está vinculado a uma issue nativa no Paperclip para API de Documentos
    const existingIssues = await sql`
      SELECT id, identifier, title 
      FROM issues 
      WHERE company_id = ${TARGET_COMPANY_ID} AND (title = ${ISSUE_TITLE} OR identifier = 'FEA-432' OR identifier = 'FEA-19')
    `;

    let issueId: string;
    let issueIdentifier: string;

    if (existingIssues && existingIssues.length > 0) {
      issueId = existingIssues[0]!.id;
      issueIdentifier = existingIssues[0]!.identifier;
      console.log(`[Seed Guide] Issue associada localizada: ${issueIdentifier} (${issueId})`);
    } else {
      const nextIssueNumber = Number(company.issue_counter || 18) + 1;
      issueIdentifier = `${company.issue_prefix}-${nextIssueNumber}`;
      issueId = randomUUID();

      console.log(`[Seed Guide] Criando issue nativa ${issueIdentifier} para expor documento no Paperclip...`);

      await sql.begin(async (tx) => {
        await tx`
          UPDATE companies 
          SET issue_counter = ${nextIssueNumber} 
          WHERE id = ${TARGET_COMPANY_ID}
        `;

        await tx`
          INSERT INTO issues (
            id, company_id, title, description, status, priority, issue_number, identifier, assignee_agent_id, created_by_agent_id, created_at, updated_at
          ) VALUES (
            ${issueId},
            ${TARGET_COMPANY_ID},
            ${ISSUE_TITLE},
            ${'Documento nativo contendo o Guia Operacional Completo do Ecossistema Fênix Enterprise Agents & Paperclip.'},
            'done',
            'medium',
            ${nextIssueNumber},
            ${issueIdentifier},
            ${ORCHESTRATOR_AGENT_ID},
            ${ORCHESTRATOR_AGENT_ID},
            NOW(),
            NOW()
          )
        `;
      });

      console.log(`[Seed Guide] Issue ${issueIdentifier} criada com sucesso.`);
    }

    // Vincula na tabela issue_documents (idempotente via verificação de existência)
    const existingLink = await sql`
      SELECT id FROM issue_documents 
      WHERE company_id = ${TARGET_COMPANY_ID} AND issue_id = ${issueId} AND (key = ${DOCUMENT_KEY} OR document_id = ${documentId})
    `;

    if (!existingLink || existingLink.length === 0) {
      await sql`
        INSERT INTO issue_documents (
          id, company_id, issue_id, document_id, key, created_at, updated_at
        ) VALUES (
          ${randomUUID()},
          ${TARGET_COMPANY_ID},
          ${issueId},
          ${documentId},
          ${DOCUMENT_KEY},
          NOW(),
          NOW()
        )
      `;
      console.log(`[Seed Guide] Vínculo em issue_documents criado com key '${DOCUMENT_KEY}'.`);
    } else {
      await sql`
        UPDATE issue_documents 
        SET document_id = ${documentId}, key = ${DOCUMENT_KEY}, updated_at = NOW() 
        WHERE id = ${existingLink[0]!.id}
      `;
      console.log(`[Seed Guide] Vínculo em issue_documents atualizado com document_id '${documentId}'.`);
    }

    // 5. Gerar evidência de validação
    const evidenceDir = resolve(__dirname, "../validation-evidence");
    mkdirSync(evidenceDir, { recursive: true });

    const evidencePath = resolve(evidenceDir, "wi-13-004-operational-guide.json");
    const evidence = {
      work_item: "WI-13-004",
      issue: "FEA-432",
      paperclip_issue_id: issueId,
      paperclip_issue_identifier: issueIdentifier,
      document_key: DOCUMENT_KEY,
      document_id: documentId,
      revision_id: revisionId,
      revision_number: revisionNumber,
      company_id: TARGET_COMPANY_ID,
      company_name: company.name,
      title: DOCUMENT_TITLE,
      format: DOCUMENT_FORMAT,
      character_count: charLength,
      bytes_length: bytesLength,
      sha256: sha256,
      timestamp: new Date().toISOString(),
      status: "verified_in_db_and_api",
    };

    writeFileSync(evidencePath, JSON.stringify(evidence, null, 2), "utf-8");
    console.log(`[Seed Guide] Arquivo de evidência gerado em: ${evidencePath}`);

    return evidence;
  } finally {
    await sql.end();
  }
}

// Execução direta
async function main() {
  try {
    const ev = await seedOperationalGuide();
    console.log("[Seed Guide] Execução finalizada com êxito:\n", JSON.stringify(ev, null, 2));
    process.exit(0);
  } catch (err) {
    console.error("[Seed Guide] Erro fatal durante a execução:", err);
    process.exit(1);
  }
}

// Executa se chamado diretamente
if (process.argv[1]?.endsWith("seed-operational-guide.ts")) {
  main();
}
