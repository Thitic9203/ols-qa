#!/usr/bin/env python3
"""Apply a Helix release to this repo's shared skill files, one way.

Usage: apply.py <ols-qa-root> <helix-dir> <helix-tag>

Spec: docs/sdd/helix-sync-pull R3-R5 (source: SkillLane/team-pluton-skills docs/sdd/skill-sync-simplify R4-R6).

- Candidates: every file under skills/, references/, commands/ in <helix-dir>, minus the paths listed in
  helix-keep.txt (one repo-relative path per line, '#' comments). Nothing outside those three folders is ever read
  or written, so OLS-only files elsewhere, the secret guard, hooks and docs are untouched; OLS-only files inside the
  folders are untouched too, because only Helix paths are candidates.
- .helix-sync.lock lists every path the sync owns: a header with the Helix tag, then `<sha256>  <path>` lines.
- Refused, with nothing written (exit 1), when:
    an owned file was edited or deleted here (shared skills are edited in Helix only);
    a candidate exists here with different content and is not owned yet (first-run adoption takes only files that
      already equal Helix);
    a lock line is malformed, or any path is a symlink, absolute, contains '..', or leaves the three folders.
- Also refused: a Helix tree missing one of the three folders or unreadable (never read as mass deletion), a
  keep-list entry that is not a path under the three folders or matches no file, a folder where Helix has a file.
- Otherwise: delete owned files Helix no longer has (pruning folders left empty inside the three folders), rename
  the staged new and changed files into place, and replace the lock last. A staging error changes nothing; an error
  while committing stops before the lock is replaced and says how to restore.
  When nothing changes, nothing is written, the lock included.
Exit 0 = applied or nothing to do, 1 = refused, 2 = usage error.
"""
import hashlib
import os
import shutil
import sys

FOLDERS = ("skills/", "references/", "commands/")
LOCK = ".helix-sync.lock"
KEEP = "helix-keep.txt"
HEADER = "# helix-sync lock - do not edit; written by scripts/helix-sync/apply.py. tag={tag}"


def sha256(path):
    h = hashlib.sha256()
    with open(path, "rb") as fh:
        for chunk in iter(lambda: fh.read(65536), b""):
            h.update(chunk)
    return h.hexdigest()


def safe(rel):
    parts = rel.split("/")
    return rel.startswith(FOLDERS) and not os.path.isabs(rel) and ".." not in parts and "" not in parts


def no_symlink_on_path(root, rel):
    cur = root
    for part in rel.split("/"):
        cur = os.path.join(cur, part)
        if os.path.islink(cur):
            return False
    return True


def read_keep(root, problems):
    path = os.path.join(root, KEEP)
    keep = set()
    if os.path.isfile(path):
        with open(path, encoding="utf-8") as fh:
            for n, line in enumerate(fh, 1):
                line = line.split("#", 1)[0].strip()
                if not line:
                    continue
                if not safe(line):
                    problems.append(f"{KEEP}:{n}: {line!r} is not a path under skills/, references/ or commands/")
                    continue
                keep.add(line)
    return keep


def read_lock(root, problems):
    path = os.path.join(root, LOCK)
    owned, header = {}, ""
    if os.path.isfile(path):
        with open(path, encoding="utf-8") as fh:
            for n, line in enumerate(fh, 1):
                line = line.rstrip("\n")
                if n == 1 and line.startswith("#"):
                    header = line
                    continue
                if not line or line.startswith("#"):
                    continue
                digest, sep, rel = line.partition("  ")
                if not sep or len(digest) != 64 or not safe(rel):
                    problems.append(f"{LOCK}:{n}: not a valid lock line ({line!r})")
                    continue
                owned[rel] = digest
    return owned, header


def helix_candidates(helix, keep, problems):
    out = {}
    for folder in FOLDERS:
        base = os.path.join(helix, folder)
        if not os.path.isdir(base) or os.path.islink(base):
            # a release missing a folder would otherwise read as "delete every owned file in it"
            problems.append(f"Helix tree has no {folder} folder (layout changed?); refusing to treat that as deletions")
            continue
        def walk_error(err):
            problems.append(f"cannot read the Helix tree: {err}")
        for d, dirs, files in os.walk(base, onerror=walk_error):
            for name in dirs + files:
                if os.path.islink(os.path.join(d, name)):
                    problems.append(f"Helix tree has a symlink: {os.path.relpath(os.path.join(d, name), helix)}")
            for f in files:
                full = os.path.join(d, f)
                if os.path.islink(full):
                    continue
                rel = os.path.relpath(full, helix).replace(os.sep, "/")
                if rel in keep or not safe(rel):
                    continue
                out[rel] = full
    return out


