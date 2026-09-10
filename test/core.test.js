'use strict';

const test = require('node:test');
const assert = require('node:assert');

const { parseSubject, parseLog, bumpFrom, parseVersion, applyBump } = require('../src/core');
const { renderSection, renderInit } = require('../src/render');

test('parseSubject reads type, scope, breaking marker', () => {
  assert.deepEqual(parseSubject('feat(api): add allowlist'), { type: 'feat', scope: 'api', breaking: false, text: 'add allowlist' });
  assert.equal(parseSubject('fix!: handle null').breaking, true);
  assert.equal(parseSubject('chore: BREAKING CHANGE somewhere').breaking, true);
  assert.equal(parseSubject('just a subject'), null);
});

test('parseLog maps git output to commit objects', () => {
  const commits = parseLog('a1b2c3\tfeat: one\n\nd4e5f6\tfallback subject');
  assert.equal(commits.length, 2);
  assert.equal(commits[0].type, 'feat');
  assert.equal(commits[1].type, 'other');
  assert.equal(commits[1].text, 'fallback subject');
  assert.equal(parseLog('').length, 0);
});

test('bumpFrom picks the highest level', () => {
  assert.equal(bumpFrom([{ type: 'fix', breaking: false }]), 'patch');
  assert.equal(bumpFrom([{ type: 'fix', breaking: false }, { type: 'feat', breaking: false }]), 'minor');
  assert.equal(bumpFrom([{ type: 'feat', breaking: true }]), 'major');
  assert.equal(bumpFrom([{ type: 'docs', breaking: false }]), null);
  assert.equal(bumpFrom([{ type: 'fix', breaking: true }]), 'major');
});

test('version parse & bump math', () => {
  assert.deepEqual(parseVersion('v1.2.3'), { major: 1, minor: 2, patch: 3 });
  assert.equal(parseVersion('1.2'), null);
  assert.equal(applyBump('1.2.3', 'major'), '2.0.0');
  assert.equal(applyBump({ major: 1, minor: 2, patch: 3 }, 'minor'), '1.3.0');
  assert.equal(applyBump('v0.1.9', 'patch'), '0.1.10');
  assert.throws(() => applyBump('nope', 'patch'));
});

test('renderSection groups commits and lists breaking changes first', () => {
  const md = renderSection({
    version: 'v1.1.0',
    date: '2026-09-10',
    commits: [
      { hash: 'a1', subject: 'fix: b', type: 'fix', scope: '', breaking: false, text: 'b' },
      { hash: 'c2', subject: 'feat!: c', type: 'feat', scope: '', breaking: true, text: 'c' },
      { hash: 'd3', subject: 'feat(api): d', type: 'feat', scope: 'api', breaking: false, text: 'd' },
    ],
  });
  assert.ok(md.startsWith('## v1.1.0 — 2026-09-10'));
  assert.ok(md.indexOf('### ⚠ BREAKING CHANGES') < md.indexOf('### ✨ Features'));
  assert.ok(md.includes('- **api:** d (`d3`)'));
  assert.ok(md.includes('- b (`a1`)'));
  assert.ok(!md.includes('🔧 Other'));
});

test('renderSection keeps an Other bucket when nothing else fits', () => {
  const md = renderSection({
    version: 'v0.0.1',
    commits: [{ hash: 'e4', subject: 'wip', type: 'other', scope: '', breaking: false, text: 'wip' }],
  });
  assert.ok(md.includes('### 🔧 Other'));
});

test('renderInit prints a changelog header', () => {
  assert.ok(renderInit().includes('# Changelog'));
});
