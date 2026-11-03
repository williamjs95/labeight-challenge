import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import sonarjs from "eslint-plugin-sonarjs";

const config = [
  ...nextVitals,
  ...nextTs,
  // Same rules SonarLint/SonarQube apply to JS/TS, so CI catches them too.
  sonarjs.configs.recommended,
  {
    rules: { "@next/next/no-html-link-for-pages": "off" },
  },
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "coverage/**",
      "playwright-report/**",
      "test-results/**",
      "next-env.d.ts",
    ],
  },
];

export default config;
