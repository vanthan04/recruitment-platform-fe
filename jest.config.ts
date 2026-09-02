import type { Config } from "jest";

// Not using next/jest here: it transforms via SWC, and on this machine the
// native SWC binary is blocked by a Windows Application Control policy — the
// WASM fallback it downloads mangles "@/..." path aliases during transform
// (rewrites them to broken relative paths before Jest's moduleNameMapper
// ever sees them). Babel (next/babel preset) sidesteps that entirely and is
// Next.js's own documented fallback transform for Jest.
const config: Config = {
  testEnvironment: "jest-environment-jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  transform: {
    "^.+\\.(js|jsx|ts|tsx|mjs)$": ["babel-jest", { configFile: "./babel.jest.config.js" }],
  },
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "^.+\\.(css|sass|scss)$": "<rootDir>/jest/style-mock.ts",
    "^.+\\.(png|jpg|jpeg|gif|webp|avif|ico|bmp|svg)$": "<rootDir>/jest/file-mock.ts",
    "^server-only$": "<rootDir>/jest/empty-mock.ts",
    "^next/cache$": "<rootDir>/jest/next-cache-mock.ts",
  },
};

export default config;
