# Auto Fold 📂

<div align="center">
  <img src="./images/auto-foldx.png" alt="Auto Fold Logo" width="128" height="128">
</div>

一款强大的 VS Code 扩展，能够根据预配置的折叠级别自动折叠新打开的文件，帮助你更好地组织和浏览代码。

[English Document](README.md)

## ✨ 特性

- 🚀 自动折叠：打开文件时自动根据配置的级别进行代码折叠
- ⚡️ 快速响应：文件打开后立即执行折叠操作
- 🎯 精确控制：支持配置多个折叠级别
- 🔧 灵活配置：可自定义折叠延迟时间
- 💡 智能识别：支持所有具有代码折叠功能的文件类型

## 📥 安装

1. 打开 VS Code
2. 按下 `Cmd+P` (macOS) 或 `Ctrl+P` (Windows/Linux) 打开命令面板
3. 输入 `ext install auto-foldx` 并按回车
4. 点击 "Install" 按钮安装扩展
5. 重新加载 VS Code 使扩展生效

或者，您也可以直接访问 [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=ljt990218.auto-foldx) 安装本扩展。

## ⚙️ 配置

扩展提供了以下配置选项：

### `autoFold.foldLevelOnOpen`

定义文件打开时要应用的折叠级别配置。支持两种配置方式：

**方式一：简单数组配置（适用于所有文件）**

- 类型：`number[]`
- 默认值：`[2, 3]`
- 取值范围：`1-7`
- 示例：
  - `[1]` - 只折叠第一级
  - `[1, 2]` - 折叠第一级和第二级
  - `[1, 2, 3]` - 折叠前三级
  - `[]` 或 `[0]` - 禁用自动折叠

**方式二：对象配置（为不同文件类型设置不同折叠级别）**

```json
{
  "default": [2, 3],
  "patterns": [
    {
      "pattern": ".vue",
      "foldLevels": [2, 3, 4, 5]
    },
    {
      "pattern": ".tsx",
      "foldLevels": [2, 3, 4, 5]
    },
    {
      "pattern": ".jsx",
      "foldLevels": [2, 3, 4, 5]
    },
    {
      "pattern": ".ts",
      "foldLevels": [2, 3, 4]
    },
    {
      "pattern": ".js",
      "foldLevels": [2, 3, 4]
    },
    {
      "pattern": ".py",
      "foldLevels": [2, 3, 4]
    },
    {
      "pattern": ".json",
      "foldLevels": [2, 3, 4]
    }
  ]
}
```

- **default**: 未匹配特定模式的文件的默认折叠级别
- **patterns**: 文件模式数组，支持 glob 语法或文件扩展名（如 `.ts`, `.js`, `.vue`）

### `autoFold.openDelayMs`

定义文件打开后等待执行折叠操作的延迟时间。

- 类型：`number`
- 默认值：`300`
- 单位：毫秒
- 取值范围：`0-5000`

## 🚀 使用方法

1. 安装并启用扩展后，它会自动生效
2. 打开任意支持代码折叠的文件
3. 扩展会根据您的配置自动折叠代码块
4. 您可以随时通过 VS Code 的折叠/展开命令手动调整折叠状态

## 👨‍💻 开发指南

### 开发环境设置

1. 克隆仓库并安装依赖：

```bash
git clone https://github.com/yourusername/auto-fold.git
cd auto-fold
pnpm install
```

2. 在 VS Code 中打开项目
3. 按下 `F5` 启动调试模式

### 可用的开发命令

- **编译：**

  ```bash
  pnpm run compile
  ```

- **监听模式：**

  ```bash
  pnpm run watch
  ```

- **代码检查：**

  ```bash
  pnpm run lint
  ```

- **类型检查：**

  ```bash
  pnpm run check-types
  ```

- **运行测试：**
  ```bash
  pnpm run test
  ```

### 打包和发布

1. 打包扩展：

```bash
pnpm run package
```

2. 发布扩展：

```bash
pnpm run publish
```

> **注意：** 发布前请确保已更新版本号并通过所有测试。

## 🎯 待办

- ✅ 支持不同文件对应不同折叠配置

## 🤝 贡献指南

我们欢迎所有形式的贡献，包括但不限于：

- 🐛 报告问题
- 💡 提出新功能建议
- 📝 改进文档
- 🔧 提交代码修复
- ✨ 实现新功能

### 提交 PR 的步骤

1. Fork 本仓库
2. 创建你的特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交你的更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启一个 Pull Request

### 行为准则

- 保持友善和专业
- 详细描述你的更改
- 遵循现有的代码风格
- 添加必要的测试
- 更新相关文档

## 📝 更新日志

### 1.0.0 (2025-10-10)

- 🎉 首次发布
- ✨ 实现基础的自动折叠功能
- ⚙️ 添加自定义配置选项
- 📚 完成基础文档

### 1.0.1 (2025-10-18)

- 🔧 改进引擎兼容性

### 1.1.0 (2025-10-24)

- ✨ 新增对不同文件类型对应不同折叠级别的支持

## 📄 许可证

此项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件
