'use strict';
const md = window.markdownit({ html: false, breaks: true });
md.renderer.rules.image = (tokens, index) => {
  const token = tokens[index];
  const escape = md.utils.escapeHtml;
  const alt = token.content;
  const url = token.attrGet('src').replace(/>/g, '%3E');
  const title = token.attrGet('title');
  const markdown = '![' + alt + '](<' + url + '>' + (title ? ' ' + JSON.stringify(title) : '') + ')';
  return '<span contenteditable="false" data-image-markdown="' + escape(markdown) + '">' +
    escape(tr("[Image: ") + alt + ']') + '</span>';
};
const page = document.querySelector('main');
const status = document.querySelector('#status');
let source = '', filename = tr("Untitled clip"), newline = '\n', dirty = false;
let fields = [];

function remember() { dirty = true; persist(); }
function showDocument(text, name) {
  source = text;
  filename = name;
  newline = text.includes('\r\n') ? '\r\n' : '\n';
  document.querySelector('#filename').textContent = filename;
  document.title = filename + tr(" · AI Clipboard");
  draw();
}
restoreHistory();

document.querySelector('#paste').onclick = async () => {
  try {
    const text = await navigator.clipboard.readText();
    if (text) replaceDocument(text, tr("Untitled clip"), true);
    else status.textContent = tr("The clipboard contains no text.");
  } catch { status.textContent = tr("Click outside the text and paste to create a clip."); }
};
document.addEventListener('paste', event => {
  if (event.defaultPrevented || event.target.isContentEditable) return;
  const text = event.clipboardData.getData('text/plain');
  if (text) { event.preventDefault(); replaceDocument(text, tr("Untitled clip"), true); }
});
const picker = document.querySelector('input[type=file]');
document.querySelector('#open').onclick = () => picker.click();
picker.onchange = async () => {
  const file = picker.files[0];
  try { if (file) replaceDocument(await file.text(), file.name, false); }
  catch { status.textContent = tr("Could not read the file. Try again."); }
  finally { picker.value = ''; }
};
document.querySelector('#copy').onclick = async () => {
  try { await navigator.clipboard.writeText(source); status.textContent = tr("Markdown copied"); }
  catch { status.textContent = tr("Clipboard unavailable. Save a .md copy."); }
};
async function save() {
  const text = source;
  const savedId = selected;
  const name = /\.(md|markdown)$/i.test(filename) ? filename : filename + '.md';
  try {
    if (window.showSaveFilePicker) {
      const handle = await window.showSaveFilePicker({ suggestedName: name, types: [{description:'Markdown',accept:{'text/markdown':['.md','.markdown']}}] });
      const writer = await handle.createWritable();
      await writer.write(text);
      await writer.close();
      if (selected !== savedId) return;
      filename = handle.name;
      document.querySelector('#filename').textContent = filename;
      document.title = filename + tr(" · AI Clipboard");
      dirty = source !== text;
      persist();
      status.textContent = dirty ? tr("New edits are waiting to be saved") : tr("File saved");
    } else {
      const url = URL.createObjectURL(new Blob([text], {type:'text/markdown;charset=utf-8'}));
      const a = document.createElement('a'); a.href = url; a.download = name; a.click();
      setTimeout(() => URL.revokeObjectURL(url), 30000);
      status.textContent = tr("Markdown download requested");
    }
  } catch (error) { if (error.name !== 'AbortError') status.textContent = tr("Could not save. Try again."); }
}
document.querySelector('#save').onclick = save;
document.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') { e.preventDefault(); save(); }
});


const settings = document.querySelector('#settings');
function openSettings() {
  document.querySelector('#actions').hidePopover();
  if (!settings.open) settings.showModal();
}
document.querySelector('#browser-settings').onclick = openSettings;
const desktop = window.chrome?.webview;
if (desktop) {
  document.body.classList.add('desktop');
  document.querySelector('#browser-settings').remove();
  desktop.addEventListener('message', event => {
    if (event.data === 'open-settings') openSettings();
    else if (['Ctrl + Alt + Space', 'Ctrl + Alt + M'].includes(event.data)) document.querySelector('#hotkey').textContent = event.data;
    else if (event.data === 'shortcut-unavailable') document.querySelector('#hotkey').textContent = tr('Shortcut in use. Open from the tray instead.');
  });
  desktop.postMessage('hotkey-status');
  for (const action of ['minimize', 'hide', 'quit']) {
    document.getElementById(action).onclick = () => { document.querySelector('#actions').hidePopover(); desktop.postMessage(action); };
  }
  document.querySelector('header').addEventListener('pointerdown', e => {
    if (e.button === 0 && !e.target.closest('button')) desktop.postMessage('drag');
  });

}

const actions = document.querySelector('#actions');
function showActions(x, y) {
  actions.showPopover();
  actions.style.left = Math.max(0, Math.min(x, innerWidth - actions.offsetWidth)) + 'px';
  actions.style.top = Math.max(0, Math.min(y, innerHeight - actions.offsetHeight)) + 'px';
}
document.addEventListener('contextmenu', event => {
  if (settings.open || event.target.closest('textarea, input, #actions')) return;
  event.preventDefault();
  showActions(event.clientX, event.clientY);
});
document.addEventListener('keydown', event => {
  if (!settings.open && event.shiftKey && event.key === 'F10') {
    event.preventDefault();
    const rect = document.activeElement.getBoundingClientRect();
    showActions(rect.left + 8, rect.top + 8);
    actions.querySelector('button').focus();
  }
});
document.querySelector('#history').addEventListener('click', () => actions.hidePopover());
document.addEventListener('keydown', event => {
  if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.code === 'KeyC') {
    event.preventDefault();
    document.querySelector('#copy').click();
  }
});
