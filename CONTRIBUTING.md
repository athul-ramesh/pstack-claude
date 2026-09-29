# Contributing

Thanks for helping out. This repo is a **maintained fork** of [upstream pstack](https://github.com/cursor/plugins/tree/main/pstack): it synced against upstream through v0.9.50 and now stands alone. There is no upstream sync anymore, so edit the skills directly — a behavior change and its documentation land in the same PR.

## Before you open a PR

Run the generator and the tests:

```shell
bun tools/generate.mjs
bun test tests/
```

The generator writes `VERSION` into the two plugin manifests and stamps model defaults from `plugins/pstack/models.json`. It also owns the line under the first heading of the playbooks in `DRIVER_PLAYBOOKS` — that line anywhere else fails the generator — and removes a retired lead line wherever one remains. It validates each skill's `name` and `description` against the [slash-command table](docs/reference.md#slash-commands).

It also copies the license and notice files in `PORTABLE_ASSETS` into `poteto-mode/references/` and removes stale generated files. The generator derives the effort and model-inheritance agent variants from the base coordinator and worker definitions.

The generator rejects missing Markdown links, links outside the skills tree, and instructions to open unreachable files. It checks for stray model names, requires a matching `CHANGES.md` heading, and validates the Claude hook paths. It also enforces these rules:

- No `commands/` directory.
- No `disable-model-invocation` on a skill.
- Every `principle-*` leaf sets `user-invocable: false`.
- Plugin agents use their namespaced `pstack:<name>` names.

CI runs `bun tools/generate.mjs --check`, which writes nothing and fails naming each generated file that is stale, missing, or orphaned, so commit the generator's output. Run the same command locally to preview CI. It checks your working tree, not the commit, so a gitignored file such as `.DS_Store` in a generated directory fails only locally, and uncommitted regenerated output passes only locally.

When adding a skill, include `name` and `description` in its frontmatter. Public skills also need a row in the slash-command table. The generator reports any skill missing a row or any row without a skill.

Change model defaults in `models.json`, never in a skill body. A role names a tier from `tiers` (`default`, `strongest`, or `panel`), so moving a tier is one edit. The generator checks the configuration's structure as it loads it (`parseModels` in `tools/generate.mjs`) and fails naming the offending role, tier, or slug. `tests/models.test.mjs` proves each malformed shape is rejected and checks that skills name every role they use. A full `claude-*` ID or a backticked available name such as `` `fable` `` outside a generated region fails the generator with its file and line.

`bun test tests/` covers the generator, the link validator, and `tests/invariants.test.mjs`, which builds fixture trees that must trip each layout invariant. One check is behavioral and lives in `tests/skill-collision-repro.sh`: it needs the `claude` CLI and API access and makes one haiku call to prove a user-typed `/plugin:name` reaches a skill with no `commands/` present. CI cannot run it, so run it locally at least once before a release.

When changing delegation instructions, keep the [Claude Code delegation contract](plugins/pstack/skills/poteto-mode/references/claude-code-delegation.md), coordinator and worker definitions, and playbooks consistent. `tests/skill-rules.test.mjs` pins critical lifecycle and worktree rules. State the Claude Code version used for any live agent check; static tests establish repository consistency but do not prove runtime loading, model selection, or the effective tool set.

If you touched `skills/poteto-mode/scripts/`:

```shell
cd plugins/pstack/skills/poteto-mode/scripts
bun install --frozen-lockfile
bun run typecheck
bun test orch watch-pr
bunx prettier@3.6.2 --check .
```

The scripts use Prettier 3.6.2 at upstream's settings in `.prettierrc.json`, CI runs the same check, and `.prettierignore` names each file the check skips and why.

`ship-pr` has one check CI cannot run. `watch-pr/live-merge-safety.mjs` creates a private repository on your `gh` account, drives `ship-pr inspect` and `cancel-pending` against a stale head, a moved base, and a retargeted base, confirms GitHub refuses a merge at a stale SHA, merges the current head, and deletes the repository. The delete needs the `gh` token's `delete_repo` scope; when it fails, the script prints the command to delete the repository by hand. Run it from the same directory before a release that changes `watch-pr/`:

```shell
bun watch-pr/live-merge-safety.mjs --live-disposable
```

If you touched a workflow, audit it before pushing:

```shell
uvx zizmor@1.29.0 --persona pedantic --min-severity low --collect all -- .
```

`--collect all` matches what CI scans. Pointing zizmor at `.github/workflows/` alone skips `dependabot.yml`, so the local run comes back clean on findings CI will fail on.

## Things that will fail CI

- **A `plugins/pstack/commands/` directory.** Claude Code renders commands and user-invocable skills in the same slash menu, so a trampoline paired with its skill duplicates every `/pstack:<name>` row ([#22](https://github.com/michael-denyer/pstack-claude/issues/22)).
- **`disable-model-invocation` in a skill's frontmatter.** On a skill it makes the Skill tool refuse the invocation outright, which breaks the SessionStart mandate. The `principle-*` leaves use `user-invocable: false` instead.
- **Stale generated output.** The `Generated files current` job runs `bun tools/generate.mjs --check`, which fails naming each generated file to write or orphan to remove. Editing `VERSION` without regenerating, hand-editing a manifest's `version` field, or bumping without a matching `CHANGES.md` heading all land here. The same run validates `hooks/hooks.json`: every `${CLAUDE_PLUGIN_ROOT}` path a command names must exist in the plugin.
- **Unresolved merge-conflict markers.** `bun tools/generate.mjs` fails on any line under `plugins/pstack` that starts with seven `<`, `=`, or `>` followed by a space or the line end, and names the file and line.
- **A missing or escaping local Markdown link.** `tools/validate-skills.mjs` resolves bare, `./`, `../`, and reference-style targets against their Markdown file. Every local target must exist inside `plugins/pstack/skills`.
- **Prose naming a plugin file the install does not carry.** The same tool resolves every backticked relative path against its Markdown file and against the plugin root. A token that lands on a real file or directory outside `plugins/pstack/skills` (`agents/comment-sicko.md`, `../../hooks/hooks.json`) fails. Tokens that resolve to nothing (placeholders, slash commands, `plugins/pstack/models.json` maintainer notes) pass. A Markdown link is caught by the link check; this covers the backticked form that is not a link.
- **A shell script that fails shellcheck.** Every `.sh` file outside `node_modules` is linted at warning severity.
- **An action pinned to a tag.** Use the full 40-character commit SHA with a version comment. A mutable tag can be force-pushed into our runners.
- **A workflow file that fails `actionlint`.** Invalid YAML, a malformed expression, an unknown runner label, or a `needs:` pointing at a job that does not exist. Run `actionlint` from the repository root.
- **A Markdown correctness error.** Reversed link syntax, an empty link target, a missing image alt, a fragment link to a heading that is not there, or an undefined or unused reference definition. The rule set is deliberately correctness-only and lives in `.markdownlint-cli2.jsonc`. Run `npx --yes markdownlint-cli2@0.18.1 '**/*.md'`.
- **A broken relative link in any Markdown file.** The link job resolves file and fragment targets offline and never touches a remote URL, so external link rot cannot fail your PR. Run `lychee --offline --include-fragments --exclude-path node_modules --exclude-path .git '**/*.md'`.

## Dependency updates

Dependabot keeps the pinned action SHAs current. The vendored scripts' one runtime dependency (`commander`) follows upstream's pin; `osv-scanner` scans `bun.lock` weekly, so a CVE still surfaces. If you bump it by hand, run `bun install` and commit the resulting `bun.lock` in the same change.

## Releasing

Plugin auto-update installs **by version number**, not by tracking `main`. A skill fix merged without a version bump is inert on every installed copy, because the updater sees the same version it already has and does nothing.

So: any PR that changes skill behavior either bumps the version itself or is followed by a release PR that does. The bump is three steps: edit the root `VERSION` file, add a `CHANGES.md` entry under a `## <version>` heading describing what changed and why, and run `bun tools/generate.mjs` to stamp the manifests. Forgetting any of the three fails CI. Run the full invariant script (including the behavioral leg) before merging.

## Commit and PR style

- Explain what changed and why. The diff already shows how.
- One concern per PR. A behavior fix and a refactor in the same diff are two separate reviews, and reviewing them together means doing neither properly.
- Claim only what you verified, and name the check. "52/52 bun tests pass" beats "tests pass"; "did not run the behavioral leg" beats silence.

## Reporting bugs

Include the pstack version, the Claude Code version, and the reproduction steps. [#22](https://github.com/michael-denyer/pstack-claude/issues/22) is the model to copy: it named versions, gave numbered steps, and included the experiment that isolated the cause.
