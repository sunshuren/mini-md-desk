# 极简 MD

把 AI 回复粘进来，直接点段落或表格单元格改字，再复制或保存为 Markdown。可离线使用，草稿保存在当前设备。

## 下载和使用

从 [GitHub Releases](https://github.com/sunshuren/mini-md-desk/releases/latest) 下载：

- **Windows**：双击 `MiniMD.exe`，使用本机 Microsoft Edge 打开独立窗口。需要 Edge 和 .NET Framework 4.5 或更高版本。
- **其他桌面系统**：下载 `MiniMD.html`，用现代浏览器打开。HTML 文件已包含编辑器及解析器。

点「粘贴新稿」导入剪贴板，或点「打开」读取 UTF-8 Markdown 文件。点击文字开始编辑，点外面恢复排版。表格里按 Tab / Shift+Tab 切换单元格。段落内可直接修改 Markdown 标记。

点「复制全文」取回 Markdown。点「保存 .md」或按 Ctrl+S（macOS 为 Cmd+S）导出。草稿缓存仅保留最近一篇，正式留档请保存为文件。复制粘贴按钮需要浏览器的剪贴板权限。也可点击正文后使用系统粘贴快捷键。

## 从源码运行

直接打开 `index.html` 即可使用。运行 `python build.py` 可在 `dist/` 生成单文件 HTML。Windows 上同一命令还会用系统 .NET Framework C# 编译器构建 EXE。构建无需联网。

## 许可

应用代码采用 MIT 许可证。Markdown 解析使用 markdown-it，第三方许可随附于 `vendor/`，并嵌入发行文件。

