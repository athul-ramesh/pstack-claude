---
name: setup-pstack
description: Configure which models pstack uses per role. Detects available models and writes the override sheet. Use for /setup-pstack, "configure pstack models", changing pstack's model choices, or turning the SessionStart hook on or off.
---

# Setup pstack

Write the per-role model override sheet. Each pstack skill names a default model inline; the override sheet adapts those defaults to the models you actually have access to.

Claude Code has no auto-applied "rules" mechanism like Cursor's `.mdc`. The Claude Code config directory is `$CLAUDE_CONFIG_DIR` when that variable is set and `~/.claude` otherwise. This skill calls it `<config>`. Inclusion is explicit: the user adds a line to `<config>/CLAUDE.md` (or their project `CLAUDE.md`) such as:

```text
@<config>/pstack-models.md
```

with `<config>` written as the resolved path, so the file is loaded as context for every session.

## Steps

### 1. Detect available models

Read and follow the [Claude Code delegation contract](../poteto-mode/references/claude-code-delegation.md). Enumerate the model names the exposed `Agent` tool accepts in this session, including any accepted full model IDs. The family defaults appear in [Models](#models); an alias can resolve to the parent's exact model when it is already in that family. Ask the user to confirm any additional slugs they want available. Never write a real slug you have not confirmed is available. The sheet tokens `auto` and `inherit-parent` are always valid, but are not model slugs. `auto` omits `model` and accepts runtime selection. `inherit-parent` routes through a matching shipped `model: inherit` agent definition with the invocation `model` omitted. On Claude Code before v2.1.251, an environment override can defeat inheritance.

### 2. Load current state

The default role-to-model mapping is the rule shape shown in the Write the override sheet step below. If the sheet already exists, read it and treat its values as the current choices. Otherwise start from those defaults. A line whose role is not in that shape, such as `how critics`, is from a retired role. An older sheet may name full model IDs that start with `claude-`. Keep one if this session's `Agent` tool accepts it; otherwise replace it with an available family name and show that rewrite in step 3.

### 3. Map and confirm

Show every role with its current model, marking any real slug not in the detected set as needing a choice. Also list each line step 2 dropped or rewrote. Ask whether to accept as-is or change specific roles, offering the detected models plus `inherit-parent` and `auto` as the options. Prefer `AskUserQuestion` over free text. For panel roles (arena runners, architect runners, interrogate reviewers) the value is a list, and one subagent runs per entry, alias entries included, so the list length sets the count. `arena cross-judge pool` is also a list, but Arena selects one value from it whose model family differs from the parent's when possible. `swarm workers` is the default model for every worker unless a race or comparison assigns another model per arm.

Then ask for the default reasoning effort, the `default effort` line. It is `session`, which requests the session's effort, or one of the levels in [Models](#models). Start from the default listed there. Every role value without a suffix uses it. Then ask whether any role should request another level. On Claude Code a role value may carry one after its slug, as in `<slug> @xhigh`; panel entries take their own, as in `<slug> @xhigh, <slug> @max`. Each level dispatches through the plugin's effort agent of that level. The available and effective level depends on the model and runtime. Leave the suffix off for the default effort.

### 4. Choose whether the session hook routes tasks

The plugin's `SessionStart` hook injects the poteto-mode mandate on startup, resume, clear, and compact. Ask whether to keep the hook. The default is on. The answer is the `session hook` line in the sheet: `on` or `off`. With no sheet or no line, the hook injects.

### 5. Validate

Every real slug written must be in the detected set. `inherit-parent` and `auto` always pass. Validate the slug without any `@<level>` suffix, and the level against the effort levels in [Models](#models). The `default effort` value is one of those levels or `session`. If a chosen real slug or level is not available, stop and ask again.

### 6. Write the override sheet

Write the sheet with the shape below. Overwrite the whole file so re-runs stay idempotent.

```markdown
# pstack model configuration

Per-role model overrides for pstack skills. Each pstack SKILL.md names its defaults in a Models section; the values here override those defaults. Delete a line to fall back to the skill default. `auto` omits the invocation model and uses Claude Code's runtime model order; `inherit-parent` uses `pstack:inherit`, `pstack:poteto-agent-inherit`, or `pstack:poteto-worker-inherit` (and their effort variants), each with `model: inherit`; on Claude Code before 2.1.251, `CLAUDE_CODE_SUBAGENT_MODEL` may override either choice. An alias entry in a panel list still counts toward that panel's fan-out. A model may carry a reasoning effort, as in `opus @xhigh` (levels: low, medium, high, xhigh, max); the role then runs through the pstack effort agent of that level, each entry of a panel list on its own. `default effort` sets the level for a value without one; `session` sets no agent effort override and lets Claude Code's session, environment, and caps determine effective effort. `session hook: off` stops the SessionStart hook from injecting the poteto-mode mandate; any other value, or no line, leaves it on.

feature, refactoring: opus
bug-fix: fable
perf-issue: fable
hillclimb: fable
judgment and prose: opus
strongest judgment: fable
how explorer: opus
how explainer: opus
why investigators: opus
why synthesizer: opus
reflect tooling: opus
reflect judgment, divergent, synthesizer: opus
arena runners: opus, fable, sonnet
arena cross-judge pool: opus, fable, sonnet
swarm workers: opus
architect runners: opus, fable, sonnet
interrogate reviewers: opus, fable, sonnet

default effort: session
session hook: on
```

### 7. Wire it in

If `<config>/CLAUDE.md` does not already include `<config>/pstack-models.md`, append an `@` line naming the sheet's resolved path, such as `@~/.claude/pstack-models.md`, so the model rows load on every session. If the user prefers project scope, add the include to the project's `CLAUDE.md` instead.

### 8. Confirm

Tell the user where the override was written, how its model rows load, and whether the plugin hook is on. Re-running this skill updates the override sheet.

## Models

Stamped from `plugins/pstack/models.json` (edit there, rerun `tools/generate.mjs`).

- Available Claude models: `opus`, `fable`, `sonnet`, `haiku`
- Default panel: `opus`, `fable`, `sonnet`
- Reasoning effort levels: `low`, `medium`, `high`, `xhigh`, `max`
- Default reasoning effort: `session`
- Single-role default: `opus`
