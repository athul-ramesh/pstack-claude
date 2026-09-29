# pstack reference

Start with the [README](../README.md) for installation and your first task.

## Slash commands

The package includes 54 skill directories: 31 public skills and 23 `principle-*` references. Claude Code invokes them as `/pstack:<name>`.

Find each skill's instructions in the [skills tree](../plugins/pstack/skills/).

| command | use it when |
| --- | --- |
| `/poteto-mode` | default entry point for any non-trivial task |
| `/how` | walk through how a subsystem works |
| `/why` | investigate why something was built this way (parallel multi-MCP evidence) |
| `/architect` | settle types and module shape before writing code that crosses a function boundary |
| `/arena` | run N parallel attempts at the same task and pick the best parts |
| `/interrogate` | have three different models try to break a diff |
| `/automate-me` | draft your own personal -mode skill from recent transcripts |
| `/reflect` | capture a long task's lessons as a skill edit |
| `/tdd` | fix a bug by writing the failing test first, then the fix |
| `/typescript-best-practices` | ground type-system discipline in TypeScript syntax |
| `/teach` | explain a subsystem plainly by composing how + why |
| `/swarm` | fan out N parallel workers across slices or races, then return one aggregated report |
| `/technical-writing` | write docs, RFCs, readmes, PR descriptions, and commit messages to one layered standard |
| `/bro` | restate the last message in plain human language, no jargon |
| `/figure-it-out` | design a rigorous, auditable playbook for a task no bundled playbook fits |
| `/show-me-your-work` | log decisions to a reviewable tsv decision trail |
| `/blast-radius` | find what a change could break beyond the diff and prove safety by running code |
| `/recall` | catch up on recent working context from chat history, live state, and the shared record |
| `/setup-pstack` | configure pstack per-role model choices |
| `/unslop` | clean up writing by removing AI tells |
| `/no-comments` | strip comments before review, fix the accepted findings, encode claimed constraints |
| `/create-verification-skill` | generate a project-local verification skill and feature map |
| `/maintain-verification-skill` | re-sync a drifted verification skill and its feature map |
| `/deslop` | deslop a diff before commit |
| `/babysit` | monitor an open PR, fix CI/comments, keep it merge-ready |
| `/thermo-nuclear-code-quality-review` | extremely strict maintainability audit |
| `/make-pr-easy-to-review` | clean noisy history and improve PR description before review |
| `/fix-ci` | find failing PR checks, inspect logs, apply focused fixes |
| `/fix-merge-conflicts` | non-interactively resolve merge conflicts, validate, finalize |
| `/get-pr-comments` | fetch and summarize review comments from the active PR |
| `/what-did-i-get-done` | summarize authored commits over a user-chosen period |

## Runtime support

