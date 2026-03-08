import { defineConfig, globalIgnores } from "eslint/config";
import globals from "globals";
import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import perfectionist from "eslint-plugin-perfectionist";
import checkFile from "eslint-plugin-check-file";
import eslintConfigPrettier from "eslint-config-prettier/flat";

export default defineConfig([
    eslint.configs.recommended,
    ...tseslint.configs.recommended,
    reactHooks.configs.flat.recommended,
    globalIgnores(["**/*.js", "node_modules/**", "dist/**", "public/**"]),
    {
        languageOptions: {
            ecmaVersion: "latest",
            sourceType: "module",
            globals: {
                ...globals.browser,
                ...globals.node,
            },
        },
        files: ["**/*.{ts,tsx}"],
        plugins: {
            perfectionist,
            "check-file": checkFile,
        },
        rules: {
            // TypeScript
            "@typescript-eslint/no-explicit-any": "error",
            "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
            "@typescript-eslint/consistent-type-imports": "error",

            // Tri des imports
            "perfectionist/sort-imports": [
                "error",
                {
                    type: "natural",
                    groups: ["builtin", "external", "internal", "parent", "sibling", "index"],
                },
            ],
            "perfectionist/sort-named-imports": "error",

            // Nommage des fichiers
            "check-file/filename-naming-convention": ["error", { "**/*.{ts,tsx}": "KEBAB_CASE" }, { ignoreMiddleExtensions: true }],
            "check-file/folder-naming-convention": ["error", { "src/**/": "KEBAB_CASE" }],

            // Qualité
            "no-console": ["warn", { allow: ["warn", "error", "info", "log"] }],
            "prefer-const": "error",
            eqeqeq: ["error", "always"],
        },
    },
    eslintConfigPrettier,
]);
