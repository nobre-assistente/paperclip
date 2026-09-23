function getLineCol(text, index) {
  let line = 1;
  let col = 0;
  for (let i = 0; i < index && i < text.length; i++) {
    if (text[i] === "\n") {
      line++;
      col = 0;
    } else {
      col++;
    }
  }
  return { line, column: col };
}

const customTsModuleParser = {
  parseForESLint(text) {
    const body = [];

    // Static from-imports and exports (including multiline and type imports)
    const fromRe = /\b(?:import|export)\s+(?:type\s+)?[\s\S]*?\s+from\s+['"]([^'"]+)['"]/g;
    let m;
    while ((m = fromRe.exec(text)) !== null) {
      const source = m[1];
      const start = m.index;
      const end = start + m[0].length;
      body.push({
        type: m[0].startsWith("export") ? "ExportNamedDeclaration" : "ImportDeclaration",
        specifiers: [],
        source: {
          type: "Literal",
          value: source,
          raw: JSON.stringify(source),
          loc: { start: getLineCol(text, start), end: getLineCol(text, end) },
          range: [start, end],
        },
        loc: { start: getLineCol(text, start), end: getLineCol(text, end) },
        range: [start, end],
      });
    }

    // Bare imports: import "..."
    const bareImportRe = /\bimport\s+['"]([^'"]+)['"]/g;
    while ((m = bareImportRe.exec(text)) !== null) {
      const source = m[1];
      const start = m.index;
      const end = start + m[0].length;
      body.push({
        type: "ImportDeclaration",
        specifiers: [],
        source: {
          type: "Literal",
          value: source,
          raw: JSON.stringify(source),
          loc: { start: getLineCol(text, start), end: getLineCol(text, end) },
          range: [start, end],
        },
        loc: { start: getLineCol(text, start), end: getLineCol(text, end) },
        range: [start, end],
      });
    }

    // Dynamic imports: import("...")
    const dynamicRe = /\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
    while ((m = dynamicRe.exec(text)) !== null) {
      const source = m[1];
      const start = m.index;
      const end = start + m[0].length;
      body.push({
        type: "ImportDeclaration",
        specifiers: [],
        source: {
          type: "Literal",
          value: source,
          raw: JSON.stringify(source),
          loc: { start: getLineCol(text, start), end: getLineCol(text, end) },
          range: [start, end],
        },
        loc: { start: getLineCol(text, start), end: getLineCol(text, end) },
        range: [start, end],
      });
    }

    // TS import equals: import x = require("...") or require("...")
    const tsRequireRe = /\b(?:import\s+[\w$]+\s*=\s*require|require)\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
    while ((m = tsRequireRe.exec(text)) !== null) {
      const source = m[1];
      const start = m.index;
      const end = start + m[0].length;
      body.push({
        type: "TSImportEqualsDeclaration",
        moduleReference: {
          type: "TSExternalModuleReference",
          expression: {
            type: "Literal",
            value: source,
            raw: JSON.stringify(source),
            loc: { start: getLineCol(text, start), end: getLineCol(text, end) },
            range: [start, end],
          },
        },
        loc: { start: getLineCol(text, start), end: getLineCol(text, end) },
        range: [start, end],
      });
    }

    return {
      ast: {
        type: "Program",
        sourceType: "module",
        body,
        tokens: [],
        comments: [],
        loc: { start: { line: 1, column: 0 }, end: getLineCol(text, text.length) },
        range: [0, text.length],
      },
    };
  },
};

export default [
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/.git/**",
      "**/build/**",
      "**/coverage/**",
      "**/storybook-static/**",
      "**/data/**",
      "docker/**",
      "scripts/**",
      "evals/**",
      "tests/**",
      "server/**",
      "cli/**",
      "tools/**",
      "announcements/**",
      "design/**",
      "doc/**",
      "docs/**",
      "patches/**",
      "releases/**",
      "report/**",
      "screenshots/**",
      "skills/**",
      "skills-releases/**",
    ],
  },
  {
    files: [
      "packages/adapters/langgraph/**/*.{ts,tsx,js,jsx,mjs,cjs}",
      "ui/src/pages/Canvas/**/*.{ts,tsx,js,jsx,mjs,cjs}",
      "*__lint_probe__*.{ts,tsx,js,jsx,mjs,cjs}",
      "**/__lint_probe__*.{ts,tsx,js,jsx,mjs,cjs}",
      "__lint_probe__.ts",
    ],
    languageOptions: {
      parser: customTsModuleParser,
    },
    linterOptions: {
      noInlineConfig: true,
    },
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@paperclipai/hermes-paperclip-adapter",
              message:
                "Importing @paperclipai/hermes-paperclip-adapter is forbidden in LangGraph adapter and Canvas modules (AD-11-05).",
            },
          ],
          patterns: [
            {
              group: ["@paperclipai/hermes-paperclip-adapter/*"],
              message:
                "Importing subpaths of @paperclipai/hermes-paperclip-adapter is forbidden in LangGraph adapter and Canvas modules (AD-11-05).",
            },
          ],
        },
      ],
    },
  },
];

