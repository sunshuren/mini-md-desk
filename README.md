# <img src="assets/feather.svg" width="36" alt=""> AI Clipboard

[中文说明](README.zh-CN.md)

A small, local-first clipboard for AI responses. Paste a Markdown reply, click a paragraph or table cell to edit it, and copy the result back. Each paste outside an editing field creates a separate clip. Clips and appearance settings stay on your device.

## Download

Get [the latest release](https://github.com/sunshuren/mini-md-desk/releases/latest).

- **Windows x64:** Run `AI-Clipboard.exe`. The desktop app requires Microsoft Edge WebView2 Runtime and .NET Framework 4.6.2 or later.
- **Other desktop systems:** Open `AI-Clipboard.html` in a modern browser. The single HTML file works offline. Tray controls and the global shortcut are Windows desktop features.

## Windows shortcuts

| Action | How |
| --- | --- |
| Show and focus the running app from another app | **Ctrl + Alt + Space**, or click the tray icon |
| Minimize to the taskbar | **··· → Minimize** |
| Keep running in the system tray | **··· → Hide to tray**, or **Alt + F4** |
| Quit and release the shortcut | **··· → Quit**, or right-click the tray icon and choose **Quit** |

Switching to another app automatically hides the editor in the tray. Its own menus and dialogs keep it visible.

Launching the executable again brings the existing window forward. If Ctrl + Alt + Space is taken, the app tries **Ctrl + Alt + M** and displays the active shortcut in its menu. If both are taken, the menu displays a notice and the tray icon can still open the app.

## Editing

Paste with Ctrl+V, or choose **··· → Paste new clip**. Use **Open** to import a UTF-8 Markdown file. Click a clip in **History** to return to it. Inside a paragraph or cell, paste inserts text at the cursor. Tab and Shift+Tab move between table cells.

Press **Ctrl+Shift+C** to copy the full Markdown and **Ctrl+S** to export it (use Cmd on macOS). On Windows, right-click the feather icon in the system tray and choose **Settings** (browser edition: **··· → Settings**) to change the warm cream background. The interface follows the browser's preferred language, with Chinese for Chinese locales and English otherwise.

Windows releases from v1.1 onward share clip history and appearance settings. For v1.0, export your draft as Markdown first. If upgrading the standalone HTML edition, keeping its previous filename and location helps preserve browser storage.

## Build

Open `index.html` directly for the browser edition, or run `python build.py` to produce the self-contained HTML in `dist/`. On Windows the same command builds the x64 executable with the system .NET Framework compiler. The first Windows build downloads a pinned WebView2 SDK package from NuGet and verifies its SHA-256 checksum.

## License

AI Clipboard is available under the [MIT License](LICENSE). Bundled Markdown dependencies include their licenses in `vendor/` and in the generated HTML. The Windows package includes the WebView2 SDK license.
