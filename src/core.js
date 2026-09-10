'use strict';

const TYPE_SECTIONS = [
  ['feat', '✨ Features'],
  ['fix', '🐛 Bug Fixes'],
  ['perf', '⚡ Performance'],
  ['refactor', '♻️ Refactor'],
  ['docs', '📝 Documentation'],
  ['test', '🧪 Tests'],
  ['build', '📦 Build'],
  ['ci', '🤖 CI'],
];

const CONVENTIONAL_RE = /^(\w+)(\([^)]*\))?(!)?:\s*(.+)$/;

/**
 * Parse one conventional-commit subject.
 * @param {string} subject
 * @returns {{ type: string, scope: string, breaking: boolean, text: string } | null}
 */
function parseSubject(subject) {
  const m = String(subject || '').match(CONVENTIONAL_RE);
  if (!m) return null;
  return {
    type: m[1],
    scope: m[2] ? m[2].slice(1, -1) : '',
    breaking: Boolean(m[3]) || /BREAKING[ -]CHANGE/i.test(String(subject)),
    text: m[4],
  };
}

/**
 * Parse `git log --pretty=format:%h%x09%s` lines into commit objects.
 */
function parseLog(raw) {
  return String(raw || '')
    .split('\n')
    .filter((line) => line.trim() !== '')
    .map((line) => {
      const [hash = '', ...rest] = line.split('\t');
      const subject = rest.join('\t');
      const parsed = parseSubject(subject) || { type: 'other', scope: '', breaking: false, text: subject };
      return { hash, subject, ...parsed };
    });
}

/**
 * semver bump implied by a set of commits: breaking → major,
 * any feat → minor, any fix/perf → patch, nothing → null.
 * @param {Array<{type: string, breaking: boolean}>} commits
 * @returns {'major'|'minor'|'patch'|null}
 */
function bumpFrom(commits) {
  let level = null;
  for (const c of commits || []) {
    if (c.breaking) return 'major';
    if (c.type === 'feat') level = 'minor';
    else if ((c.type === 'fix' || c.type === 'perf') && level === null) level = 'patch';
  }
  return level;
}

/** Parse "1.2.3" (optional v-prefix) → {major, minor, patch}. */
function parseVersion(v) {
  const m = String(v || '').match(/^v?(\d+)\.(\d+)\.(\d+)$/);
  if (!m) return null;
  return { major: Number(m[1]), minor: Number(m[2]), patch: Number(m[3]) };
}

/** Apply a bump level to a version object, returning "x.y.z". */
function applyBump(version, level) {
  const v = typeof version === 'string' ? parseVersion(version) : version;
  if (!v) throw new Error(`Invalid version: ${version}`);
  if (level === 'major') return `${v.major + 1}.0.0`;
  if (level === 'minor') return `${v.major}.${v.minor + 1}.0`;
  if (level === 'patch') return `${v.major}.${v.minor}.${v.patch + 1}`;
  throw new Error(`Unknown bump level: ${level}`);
}

module.exports = { TYPE_SECTIONS, parseSubject, parseLog, bumpFrom, parseVersion, applyBump };
