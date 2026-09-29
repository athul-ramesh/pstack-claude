# pstack

Lauren Tan's [pstack](https://github.com/cursor/plugins/tree/main/pstack) is an opinionated Cursor skill stack that improves agent outcomes. This is a port for Claude Code, maintained as a standalone fork of upstream cursor/plugins.

Tell `poteto-mode` your goal and it will invoke the correct workflow for the task. It keeps your code concise, simple and verified.

## Install

Run in Claude Code:

```text
/plugin marketplace add athul-ramesh/pstack-claude
/plugin install pstack@pstack-claude
```

Run `/pstack:setup-pstack` to change model defaults, set a reasoning effort per role (for example `arena runners: opus @xhigh, fable @max`, which Claude Code dispatches through the plugin's `pstack:effort-<level>` or `pstack:poteto-agent-<level>` agents; roles without a level keep the session's effort unless the sheet's `default effort` line names one), or turn automatic routing off.

Delegation uses Claude Code's local subagents. A bounded code task uses `pstack:poteto-worker`; a separately delegated workflow uses `pstack:poteto-agent` as its coordinator. The playbooks require separate worktrees for concurrent file writers and a check of the intended base, since native isolation starts from the repository's default branch by default. See [delegation and version support](docs/reference.md#delegation-and-version-support).

## Getting started

```text
Use poteto-mode to fix the search filter resetting when I change pages.
```

For a bug, it reproduces the failure, uses `how` and `why` to investigate, delegates the fix, then reruns the failing case. If the fix crosses a function boundary, it brings in `architect` before implementation. You receive the fix and the failing and passing evidence.

[Other playbooks](plugins/pstack/skills/poteto-mode/SKILL.md#playbooks) cover planning, features, refactoring, performance issues, investigations, prototypes, PR maintenance, shipping, and longer projects.

![A request enters poteto-mode. Playbook options include Plan, Bugs, Features, and Refactor. Planning can use architect, arena, or swarm; review and verification can use interrogate, tests, and measurements. Supporting skills include how, why, and unslop. The output is Finished work validated.](assets/pstack-overview.png)

## Details

- [Skills and slash commands](docs/reference.md#slash-commands)
- [Runtime setup](docs/reference.md#runtime-support)
- [Models and dependencies](docs/reference.md#configuration-and-dependencies)
- [Maintenance and port scope](docs/reference.md#maintenance)

## Data handling

pstack is Markdown instructions, a session hook, and local scripts. It runs no server, collects no telemetry, and sends no data anywhere itself. What each part touches:

- The SessionStart hook reads one file, `pstack-models.md`, from the Claude Code configuration directory (`$CLAUDE_CONFIG_DIR` or `~/.claude`) to decide whether to inject the poteto-mode mandate. It reads nothing else and sends nothing.
- The `watch-pr` and `ship-pr` scripts call the GitHub CLI (`gh`) with your own login to read and act on your own pull requests. They read no token themselves and talk to no service other than GitHub through `gh`.
- On first use, those scripts install their one npm dependency, `commander`, at the version pinned in `bun.lock`, into the plugin's own `scripts/node_modules`.
- `watch-pr/live-merge-safety.mjs` runs only when you start it by hand with `--live-disposable`; it creates a private repository on your `gh` account, drives `ship-pr` against it, and deletes it.
- `worktree-audit.mjs` and the `recall` and `eval` playbooks read Claude Code session transcripts on the local machine, under the Claude Code transcripts directory, to find which files a session touched. Transcripts stay on disk.

## Contributing

Thanks for helping make this port better. Bug reports, documentation fixes, and workflow improvements are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md) for the checks and where your change belongs. Report vulnerabilities privately as described in [SECURITY.md](SECURITY.md).

## License

This port, including its modifications and additions, is also [MIT-licensed](LICENSE). Original pstack © 2026 Lauren Tan; imported cursor-team-kit skills © 2026 Cursor. See [LICENSE-cursor-team-kit](LICENSE-cursor-team-kit) and [NOTICE.md](NOTICE.md).
