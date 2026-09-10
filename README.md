# 🧞 changelog-genie

[![CI](https://github.com/Dukk11/changelog-genie/actions/workflows/ci.yml/badge.svg)](https://github.com/Dukk11/changelog-genie/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/changelog-genie?label=npm)](https://www.npmjs.com/package/changelog-genie)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![node](https://img.shields.io/badge/node-%3E%3D18-brightgreen)](package.json)
![zero dependencies](https://img.shields.io/badge/dependencies-0-success)

**Keep your commits conventional — this writes your releases.**
changelog-genie collects the commits since your last `v*` tag, derives the
semver bump (breaking → major, `feat` → minor, `fix`/`perf` → patch), renders
a clean Markdown release section, and tags the release on request. No config
file. No lock-in. **Zero dependencies.**

```console
$ changelog-genie
## v1.3.0 — 2026-09-10

### ✨ Features
- **cli:** `--tag` flag creates the release tag (`e4f5g6h`)
- offline heuristic summarizer (`a1b2c3d`)

### 🐛 Bug Fixes
-  null guard for empty diffs (`b2c3d4e`)

ℹ bump: minor → v1.3.0 (since v1.2.0)
```

## Why

Most changelog tools are config-file zoos with 200 transitive dependencies.
changelog-genie is a single auditable folder, deterministic output, and two
commands from "commits pushed" to "release published". It doesn't maintain a
CHANGELOG.md behind your back — it prints sections to **stdout**, so *you*
decide where they go (file, GitHub Release, Slack, CI step).

## Install

```console
npm install -g changelog-genie     # or just: npx changelog-genie
```

Requires Node ≥ 18 and `git`. **0 npm dependencies.**

## Usage

```console
changelog-genie                    # section for the next release (latest tag → HEAD)
changelog-genie --from v1.0.0 --to v1.1.0   # any range
changelog-genie --current 2.0.0    # override the version source (default: package.json)
changelog-genie --tag              # also create the annotated git tag vX.Y.Z
changelog-genie --init             # print a CHANGELOG.md header template
```

## The 2-command release

```console
changelog-genie --tag                                   # 1. bump + annotated tag
changelog-genie | gh release create v1.3.0 --notes-file -   # 2. GitHub Release from stdout
```

**Automate it in CI (push-tag workflow):**

```yaml
on:
  push:
    branches: [main]
jobs:
  release:
    runs-on: ubuntu-latest
    permissions:
      contents: write
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npx changelog-genie --tag
      - run: |
          VERSION=$(git describe --tags --abbrev=0)
          npx changelog-genie | gh release create "$VERSION" --notes-file -
        env:
          GH_TOKEN: ${{ github.token }}
```

## How it works

1. `git describe --tags --abbrev=0 --match 'v[0-9]*'` finds the base (refs are regex-validated and `rev-parse`-verified).
2. Commit subjects are parsed as Conventional Commits (`feat(api):`, `fix!:`, `BREAKING CHANGE:`).
3. `bumpFrom` picks major/minor/patch; `applyBump` does the semver math.
4. `renderSection` emits deterministic Markdown — snapshot-tested.

**Security posture:** refs must match `^[\w./-]+$` and exist before use, the
tag version must be strict semver, nothing touches a shell, and the tool
never writes files — output goes to stdout.

## Contributing

PRs welcome — see [CONTRIBUTING.md](CONTRIBUTING.md). Hard rule: **zero runtime
dependencies**, tests via `node:test`.

## More from Duk · [dukdev.com](https://dukdev.com)

| | |
|---|---|
| [commit-genie](https://github.com/Dukk11/commit-genie) | AI commit messages — free via Ollama, offline mode |
| [pr-genie](https://github.com/Dukk11/pr-genie) | PR titles & descriptions, auto-written from your diff |
| [standup-genie](https://github.com/Dukk11/standup-genie) | Your standup, written by your commits |
| [repo-autopilot](https://github.com/Dukk11/repo-autopilot) | Rule-based issue/PR triage as a GitHub Action |
| [linkrot-guard](https://github.com/Dukk11/linkrot-guard) | Dead-link guardian for your READMEs, on a schedule |
| [devtoolbelt](https://dukk11.github.io/devtoolbelt) | 18 dev tools, 100 % client-side |

## License

[MIT](LICENSE) · built by **Duk** · [dukdev.com](https://dukdev.com)
