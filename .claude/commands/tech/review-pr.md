# Review Pull Request

Perform a comprehensive code review of a pull request.

## Instructions

1. Get PR information: `gh pr view $ARGUMENTS --json title,body,files,additions,deletions`
2. Review each changed file
3. Provide structured feedback

## Review Checklist

### Code Quality

- [ ] Code is readable and well-organized
- [ ] Functions are appropriately sized
- [ ] No code duplication
- [ ] Meaningful variable/function names

### Functionality

- [ ] Logic is correct
- [ ] Edge cases handled
- [ ] Error handling is comprehensive
- [ ] No obvious bugs

### Security

- [ ] No hardcoded secrets
- [ ] Input validation present
- [ ] No injection vulnerabilities
- [ ] Authorization checks in place

### Testing

- [ ] Tests added for new code
- [ ] Existing tests still pass
- [ ] Edge cases tested

### Documentation

- [ ] Code is self-documenting or commented
- [ ] README updated if needed
- [ ] API changes documented

## Output Format

```markdown
## PR Review: #[number] - [title]

### Summary

[1-2 sentence overview]

### Approval Status

[ ] Approved
[ ] Approved with suggestions
[ ] Changes requested

### Findings

#### Critical (Must Fix)

- [ ] [Issue description] - `file:line`

#### Suggestions (Should Consider)

- [ ] [Improvement] - `file:line`

#### Nitpicks (Optional)

- [ ] [Minor suggestion] - `file:line`

### Positive Highlights

- [What's done well]

### Questions

- [Clarifications needed]
```

## Usage

```
/review-pr 123
/review-pr https://github.com/owner/repo/pull/123
```

$ARGUMENTS
