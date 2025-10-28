import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";
import react from "eslint-plugin-react";
import prettier from "eslint-config-prettier";
import { fixupPluginRules } from "@eslint/compat";

export default tseslint.config(
    { ignores: ["dist", "node_modules", ".vite", "coverage", "vite.config.ts"] },
    {
        extends: [js.configs.recommended, ...tseslint.configs.recommendedTypeChecked],
        files: ["**/*.{ts,tsx}"],
        languageOptions: {
            ecmaVersion: 2020,
            globals: globals.browser,
            parserOptions: {
                projectService: true,
                tsconfigRootDir: import.meta.dirname,
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
            // TypeScript specific
            "@typescript-eslint/no-unused-vars": [
                "warn",
                {
                    argsIgnorePattern: "^_",
                    varsIgnorePattern: "^_",
                },
            ],
            "@typescript-eslint/no-explicit-any": "warn",
            "@typescript-eslint/no-floating-promises": "warn",
            "@typescript-eslint/no-misused-promises": "warn",
            "@typescript-eslint/no-unsafe-assignment": "warn",
            "@typescript-eslint/no-unsafe-member-access": "warn",
            "@typescript-eslint/no-unsafe-argument": "warn",
            "@typescript-eslint/prefer-promise-reject-errors": "warn",
            // React specific
            "react/prop-types": "off", // Using TypeScript for prop validation
            "react/react-in-jsx-scope": "off", // Not needed in React 17+
            "react/no-unescaped-entities": "off", // Allow quotes and apostrophes in JSX
            // General
            "no-console": ["warn", { allow: ["warn", "error"] }],
        },
    },
    prettier
);
