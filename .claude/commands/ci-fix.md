# Check and Fix GitHub Actions CI

Check the latest GitHub Actions CI status. If there are failures, automatically analyze and fix dependency/build errors and test failures, then commit directly to the current branch.

## Usage

```
/ci-fix [branch]
```

- If `branch` is specified, check that branch's CI status
- If not specified, check the current branch's CI status

## Workflow

1. **Check CI Status**: Get the latest workflow run for the target branch
2. **Analyze Failures**: If CI failed, fetch and analyze the failure logs
3. **Categorize Issues**: Identify the type of failure:
   - Dependency/Build errors (missing packages, compilation errors)
   - Test failures (unit tests, integration tests)
4. **Auto-Fix**: Attempt to fix identified issues
5. **Commit**: Commit fixes directly to current branch with descriptive message
6. **Report**: Summarize what was fixed and next steps

## Examples

- `/ci-fix` - Check current branch CI
- `/ci-fix main` - Check main branch CI
- `/ci-fix feature/my-feature` - Check specific branch CI