pstack is a Claude Code plugin. The [marketplace install](../README.md#install) registers the repository's catalog and installs the plugin, which ships the skills, the subagent and effort-agent definitions, and the automatic routing hook.

| Runtime | Setup and recorded verification |
| --- | --- |
| Claude Code | Install the marketplace plugin. Skills use Claude tool names and model defaults; the plugin installs automatic routing. |

### Automatic routing

The plugin installs a [SessionStart hook](../plugins/pstack/hooks/session-start.sh) that loads a short [routing instruction](../plugins/pstack/hooks/session-start-context.md) on startup, resume, clear, and compact. The instruction invokes `poteto-mode` when a task meets any of these conditions:

- It touches more than one file or changes a signature other files call.
- It involves a design or architecture choice.
- It concerns a bug with an unknown cause or a performance issue.

Smaller tasks proceed directly. The full skill loads when invoked, and explicit user instructions take precedence.

To disable routing, run `/pstack:setup-pstack` and turn off the session hook. You can also write `session hook: off` in the override sheet the skill writes, `pstack-models.md` under the Claude Code configuration directory. The hook reads that setting before injecting its instruction. Without the setting, routing stays on.

## Configuration and dependencies

Invoke [setup-pstack](../plugins/pstack/skills/setup-pstack/SKILL.md) to choose models for each role. It detects available models, confirms the choices, and writes an override sheet at `pstack-models.md` under the Claude Code configuration directory (`$CLAUDE_CONFIG_DIR` or `~/.claude`), wired in through an `@` include in `CLAUDE.md`. Defaults live in [models.json](../plugins/pstack/models.json).

For design comparisons and reviews, choose distinct models you have access to. The default panel uses different Claude models.

Install dependencies for the workflows you use:

| Dependency | When you need it |
| --- | --- |
| GitHub CLI, `gh` | PR monitoring and shipping. Authenticate with `gh auth login`. |
| Bun | The bundled `watch-pr` and `orch` scripts. Their bootstrap installs script dependencies on first run. |
| Graphite CLI, `gt` | The Orchestrate playbook and `orch` stack frontier. Shipping and autopilot playbooks use `gh` or Origin's CLI when available. |
| `plugin-dev` | Claude Code skill-authoring guidance used by `automate-me`, `reflect`, and `poteto-mode`. |

Install the Claude Code skill-authoring companion with:

```text
/plugin marketplace add anthropics/claude-plugins-official
/plugin install plugin-dev@claude-plugins-official
```

Those authoring workflows need `plugin-dev` for their guidance; other workflows do not.

Playbooks use Claude Code's task-tracking tools or an uncommitted `todo.md` checklist. The repository documents `CLAUDE_CODE_ENABLE_TODO_TOOLS=1`; see [platform adaptation](../plugins/pstack/skills/poteto-mode/SKILL.md#platform-adaptation).

Use [create-verification-skill](../plugins/pstack/skills/create-verification-skill/SKILL.md) to record how the agent should run and check your project, following the [driver policy](../plugins/pstack/skills/poteto-mode/SKILL.md#non-negotiables).

## Maintenance

### Repository layout

```text
.claude-plugin/marketplace.json    Claude Code marketplace
plugins/pstack/
  .claude-plugin/plugin.json      Claude Code plugin manifest
  skills/                         Skills, references, and scripts
  agents/                         Subagent definitions
  effort-agents/                  Generated per-effort-level agents
  hooks/                          Startup routing
tools/                            Generation and validation
tests/                            Repository checks
```

Agent references and license files are included under `poteto-mode/references/`.

### Generated files and checks

The [generator](../tools/generate.mjs) updates versions, model defaults, and portable reference files. The [slash-command table](#slash-commands) is documentation only: keep a row for every public skill, with `poteto-mode` first. The generator reports any skill missing a row or any row without a skill.

[Documentation fact tests](../tests/readme-facts.test.mjs) check the skill counts. The table parser requires the header `| command | use it when |`.

Run the generator and repository tests with Bun:

```shell
bun tools/generate.mjs
bun test tests/
```

CI also checks shell scripts, workflows, Markdown, relative links, and the bundled Bun tools. See [local checks](../CONTRIBUTING.md#things-that-will-fail-ci) for commands and [release instructions](../CONTRIBUTING.md#releasing) for versioning and the live Claude Code command check.

### Port scope and attribution

The skill tree was forked from upstream `12d587d` (upstream v0.15.5). Releases through 0.9.50 kept it synced against upstream cursor/plugins; the repository is now maintained standalone for Claude Code.

This repository ports Lauren Tan's pstack from Cursor to Claude Code. It includes seven cursor-team-kit skills and an independently authored `babysit` skill. The port supplies Claude Code plugin registration and routing.

Cursor-specific automations, sticky-mode metadata, the Grok Bot UI workflow, and the Cursor UI tutorial are excluded. [CHANGES.md](../CHANGES.md) records each release. The bundled `thermo-nuclear-code-quality-review` provides a maintainability review when a workflow calls for one.

Skill changes land here directly; there is no upstream sync anymore.

See the [license summary](../README.md#license) for licenses and full-plugin attribution.
