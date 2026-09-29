import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../plugins/pstack/skills", import.meta.url));
const read = (path) => readFileSync(join(root, path), "utf8");

describe("Claude Code delegation guidance", () => {
  test("research skills do not pass an unsupported readonly Agent argument", () => {
    for (const path of ["how/SKILL.md", "why/SKILL.md", "interrogate/SKILL.md", "arena/SKILL.md"]) {
      expect(read(path)).not.toMatch(/`readonly`\s*:\s*`(?:true|false)`/);
    }
  });

  test("fan-out work preserves the requested total under a capacity limit", () => {
    for (const path of ["swarm/SKILL.md", "arena/SKILL.md", "why/SKILL.md", "interrogate/SKILL.md"]) {
      const skill = read(path);
      expect(skill).toMatch(/(?:rolling|refill)/i);
      expect(skill).toMatch(/capacity/i);
    }
    const contract = read("poteto-mode/references/claude-code-delegation.md");
    expect(contract).toMatch(/capacity rejection stays queued|keep that item queued/i);
    expect(contract).toMatch(/refill each free slot/i);
  });

  test("lifecycle and model aliases have distinct documented semantics", () => {
    const contract = read("poteto-mode/references/claude-code-delegation.md");
    expect(contract).toMatch(/`SendMessage`.*continue/);
    expect(contract).toMatch(/`TaskStop`.*cancel/);
    expect(contract).toMatch(/`auto`.*runtime resolution/);
    expect(contract).toMatch(/`inherit-parent`.*actual parent model/);
    expect(contract).toMatch(/v2\.1\.250 and earlier/);
    expect(contract).toMatch(/CLAUDE_CODE_SUBAGENT_MODEL_FORCE/);
  });
});
