# Contributing to changelog-genie

Thanks for helping out! 🧞

## Ground rules

1. **Zero runtime dependencies.** Build the small part you need instead of
   pulling a library. Tests run on `node:test` only.
2. **Conventional Commits** (`feat:`, `fix:`, `docs:` …) — eat your own dog food.
3. **Security:** refs are regex-validated and verified via `rev-parse`; tag
   versions must be strict semver; no shell, no file writes — stdout only.
4. Run `npm test` before pushing — CI runs the suite on Node 18/20/22.

## Dev setup

```console
git clone https://github.com/Dukk11/changelog-genie
cd changelog-genie
npm test
```

## Reporting bugs

Open an issue with the command you ran, the output, and your Node version.
