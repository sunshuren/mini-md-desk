'use strict';
const md = window.markdownit({ html: false, breaks: true });
md.renderer.rules.image = (tokens, i) => '[图片：' + md.utils.escapeHtml(tokens[i].content) + ']';
const page = document.querySelector('main');
const status = document.querySelector('#status');
const storageKey = 'mini-md-desk.document.v1';
let source = '', filename = '未命名草稿', newline = '\n', dirty = false;
let fields = [], active = null;

function persist() {
  try {
    localStorage.setItem(storageKey, JSON.stringify({ source, filename, dirty }));
    status.textContent = '草稿已保存在本机';
  } catch { status.textContent = '草稿缓存不可用，请保存 .md'; }
}
function remember() { dirty = true; persist(); }
function showDocument(text, name) {
  source = text;
  filename = name;
  newline = text.includes('\r\n') ? '\r\n' : '\n';
  document.querySelector('#filename').textContent = filename;
  document.title = filename + ' · 极简 MD';
  draw();
}
function replaceDocument(text, name, changed) {
  if (dirty && source && !confirm('当前草稿尚未导出。要替换为新文稿吗？')) return;
  dirty = changed;
  showDocument(text, name);
  persist();
}
try {
  const cached = JSON.parse(localStorage.getItem(storageKey));
  if (cached && typeof cached.source === 'string' && typeof cached.filename === 'string') {
    dirty = !!cached.dirty;
    showDocument(cached.source, cached.filename);
    status.textContent = '已恢复本机草稿';
  } else showDocument('', filename);
} catch { showDocument('', filename); }

document.querySelector('#paste').onclick = async () => {
  try {
    const text = await navigator.clipboard.readText();
    if (text) replaceDocument(text, '未命名草稿', true);
    else status.textContent = '剪贴板中没有文字';
  } catch { status.textContent = '请点击正文后按 Ctrl+V 粘贴'; }
};
document.addEventListener('paste', event => {
  if (event.target.tagName === 'TEXTAREA') return;
  const text = event.clipboardData.getData('text/plain');
  if (text) { event.preventDefault(); replaceDocument(text, '未命名草稿', true); }
});
const picker = document.querySelector('input[type=file]');
document.querySelector('#open').onclick = () => picker.click();
picker.onchange = async () => {
  const file = picker.files[0];
  try { if (file) replaceDocument(await file.text(), file.name, false); }
  catch { status.textContent = '文件读取失败，请重新打开'; }
  finally { picker.value = ''; }
};
document.querySelector('#copy').onclick = async () => {
  try { await navigator.clipboard.writeText(source); status.textContent = '已复制 Markdown 全文'; }
  catch { status.textContent = '无法访问剪贴板，请保存 .md'; }
};
async function save() {
  const text = source;
  const name = /\.(md|markdown)$/i.test(filename) ? filename : filename + '.md';
  try {
    if (window.showSaveFilePicker) {
      const handle = await window.showSaveFilePicker({ suggestedName: name, types: [{description:'Markdown',accept:{'text/markdown':['.md','.markdown']}}] });
      const writer = await handle.createWritable();
      await writer.write(text);
      await writer.close();
      filename = handle.name;
      document.querySelector('#filename').textContent = filename;
      document.title = filename + ' · 极简 MD';
      dirty = source !== text;
      persist();
      status.textContent = dirty ? '有新的修改待保存' : '文件已保存';
    } else {
      const url = URL.createObjectURL(new Blob([text], {type:'text/markdown;charset=utf-8'}));
      const a = document.createElement('a'); a.href = url; a.download = name; a.click();
      setTimeout(() => URL.revokeObjectURL(url), 30000);
      status.textContent = '已请求下载 Markdown 文件';
    }
  } catch (error) { if (error.name !== 'AbortError') status.textContent = '保存失败，请重试'; }
}
document.querySelector('#save').onclick = save;
document.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') { e.preventDefault(); save(); }
});

