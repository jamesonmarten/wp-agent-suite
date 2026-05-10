import type { Config } from "jest";

const config: Config = {
  projects: [
    {
      displayName: "api",
      testMatch: ["**/__tests__/api/**/*.test.ts"],
      testEnvironment: "node",
      transform: {
        "^.+\\.tsx?$": ["ts-jest", { tsconfig: { module: "commonjs" } }],
      },
      moduleNameMapper: { "^@/(.*)$": "<rootDir>/$1" },
      setupFiles: ["<rootDir>/__tests__/setup/env.ts"],
      setupFilesAfterEnv: ["<rootDir>/__tests__/setup/mockOpenAI.ts"],
    },
    {
      displayName: "ui",
      testMatch: ["**/__tests__/ui/**/*.test.tsx"],
      testEnvironment: "jsdom",
      transform: {
        "^.+\\.tsx?$": [
          "ts-jest",
          { tsconfig: { jsx: "react-jsx", module: "commonjs", types: ["@testing-library/jest-dom", "jest"] } },
        ],
      },
      moduleNameMapper: { "^@/(.*)$": "<rootDir>/$1" },
      setupFiles: ["<rootDir>/__tests__/setup/env.ts"],
      setupFilesAfterEnv: [
        "@testing-library/jest-dom",
        "<rootDir>/__tests__/setup/mockOpenAI.ts",
      ],
    },
  ],
};

export default config;
