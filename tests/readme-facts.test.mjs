// Documentation states counts and the historical upstream pin in prose. Each is
// derivable from the tree or recorded in CHANGES.md, so this pins every
// occurrence to its source instead of trusting a hand edit to keep up.
import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { agentSkills, publicSkills } from "../tools/generate.mjs";

const repoRoot = fileURLToPath(new URL("..", import.meta.url));
const documentation = ["README.md", "docs/reference.md"]
  .map((file) => readFileSync(join(repoRoot, file), "utf8"))
  .join("\n");
const changelog = readFileSync(join(repoRoot, "CHANGES.md"), "utf8");
const skillsDir = join(repoRoot, "plugins/pstack/skills");
const total = agentSkills(skillsDir).length;
const publicCount = publicSkills(skillsDir).length;
const principles = total - publicCount;

const numbersBefore = (phrase) => [...documentation.matchAll(new RegExp(`(\\d+) (?:${phrase})`, "g"))].map((m) => Number(m[1]));

describe("README and reference facts match the tree", () => {
  test("skill directory count", () => {
    const found = numbersBefore("skill directories|Agent Skills");
    expect(found.length).toBeGreaterThan(0);
    for (const n of found) expect(n).toBe(total);
  });

  test("public skill count", () => {
    const found = numbersBefore("are public workflows|public workflows|public skills");
    expect(found.length).toBeGreaterThan(0);
    for (const n of found) expect(n).toBe(publicCount);
  });

  test("principle leaf count", () => {
    const found = numbersBefore("`principle-\\*`");
    expect(found.length).toBeGreaterThan(0);
    for (const n of found) expect(n).toBe(principles);
  });

  test("each documented upstream pin is a SHA the changelog records", () => {
    const named = [...documentation.matchAll(/upstream `([0-9a-f]{7,40})`/g)].map((m) => m[1]);
    expect(named.length).toBeGreaterThan(0);
    for (const sha of named) expect(changelog).toContain(sha);
  });
});
