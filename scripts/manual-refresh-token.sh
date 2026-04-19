#!/bin/bash

# Chrome Web Store Refresh Token - Manual Generation
# 因为 npx chrome-webstore-upload-keys 需要打开浏览器和动态端口，
# 这个脚本提供手动方式的替代方案

echo "=========================================="
echo "🔑 手动生成 Chrome Web Store Refresh Token"
echo "=========================================="
echo ""
echo "由于自动工具需要浏览器交互，请按以下步骤操作："
echo ""

# 提示用户访问 OAuth Playground
echo "步骤 1: 访问 OAuth Playground"
echo "--------------------------------------"
echo "打开浏览器访问："
echo "https://developers.google.com/oauthplayground/"
echo ""

# 配置说明
echo "步骤 2: 配置 OAuth 凭证"
echo "--------------------------------------"
echo "1. 点击右上角的 ⚙️ 齿轮图标"
echo "2. 勾选 'Use your own OAuth credentials'"
echo "3. 输入你的凭证："
echo ""
echo "   Client ID: [从 GitHub secrets 或 Google Console 获取]"
echo "   Client Secret: [从 Google Console 获取]"
echo ""

# 选择 scope
echo "步骤 3: 选择 API Scope"
echo "--------------------------------------"
echo "1. 在左侧列表中找到 'Chrome Web Store API v3'"
echo "2. 展开并勾选："
echo "   ☑ https://www.googleapis.com/auth/chromewebstore"
echo ""

# 授权
echo "步骤 4: 授权"
echo "--------------------------------------"
echo "1. 点击 'Authorize APIs' 按钮"
echo "2. 登录你的 Google 账号"
echo "3. 允许访问权限"
echo "4. 会自动跳回 OAuth Playground"
echo ""

# 交换 token
echo "步骤 5: 获取 Refresh Token"
echo "--------------------------------------"
echo "1. 点击 'Exchange authorization code for tokens'"
echo "2. 在右侧会显示："
echo ""
echo "   Refresh token: 1//04xxxxxxxxxxxxxxxx"
echo ""
echo "3. ⚠️ 复制 'Refresh token' (不是 Access token)"
echo ""

# 保存说明
echo "步骤 6: 更新 GitHub Secret"
echo "--------------------------------------"
echo "1. 访问："
echo "   https://github.com/bugparty/chatgpt_markdown_copy_extension/settings/environments/publish"
echo ""
echo "2. 找到 CHROME_REFRESH_TOKEN"
echo "3. 点击 'Update'"
echo "4. 粘贴刚才复制的 refresh token"
echo "5. 点击 'Update secret'"
echo ""

echo "=========================================="
echo "完成后，运行验证："
echo "  GitHub Actions -> Verify Secrets Have Values workflow"
echo "=========================================="
