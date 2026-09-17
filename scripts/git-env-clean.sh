# shellcheck shell=bash
# Sourced. git hands every hook the repository it runs for (absolute paths from a linked worktree);
# anything that then runs git for another directory must drop them first (report #0063).
git_env_clean() {
  local vars
  vars="$(git rev-parse --local-env-vars 2>/dev/null)" || return 1
  [ -n "$vars" ] || return 1
  # shellcheck disable=SC2086
  unset $vars GIT_QUARANTINE_PATH
}
