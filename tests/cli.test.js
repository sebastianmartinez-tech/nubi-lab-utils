import assert from "node:assert";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";

import { runCli } from "../dist/cli/index.js";

const readFile = (target) => fs.readFile(target, "utf8");

test("scaffolds API and hooks for a resource", async () => {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "sutils-"));
    const originalCwd = process.cwd();

    try {
        process.chdir(tempDir);
        await runCli(["create", "users"]);

        const apiPath = path.join(tempDir, "api", "users", "index.ts");
        const hookPath = path.join(
            tempDir,
            "hooks",
            "users",
            "useUsers.ts"
        );
        const hooksIndexPath = path.join(tempDir, "hooks", "users", "index.ts");

        const [apiContent, hookContent, hooksIndexContent] = await Promise.all([
            readFile(apiPath),
            readFile(hookPath),
            readFile(hooksIndexPath),
        ]);

        assert.ok(apiContent.includes("listUsers"));
        assert.ok(apiContent.includes("createUser"));
        assert.ok(hookContent.includes("useUsers"));
        assert.ok(hookContent.includes("useCreateUser"));
        assert.ok(hooksIndexContent.includes("export * from"));
    } finally {
        process.chdir(originalCwd);
        await fs.rm(tempDir, { recursive: true, force: true });
    }
});
