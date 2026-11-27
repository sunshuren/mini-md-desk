const chineseUI = navigator.language.toLowerCase().startsWith('zh');
const chineseText = {
  "Copy image": "复制图片",
  "Image": "图片",
  "Could not copy this image.": "复制图片失败，请重试。",
  "Could not read this image.": "读取图片失败，请重试。",
  "History and actions": "历史和操作",
  "Clip actions": "文稿操作",
  "Paste new clip": "粘贴新条目",
  "Open": "打开",
  "Copy Markdown": "复制全文",
  "Save .md": "保存 .md",
  "History": "剪贴记录",
  "Delete selected clip": "删除当前条目",
  "Settings": "设置",
  "Done": "完成",
  "Background": "背景色",
  "Reset to cream": "恢复米黄",
  "Minimize": "最小化",
  "Hide to tray": "后台运行",
  "Quit": "退出",
  "Untitled clip": "未命名草稿",
  "Empty clip": "空白条目",
  "Saved on this device": "已存到本机",
  "Local storage unavailable. Save a .md copy.": "本机缓存不可用，请保存 .md",
  "Delete this local clip?": "删除这条本机记录？",
  "Could not delete this clip. Try again.": "删除失败，请重试",
  "This color will last for this session.": "颜色仅在本次打开时生效",
  "[Image: ": "[图片：",
  " · AI Clipboard": " · AI 剪贴板",
  "The clipboard contains no text.": "剪贴板中没有文字",
  "Click outside the text and paste to create a clip.": "点击正文外的空白处，按 Ctrl+V 新建条目",
  "Could not read the file. Try again.": "文件读取失败，请重新打开",
  "Markdown copied": "已复制 Markdown 全文",
  "Clipboard unavailable. Save a .md copy.": "无法访问剪贴板，请保存 .md",
  "New edits are waiting to be saved": "有新的修改待保存",
  "File saved": "文件已保存",
  "Markdown download requested": "已请求下载 Markdown 文件",
  "Could not save. Try again.": "保存失败，请重试",
  "Click here to paste or write Markdown…": "点击这里，粘贴或输入 Markdown…",
  "Edit cell": "编辑单元格",
  "Edit paragraph": "编辑段落",
  "Clip": "文稿",
  "Shortcut in use. Open from the tray instead.": "快捷键已被占用，请用托盘图标打开"
};
const tr = text => chineseUI ? (chineseText[text] || text) : text;
document.documentElement.lang = chineseUI ? 'zh-CN' : 'en';
for (const el of document.querySelectorAll('[data-label]')) el.textContent = tr(el.textContent);
for (const el of document.querySelectorAll('[aria-label], [title]')) {
  for (const attr of ['aria-label','title']) if (el.hasAttribute(attr)) el.setAttribute(attr, tr(el.getAttribute(attr)));
}
