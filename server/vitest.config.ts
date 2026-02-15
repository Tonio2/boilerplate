import path from "path";

import { defineConfig } from "vitest/config";

export default defineConfig({
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "src"),
            "@config": path.resolve(__dirname, "src/config"),
            "@features": path.resolve(__dirname, "src/features"),
        },
    },
    test: {
        globals: true,
        environment: "node",
        testTimeout: 30000,
        hookTimeout: 60000,
        exclude: ["dist/**", "node_modules/**"],
        isolate: true,
        fileParallelism: false,
        globalSetup: ["src/test/global-setup.ts"],
        setupFiles: ["src/test/setup.ts"],
    },
});
