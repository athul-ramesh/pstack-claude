// The shipped SessionStart command, run for real: the mandate is injected
// unless the Claude Code model sheet turns it off.
import { describe, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { agentSkills } from "../tools/generate.mjs";

const pluginRoot = fileURLToPath(new URL("../plugins/pstack/", import.meta.url));
const mandate = readFileSync(join(pluginRoot, "hooks/session-start-context.md"), "utf8");

// Claude Code loads hooks/hooks.json by convention.
const sessionStart = JSON.parse(readFileSync(join(pluginRoot, "hooks/hooks.json"), "utf8")).hooks.SessionStart[0];

// CLAUDE_CONFIG_DIR is only present when the user has relocated the Claude
// Code configuration directory. PLUGIN_ROOT is a generic name any shell
// profile may export, so it must not move where the hook looks for the sheet.
const runtimes = {
  claude: { sheetDir: ".claude", env: () => ({}) },
  "claude with CLAUDE_CONFIG_DIR": {
    sheetDir: "claude-config",
    env: (sheetRoot) => ({ CLAUDE_CONFIG_DIR: sheetRoot }),
  },
  "claude with PLUGIN_ROOT exported": { sheetDir: ".claude", env: () => ({ PLUGIN_ROOT: pluginRoot }) },
};

function runHook(runtime, sheet, command = sessionStart.hooks[0].command) {
  const home = mkdtempSync(join(tmpdir(), "pstack-hook-"));
  const { sheetDir, env } = runtimes[runtime];
  const sheetRoot = join(home, sheetDir);
  if (sheet !== null) {
    mkdirSync(sheetRoot);
    writeFileSync(join(sheetRoot, "pstack-models.md"), sheet);
  }
  try {
    const r = spawnSync("sh", ["-c", command], {
      env: { PATH: process.env.PATH, HOME: home, CLAUDE_PLUGIN_ROOT: pluginRoot, ...env(sheetRoot) },
      encoding: "utf8",
    });
    return { status: r.status, out: r.stdout, err: r.stderr };
  } finally {
    rmSync(home, { recursive: true, force: true });
  }
}

describe("SessionStart hook", () => {
  test("declares the hook with no runtime argument", () => {
    expect(sessionStart.matcher).toBe("startup|resume|clear|compact");
    expect(sessionStart.hooks[0].command).toBe('"${CLAUDE_PLUGIN_ROOT}/hooks/session-start.sh"');
  });

  test("names only skills that exist", () => {
    const named = [...mandate.matchAll(/(?:pstack:|`\/)([a-z0-9-]+)/g)].map((m) => m[1]);
    const skills = new Set(agentSkills(join(pluginRoot, "skills")).map(({ name }) => name));
    expect(named).toContain("poteto-mode");
    expect(named.filter((name) => !skills.has(name))).toEqual([]);
  });

  for (const runtime of Object.keys(runtimes)) {
    describe(runtime, () => {
      test("injects the mandate when no sheet exists", () => {
        expect(runHook(runtime, null)).toEqual({ status: 0, out: mandate, err: "" });
      });

      test("injects the mandate when the sheet has no session hook line", () => {
        expect(runHook(runtime, "bug-fix: configured-model\n")).toEqual({ status: 0, out: mandate, err: "" });
      });

      test("injects the mandate when the sheet says on", () => {
        expect(runHook(runtime, "bug-fix: configured-model\nsession hook: on\n")).toEqual({
          status: 0,
          out: mandate,
          err: "",
        });
      });

      test("injects nothing when the sheet says off", () => {
        expect(runHook(runtime, "bug-fix: configured-model\nsession hook: off\n")).toEqual({
          status: 0,
          out: "",
          err: "",
        });
      });
    });
  }
});
