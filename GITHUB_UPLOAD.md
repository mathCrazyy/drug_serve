# GitHub 上传指南

## 已完成

✅ Git 仓库已初始化
✅ 所有文件已添加到暂存区
✅ 初始提交已创建

## 下一步：上传到 GitHub

### 方法 1: 使用 GitHub CLI（如果已安装）

```bash
# 创建 GitHub 仓库并推送
gh repo create drug_serve --public --source=. --remote=origin --push
```

### 方法 2: 手动创建仓库并推送

1. **在 GitHub 上创建新仓库**
   - 访问 https://github.com/new
   - 仓库名称：`drug_serve`（或你喜欢的名称）
   - 选择 Public 或 Private
   - **不要**初始化 README、.gitignore 或 license（我们已经有了）
   - 点击 "Create repository"

2. **添加远程仓库并推送**

```bash
# 添加远程仓库（将 YOUR_USERNAME 替换为你的 GitHub 用户名）
git remote add origin https://github.com/YOUR_USERNAME/drug_serve.git

# 或者使用 SSH（如果你配置了 SSH key）
# git remote add origin git@github.com:YOUR_USERNAME/drug_serve.git

# 推送代码
git branch -M main
git push -u origin main
```

### 方法 3: 使用 GitHub Desktop

1. 打开 GitHub Desktop
2. 选择 "Add" -> "Add Existing Repository"
3. 选择项目目录：`/Users/chunshengwu/code/drug_serve`
4. 点击 "Publish repository"
5. 填写仓库信息并发布

## 重要提示

### 环境变量文件

`.env` 文件已被 `.gitignore` 排除，不会上传到 GitHub。

**部署时需要：**
1. 在服务器上创建 `backend/.env` 文件
2. 从 `backend/.env.example` 复制模板
3. 填入实际的 API 配置

### 敏感信息

确保以下文件不会被上传（已在 .gitignore 中）：
- `backend/.env` - 包含 API 密钥
- `backend/drugs.db` - 数据库文件
- `backend/uploads/` - 上传的图片
- `node_modules/` - 前端依赖
- `venv/` - Python 虚拟环境

## 推送后建议

1. **添加 README 徽章**（可选）
2. **设置 GitHub Pages**（如果需要部署前端）
3. **添加 LICENSE**（如果需要）
4. **创建 releases**（版本发布）

## 当前分支

当前在 `main` 分支，所有代码已提交。

