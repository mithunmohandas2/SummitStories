import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTypescript,
  {
    rules: {
      "@next/next/no-img-element": "off",
      "react/no-unescaped-entities": "off",
    },
  },
  globalIgnores([".next/**", "out/**", "next-env.d.ts", ".npm-cache/**", ".playwright/**", "test-results/**", "playwright-report/**"]),
]);
