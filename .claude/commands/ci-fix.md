# Check and Fix GitHub Actions CI

Check the latest GitHub Actions CI status. If there are failures, automatically analyze and fix dependency/build errors and test failures, then commit directly to the current branch.

## Usage

```
/ci-fix [branch]
```

- If `branch` is specified, check that branch's CI status
- If not specified, check the current branch's CI status

## Workflow

1. **Check CI Status**: Use `gh run list` to get the latest workflow run for the target branch
2. **Analyze Failures**: If CI failed, use `gh run view <run-id> --log-failed` to fetch and analyze logs
3. **Categorize Issues**: Identify the type of failure:
   - **Dependency/Build errors**: Missing packages, compilation errors, missing files
   - **Test failures**: Unit tests, integration tests
   - **Workflow configuration errors**: Missing steps, incorrect action versions
4. **Auto-Fix**: Attempt to fix identified issues:
   - For missing files: Add checkout steps, fix paths
   - For dependency errors: Update package.json, lock files
   - For test failures: Analyze test output and fix code
   - For workflow errors: Fix YAML syntax, update action versions
5. **Commit**: Commit fixes directly to current branch with message:
   ```
   Fix GitHub Actions <issue-type>
   
   <detailed-description>
   
   Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
   ```
6. **Report**: Summarize what was fixed and next steps

## Common CI Issues This Can Fix

- Missing `actions/checkout` step
- Incorrect file paths in workflows
- Missing lock files (pnpm-lock.yaml, package-lock.json)
- Build script errors
- Test failures
- Deprecated action versions

## Examples

- `/ci-fix` - Check current branch CI
- `/ci-fix main` - Check main branch CI
- `/ci-fix feature/my-feature` - Check specific branch CI

## Limitations

- Cannot fix secrets/credential issues (requires GitHub settings update)
- Cannot fix external service issues (Chrome Web Store API, etc.)
- Cannot fix issues in protected branches (requires PR workflow)
