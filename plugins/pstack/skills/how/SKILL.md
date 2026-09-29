---
name: how
description: "Use for \"how does X work\", code walkthroughs before changing something, and placement / ownership / layering questions (\"where should this live\", \"which package owns this\", \"is this the right layer\"). Explains subsystem architecture, runtime flow, onboarding mental models. Use why for motivation."
---

# How

Explore the codebase to answer "how does X work?" questions. Produce architectural explanations at the level of a senior engineer onboarding onto a subsystem, enough to build a working mental model, not so much that it reads like annotated source code.

Read and follow the [Claude Code delegation contract](../poteto-mode/references/claude-code-delegation.md). Each spawn below names a role line in `pstack-models.md` and a default in [Models](#models). Pass a configured real model or the default; `auto` omits `model` and accepts runtime resolution; `inherit-parent` uses `pstack:inherit` and omits `model`. If the `Agent` tool rejects a slug, use the default and say so. If it rejects the default, use the closest valid slug of the same family from its error message.

## Step 1. Assess Complexity

If the scope is ambiguous, state your interpretation and explore. The user can redirect.

- **Simple** (a single module, a small utility, a narrow question such as "how does function X work"): no explorers. One explainer explores and explains in a single pass. Go to Step 2b.
- **Complex** (a subsystem spanning multiple files or services, a cross-cutting feature, a full architectural overview): spawn parallel explorers first, then hand off to the explainer. Go to Step 2a.

When in doubt, take the simple path.

## Step 2a. Explore (complex questions only)

Decompose the question into 2 to 4 exploration angles, each a distinct slice of the subsystem. Queue all angles, launch up to available capacity, and refill slots as results arrive:

- `subagent_type`: `general-purpose`
- `model`: the `how explorer` line, default in [Models](#models)
- Research only: no writes. The Claude Code `Agent` tool has no `readonly` argument. For strict code-only access, use an available read-tool allowlisted agent definition.

Each explorer gets the prompt in `references/explorer-prompt.md` with its angle filled in. Then go to Step 3.

## Step 2b. Direct Explain (simple questions)

Spawn one `Agent` subagent that explores and explains in one pass:

- `subagent_type`: `general-purpose`
- `model`: the `how explainer` line, default in [Models](#models)
- Research only: no writes; do not pass a `readonly` argument.

Build its prompt from `references/explainer-prompt.md` without the explorer-findings section. Go to Step 4.

## Step 3. Synthesize (complex questions only)

Once all explorers have returned, spawn one `Agent` subagent to synthesize their findings into one explanation:

- `subagent_type`: `general-purpose`
- `model`: the `how explainer` line, default in [Models](#models)
- Research only: no writes; do not pass a `readonly` argument.

Build its prompt from `references/explainer-prompt.md` with every explorer's findings filled in.

## Step 4. Present

Present the explainer's output to the user. Light edits for clarity or context from the conversation are fine. Do not substantially rewrite it.

## Output Format

The explanation uses the sections defined in `references/explainer-prompt.md`, dropping any that do not apply: Overview, Key Concepts, How It Works, Where Things Live, Gotchas.

## Models

Role defaults, stamped from `plugins/pstack/models.json` (edit there, rerun `tools/generate.mjs`). A matching role line in the `pstack-models.md` override sheet overrides each at runtime; `/setup-pstack` writes it and lists its path.

- how explorer: `opus`
- how explainer: `opus`

## Reasoning effort

A role value in the override sheet may name a reasoning effort after its model, as in `opus @xhigh`. Levels: `low`, `medium`, `high`, `xhigh`, `max`. Which ones apply depends on the model. A value without `@` takes the sheet's `default effort` line, a level or `session`, and `session` when the sheet has no such line. `session` sets no agent effort override, so the effective effort follows Claude Code's session and environment settings or caps. Strip the suffix before choosing the model: a model name is passed as `model`; `auto` omits it and accepts Claude Code's runtime default; `inherit-parent` omits it and selects a matching `model: inherit` definition. On Claude Code before 2.1.251, `CLAUDE_CODE_SUBAGENT_MODEL` can override both the invocation and definition. A level picks the effort agent from the `subagent_type` you would otherwise use. `pstack:poteto-agent` becomes `subagent_type: "pstack:poteto-agent-<level>"`; `pstack:poteto-worker` becomes `subagent_type: "pstack:poteto-worker-<level>"`; `general-purpose`, or no `subagent_type`, becomes `subagent_type: "pstack:effort-<level>"`. For `inherit-parent`, use `pstack:poteto-agent-inherit[-<level>]` for the coordinator, `pstack:poteto-worker-inherit[-<level>]` for bounded implementation, or `pstack:inherit[-<level>]` for a generic worker; the bracketed level is omitted for `session`. These definitions set `model: inherit`; explicit model entries still use the non-inherit definitions.
