const writer = new TurndownService({
  headingStyle: 'atx', bulletListMarker: '-', codeBlockStyle: 'fenced', emDelimiter: '*'
});
writer.use(turndownPluginGfm.gfm);
writer.addRule('imagePlaceholder', {
  filter: node => node.hasAttribute('data-image-markdown'),
  replacement: (_, node) => node.dataset.imageMarkdown
});

function updateField(item, markdown) {
  let value = markdown.replace(/\r\n|\r|\n/g, newline);
  if (item.kind === 'cell') {
    value = value.replace(/[\r\n]+/g, ' ').replace(/(\\*)\|/g, (match, escapes) => escapes.length % 2 ? match : '\\' + match);
  }
  if (value === source.slice(item.start, item.end)) return;
  const delta = value.length - (item.end - item.start);
  source = source.slice(0, item.start) + value + source.slice(item.end);
  item.end += delta;
  for (const next of fields.slice(fields.indexOf(item) + 1)) {
    next.start += delta;
    next.end += delta;
  }
  remember();
}

function field(el, start, end, kind) {
  const item = { el, start, end, kind };
  fields.push(item);
  el.classList.add('editable');
  el.contentEditable = 'true';
  el.spellcheck = false;
  el.setAttribute('aria-label', kind === 'cell' ? tr("Edit cell") : tr("Edit paragraph"));
  const value = source.slice(start, end);
  el.innerHTML = kind === 'block' ? md.render(value, renderEnv) : md.renderInline(
    kind === 'cell' ? value.replace(/\\\|/g, '|') : value, renderEnv
  );
  if (kind === 'block') el.dataset.placeholder = tr("Click here to paste or write Markdown…");
  el.addEventListener('input', () => {
    updateField(item, writer.turndown(el.innerHTML));
  });
  el.addEventListener('paste', event => {
    event.preventDefault();
    event.stopPropagation();
    const text = event.clipboardData.getData('text/plain');
    if (!text) return;
    if (!el.textContent.trim() && !el.querySelector('hr, pre, ul, ol, blockquote')) {
      updateField(item, text);
      draw();
      return;
    }
    if (getSelection().anchorNode?.parentElement?.closest('pre, code')) {
      document.execCommand('insertText', false, text);
      return;
    }
    const html = kind === 'block' && text.includes('\n') ? md.render(text) : md.renderInline(text);
    document.execCommand('insertHTML', false, html);
    // Pasting a table can create new editable cells.
    if (kind === 'block' && text.includes('\n')) draw();
  });
  el.addEventListener('drop', event => event.preventDefault());
  el.addEventListener('keydown', event => {
    if (event.isComposing || event.keyCode === 229) return;
    if (event.key === 'Escape' || (kind === 'cell' && event.key === 'Enter')) {
      event.preventDefault();
      el.blur();
    } else if (event.key === 'Tab' && kind === 'cell') {
      const next = fields[fields.indexOf(item) + (event.shiftKey ? -1 : 1)];
      if (next) {
        event.preventDefault();
        next.el.focus();
      }
    }
  });
}
let renderEnv;


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
  renderEnv = {};
  page.replaceChildren();
  fields = [];
  const lines = source.split(/\r\n|\n|\r/);
  const offsets = [0];
  for (const match of source.matchAll(/\r\n|\n|\r/g)) offsets.push(match.index + match[0].length);
  for (const token of md.parse(source, renderEnv)) {
    if (token.level !== 0 || !token.map) continue;
    const [first, stop] = token.map;
    const start = offsets[first];
    let last = stop - 1;
    while (last > first && !lines[last].trim()) last--;
    const end = offsets[last] + lines[last].length;
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
      const closing = prefix && lines[first].slice(prefix[0].length).match(/[ \t]+#+[ \t]*$/);
      field(el, start + (prefix ? prefix[0].length : 0), end - (closing ? closing[0].length : 0), prefix ? 'inline' : 'block');
    }
  }
  if (!fields.length) field(page.appendChild(document.createElement('div')), 0, source.length, 'block');
}

