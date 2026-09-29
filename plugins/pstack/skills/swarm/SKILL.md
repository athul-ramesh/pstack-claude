---
name: swarm
description: "Fan out N parallel workers, drain them, and return one report. Use for /swarm, 'swarm this', or parallel coverage, races, gauntlets, and exploration."
---

# Swarm

Fan out N parallel workers. They may cover separate slices, race the same brief, or mix both. The parent waits, aggregates, and returns one report.

Read and follow the [Claude Code delegation contract](../poteto-mode/references/claude-code-delegation.md) before dispatch.

## Start

Open a todolist with one entry per phase before launching anything.

1. Frame
2. Fan out
3. Aggregate
4. Report

## Phase A: Frame

1. State the done predicate and the artifact or report the swarm must return.
2. Choose the shape. Partition into slices, race N workers on identical briefs, or mix both. For a race or mixed shape, declare `first pass`, `rank all`, or `best-of` before spawning.
3. Set N from the user or derive it from the shape. N is total workers, not the number that run at once.
4. Pick the worker model from the `swarm workers` line in `pstack-models.md`. If the sheet or that line is missing, use the default in [Models](#models). Follow `../poteto-mode/references/claude-code-delegation.md`: `auto` omits `model` and accepts runtime selection; `inherit-parent` uses `pstack:inherit` with `model` omitted. If the `Agent` tool rejects a slug, use the default and say so. If it rejects the default, use the closest valid slug of the same family from its error message. For a model race, name each arm's model up front.
5. Give each worker its own writable output when it writes. When workers verify or measure commits, each brief names the exact SHAs. A measurement brief also names the method (sample count, what one sample is, order). The worker records both in its result.

## Phase B: Fan out

Queue all N workers and launch only as many as available session capacity allows. Refill each slot as a worker finishes until all N have run. Use `subagent_type: "general-purpose"` for ordinary model values or `auto`, and `pstack:inherit` for `inherit-parent`; use the matching effort variant when selected. Request background execution when its available tools satisfy the brief. Claude Code subagents all run on this machine. Repository writers need separate worktrees; independent artifact writers need separate output directories.

When a worker must start from a non-default branch, check that branch out in the worker's own worktree and name the worktree path in its brief.

Every brief stands alone. Include the goal, scope, exact slice or race arm, how to verify, and what to report. Reports use `PASS`, `ISSUES`, or `BLOCKED` with evidence. A worker that can prove a defect reports `ISSUES` and lists every issue it can prove, not only the first.

If a worker fails after starting, follow the workflow's retry rule or report a dropout. A capacity rejection stays queued for the next free slot and does not reduce N.

## Phase C: Aggregate

Read the terminal results. Drop a result that does not record the SHAs and method its brief names, and rerun that worker once. After a second miss, record a gap. A gap does not count as a pass. For coverage, every required slice needs a result. For a race, apply the selection rule declared up front. Use first pass, rank all, or best-of. Do not paste raw worker dumps.

Keep a compact result table, one-line evidenced issues, and explicit gaps or dropouts.

## Phase D: Report

Return one consolidated in-chat report with the table, issue one-liners, gaps or dropouts, and the race rule when used.

## Models

Role defaults, stamped from `plugins/pstack/models.json` (edit there, rerun `tools/generate.mjs`). A matching role line in the `pstack-models.md` override sheet overrides each at runtime; `/setup-pstack` writes it and lists its path.

- swarm workers: `opus`

## Reasoning effort

A role value in the override sheet may name a reasoning effort after its model, as in `opus @xhigh`. Levels: `low`, `medium`, `high`, `xhigh`, `max`. Which ones apply depends on the model. A value without `@` takes the sheet's `default effort` line, a level or `session`, and `session` when the sheet has no such line. `session` sets no agent effort override, so the effective effort follows Claude Code's session and environment settings or caps. Strip the suffix before choosing the model: a model name is passed as `model`; `auto` omits it and accepts Claude Code's runtime default; `inherit-parent` omits it and selects a matching `model: inherit` definition. On Claude Code before 2.1.251, `CLAUDE_CODE_SUBAGENT_MODEL` can override both the invocation and definition. A level picks the effort agent from the `subagent_type` you would otherwise use. `pstack:poteto-agent` becomes `subagent_type: "pstack:poteto-agent-<level>"`; `pstack:poteto-worker` becomes `subagent_type: "pstack:poteto-worker-<level>"`; `general-purpose`, or no `subagent_type`, becomes `subagent_type: "pstack:effort-<level>"`. For `inherit-parent`, use `pstack:poteto-agent-inherit[-<level>]` for the coordinator, `pstack:poteto-worker-inherit[-<level>]` for bounded implementation, or `pstack:inherit[-<level>]` for a generic worker; the bracketed level is omitted for `session`. These definitions set `model: inherit`; explicit model entries still use the non-inherit definitions.
