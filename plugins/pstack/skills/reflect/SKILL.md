---
name: reflect
description: Spawn three parallel review subagents over the active transcript, surface learnings, and route each to a concrete edit on an existing skill. Use when the user says reflect.
---

# Reflect

Mine the current conversation for durable learnings, then route them into skill edits.

Read and follow the [Claude Code delegation contract](../poteto-mode/references/claude-code-delegation.md) before dispatch.

## When to invoke

Invoke when the user says "reflect" or "/reflect". Skip when the conversation is trivial, off-topic, or already covered by an existing skill the parent followed correctly. One-offs are not learnings.

## Process

### 1. Locate the active transcript

The parent finds its own transcript file before fanning out. The system prompt names Claude Code's per-project transcripts directory at `~/.claude/projects/<encoded-cwd>/`. Use that path. Do not glob across `~/.claude/projects/`. That crosses workspace boundaries and reads private chats from unrelated projects.

Run the finder at `skills/reflect/scripts/find-transcript.mjs` under the installed plugin with the projects directory and a fragment of the conversation's opening user prompt:

```bash
node <plugin>/skills/reflect/scripts/find-transcript.mjs ~/.claude/projects/<encoded-cwd> "<opening prompt fragment>"
```

It covers the three layouts (flat `<id>.jsonl`, nested `<id>/<id>.jsonl`, subagent `<parent>/subagents/<child>.jsonl`), newest first, and prints the first path whose opening `user` record carries the fragment. Do not reimplement the scan by hand: the first line of a transcript is session metadata, not a message, and files run to several megabytes, so the finder streams each candidate and stops at its first `user` record. If it exits 1, write a tight digest of the session and pass that instead.

### 2. Spawn three reviewers in parallel

Queue three reviewer `Agent` calls and dispatch them within the available session capacity, refilling a slot as each completes. Use `subagent_type: "general-purpose"` for ordinary model choices. Reviewers need MCP access for context lookups (tickets, chat threads, observability traces referenced in the transcript). The prompt forbids file writes. The parent applies edits. Follow `../poteto-mode/references/claude-code-delegation.md` for dispatch and tool limits.

Each reviewer and the synthesizer name a role line in `pstack-models.md` and a default in [Models](#models). Set `model` to a real configured value, or to the default if the sheet or the line is missing. `auto` omits `model` and accepts runtime selection; `inherit-parent` routes through `pstack:inherit` with `model` omitted. If the `Agent` tool rejects a slug, use the default and say so. If it rejects the default, use the closest valid slug of the same family from its error message.

| Lens | Role line | Prompt template |
|---|---|---|
| Judgment | `reflect judgment, divergent, synthesizer` | `references/judgment-reviewer.md` |
| Tooling | `reflect tooling` | `references/tooling-reviewer.md` |
| Divergent | `reflect judgment, divergent, synthesizer` | `references/divergent-reviewer.md` |

Pass each template verbatim, substituting the transcript path or digest where marked. Reviewers return findings in the `Agent` response body.

### 3. Synthesize

One `Agent` call, `subagent_type: "general-purpose"`, with `model` from the `reflect judgment, divergent, synthesizer` line (default in [Models](#models)). Pick a subagent_type that retains MCP access. The synthesizer's quality check includes spot-verifying citations, which can require MCP access. Use `references/synthesizer.md` verbatim, with each reviewer's full output inlined where marked. The synthesizer returns a structured Accepted / Rejected / Backlog list.

### 4. Structural enforcement check

Sanity-check the synthesizer's Accepted list. For any item that would be enforced more reliably by a lint rule, script, metadata flag, or runtime check, move it from Accepted to Backlog. See the **encode-lessons-in-structure** principle skill.

### 5. Apply

Before applying any Accepted edit, present the synthesizer's full Accepted/Rejected/Backlog output to the user and wait for explicit approval. The user picks which subset to apply and may redirect routings. Skill changes affect every future agent in the org. Do not auto-apply.

Backlog items file to whatever devex / backlog tracker your team uses automatically. Only the Accepted list waits for approval.

For each approved Accepted item, follow the Routing field exactly:

- Trivial existing-skill edit (a one-line bullet, a tightened sentence, a stale fact corrected): parent does directly.
- Substantive existing-skill edit (a new section, a new pattern table, more than ~10 lines): hand to the **plugin-dev:skill-development** skill and run its draft / test / iterate loop.
- `tune description: <skill path>` (the skill exists but didn't trigger when it should have): hand to `plugin-dev:skill-development` and run its description-optimization loop.
- `new skill via plugin-dev:skill-development: <kebab-name>`: hand creation to `plugin-dev:skill-development`. Do not invent the shape ad hoc.

If your environment ships a SKILL.md validator, run it on every touched skill before declaring done. Skip this step if it doesn't.

### 6. Summarize for the user

Short list, no preamble:

- Edits applied: `<skill path>`. What changed, one line each.
- New skills created: `<skill path>`. One line each (rare).
- Backlog filed to the devex tracker: `<issue title>` (`<tags>`). One line each.
- Dropped: one line per rejected finding + reason from the synthesizer.

## Models

Role defaults, stamped from `plugins/pstack/models.json` (edit there, rerun `tools/generate.mjs`). A matching role line in the `pstack-models.md` override sheet overrides each at runtime; `/setup-pstack` writes it and lists its path.

- reflect tooling: `opus`
- reflect judgment, divergent, synthesizer: `opus`

## Reasoning effort

A role value in the override sheet may name a reasoning effort after its model, as in `opus @xhigh`. Levels: `low`, `medium`, `high`, `xhigh`, `max`. Which ones apply depends on the model. A value without `@` takes the sheet's `default effort` line, a level or `session`, and `session` when the sheet has no such line. `session` sets no agent effort override, so the effective effort follows Claude Code's session and environment settings or caps. Strip the suffix before choosing the model: a model name is passed as `model`; `auto` omits it and accepts Claude Code's runtime default; `inherit-parent` omits it and selects a matching `model: inherit` definition. On Claude Code before 2.1.251, `CLAUDE_CODE_SUBAGENT_MODEL` can override both the invocation and definition. A level picks the effort agent from the `subagent_type` you would otherwise use. `pstack:poteto-agent` becomes `subagent_type: "pstack:poteto-agent-<level>"`; `pstack:poteto-worker` becomes `subagent_type: "pstack:poteto-worker-<level>"`; `general-purpose`, or no `subagent_type`, becomes `subagent_type: "pstack:effort-<level>"`. For `inherit-parent`, use `pstack:poteto-agent-inherit[-<level>]` for the coordinator, `pstack:poteto-worker-inherit[-<level>]` for bounded implementation, or `pstack:inherit[-<level>]` for a generic worker; the bracketed level is omitted for `session`. These definitions set `model: inherit`; explicit model entries still use the non-inherit definitions.
