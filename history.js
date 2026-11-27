const entryPrefix = 'mini-md-desk.clip.';
const selectedKey = 'mini-md-desk.selected';
const legacyKey = 'mini-md-desk.document.v1';
const historyList = document.querySelector('#history');
const entries = new Map();
let selected = null;
let pictureDB;
const pictureIds = new Set();
function pictureStore(mode) {
  return pictureDB.transaction('clips', mode).objectStore('clips');
}
function openPictureHistory() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('ai-clipboard-pictures', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('clips', {keyPath: 'id'});
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      pictureDB = request.result;
      const load = pictureStore('readonly').getAll();
      load.onsuccess = () => {
        for (const entry of load.result) {
          pictureIds.add(entry.id);
          entries.set(entry.id, entry);
        }
        resolve();
      };
      load.onerror = () => reject(load.error);
    };
  });
}

function label(entry) {
  if (![tr("Untitled clip"), "Untitled clip", "未命名草稿"].includes(entry.filename)) return entry.filename;
  if (entry.source.trimStart().startsWith('![')) {
    const alt = /^!\[([^\]]*)\]/.exec(entry.source.trimStart());
    if (alt) return alt[1] || tr('Image');
  }
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
    if (pictureDB && (pictureIds.has(entry.id) || entry.source.includes('data:image/'))) {
      const transaction = pictureStore('readwrite').put(entry).transaction;
      pictureIds.add(entry.id);
      transaction.oncomplete = () => { try { localStorage.removeItem(entryPrefix + entry.id); } catch {} };
      transaction.onabort = () => { if (selected === entry.id) status.textContent = tr("Local storage unavailable. Save a .md copy."); };
    } else {
      localStorage.setItem(entryPrefix + selected, JSON.stringify(entry));
    }
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

async function restoreHistory() {
  try { await openPictureHistory(); } catch {}
  try {
    for (const key of Object.keys(localStorage)) {
      if (!key.startsWith(entryPrefix)) continue;
      try {
        const entry = JSON.parse(localStorage.getItem(key));
        if (entry && !pictureIds.has(entry.id) && key === entryPrefix + entry.id && typeof entry.source === 'string' && typeof entry.filename === 'string') entries.set(entry.id, entry);
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

document.querySelector('#delete').onclick = async () => {
  if (!selected || !confirm(tr("Delete this local clip?"))) return;
  const id = selected;
  try {
    if (pictureIds.has(id)) {
      await new Promise((resolve,reject) => {
        const tx = pictureStore('readwrite').delete(id).transaction;
        tx.oncomplete = resolve;
        tx.onabort = () => reject(tx.error);
      });
      pictureIds.delete(id);
    }
    localStorage.removeItem(entryPrefix + id);
  }
  catch { status.textContent = tr("Could not delete this clip. Try again."); return; }
  entries.delete(id);
  if (selected !== id) { drawHistory(); return; }
  const latest = Array.from(entries.values()).sort((a,b) => b.created - a.created)[0];
  select(latest ? latest.id : null);
};

