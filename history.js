const entryPrefix = 'mini-md-desk.clip.';
const selectedKey = 'mini-md-desk.selected';
const legacyKey = 'mini-md-desk.document.v1';
const historyList = document.querySelector('#history');
const entries = new Map();
let selected = null;

function label(entry) {
  if (![tr("Untitled clip"), "Untitled clip", "未命名草稿"].includes(entry.filename)) return entry.filename;
  return entry.source.trimStart().split(/[\r\n]/, 1)[0].replace(/^#{1,6}\s+/, '').slice(0, 64) || tr("Empty clip");
}

function drawHistory() {
  historyList.replaceChildren();
  const ordered = Array.from(entries.values()).sort((a, b) => b.created - a.created);
  for (const entry of ordered) {
    const button = document.createElement('button');
    button.textContent = label(entry);
    button.title = button.textContent;
    button.setAttribute('aria-current', String(entry.id === selected));
    button.onclick = () => select(entry.id);
    historyList.appendChild(button);
  }
  document.querySelector('#delete').disabled = !selected;
}

function select(id) {
  selected = id;
  const entry = entries.get(id);
  showDocument(entry ? entry.source : '', entry ? entry.filename : tr("Untitled clip"));
  dirty = entry ? entry.dirty : false;
  try { localStorage.setItem(selectedKey, id || ''); } catch {}
  status.textContent = '';
  drawHistory();
}

function persist() {
  if (!selected) {
    selected = crypto.randomUUID();
    entries.set(selected, { id: selected, created: Date.now() });
  }
  const entry = entries.get(selected);
  Object.assign(entry, { source, filename, dirty });
  drawHistory();
  try {
    localStorage.setItem(entryPrefix + selected, JSON.stringify(entry));
    localStorage.setItem(selectedKey, selected);
    status.textContent = tr("Saved on this device");
    return true;
  } catch {
    status.textContent = tr("Local storage unavailable. Save a .md copy.");
    return false;
  }
}

function replaceDocument(text, name, changed) {
  selected = null;
  dirty = changed;
  showDocument(text, name);
  persist();
}

function restoreHistory() {
  try {
    for (const key of Object.keys(localStorage)) {
      if (!key.startsWith(entryPrefix)) continue;
      try {
        const entry = JSON.parse(localStorage.getItem(key));
        if (entry && key === entryPrefix + entry.id && typeof entry.source === 'string' && typeof entry.filename === 'string') entries.set(entry.id, entry);
      } catch {}
    }
    const legacy = JSON.parse(localStorage.getItem(legacyKey));
    if (!entries.size && legacy && typeof legacy.source === 'string' && legacy.source) {
      showDocument(legacy.source, legacy.filename || tr("Untitled clip"));
      dirty = !!legacy.dirty;
      if (persist()) localStorage.removeItem(legacyKey);
      return;
    }
    const last = localStorage.getItem(selectedKey);
    select(entries.has(last) ? last : entries.keys().next().value || null);
  } catch { select(null); }
}

document.querySelector('#delete').onclick = () => {
  if (!selected || !confirm(tr("Delete this local clip?"))) return;
  try { localStorage.removeItem(entryPrefix + selected); }
  catch { status.textContent = tr("Could not delete this clip. Try again."); return; }
  entries.delete(selected);
  const latest = Array.from(entries.values()).sort((a,b) => b.created - a.created)[0];
  select(latest ? latest.id : null);
};

