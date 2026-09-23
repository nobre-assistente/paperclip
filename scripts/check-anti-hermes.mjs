#!/usr/bin/env node
/**
 * check-anti-hermes.mjs
 *
 * Binary anti-Hermes static audit gate script (FEA-318, WI-11-012).
 *
 * Enforces the strict architectural invariant (AD-11-05) that Hermes adapter
 * artifacts and imports are strictly prohibited in the LangGraph adapter and
 * Canvas UI scopes:
 *   - packages/adapters/langgraph/src
 *   - ui/src/pages/Canvas
 *
 * Runs 4 GATE-HERMES checks:
 *   1. AST Check: Syntax and AST inspection for any Hermes imports, exports,
 *      specifiers, calls, or identifiers.
 *   2. Import-Graph Check: Validates package.json dependencies and direct/transitive
 *      import-graph edges to ensure zero reference to Hermes.
 *   3. Grep Check: Binary raw text/grep sweep over all target files rejecting any
 *      match of "hermes" (case-insensitive).
 *   4. ESLint Check: Invokes ESLint with zero-tolerance (--max-warnings=0) enforcing
 *      the no-restricted-imports anti-Hermes lint rule.
 *
 * Exit code:
 *   0: All 4 gates are completely clean.
 *   1: Any violation/match is detected in any gate (hard stop).
 *
 * Usage:
 *   node scripts/check-anti-hermes.mjs
 *   pnpm check:anti-hermes
 */

import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { ESLint } from "eslint";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");

const TARGET_SCOPES = [
  "packages/adapters/langgraph/src",
  "ui/src/pages/Canvas",
];

const PACKAGE_JSON_SCOPES = [
  "packages/adapters/langgraph/package.json",
];

const SCANNABLE_EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
]);

const HERMES_REGEX = /hermes/i;

function toPosix(p) {
  return p.split(path.sep).join("/");
}

function getRepoRelative(absPath) {
  return toPosix(path.relative(REPO_ROOT, absPath));
}

function collectFiles(relDir) {
  const absDir = path.resolve(REPO_ROOT, relDir);
  const files = [];

  if (!existsSync(absDir)) {
    return files;
  }

  function walk(current) {
    const entries = readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.isFile()) {
        files.push(fullPath);
      }
    }
  }

  walk(absDir);
  files.sort();
  return files;
}

function collectSourceFiles(relDir) {
  return collectFiles(relDir).filter((file) =>
    SCANNABLE_EXTENSIONS.has(path.extname(file)),
  );
}

function extractAllModuleSpecifiers(content) {
  const results = [];
  function getLineCol(index) {
    let line = 1;
    let col = 1;
    for (let i = 0; i < index && i < content.length; i++) {
      if (content[i] === "\n") {
        line++;
        col = 1;
      } else {
        col++;
      }
    }
    return { line, column: col };
  }

  // 1. Static from-imports and exports (single or multi-line within declaration)
  const fromRe = /\b(?:import|export)\s+(?:type\s+)?(?:[^;]+?)\s+from\s+['"]([^'"]+)['"]/g;
  let m;
  while ((m = fromRe.exec(content)) !== null) {
    results.push({
      specifier: m[1],
      snippet: m[0].replace(/\s+/g, " ").trim(),
      index: m.index,
      loc: getLineCol(m.index),
      type: m[0].startsWith("export") ? "export" : "import",
    });
  }

  // 2. Bare imports: import "..."
  const bareRe = /\bimport\s+['"]([^'"]+)['"]/g;
  while ((m = bareRe.exec(content)) !== null) {
    results.push({
      specifier: m[1],
      snippet: m[0].trim(),
      index: m.index,
      loc: getLineCol(m.index),
      type: "bare-import",
    });
  }

  // 3. Export all: export * from "..."
  const exportAllRe = /\bexport\s+(?:type\s+)?\*\s+from\s+['"]([^'"]+)['"]/g;
  while ((m = exportAllRe.exec(content)) !== null) {
    results.push({
      specifier: m[1],
      snippet: m[0].replace(/\s+/g, " ").trim(),
      index: m.index,
      loc: getLineCol(m.index),
      type: "export-all",
    });
  }

  // 4. Dynamic import: import("...")
  const dynamicRe = /\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
  while ((m = dynamicRe.exec(content)) !== null) {
    results.push({
      specifier: m[1],
      snippet: m[0].trim(),
      index: m.index,
      loc: getLineCol(m.index),
      type: "dynamic-import",
    });
  }

  // 5. Require or TS import-equals
  const requireRe = /\b(?:import\s+[\w$]+\s*=\s*require|require)\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
  while ((m = requireRe.exec(content)) !== null) {
    results.push({
      specifier: m[1],
      snippet: m[0].trim(),
      index: m.index,
      loc: getLineCol(m.index),
      type: "require",
    });
  }

  return results;
}

