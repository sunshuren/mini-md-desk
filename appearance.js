const themeKey = 'mini-md-desk.background';
const cream = '#f5f2e9';
const colorPicker = document.querySelector('#background');
function applyBackground(color) {
  if (!/^#[0-9a-f]{6}$/i.test(color)) color = cream;
  const channels = color.slice(1).match(/../g).map(hex => {
    const c = parseInt(hex, 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  const luminance = channels[0] * .2126 + channels[1] * .7152 + channels[2] * .0722;
  const root = document.documentElement;
  root.style.setProperty('--paper', color);
  root.dataset.ink = luminance < .18 ? 'light' : 'dark';
  colorPicker.value = color;
}
try { applyBackground(localStorage.getItem(themeKey) || cream); }
catch { applyBackground(cream); }
function chooseColor(color) {
  applyBackground(color);
  try { localStorage.setItem(themeKey, color); }
  catch { document.querySelector('#status').textContent = '颜色仅在本次打开时生效'; }
}
colorPicker.addEventListener('input', () => chooseColor(colorPicker.value));
document.querySelector('#reset-color').onclick = () => chooseColor(cream);

