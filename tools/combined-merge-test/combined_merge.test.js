#!/usr/bin/env node
"use strict";
/**
 * Known-answer suite for scripts/test-combined-merge.sh (docs/sdd/combined-merge-test R2–R4).
 * Builds a throw-away origin + clone with a fake scripts/run-test-suites.sh, runs the real tool
 * against it, and checks what it refuses, what it prints, and that it cleans up its own worktree.
 * Post-mortem #0198: a hand-written chain tested main and printed green as "combined".
 */
const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync, execFileSync } = require("child_process");

const TOOL = path.resolve(__dirname, "../../scripts/test-combined-merge.sh");
const results = [];
let failed = 0;
function t(name, fn) {
  try { fn(); results.push(`PASS ${name}`); } catch (e) { failed++; results.push(`FAIL ${name}: ${e.message}`); }
}

const base = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "cmt-")));
const env = { ...process.env, GIT_AUTHOR_NAME: "t", GIT_AUTHOR_EMAIL: "t@example.invalid", GIT_COMMITTER_NAME: "t", GIT_COMMITTER_EMAIL: "t@example.invalid", GIT_CONFIG_GLOBAL: "/dev/null", GIT_CONFIG_NOSYSTEM: "1" };
for (const k of Object.keys(env)) if (k.startsWith("GIT_DIR") || k === "GIT_WORK_TREE" || k === "GIT_INDEX_FILE") delete env[k];
const git = (cwd, ...a) => execFileSync("git", a, { cwd, env, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
const origin = path.join(base, "origin.git");
const repo = path.join(base, "repo");
git(base, "init", "-q", "--bare", "-b", "main", origin);
git(base, "init", "-q", "-b", "main", repo);
git(repo, "remote", "add", "origin", origin);
fs.mkdirSync(path.join(repo, "scripts"));
fs.writeFileSync(path.join(repo, "scripts/run-test-suites.sh"), "#!/bin/bash\necho fake-suites-green\nexit 0\n");
fs.writeFileSync(path.join(repo, "shared.txt"), "line\n");
git(repo, "add", "scripts/run-test-suites.sh", "shared.txt");
git(repo, "commit", "-q", "-m", "base");
git(repo, "push", "-q", "origin", "main");
function branch(name, file, content) {
  git(repo, "checkout", "-q", "-b", name, "main");
  fs.writeFileSync(path.join(repo, file), content);
  git(repo, "add", file);
  git(repo, "commit", "-q", "-m", name);
  git(repo, "push", "-q", "origin", name);
  git(repo, "checkout", "-q", "main");
}
branch("fix/a", "a.txt", "a\n");
branch("fix/b", "b.txt", "b\n");
branch("fix/c", "shared.txt", "c\n");
branch("fix/d", "shared.txt", "d\n");
branch("fix/red", "scripts/run-test-suites.sh", "#!/bin/bash\necho fake-suites-red\nexit 1\n");

const WT = path.join(repo, ".worktrees", "combined-merge-test");
const run = (...branches) => spawnSync("bash", [TOOL, ...branches], { env: { ...env, COMBINED_REPO: repo }, encoding: "utf8" });
const out = (r) => `${r.stdout}${r.stderr}`;

t("no branch given → refused (exit 2)", () => { const r = run(); assert.strictEqual(r.status, 2, out(r)); });
t("clean set → exit 0, one in-test line per branch, combined HEAD inside the tool's own worktree", () => {
  const r = run("fix/a", "fix/b");
  assert.strictEqual(r.status, 0, out(r));
  assert.match(r.stdout, /^in-test fix\/a [0-9a-f]{7,}$/m);
  assert.match(r.stdout, /^in-test fix\/b [0-9a-f]{7,}$/m);
  assert.ok(r.stdout.includes(`combined HEAD `) && r.stdout.includes(` in ${WT}`), r.stdout);
  assert.match(r.stdout, /fake-suites-green/);
  assert.match(r.stdout, /^rc=0$/m);
});
t("worktree removed after a run (next run never meets a stale folder)", () => { assert.ok(!fs.existsSync(WT), "worktree still there"); });
t("existing worktree path → refused (exit 4) and the existing folder is left untouched", () => {
  fs.mkdirSync(WT, { recursive: true });
  fs.writeFileSync(path.join(WT, "keep.txt"), "x");
  const r = run("fix/a");
  assert.strictEqual(r.status, 4, out(r));
  assert.ok(fs.existsSync(path.join(WT, "keep.txt")), "tool touched a folder it did not create");
  fs.rmSync(WT, { recursive: true, force: true });
});
t("conflicting branches → refused (exit 3), names the branch, suites never run", () => {
  const r = run("fix/c", "fix/d");
  assert.strictEqual(r.status, 3, out(r));
  assert.match(out(r), /CONFLICT fix\/d/);
  assert.doesNotMatch(r.stdout, /fake-suites/);
  assert.ok(!fs.existsSync(WT), "worktree left behind after conflict");
});
t("branch that does not exist → refused (exit 3), suites never run", () => {
  const r = run("fix/a", "fix/nope");
  assert.strictEqual(r.status, 3, out(r));
  assert.doesNotMatch(r.stdout, /fake-suites/);
});
t("red suites inside the combined tree → tool exits non-zero with rc=1", () => {
  const r = run("fix/a", "fix/red");
  assert.strictEqual(r.status, 1, out(r));
  assert.match(r.stdout, /fake-suites-red/);
  assert.match(r.stdout, /^rc=1$/m);
});

fs.rmSync(base, { recursive: true, force: true });
console.log(results.join("\n"));
console.log(failed ? `combined-merge-test: ❌ ${failed} failed` : `combined-merge-test: ผ่านครบ ${results.length} ข้อ`);
process.exit(failed ? 1 : 0);