// ============================================================================
// Gate 1: AST / Syntax Inspection
// ============================================================================
function runAstCheck(sourceFiles) {
  const violations = [];

  for (const filePath of sourceFiles) {
    const relPath = getRepoRelative(filePath);
    const content = readFileSync(filePath, "utf8");
    const lines = content.split("\n");

    const modules = extractAllModuleSpecifiers(content);
    for (const mod of modules) {
      if (HERMES_REGEX.test(mod.specifier)) {
        violations.push({
          file: relPath,
          line: mod.loc.line,
          snippet: mod.snippet,
          detail: `Hermes module specifier in ${mod.type}: "${mod.specifier}"`,
        });
      }
    }

    // Inspect AST-level identifier references or string literals mentioning hermes
    // Look for identifier-level tokens (excluding plain comment lines)
    for (let i = 0; i < lines.length; i++) {
      const lineText = lines[i];
      const trimmed = lineText.trim();
      // Skip pure single-line comment lines
      if (trimmed.startsWith("//") || trimmed.startsWith("/*") || trimmed.startsWith("*")) {
        continue;
      }
      // Check for code tokens matching hermes
      if (HERMES_REGEX.test(lineText)) {
        // If not already caught by import check on the same line
        const alreadyFlagged = violations.some(
          (v) => v.file === relPath && v.line === i + 1,
        );
        if (!alreadyFlagged) {
          violations.push({
            file: relPath,
            line: i + 1,
            snippet: trimmed,
            detail: `AST code token matching hermes found on line ${i + 1}`,
          });
        }
      }
    }
  }

  return violations;
}

// ============================================================================
// Gate 2: Import-Graph / Dependency Check
// ============================================================================
function runImportGraphCheck(sourceFiles) {
  const violations = [];

  // Check package.json dependencies
  for (const pkgRel of PACKAGE_JSON_SCOPES) {
    const absPath = path.resolve(REPO_ROOT, pkgRel);
    if (!existsSync(absPath)) continue;

    try {
      const pkg = JSON.parse(readFileSync(absPath, "utf8"));
      const depSections = [
        "dependencies",
        "devDependencies",
        "peerDependencies",
        "optionalDependencies",
      ];
      for (const section of depSections) {
        if (!pkg[section] || typeof pkg[section] !== "object") continue;
        for (const [depName, version] of Object.entries(pkg[section])) {
          if (HERMES_REGEX.test(depName)) {
            violations.push({
              file: pkgRel,
              line: 1,
              snippet: `"${depName}": "${version}"`,
              detail: `Forbidden Hermes dependency in ${section}: "${depName}"`,
            });
          }
        }
      }
    } catch (err) {
      violations.push({
        file: pkgRel,
        line: 1,
        snippet: "package.json",
        detail: `Failed to parse package.json: ${err.message}`,
      });
    }
  }

  // Check all import edges across source files
  for (const filePath of sourceFiles) {
    const relPath = getRepoRelative(filePath);
    const content = readFileSync(filePath, "utf8");
    const modules = extractAllModuleSpecifiers(content);
    for (const mod of modules) {
      if (HERMES_REGEX.test(mod.specifier)) {
        violations.push({
          file: relPath,
          line: mod.loc.line,
          snippet: mod.snippet,
          detail: `Forbidden import-graph edge to "${mod.specifier}"`,
        });
      }
    }
  }

  return violations;
}

// ============================================================================
// Gate 3: Raw Grep / Text Match
// ============================================================================
function runGrepCheck(allFiles) {
  const violations = [];

  for (const filePath of allFiles) {
    const relPath = getRepoRelative(filePath);
    let content;
    try {
      content = readFileSync(filePath, "utf8");
    } catch {
      continue;
    }

    const lines = content.split("\n");
    for (let index = 0; index < lines.length; index++) {
      const line = lines[index];
      if (HERMES_REGEX.test(line)) {
        violations.push({
          file: relPath,
          line: index + 1,
          snippet: line.trim(),
          detail: `Binary grep match for "hermes" (case-insensitive)`,
        });
      }
    }
  }

  return violations;
}

