import { defineConfig } from "vitest/config";
import path from "path";

// Scoped to this project's own src/ only — teacher-dashboard, student-
// dashboard, growth-os, and mcam-backend are separate npm projects with
// their own tooling (same reasoning as the tsconfig.json `exclude` fix:
// don't let a bare test/typecheck run sweep in sibling projects).
export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node",
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
