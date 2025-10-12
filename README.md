# Auto Fold 📂

<div align="center">
  <img src="./images/auto-foldx.png" alt="Auto Fold Logo" width="128" height="128">
</div>

A powerful VS Code extension that automatically folds newly opened files according to preconfigured folding levels, helping you better organize and navigate your code.

[中文文档](README.zh-CN.md)

## ✨ Features

- 🚀 Auto Folding: Automatically fold code according to configured levels when opening files
- ⚡️ Fast Response: Execute folding operations immediately after file opening
- 🎯 Precise Control: Support for configuring multiple folding levels
- 🔧 Flexible Configuration: Customizable folding delay time
- 💡 Smart Recognition: Support for all file types with code folding capabilities

## 📥 Installation

1. Open VS Code
2. Press `Cmd+P` (macOS) or `Ctrl+P` (Windows/Linux) to open the command palette
3. Type `ext install auto-fold` and press Enter
4. Click the "Install" button to install the extension
5. Reload VS Code to activate the extension

Alternatively, you can visit the [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=auto-fold) to install this extension directly.

## ⚙️ Configuration

The extension provides the following configuration options:

### `autoFold.foldLevelOnOpen`

Defines the array of folding levels to apply when files are opened.

- Type: `number[]`
- Default: `[1]`
- Range: `1-7`
- Examples:
  - `[1]` - Fold only the first level
  - `[1, 2]` - Fold the first and second levels
  - `[1, 2, 3]` - Fold the first three levels
  - `[]` or `[0]` - Disable auto folding

### `autoFold.openDelayMs`

Defines the delay time to wait before executing folding operations after files are opened.

- Type: `number`
- Default: `300`
- Unit: milliseconds
- Range: `0-5000`

## 🚀 Usage

1. After installing and enabling the extension, it will automatically take effect
2. Open any file that supports code folding
3. The extension will automatically fold code blocks according to your configuration
4. You can manually adjust the folding state at any time using VS Code's fold/unfold commands

## 👨‍💻 Development Guide

### Development Environment Setup

1. Clone the repository and install dependencies:

```bash
git clone https://github.com/yourusername/auto-fold.git
cd auto-fold
pnpm install
```

2. Open the project in VS Code
3. Press `F5` to start debugging mode

### Available Development Commands

- **Compile:**

  ```bash
  pnpm run compile
  ```

- **Watch Mode:**

  ```bash
  pnpm run watch
  ```

- **Linting:**

  ```bash
  pnpm run lint
  ```

- **Type Checking:**

  ```bash
  pnpm run check-types
  ```

- **Run Tests:**
  ```bash
  pnpm run test
  ```

### Packaging and Publishing

1. Package the extension:

   ```bash
   pnpm run package
   ```

2. Publish the extension:
   ```bash
   pnpm run publish
   ```

> **Note:** Please ensure you have updated the version number and passed all tests before publishing.

## 🎯 To-do

- ◽ Get editor folding code shortcut key configuration
- ◽ Support different folding configurations corresponding to different files

## 🤝 Contribution Guidelines

We welcome all forms of contributions, including but not limited to:

- 🐛 Bug reports
- 💡 Feature suggestions
- 📝 Documentation improvements
- 🔧 Code fixes
- ✨ New feature implementations

### Steps for Submitting a PR

1. Fork this repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Code of Conduct

- Be friendly and professional
- Describe your changes in detail
- Follow the existing code style
- Add necessary tests
- Update relevant documentation

## 📝 Changelog

### 1.0.0 (2025-10-10)

- 🎉 Initial release
- ✨ Implemented basic auto-folding functionality
- ⚙️ Added custom configuration options
- 📚 Completed basic documentation

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details