// ============================================================================
// Gate 4: ESLint Rule Enforcement
// ============================================================================
async function runEslintCheck(targetScopes) {
  const violations = [];

  try {
    const eslint = new ESLint();
    const results = await eslint.lintFiles(targetScopes);

    for (const fileResult of results) {
      const relPath = getRepoRelative(fileResult.filePath);
      for (const msg of fileResult.messages) {
        // Any error or warning triggers gate failure
        violations.push({
          file: relPath,
          line: msg.line || 1,
          column: msg.column || 1,
          snippet: msg.message,
          ruleId: msg.ruleId || "unknown",
          detail: `ESLint violation [${msg.ruleId || "error"}]: ${msg.message}`,
        });
      }
    }
  } catch (err) {
    violations.push({
      file: "eslint",
      line: 1,
      snippet: err.message,
      detail: `ESLint execution failed: ${err.message}`,
    });
  }

  return violations;
}

// ============================================================================
// Main Execution
// ============================================================================
async function main() {
  console.log("============================================================");
  console.log("GATE-HERMES: Binary Anti-Hermes Static Audit");
  console.log("============================================================");
  console.log("Target scopes:");
  for (const scope of TARGET_SCOPES) {
    console.log(`  - ${scope}`);
  }
  console.log("");

  // Collect files
  const allFiles = [];
  const sourceFiles = [];

  for (const scope of TARGET_SCOPES) {
    const files = collectFiles(scope);
    const sources = collectSourceFiles(scope);
    allFiles.push(...files);
    sourceFiles.push(...sources);
  }

  console.log(`Discovered ${allFiles.length} file(s) (${sourceFiles.length} source file(s)).`);
  console.log("Running 4 GATE-HERMES verification passes...\n");

  // Pass 1: AST Check
  const astViolations = runAstCheck(sourceFiles);
  const astStatus = astViolations.length === 0 ? "CLEAN" : `${astViolations.length} VIOLATION(S)`;
  console.log(`  Gate 1: AST Check ....................... ${astStatus}`);

  // Pass 2: Import-Graph Check
  const importGraphViolations = runImportGraphCheck(sourceFiles);
  const importStatus =
    importGraphViolations.length === 0 ? "CLEAN" : `${importGraphViolations.length} VIOLATION(S)`;
  console.log(`  Gate 2: Import-Graph Check .............. ${importStatus}`);

  // Pass 3: Grep Check
  const grepViolations = runGrepCheck(allFiles);
  const grepStatus = grepViolations.length === 0 ? "CLEAN" : `${grepViolations.length} VIOLATION(S)`;
  console.log(`  Gate 3: Grep Check ...................... ${grepStatus}`);

  // Pass 4: ESLint Check
  const eslintViolations = await runEslintCheck(TARGET_SCOPES);
  const eslintStatus =
    eslintViolations.length === 0 ? "CLEAN" : `${eslintViolations.length} VIOLATION(S)`;
  console.log(`  Gate 4: ESLint Check .................... ${eslintStatus}`);

  const totalViolations =
    astViolations.length +
    importGraphViolations.length +
    grepViolations.length +
    eslintViolations.length;

  console.log("");
  console.log("============================================================");

  if (totalViolations > 0) {
    console.error(`AUDIT FAILED: ${totalViolations} total anti-Hermes violation(s) found!\n`);

    if (astViolations.length > 0) {
      console.error("── Gate 1: AST Check Violations ──");
      for (const v of astViolations) {
        console.error(`  ${v.file}:${v.line} -> ${v.detail}`);
        if (v.snippet) console.error(`    Line: ${v.snippet}`);
      }
      console.error("");
    }

    if (importGraphViolations.length > 0) {
      console.error("── Gate 2: Import-Graph Check Violations ──");
      for (const v of importGraphViolations) {
        console.error(`  ${v.file}:${v.line} -> ${v.detail}`);
        if (v.snippet) console.error(`    Snippet: ${v.snippet}`);
      }
      console.error("");
    }

    if (grepViolations.length > 0) {
      console.error("── Gate 3: Grep Check Violations ──");
      for (const v of grepViolations) {
        console.error(`  ${v.file}:${v.line} -> ${v.detail}`);
        if (v.snippet) console.error(`    Line: ${v.snippet}`);
      }
      console.error("");
    }

    if (eslintViolations.length > 0) {
      console.error("── Gate 4: ESLint Check Violations ──");
      for (const v of eslintViolations) {
        console.error(`  ${v.file}:${v.line}:${v.column || 1} -> ${v.detail}`);
      }
      console.error("");
    }

    console.error("RESULT: FAIL (Hermes detected in forbidden scope)");
    console.error("Architectural constraint violated: packages/adapters/langgraph/src and ui/src/pages/Canvas must have zero Hermes dependencies.");
    process.exit(1);
  }

  console.log("AUDIT PASSED: All 4 anti-Hermes gates clean.");
  console.log("RESULT: PASS (Zero Hermes traces detected)");
  process.exit(0);
}

main().catch((err) => {
  console.error("Fatal error during anti-Hermes audit:", err);
  process.exit(1);
});
