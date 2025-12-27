import js from "@eslint/js";
import prettier from "eslint-config-prettier";
import importPlugin from "eslint-plugin-import";
import unusedImports from "eslint-plugin-unused-imports";
import globals from "globals";
import tseslint from "typescript-eslint";

// React plugins (for client)
import { fixupPluginRules } from "@eslint/compat";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";

export default tseslint.config(
    // Global ignores
    {
        ignores: [
            "**/node_modules/**",
            "**/dist/**",
            "**/build/**",
            "**/.vite/**",
            "**/coverage/**",
            "client/vite.config.ts",
        ],
    },

    // Base configuration for all TypeScript files
    {
        files: ["**/*.{ts,tsx}"],
        extends: [js.configs.recommended, ...tseslint.configs.recommendedTypeChecked],
        plugins: {
            import: importPlugin,
            "unused-imports": unusedImports,
        },
        rules: {
            // Import ordering
            "import/order": [
                "error",
                {
                    groups: [
                        "builtin", // Node.js built-ins
                        "external", // npm packages
                        "internal", // Aliased imports (@config, @features, etc.)
                        "parent", // ../
                        "sibling", // ./
                        "index", // ./index
                        "type", // type imports
                    ],
                    pathGroups: [
                        {
                            pattern: "@/**",
                            group: "internal",
                            position: "before",
                        },
                        {
                            pattern: "@config/**",
                            group: "internal",
                            position: "before",
                        },
                        {
                            pattern: "@features/**",
                            group: "internal",
                            position: "before",
                        },
                        {
                            pattern: "@shared/**",
                            group: "internal",
                            position: "before",
                        },
                    ],
                    pathGroupsExcludedImportTypes: ["builtin"],
                    "newlines-between": "always",
                    alphabetize: {
                        order: "asc",
                        caseInsensitive: true,
                    },
                },
            ],
            // Unused imports - auto-remove on fix
            "unused-imports/no-unused-imports": "error",
            "unused-imports/no-unused-vars": [
                "warn",
                {
                    vars: "all",
                    varsIgnorePattern: "^_",
                    args: "after-used",
                    argsIgnorePattern: "^_",
                },
            ],
            // Disable the base rule as it can report incorrect errors
            "@typescript-eslint/no-unused-vars": "off",
            "@typescript-eslint/no-explicit-any": "warn",
            "no-console": ["warn", { allow: ["warn", "error"] }],
        },
    },

    // Client-specific configuration (React)
    {
        files: ["client/**/*.{ts,tsx}"],
        languageOptions: {
            ecmaVersion: 2020,
            globals: globals.browser,
            parserOptions: {
                projectService: true,
                tsconfigRootDir: import.meta.dirname + "/client",
            },
        },
        settings: {
            react: {
                version: "detect",
            },
        },
        plugins: {
            "react-hooks": fixupPluginRules(reactHooks),
            "react-refresh": reactRefresh,
            react: fixupPluginRules(react),
        },
        rules: {
            ...reactHooks.configs.recommended.rules,
            ...react.configs.recommended.rules,
            ...react.configs["jsx-runtime"].rules,
            "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
            "@typescript-eslint/no-floating-promises": "warn",
            "@typescript-eslint/no-misused-promises": "warn",
            "@typescript-eslint/no-unsafe-assignment": "warn",
            "@typescript-eslint/no-unsafe-member-access": "warn",
            "@typescript-eslint/no-unsafe-argument": "warn",
            "@typescript-eslint/prefer-promise-reject-errors": "warn",
            "react/prop-types": "off",
            "react/react-in-jsx-scope": "off",
            "react/no-unescaped-entities": "off",
            // With new JSX transform (react-jsx), React doesn't need to be imported
            "react/jsx-uses-react": "off",
        },
    },

    // Server-specific configuration (Node.js/Express)
    {
        files: ["server/**/*.ts"],
        languageOptions: {
            ecmaVersion: 2020,
            globals: globals.node,
            parserOptions: {
                projectService: true,
                tsconfigRootDir: import.meta.dirname + "/server",
            },
        },
        rules: {
            // Server-specific rules
            "@typescript-eslint/no-floating-promises": "error", // Stricter for backend
            "@typescript-eslint/no-misused-promises": "error",
            "no-console": "off", // Allow console in server
        },
    },

    // Prettier must be last to override formatting rules
    prettier
);
