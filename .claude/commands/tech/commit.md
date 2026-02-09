# Commit Current Changes

## Purpose

Create a well-formatted git commit following Conventional Commits.

## Process

1. **Check Status**
   Run `git status` to see all changes.

2. **Analyze Changes**
   Run `git diff` to understand what changed.

3. **Review History**
   Run `git log -5 --oneline` to see recent commit style.

4. **Draft Message**
   Create commit message following:

   - `feat`: New feature
   - `fix`: Bug fix
   - `refactor`: Code restructuring
   - `docs`: Documentation
   - `test`: Test changes
   - `chore`: Maintenance

5. **Stage and Commit**

   ```bash
   git add [relevant files]
   git commit -m "[type](scope): description"
   ```

6. **Verify**
   Run git status to confirm commit succeeded.

## Arguments

If $ARGUMENTS provided:

- Use as commit message hint: "$ARGUMENTS"

## Output Format

Commit: [hash] [message] Files: [number] changed
