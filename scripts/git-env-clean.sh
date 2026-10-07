# shellcheck shell=bash
# Sourced. git hands every hook the repository it runs for (absolute paths from a linked worktree);
# anything that then runs git for another directory must drop them first (report #0063).
# git also exports the commit's identity to hooks, and --local-env-vars does not list it: left
# set, a commit made in another repository takes this repository's author and date.
git_env_clean() {
  local vars
  vars="$(git rev-parse --local-env-vars 2>/dev/null)" || return 1
  [ -n "$vars" ] || return 1
  # shellcheck disable=SC2086
  unset $vars GIT_QUARANTINE_PATH \
    GIT_AUTHOR_NAME GIT_AUTHOR_EMAIL GIT_AUTHOR_DATE \
    GIT_COMMITTER_NAME GIT_COMMITTER_EMAIL GIT_COMMITTER_DATE
}
