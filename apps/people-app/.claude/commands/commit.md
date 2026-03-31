---
description: Stage and commit changes using Conventional Commits format
allowed-tools: Bash(git add:*), Bash(git commit:*), Bash(git status:*), Bash(git diff:*)
argument-hint: [optional commit message]
---

# Commit Skill — Fullstack Project

## When to Use
Use this skill when committing changes across frontend, backend, or both.

## Commit Message Format
Follow Conventional Commits:
<type>(<scope>): <short summary>

Types: feat | fix | chore | refactor | docs | style | ci
Note: Include both frontend and backend changes in same commit if they are part of the same logical change.

## Examples
feat(frontend): add dark mode toggle to navbar
fix(api): handle null response from payment service
chore(db): add index on users.email column
refactor(backend): extract auth middleware into separate module

## Files to Skip
Before staging, always check with the user if any sensitive or 
work-in-progress files should be excluded. Do not auto-stage:
- `.env` files
- config files containing secrets (e.g., `Config.toml` with client secrets)
- Any file the user explicitly flags
- webapp/src/utils/apiService.ts: If it has changes related to adding new header: X-JWT-Assertion, do not stage those changes as they are related to local setup and should not be committed.

## Steps
1. Run `git status` to review changes
2. Group related changes by scope (frontend/backend)
3. Stage files per scope using `git add <path>`
4. Commit each group with a conventional message
5. Confirm with `git log --oneline -3`

If $ARGUMENTS is provided, use it as a hint for the commit message.