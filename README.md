# 极简 MD 剪贴板

把 AI 回复粘成独立条目，从右上角「···」切换历史，点右侧的段落或表格直接改字。记录只保存在本机。Windows 版使用无边框窗口，窗口中只显示正文和「···」。拖动顶部空白处可以移动窗口，拖动右下角可以调整大小。

## 使用

从 [GitHub Releases](https://github.com/sunshuren/mini-md-desk/releases/latest) 下载：

- **Windows x64**：双击 `MiniMD.exe`，需要 Microsoft Edge WebView2 Runtime 和 .NET Framework 4.6.2 或更高版本。
- **其他桌面系统**：下载 `MiniMD.html`，用现代浏览器打开。浏览器窗口保留其自身标题栏。

正文默认使用暖米黄。在「··· → 外观设置 → 背景色」可自选颜色，关闭后仍会保留。Windows 应用支持逐显示器 DPI 感知。

打开右上角「···」点「粘贴新条目」或在正文编辑框以外按 Ctrl+V，将剪贴板文字添加到历史。编辑框内粘贴会插入当前段落或单元格。点「打开」也可以导入 UTF-8 文本。点击菜单中的记录标题切换条目，点「删除」可移除当前记录。

点文字开始编辑，点击外面恢复排版；表格中按 Tab 或 Shift+Tab 切换单元格。按 Ctrl+Shift+C 或点菜单中的「复制全文」取回当前 Markdown，或按 Ctrl+S（macOS 为 Cmd+S）保存文件。关闭再打开应用会恢复条目。正式留档请导出 .md。

### 从 1.0 升级

Windows 1.1 使用独立的 WebView2 本机存储。要带入旧草稿，请在 1.0 窗口导出 .md，再用新版的「打开」导入。旧窗口已关闭时，可以重新运行 1.0。HTML 版在同一浏览器和文件位置升级时会导入已有草稿。

## 构建

直接打开 `index.html` 即可使用浏览器版。运行 `python build.py` 在 `dist/` 生成离线 HTML。Windows 上还会用系统 .NET Framework C# 编译器生成自解包 EXE。首次构建桌面版会从 NuGet 下载固定版本的 WebView2 SDK 并校验 SHA-256。应用启动和编辑无需联网。

## 许可

应用代码采用 MIT 许可证。Markdown 解析使用 markdown-it，第三方许可随附于 `vendor/` 并嵌入 HTML。Windows 包同时携带 WebView2 SDK 的许可文件。
