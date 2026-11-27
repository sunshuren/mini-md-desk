"""Build the offline HTML and, on Windows, a single-file launcher."""
from pathlib import Path
from base64 import b64encode
import os
import subprocess

root = Path(__file__).resolve().parent
dist = root / 'dist'
dist.mkdir(exist_ok=True)
html = (root / 'index.html').read_text('utf-8')
favicon = b64encode((root / 'assets/feather.svg').read_bytes()).decode('ascii')
html = html.replace('href="assets/feather.svg"', 'href="data:image/svg+xml;base64,' + favicon + '"')
css = (root / 'style.css').read_text('utf-8')
html = html.replace('<link rel="stylesheet" href="style.css">', '<style>' + css + '</style>')
for name in ['vendor/markdown-it.min.js', 'vendor/turndown.min.js', 'vendor/turndown-gfm.min.js', 'locale.js', 'editor.js', 'history.js', 'appearance.js', 'app.js']:
    script = (root / name).read_text('utf-8-sig')
    html = html.replace(f'<script src="{name}"></script>', '<script>' + script.replace('</script', '<\\/script') + '</script>')
licenses = [root / 'LICENSE', *sorted((root / 'vendor').glob('*-LICENSE.txt'))]
from html import escape
notices = '\n'.join(p.name + '\n' + p.read_text('utf-8-sig') for p in licenses)
html = html.replace('</body>', '<template id="licenses"><pre>' + escape(notices) + '</pre></template></body>')
page = dist / 'AI-Clipboard.html'
page.write_text(html, 'utf-8')
if os.name == 'nt':
    compiler = Path(os.environ['WINDIR']) / 'Microsoft.NET/Framework/v4.0.30319/csc.exe'
    from hashlib import sha256
    from urllib.request import urlopen
    from zipfile import ZipFile
    from shutil import copyfileobj

    version = '1.0.2903.40'
    package = dist / 'webview2.nupkg'
    if not package.exists():
        url = f'https://api.nuget.org/v3-flatcontainer/microsoft.web.webview2/{version}/microsoft.web.webview2.{version}.nupkg'
        with urlopen(url, timeout=60) as response, package.open('wb') as target:
            copyfileobj(response, target)
    if sha256(package.read_bytes()).hexdigest() != 'ef128016dd1e51c59178c827ed5b8aa3322c57afa8675d930f8109505542ad74':
        raise ValueError('WebView2 SDK checksum mismatch')
    with ZipFile(package) as archive:
        for path in ['lib/net462/Microsoft.Web.WebView2.Core.dll', 'lib/net462/Microsoft.Web.WebView2.WinForms.dll',
                     'runtimes/win-x64/native/WebView2Loader.dll', 'LICENSE.txt']:
            (dist / Path(path).name).write_bytes(archive.read(path))
    common = [str(compiler), '/nologo', '/target:winexe', '/platform:x64', '/win32icon:' + str(root / 'assets/feather.ico'), '/win32manifest:' + str(root / 'desktop.manifest'), '/codepage:65001', '/reference:System.Windows.Forms.dll']
    managed = ['Microsoft.Web.WebView2.Core.dll', 'Microsoft.Web.WebView2.WinForms.dll']
    subprocess.run(common + ['/reference:System.Drawing.dll', *['/reference:' + name for name in managed],
                             '/resource:' + str(root / 'assets/feather.ico') + ',feather.ico', '/out:ClipWindow.exe', str(root / 'Window.cs')], cwd=dist, check=True)
    assets = ['ClipWindow.exe', *managed, 'WebView2Loader.dll', 'LICENSE.txt']
    resources = ['/resource:' + name + ',' + name for name in assets]
    subprocess.run(common + resources + ['/out:AI-Clipboard.exe', '/resource:AI-Clipboard.html,editor.html', str(root / 'Launcher.cs')], cwd=dist, check=True)
