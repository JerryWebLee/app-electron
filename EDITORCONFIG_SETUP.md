# EditorConfig 配置说明

## 当前配置

项目已经配置了 `.editorconfig` 文件，设置如下：

- 所有代码文件使用 2 个空格缩进
- 文件末尾自动添加换行符（`insert_final_newline = true`）
- 使用 LF 换行符
- UTF-8 编码

## VS Code 配置步骤

如果您使用 VS Code，请按以下步骤配置：

### 1. 安装 EditorConfig 扩展

1. 打开 VS Code
2. 按 `Cmd+Shift+X`（Mac）或 `Ctrl+Shift+X`（Windows/Linux）打开扩展面板
3. 搜索 "EditorConfig for VS Code"
4. 点击安装（作者：EditorConfig）

### 2. 配置 Prettier 为默认格式化工具

1. 打开 VS Code 设置（`Cmd+,` 或 `Ctrl+,`）
2. 搜索 "default formatter"
3. 将 "Editor: Default Formatter" 设置为 "Prettier - Code formatter"

**重要**：为了确保 JSON 文件（包括 `.prettierrc`）也使用 Prettier 格式化，请添加以下设置：

1. 在设置界面点击右上角的 "打开设置 (JSON)" 图标
2. 添加以下配置：

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "[json]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[jsonc]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  }
}
```

这样可以确保所有文件类型（包括 JSON）都使用 Prettier 格式化，避免缩进不一致的问题。

### 3. 启用保存时自动格式化

1. 在设置中搜索 "format on save"
2. 勾选 "Editor: Format On Save"

### 4. 验证配置

1. 打开任意代码文件（如 `src/style.css`）
2. 删除文件末尾的空行
3. 按 `Cmd+S`（Mac）或 `Ctrl+S`（Windows/Linux）保存
4. 文件末尾应该自动添加一个空行

## 其他编辑器

- **WebStorm/IntelliJ IDEA**: 内置支持 EditorConfig，无需额外配置
- **Sublime Text**: 安装 "EditorConfig" 插件
- **Atom**: 安装 "editorconfig" 包
- **Vim**: 安装 "editorconfig-vim" 插件

## 验证

配置完成后，运行以下命令验证格式化一致性：

\`\`\`bash

# 格式化所有文件

pnpm format

# 应该显示所有文件都是 (unchanged)

\`\`\`

现在编辑器保存和 `pnpm format` 命令的格式化结果应该完全一致了。
