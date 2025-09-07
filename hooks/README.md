# Pre-Push Console Guard Hook

This repository ships with a `pre-push` Git hook that prevents pushing JavaScript code containing unguarded `console` statements.

It can also be executed manually to retroactively scan the entire codebase.

## What it enforces

The hook scans JavaScript files and blocks the push if it finds any unguarded:

- `console.log(...)`
- `console.warn(...)`
- `console.error(...)`

Guarded forms that are allowed:

- `isDev && console.log("...")`
- `if (isDev) console.warn("...")`
- `if (isDev) { console.error("..."); }`

It also supports multi-line `console` calls, for example:

```js
isDev &&
  console.log(
    "multi-line",
    someObject
  );
```

The file `scripts/shared/devTool.js` is exempt (where the dev flag is defined).

## Quick setup (enable the hook)

1) Tell Git to use this repository's hooks directory:

```bash
git config core.hooksPath hooks
```

2) (Unix/macOS only) Ensure the hook is executable:

```bash
chmod +x hooks/pre-push
```

You're done. Future `git push` commands will automatically run the hook.

## Run manually (scan the whole repo)

You can run the same script manually to scan all tracked `.js` files:

```bash
sh hooks/pre-push --all
# or
sh hooks/pre-push -a
```

Example output (success):

```
✅ No JS files found to check. Done.
```

Example output (violations found):

```
❌ Found unguarded console.log statements in staged files:
  • scripts/example.js:42: console.log("leftover debug")
  • scripts/another.js:10: console.error("oops")
```

Exit codes (useful for CI):

- `0` — No violations
- `1` — Violations found

## Normal behavior (pre-push mode)

When run by Git as a pre-push hook (i.e., during `git push`), the script:

1) Reads ref updates from Git on stdin
2) Computes the diff range for each update (e.g., `remote_sha..local_sha`)
3) Collects changed `.js` files in those ranges (excluding `scripts/shared/devTool.js`)
4) Scans only those files for unguarded `console.(log|warn|error)`
5) Fails the push if violations are found, with a summary and execution time

Typical messages you may see:

- `✅ No JS changes to check in this push. Push allowed.` — No relevant `.js` changes in the commits being pushed
- `❌ Found unguarded console.log statements in staged files:` — Violations detected; push is blocked until fixed

## Notes & tips

- GUI clients or CI systems can bypass hooks with `--no-verify`. Ensure this is not used if you rely on the hook.
- On Windows, run the hook under Git Bash or a POSIX-compatible shell.
- You can expand the guard patterns or exempt paths in `hooks/pre-push` if your project needs custom logic.

## Troubleshooting

- "No JS changes to check in this push" but you expected checks:
  - Ensure `git config --get core.hooksPath` outputs `hooks`
  - Ensure your changes are actually part of the commits being pushed
  - Some tools push with `--no-verify` (which skips hooks)

- Syntax errors when running the hook:
  - Make sure you execute it with a POSIX shell: `sh hooks/pre-push`

If you want this hook to also guard other methods like `console.info`, `console.debug`, or add `NODE_ENV`-based guards, open an issue or request an update.

