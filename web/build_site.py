"""Собирает веб-версию в папку site/: файлы приложения + библиотека сканера + sw.js со списком файлов.
Firebase SDK скачивается шагом сборки в GitHub Actions (в папку app/src/main/assets/vendor)."""
import json, os, shutil, sys
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
src = os.path.join(root, 'app/src/main/assets')
out = sys.argv[1] if len(sys.argv) > 1 else os.path.join(root, 'site')
version = sys.argv[2] if len(sys.argv) > 2 else 'dev'
shutil.rmtree(out, ignore_errors=True)
shutil.copytree(src, out)
os.makedirs(os.path.join(out, 'vendor'), exist_ok=True)
shutil.copy(os.path.join(root, 'web/html5-qrcode.min.js'), os.path.join(out, 'vendor/html5-qrcode.min.js'))
shutil.copy(os.path.join(root, 'web/html5-qrcode.LICENSE'), os.path.join(out, 'vendor/html5-qrcode.LICENSE.txt'))
files = ['./']
for d, _, fs in os.walk(out):
    for f in sorted(fs):
        rel = os.path.relpath(os.path.join(d, f), out).replace(os.sep, '/')
        if rel in ('sw.js',) or rel.endswith('.LICENSE.txt') or rel == 'icon-maskable.png': continue
        files.append(rel)
sw = os.path.join(out, 'sw.js')
s = open(sw, encoding='utf-8').read().replace("'__VERSION__'", json.dumps(version)).replace('__FILES__', json.dumps(files, ensure_ascii=False))
open(sw, 'w', encoding='utf-8').write(s)
open(os.path.join(out, '.nojekyll'), 'w').close()
print(len(files), 'files, version', version)
