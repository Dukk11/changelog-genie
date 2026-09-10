#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const { parseLog, bumpFrom, parseVersion, applyBump } = require('../src/core');
const { renderSection, renderInit } = require('../src/render');
const { latestTag, logBetween, createTag } = require('../src/git');

const HELP = `changelog-genie 🧞 — conventional commits → changelog, bump & release tag

Usage:
  changelog-genie [options]

What it does:
  1. Collects commits since the latest v* tag (or all of them on a fresh repo).
  2. Derives the semver bump: breaking → major, feat → minor, fix/perf → patch.
  3. Renders the release-notes section for that version to stdout.

Options:
  --from <ref>             diff from this ref instead of the latest tag
  --to <ref>               diff up to this ref (default: HEAD)
  --current <version>      current version (default: read from package.json)
  --tag                    create the annotated git tag for the next version
  --init                   print a CHANGELOG.md header template
  --version, -v            print version
  --help, -h               show this help

Ship a release in two commands:
  changelog-genie --tag
  changelog-genie | gh release create vX.Y.Z --notes-file -

Zero dependencies. Deterministic. Free forever.`;

function readCurrentVersion() {
  try {
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    return pkg.version ? String(pkg.version) : null;
  } catch {
    return null;
  }
}

function parseArgs(argv) {
  const opts = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    switch (a) {
      case '--help': case '-h': opts.help = true; break;
      case '--version': case '-v': opts.version = true; break;
      case '--from': opts.from = argv[++i]; break;
      case '--to': opts.to = argv[++i]; break;
      case '--current': opts.current = argv[++i]; break;
      case '--tag': opts.tag = true; break;
      case '--init': opts.init = true; break;
      default: throw new Error(`Unknown option: ${a}\n\n${HELP}`);
    }
  }
  return opts;
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help) { console.log(HELP); return; }
  if (opts.version) { console.log(require('../package.json').version); return; }
  if (opts.init) { process.stdout.write(renderInit()); return; }

  const from = opts.from || latestTag();
  const current = opts.current || readCurrentVersion() || '0.0.0';
  const commits = parseLog(logBetween(from, opts.to || 'HEAD'));

  if (commits.length === 0) {
    console.error('ℹ no commits found in range — nothing to release');
    return;
  }

  const level = bumpFrom(commits);
  const next = level ? applyBump(current, level) : current;
  const version = `v${String(next).replace(/^v/, '')}`;

  if (opts.tag) {
    if (!level) { throw new Error('No version-worthy commits (need feat/fix/breaking) — not tagging.'); }
    const created = createTag(next, `Release ${version}`);
    console.error(`✔ tagged ${created}`);
  }

  const section = renderSection({
    commits,
    version,
    date: new Date().toISOString().slice(0, 10),
  });
  process.stdout.write(section);

  console.error(`ℹ bump: ${level || 'none'} → ${version}${from ? ` (since ${from})` : ''}`);
}

main().catch((err) => {
  console.error(`✖ ${err.message}`);
  process.exitCode = 1;
});

module.exports = { parseArgs };
