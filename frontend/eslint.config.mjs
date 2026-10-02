import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// Full Next.js + TypeScript + React Hooks rule sets, no rules switched off.
const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Native Android project (contains a copy of the built web bundle)
    "android/**",
  ]),
]);

export default eslintConfig;
