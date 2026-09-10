'use strict';

const { execFileSync } = require('node:child_process');

function git(args, fallback) {
  try {
    return execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  } catch {
    return fallback;
  }
}

const REF_RE = /^[\w./-]+$/;

/** Validate a ref against a strict pattern, then verify it exists. */
function verifyRef(ref) {
  const r = String(ref || '');
  if (!REF_RE.test(r)) throw new Error(`Suspicious ref: ${r}`);
  if (!git(['rev-parse', '--verify', '--quiet', r], '')) throw new Error(`Unknown git ref: ${r}`);
  return r;
}

/** Latest tag reachable from HEAD (semver-ish tags only). */
function latestTag() {
  const raw = git(['describe', '--tags', '--abbrev=0', '--match', 'v[0-9]*'], '');
  return raw.trim() || null;
}

/** Subjects+hashes between two refs (from exclusive, to inclusive). */
function logBetween(from, to = 'HEAD') {
  const args = ['log', '--pretty=format:%h%x09%s'];
  if (from) args.push(`${verifyRef(from)}..${verifyRef(to)}`);
  else args.push(verifyRef(to));
  return git(args, '');
}

/** Create an annotated release tag. The version is semver-validated before it
 *  ever becomes an argument; no shell is involved. */
function createTag(version, message) {
  const v = String(version);
  if (!/^v?\d+\.\d+\.\d+$/.test(v)) throw new Error(`Refusing to tag non-semver version: ${v}`);
  git(['tag', '-a', `v${v.replace(/^v/, '')}`, '-m', String(message || `Release ${v}`)], '');
  return `v${v.replace(/^v/, '')}`;
}

module.exports = { verifyRef, latestTag, logBetween, createTag };
