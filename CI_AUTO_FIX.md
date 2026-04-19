# CI 自动检查和修复系统

## 概述

这个项目已经配置了自动化的 CI 检查和修复系统，可以：
- 检查 GitHub Actions CI 状态
- 自动分析失败的构建/测试
- 修复常见的 CI 问题
- 提交修复到当前分支

## 使用方法

### 方法 1：使用 `/ci-fix` 斜杠命令（推荐）

在下次对话中，直接运行：

```
/ci-fix
```

或指定分支：

```
/ci-fix main
/ci-fix feature/my-feature
```

### 方法 2：手动执行

你也可以让我直接执行 CI 检查，我会：

1. 使用 `gh run list` 检查最新的 CI 运行
2. 使用 `gh run view <id> --log-failed` 获取失败日志
3. 分析错误并自动修复
4. 提交修复到当前分支

## 已修复的问题

### ✅ 2026-04-19: Chrome 扩展改为草稿发布

**改进**：
- 将 Chrome 扩展发布改为草稿模式（`publish: false`）
- 允许在公开发布前进行审核
- Firefox 保持原有的直接发布逻辑

**修改**：
- 步骤名称：`Upload to Chrome Web Store` → `Upload to Chrome Web Store as Draft`
- 参数：`publish: true` → `publish: false`

**提交**: `42b11c1` - "Change Chrome extension publish to draft mode"

### ✅ 2026-04-19: Firefox 发布缺少依赖

**问题**：
- `publish-firefox` job 中 `web-ext` 命令找不到
- 错误：`ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL  Command "web-ext" not found`

**原因**：
- `web-ext` 是 devDependency，需要先安装依赖
- 之前的修复错误地移除了 `pnpm install` 步骤

**修复**：
- 重新添加 `pnpm install --frozen-lockfile` 步骤到 publish-firefox job
- 在下载 artifact 之前安装依赖

**提交**: `7da01dc` - "Fix GitHub Actions Firefox publish missing dependencies"

### ✅ 2026-04-19: Firefox 发布缺少 checkout 步骤

**问题**：
- `publish-firefox` job 缺少 `actions/checkout` 步骤
- 导致找不到 `pnpm-lock.yaml` 文件

**修复**：
- 添加 checkout 步骤
- 移除不必要的 `pnpm install` 步骤（web-ext 不需要依赖）

**提交**: `bf67f1a` - "Fix GitHub Actions Firefox publish job and add CI auto-fix command"

**注意**: 这个修复不完整，后续发现还需要安装依赖（见上一次修复）

## 支持的修复类型

✅ **可以自动修复**：
- 缺少 `actions/checkout` 步骤
- 错误的文件路径
- 缺少 lock 文件
- 构建脚本错误
- 测试失败
- 过时的 action 版本

❌ **无法自动修复**：
- Secrets/凭证问题（需要 GitHub 设置更新）
- 外部服务问题（Chrome Web Store API 等）
- 受保护分支的问题（需要 PR 流程）

## 常见问题

### Q: 为什么 `/ci-fix` 命令不可用？

A: 新创建的斜杠命令需要在新会话中才能使用。你可以：
1. 开始新的对话
2. 或者直接让我检查 CI 状态

### Q: 如何查看当前 CI 状态？

A: 运行：
```bash
gh run list --limit 5
```

### Q: 如何查看特定运行的详细日志？

A: 运行：
```bash
gh run view <run-id> --log-failed
```

## 技术细节

### 文件位置

- **CI 修复命令**: `.claude/commands/ci-fix.md`
- **Workflow 文件**: `.github/workflows/*.yml`

### 依赖

- GitHub CLI (`gh`) - 用于检查 CI 状态和获取日志
- Git - 用于提交修复

## 下一步

1. 监控推送后的 CI 运行：https://github.com/bugparty/chatgpt_markdown_copy_extension/actions
2. 如果还有失败，运行 `/ci-fix` 或让我检查
3. Chrome Web Store 的 HTTP 400 错误可能需要检查：
   - Chrome 扩展 ID 是否正确
   - API 凭证是否有效
   - 扩展包格式是否符合要求

## 联系

如有问题，请在 GitHub 上创建 issue。
