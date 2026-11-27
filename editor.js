function paint(field) {
  const { el, kind, start, end } = field;
  const value = source.slice(start, end);
  if (kind === 'block') el.innerHTML = md.render(value);
  else el.innerHTML = md.renderInline(kind === 'cell' ? value.replace(/\\\|/g, '|') : value);
  if (!value && kind === 'block') {
    el.textContent = tr("Click here to paste or write Markdown…");
    el.classList.add('empty');
  }
}

function field(el, start, end, kind) {
  const item = { el, start, end, kind };
  fields.push(item);
  el.classList.add('editable');
  el.tabIndex = 0;
  el.addEventListener('click', event => { event.preventDefault(); begin(item); });
  el.addEventListener('keydown', event => {
    if (event.target === el && event.key === 'Enter') { event.preventDefault(); begin(item); }
  });
  paint(item);
}

// Locate original cell text so untouched delimiters and spacing survive edits.
function cells(line) {
  const bars = [];
  for (let i = 0; i < line.length; i++) {
    if (line[i] === '\\') { i++; continue; }
    if (line[i] === '|') bars.push(i);
  }
  const bounds = [-1, ...bars, line.length];
  return bounds.slice(1).flatMap((end, i) => {
    const start = bounds[i] + 1;
    const raw = line.slice(start, end);
    if (!raw.trim() && bars.length && (i === 0 || i === bounds.length - 2)) return [];
    const left = start + raw.length - raw.trimStart().length;
    return [[left, left + raw.trim().length]];
  });
}

function draw() {
  active = null;
  page.replaceChildren();
  fields = [];
  const lines = source.split(/\r\n|\n|\r/);
  const offsets = [0];
  for (const match of source.matchAll(/\r\n|\n|\r/g)) offsets.push(match.index + match[0].length);
  for (const token of md.parse(source, {})) {
    if (token.level !== 0 || !token.map) continue;
    const [first, stop] = token.map;
    const start = offsets[first];
    const end = offsets[stop - 1] + lines[stop - 1].length;
    if (token.type === 'table_open') {
      const table = page.appendChild(document.createElement('table'));
      for (let n = first; n < stop; n++) {
        if (n === first + 1) continue;
        const row = table.insertRow();
        for (const [a, b] of cells(lines[n])) {
          field(row.appendChild(document.createElement(n === first ? 'th' : 'td')), offsets[n] + a, offsets[n] + b, 'cell');
        }
      }
    } else {
      const prefix = token.type === 'heading_open' && lines[first].match(/^ {0,3}#{1,6}[ \t]+/);
      const el = page.appendChild(document.createElement(prefix ? token.tag : 'div'));
      el.className = 'block';
      field(el, start + (prefix ? prefix[0].length : 0), end, prefix ? 'inline' : 'block');
    }
  }
  if (!fields.length) field(page.appendChild(document.createElement('div')), 0, source.length, 'block');
}

function begin(item) {
  if (active === item) return;
  const input = document.createElement('textarea');
  input.setAttribute('aria-label', item.kind === 'cell' ? tr("Edit cell") : tr("Edit paragraph"));
  input.value = source.slice(item.start, item.end);
  item.el.classList.remove('empty');
  item.el.replaceChildren(input);
  active = item;
  function resize() { input.style.height = 'auto'; input.style.height = (input.scrollHeight + 2) + 'px'; }
  input.addEventListener('input', event => {
    let value = input.value.replace(/\n/g, newline);
    if (item.kind === 'cell') value = value.replace(/\r?\n/g, ' ').replace(/(\\*)\|/g, (match, slashes) => slashes.length % 2 ? match : '\\' + match);
    const delta = value.length - (item.end - item.start);
    source = source.slice(0, item.start) + value + source.slice(item.end);
    item.end += delta;
    for (const next of fields.slice(fields.indexOf(item) + 1)) { next.start += delta; next.end += delta; }
    resize();
    remember();
    if (event.inputType === 'insertFromPaste' && !event.isComposing) {
      // Reparse the whole clip: one pasted block can become an editable table
      // or several independent headings, lists, and code blocks.
      draw();
    }
  });
  input.addEventListener('blur', () => {
    if (active !== item) return;
    active = null;
    paint(item);
    setTimeout(() => { if (!active && !page.contains(document.activeElement)) draw(); }, 0);
  });
  input.addEventListener('keydown', event => {
    if (event.key === 'Escape' || (item.kind === 'cell' && event.key === 'Enter' && !event.isComposing)) {
      event.preventDefault(); input.blur();
    }
    if (event.key === 'Tab') {
      const next = fields[fields.indexOf(item) + (event.shiftKey ? -1 : 1)];
      if (next) { event.preventDefault(); input.blur(); begin(next); }
    }
  });
  resize(); input.focus();
}

