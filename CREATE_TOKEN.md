# 创建 GitHub Personal Access Token 步骤

## 为什么需要 Token？

GitHub 从 2021年8月起不再支持使用密码进行 Git 操作，需要使用 Personal Access Token (PAT) 来替代密码。

## 创建 Token 步骤

1. **访问 Token 设置页面**
   - 打开: https://github.com/settings/tokens
   - 或者: GitHub 网站 -> 右上角头像 -> Settings -> Developer settings -> Personal access tokens -> Tokens (classic)

2. **生成新 Token**
   - 点击 "Generate new token" -> "Generate new token (classic)"
   - 或者直接访问: https://github.com/settings/tokens/new

3. **设置 Token 信息**
   - **Note（名称）**: `drug_serve` 或任意名称
   - **Expiration（过期时间）**: 选择合适的时间（如 90 天、1 年等）
   - **Select scopes（权限）**: 
     - ✅ 勾选 **`repo`** (完整仓库权限)
       - 这会自动勾选所有 repo 相关权限

4. **生成并复制 Token**
   - 点击页面底部的 "Generate token" 按钮
   - **重要**: Token 只显示一次，请立即复制保存！
   - Token 格式类似: `ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

5. **使用 Token 推送代码**

```bash
cd /Users/chunshengwu/code/drug_serve
git push -u origin main
```

当提示输入密码时，**粘贴你的 Token**（不是密码）

## 安全提示

- Token 等同于密码，请妥善保管
- 不要将 Token 提交到代码仓库
- 如果 Token 泄露，立即在 GitHub 设置中删除并重新生成

## 替代方案：使用 SSH Key

如果你配置了 SSH key，可以使用更安全的方式：

```bash
git remote set-url origin git@github.com:1215764141/drug_serve.git
git push -u origin main
```