def prune(root, rel):
    d = os.path.dirname(os.path.join(root, rel))
    tops = {os.path.normpath(os.path.join(root, f)) for f in FOLDERS}
    while os.path.normpath(d) not in tops and os.path.isdir(d) and not os.path.islink(d) and not os.listdir(d):
        os.rmdir(d)
        d = os.path.dirname(d)


def main(argv):
    if len(argv) != 3 or not os.path.isdir(argv[0]) or not os.path.isdir(argv[1]) or not argv[2]:
        print(__doc__.strip(), file=sys.stderr)
        return 2
    root, helix, tag = os.path.abspath(argv[0]), os.path.abspath(argv[1]), argv[2]
    problems = []
    keep = read_keep(root, problems)
    owned, old_header = read_lock(root, problems)
    cand = helix_candidates(helix, keep, problems)
    for k in sorted(keep):
        if not os.path.isfile(os.path.join(root, k)) and not os.path.isfile(os.path.join(helix, k)):
            problems.append(f"{KEEP}: {k} matches no file here or in Helix (typo?)")

    for rel, digest in sorted(owned.items()):
        if rel in keep:
            continue  # released by the keep-list: no longer written, never deleted
        local = os.path.join(root, rel)
        if not no_symlink_on_path(root, rel):
            problems.append(f"{rel}: path goes through a symlink")
        elif not os.path.isfile(local):
            problems.append(f"{rel}: synced file was deleted here; restore it with `git checkout -- {rel}` "
                            "(shared skills are edited in Helix only)")
        elif sha256(local) != digest:
            problems.append(f"{rel}: synced file was edited here; restore it with `git checkout -- {rel}` "
                            "and make the change in Helix (shared skills are edited in Helix only)")

    writes = []
    for rel, src in sorted(cand.items()):
        local = os.path.join(root, rel)
        new = sha256(src)
        if not no_symlink_on_path(root, rel):
            problems.append(f"{rel}: path goes through a symlink")
            continue
        exists = os.path.lexists(local)
        if exists and not os.path.isfile(local):
            problems.append(f"{rel}: is a folder or special file here, but a file in Helix")
            continue
        if exists and rel not in owned and sha256(local) != new:
            problems.append(f"{rel}: exists here with different content and is not synced yet; make the change in "
                            f"Helix, or list it in {KEEP} if this repo must keep its own copy")
            continue
        if not exists or sha256(local) != new:
            writes.append((rel, src))
    deletes = sorted(rel for rel in owned if rel not in cand and rel not in keep)

    if problems:
        for p in problems:
            print(f"apply: {p}", file=sys.stderr)
        print(f"apply: refused, {len(problems)} problem(s); nothing written", file=sys.stderr)
        return 1

    header = HEADER.format(tag=tag)
    lock_lines = [header] + [f"{sha256(cand[rel])}  {rel}" for rel in sorted(cand)]
    lock_text = "\n".join(lock_lines) + "\n"
    lock_path = os.path.join(root, LOCK)
    old_lock = open(lock_path, encoding="utf-8").read() if os.path.isfile(lock_path) else None
    if not writes and not deletes and old_lock == lock_text:
        print("apply: nothing to do")
        return 0

    staged = []
    try:
        for rel, src in writes:
            dest = os.path.join(root, rel)
            os.makedirs(os.path.dirname(dest), exist_ok=True)
            shutil.copyfile(src, dest + ".helix-sync-tmp")
            staged.append((dest + ".helix-sync-tmp", dest))
        with open(lock_path + ".helix-sync-tmp", "w", encoding="utf-8") as fh:
            fh.write(lock_text)
        staged.append((lock_path + ".helix-sync-tmp", lock_path))
    except OSError as exc:
        for tmp, _ in staged:
            if os.path.exists(tmp):
                os.remove(tmp)
        print(f"apply: staging failed ({exc}); nothing changed", file=sys.stderr)
        return 1
    # commit: deletes, then file renames, the lock last, so a lock never names a state that was not reached
    try:
        for rel in deletes:
            os.remove(os.path.join(root, rel))
            prune(root, rel)
        for tmp, dest in staged:
            os.replace(tmp, dest)
    except OSError as exc:
        for tmp, _ in staged:
            if os.path.exists(tmp):
                os.remove(tmp)
        print(f"apply: writing failed part-way ({exc}); the lock was not updated, so the next run reports the "
              "changed files; restore with `git checkout -- skills references commands`", file=sys.stderr)
        return 1
    added = sum(1 for rel, _ in writes if rel not in owned)
    print(f"apply: Helix {tag}: {added} added, {len(writes) - added} updated, {len(deletes)} deleted, "
          f"{len(cand) - len(writes)} unchanged")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
