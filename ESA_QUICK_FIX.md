# ESA 版本配额问题 - 快速修复指南

## 🎉 好消息

**构建已成功！** ✅
- 构建产物：67.01 KB
- 构建时间：1.08 秒
- 所有文件已正确生成

## ❌ 当前问题

版本创建失败：`code version number exceeds the quota limit`

**原因**：ESA 平台对代码版本数量有限制，当前已超过配额。

## 🔧 快速解决方案

### 方法 1: 在 ESA 控制台删除旧版本（推荐）

**最快操作路径**：

1. **登录控制台**
   ```
   https://esa.console.aliyun.com/
   ```

2. **找到应用**
   - 左侧菜单：应用管理 → 应用列表
   - 找到：`drug_serve`

3. **进入版本管理**
   - 点击应用名称
   - 找到"版本管理"或"代码版本"标签
   - 查看版本列表

4. **删除旧版本**
   - 选择最早的或失败的版本
   - 点击"删除"
   - 删除 2-3 个版本即可

5. **重新构建**
   - 返回应用页面
   - 点击"构建"或"重新部署"

### 方法 2: 使用阿里云 CLI（如果已安装）

```bash
# 列出所有版本
aliyun esa ListVersions --app-name drug_serve

# 删除旧版本（替换 VERSION_ID）
aliyun esa DeleteVersion --app-name drug_serve --version-id VERSION_ID
```

### 方法 3: 联系阿里云支持

如果版本数量限制过小，可以：
- 提交工单申请提高配额
- 说明项目需求和使用场景

## 📊 当前构建状态

```
✅ 构建成功
✅ 文件生成：frontend/dist/
✅ 压缩包：index.zip (67.01 KB)
❌ 版本创建：需要删除旧版本
```

## ⚠️ 重要提示

- **删除版本不会影响运行中的实例**
- **只删除不需要的旧版本**
- **保留正在使用的生产版本**
- **建议保留最近 3-5 个版本**

## 🎯 预期结果

删除旧版本并重新构建后，应该看到：
```
✅ Build application successfully.
✅ Creating code version...
✅ Create version successfully.
✅ Deploy application successfully.
```

## 📝 后续建议

1. **定期清理**：每月清理一次旧版本
2. **版本命名**：为重要版本添加标签
3. **监控配额**：定期检查版本数量

---

**操作完成后，重新触发构建即可完成部署！** 🚀

