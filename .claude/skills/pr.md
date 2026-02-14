# Skill: pr

## Description
Create a GitHub Pull Request from the current branch to the main branch (master).

## Instructions

1. Run the following in parallel to understand the current state:
   - `git status` (without -uall flag)
   - `git diff` and `git diff --cached` to check for uncommitted changes
   - `git branch --show-current` to get current branch name
   - `git log --oneline master..HEAD` to see all commits in this branch
   - `git diff master...HEAD --stat` to see summary of all file changes

2. If there are uncommitted changes, ask the user if they want to commit first before creating the PR.

3. Analyze ALL commits in the branch (not just the latest) to understand the full scope of changes.

4. Push the branch to remote if not already pushed:
   ```
   git push -u origin <branch-name>
   ```

5. Create the PR using `gh pr create` with this format:
   ```
   gh pr create --title "<concise title under 70 chars>" --body "$(cat <<'EOF'
   ## Summary
   <1-3 bullet points describing the changes>

   ## Changes
   <List of notable changes grouped by area>

   ## Test plan
   - [ ] <Testing steps>

   🤖 Generated with [Claude Code](https://claude.com/claude-code)
   EOF
   )"
   ```

6. Return the PR URL to the user.

## Rules
- PR title should be concise (under 70 characters) and descriptive
- Base branch defaults to `master` unless user specifies otherwise
- Always analyze ALL commits in the branch, not just the most recent one
- If the branch name contains context (e.g., `feature/enhance-some-pages`), use it to inform the PR title
- Never force push unless explicitly requested
- Use Indonesian in the summary if all changes are UI/Indonesian-facing, otherwise use English
