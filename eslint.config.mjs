// @ts-check
import eslint from "@eslint/js"
import importX from "eslint-plugin-import-x"
import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended"
import globals from "globals"
import tseslint from "typescript-eslint"

export default tseslint.config(
  {
    ignores: [
      // This file.
      "eslint.config.mjs",
      // Any build output
      "**/dist",
      // Ambient type declarations
      "**/*.d.ts",
    ],
  },
  eslint.configs.recommended,
  tseslint.configs.recommended,
  eslintPluginPrettierRecommended,
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      sourceType: "commonjs",
      parserOptions: {
        projectService: true,
      },
    },
  },
  {
    files: ["**/*.ts"],
    plugins: {
      "import-x": importX,
    },
    rules: {
      "@typescript-eslint/no-unsafe-argument": "error",
      // Don't use semi-colons to terminate statements.
      semi: ["error", "never"],
      // Force explicitly stated return types to avoid errors where a function returns 2 different types.
      "@typescript-eslint/explicit-function-return-type": "error",
      // Force public, private, protected to be explicitly stated.
      "@typescript-eslint/explicit-member-accessibility": "error",
      // Ensure promises are handled.
      "@typescript-eslint/no-floating-promises": "error",
      // Allow explicit anys as they are often used in request code e.g. when fetching headers.
      "@typescript-eslint/no-explicit-any": "off",
      // Any prettier issues are a lint error.
      "prettier/prettier": ["error"],
      // Prefer `import { type Foo }` syntax — enables tree-shaking and makes type-vs-value intent explicit.
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { fixStyle: "inline-type-imports" },
      ],
      // Catch passing async functions where a void callback is expected (common NestJS footgun with event handlers).
      "@typescript-eslint/no-misused-promises": "error",
      // Force handling all union/enum cases in switch — prevents silent bugs when a discriminated union grows.
      "@typescript-eslint/switch-exhaustiveness-check": "error",
      // Ensure `return await` inside try/catch so the async stack trace is preserved.
      "@typescript-eslint/return-await": ["error", "in-try-catch"],
      // Prefer `??` over `||` to avoid falsy-value bugs with `0`, `""`, `false`.
      "@typescript-eslint/prefer-nullish-coalescing": "error",
      // Prefer `a?.b` over `a && a.b` — cleaner and less error-prone.
      "@typescript-eslint/prefer-optional-chain": "error",
      // Import sorting and organization. @lib is internal (maps to libs/<name>/src).
      "import-x/order": [
        "error",
        {
          groups: ["builtin", "external", "internal", "parent", "sibling", "index"],
          pathGroups: [
            {
              pattern: "@lib",
              group: "internal",
              position: "before",
            },
            {
              pattern: "@lib/**",
              group: "internal",
              position: "before",
            },
          ],
          pathGroupsExcludedImportTypes: ["builtin"],
          "newlines-between": "always",
          alphabetize: { order: "asc" },
        },
      ],
      // Detect circular dependencies.
      "import-x/no-cycle": "error",
      // Prevent duplicate imports. prefer-inline pairs with consistent-type-imports to inline type specifiers.
      "import-x/no-duplicates": ["error", { "prefer-inline": true }],
    },
  },
)
