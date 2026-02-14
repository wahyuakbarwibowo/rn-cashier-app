# Skill: commit

## Description
Create a git commit with a well-crafted commit message following Conventional Commits format.

## Instructions

1. Run `git status` (without -uall flag) and `git diff --cached` and `git diff` in parallel to see current changes.
2. Also run `git log --oneline -10` to see recent commit style.
3. Analyze all changes (staged and unstaged) and determine:
   - The type: `feat`, `fix`, `refactor`, `perf`, `docs`, `style`, `test`, `chore`, `build`, `ci`
   - A concise scope if applicable (e.g., `database`, `screens`, `navigation`)
   - A clear description of what changed and why
4. Stage all relevant changed files individually (do NOT use `git add -A` or `git add .`). Skip files that look like secrets (.env, credentials, etc.).
5. Create the commit using this format:
   ```
   <type>(<scope>): <short description>

   <optional body explaining what and why>

   Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
   ```
6. Use a HEREDOC to pass the commit message to ensure correct formatting.
7. Run `git status` after committing to verify success.

## Rules
- Commit message subject line must be under 72 characters
- Use Indonesian for the body if the changes are UI/user-facing Indonesian text, otherwise use English
- Never use `--no-verify` unless explicitly requested
- Never amend previous commits unless explicitly requested
- If pre-commit hooks fail, fix the issue and create a NEW commit
