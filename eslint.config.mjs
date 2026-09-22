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
