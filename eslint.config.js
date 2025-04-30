import eslint from "@eslint/js";
import importPlugin from "eslint-plugin-import";
import jsxA11yPlugin from "eslint-plugin-jsx-a11y";
import reactPlugin from "eslint-plugin-react";
import reactHooksPlugin from "eslint-plugin-react-hooks";
import globals from "globals";

export default [
  eslint.configs.recommended,

  // React configuration
  {
    files: ["**/*.{js,jsx}"],
    plugins: {
      "react": reactPlugin,
      "react-hooks": reactHooksPlugin,
      "jsx-a11y": jsxA11yPlugin,
      "import": importPlugin,
    },
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        ...globals.browser,
        ...globals.es2021,
        ...globals.node,
        // Add any additional custom globals here if needed
      },
    },
    settings: {
      "react": {
        version: "detect",
      },
      "import/resolver": {
        node: {
          extensions: [".js", ".jsx"],
        },
      },
    },
    rules: {
      // React rules
      "react/jsx-uses-react": "error",
      "react/jsx-uses-vars": "error",
      "react/jsx-no-undef": "error",
      "react/jsx-key": "error",
      "react/jsx-no-duplicate-props": "error",
      "react/jsx-pascal-case": "error",
      "react/no-direct-mutation-state": "error",
      "react/no-unused-state": "warn",
      "react/self-closing-comp": "warn",
      "react/jsx-curly-brace-presence": ["warn", { props: "never", children: "never" }],

      // React Hooks rules
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",

      // JSX Accessibility rules
      "jsx-a11y/alt-text": "error",
      "jsx-a11y/anchor-has-content": "error",
      "jsx-a11y/anchor-is-valid": "error",
      "jsx-a11y/aria-props": "error",
      "jsx-a11y/aria-role": "error",
      "jsx-a11y/aria-unsupported-elements": "error",
      "jsx-a11y/img-redundant-alt": "error",
      "jsx-a11y/no-noninteractive-element-to-interactive-role": "error",

      // Import rules
      // "import/no-unresolved": "error",
      "import/named": "error",
      "import/default": "error",
      "import/export": "error",
      "import/no-named-as-default": "warn",
      "import/no-duplicates": "error",
      "import/order": [
        "warn",
        {
          "groups": ["builtin", "external", "internal", "parent", "sibling", "index"],
          "newlines-between": "always",
          "alphabetize": {
            order: "asc",
            caseInsensitive: true,
          },
        },
      ],

      // General code quality rules
      "no-console": "warn",
      "no-debugger": "warn",
      "prefer-const": "warn",
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "no-duplicate-imports": "error",
      "no-var": "error",
    },
  },

  // Override for test files
  {
    files: ["**/*.test.{js,jsx}", "**/*.spec.{js,jsx}", "**/__tests__/**"],
    rules: {
      "no-console": "off",
      "react/jsx-no-undef": "off",
      "no-unused-expressions": "off",
    },
  },
];
