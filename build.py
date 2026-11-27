"""Build the offline HTML and, on Windows, a single-file launcher."""
from pathlib import Path
import os
import subprocess

root = Path(__file__).resolve().parent
dist = root / 'dist'
dist.mkdir(exist_ok=True)
html = (root / 'index.html').read_text('utf-8')
css = (root / 'style.css').read_text('utf-8')
html = html.replace('<link rel="stylesheet" href="style.css">', '<style>' + css + '</style>')
for name in ['vendor/markdown-it.min.js', 'editor.js', 'app.js']:
    script = (root / name).read_text('utf-8-sig')
    html = html.replace(f'<script src="{name}"></script>', '<script>' + script.replace('</script', '<\\/script') + '</script>')
licenses = [root / 'LICENSE', *sorted((root / 'vendor').glob('*-LICENSE.txt'))]
from html import escape
notices = '\n'.join(p.name + '\n' + p.read_text('utf-8-sig') for p in licenses)
html = html.replace('</body>', '<template id="licenses"><pre>' + escape(notices) + '</pre></template></body>')
page = dist / 'MiniMD.html'
page.write_text(html, 'utf-8')
if os.name == 'nt':
    compiler = Path(os.environ['WINDIR']) / 'Microsoft.NET/Framework/v4.0.30319/csc.exe'
    subprocess.run([str(compiler), '/nologo', '/target:winexe', '/codepage:65001', '/reference:System.Windows.Forms.dll',
                    '/out:' + str(dist / 'MiniMD.exe'), '/resource:' + str(page) + ',editor.html',
                    str(root / 'Launcher.cs')], check=True)

