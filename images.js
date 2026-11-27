// Embedded raster images travel with the Markdown file and work offline.
const clipImages = (() => {
  const mime = /^image\/(?:png|jpeg|gif|webp)$/i;
  const embedded = /^data:image\/(?:png|jpeg|gif|webp);base64,/i;
  const asDataUrl = blob => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
  async function formatPaste(files, html) {
    const urls = await Promise.all(files.map(asDataUrl));
    if (html) {
      const template = document.createElement('template');
      template.innerHTML = html;
      const images = Array.from(template.content.querySelectorAll('img'));
      let next = 0;
      for (const image of images) {
        if (!embedded.test(image.getAttribute('src') || '') && next < urls.length) {
          image.setAttribute('src', urls[next++]);
        }
      }
      if (images.some(img => embedded.test(img.getAttribute('src') || ''))) {
        for (const el of template.content.querySelectorAll('script,style,iframe,object')) el.remove();
        const wrapper = document.createElement('div');
        wrapper.append(template.content);
        return writer.turndown(wrapper);
      }
    }
    return urls.map(markdown).join('\n\n');
  }
  function fromEvent(event) {
    const files = Array.from(event.clipboardData.files).filter(file => mime.test(file.type));
    const html = event.clipboardData.getData('text/html');
    if (!files.length && !/data:image\/(?:png|jpeg|gif|webp);base64,/i.test(html)) return null;
    return formatPaste(files, html);
  }
  function markdown(url) { return '![' + tr('Image') + '](' + url + ')'; }
  async function read() {
    if (navigator.clipboard.read) {
      try {
        const items = await navigator.clipboard.read();
        const images = [];
        for (const item of items) {
          const type = item.types.find(t => mime.test(t));
          if (type) images.push(await item.getType(type));
        }
        const rich = items.find(item => item.types.includes('text/html'));
        const html = rich ? await (await rich.getType('text/html')).text() : '';
        if (images.length || html.includes('data:image/')) {
          const formatted = await formatPaste(images, html);
          if (formatted) return formatted;
        }
        const plain = items.find(item => item.types.includes('text/plain'));
        if (plain) return (await plain.getType('text/plain')).text();
      } catch { /* Some hosts only grant the text clipboard API. */ }
    }
    return navigator.clipboard.readText();
  }
  function configure(md) {
    const fallback = md.renderer.rules.image;
    md.renderer.rules.image = (tokens, i, ...args) => {
      if (!embedded.test(tokens[i].attrGet('src'))) return fallback(tokens, i, ...args);
      const escape = md.utils.escapeHtml;
      const token = tokens[i];
      return '<img class="clip-image" draggable="false" src="' + escape(token.attrGet('src')) +
        '" alt="' + escape(token.content) + '"' +
        (token.attrGet('title') ? ' title="' + escape(token.attrGet('title')) + '"' : '') + '>';
    };
  }
  function bind(root, fallbackCopy, reportError) {
    const button = document.createElement('button');
    button.className = 'image-action';
    button.type = 'button';
    button.popover = 'manual';
    button.textContent = tr('Copy image');
    document.body.appendChild(button);
    let target = null;
    function dismiss() { target = null; button.hidePopover(); }
    async function copy() {
      const img = target;
      if (!img) return;
      try {
        await img.decode();
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        canvas.getContext('2d').drawImage(img, 0, 0);
        try {
          const png = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
          await navigator.clipboard.write([new ClipboardItem({'image/png': png})]);
        } catch (error) {
          if (!fallbackCopy) throw error;
          fallbackCopy(canvas.toDataURL('image/png'));
        }
        dismiss();
      } catch { reportError(tr('Could not copy this image.')); }
    }
    button.onclick = copy;
    function show(event) {
      const img = event.target.closest('img.clip-image');
      if (!img) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      target = img;
      button.showPopover();
      button.style.left = Math.max(0, Math.min(event.clientX, innerWidth - button.offsetWidth)) + 'px';
      button.style.top = Math.max(0, Math.min(event.clientY, innerHeight - button.offsetHeight)) + 'px';
    }
    root.addEventListener('click', show, true);
    root.addEventListener('contextmenu', show, true);
    document.addEventListener('pointerdown', e => { if (target && e.target !== button && e.target !== target) dismiss(); });
    document.addEventListener('keydown', e => {
      if (!target) return;
      if (e.key === 'Escape') dismiss();
      else if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'c') { e.preventDefault(); copy(); }
    });
    window.addEventListener('blur', dismiss);
  }
  return {fromEvent, read, configure, bind};
})();
