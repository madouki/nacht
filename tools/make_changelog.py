# Erzeugt js/changelog.js aus CHANGELOG.md, damit das Changelog im Spiel (Optionen → CHANGELOG) lesbar ist.
# Aufruf im Projektstamm:  python tools/make_changelog.py   (schreibt auch das Inhaltsverzeichnis oben in CHANGELOG.md)
# Je Version: { build, title, rows: [[art, text]] } mit art 'h' = Zwischenüberschrift, 'b' = Aufzählungspunkt, 'p' = Absatz.
import io, json, re

src = io.open('CHANGELOG.md', encoding='utf-8').read()

# Inhaltsverzeichnis oben in CHANGELOG.md: je Version ein Link direkt zu ihrem Abschnitt (Anker wie auf GitHub)
heads = re.findall(r'^## (\S+) [–-] (.*)$', src, re.M)
slug = lambda h: re.sub(r'[^\w\- ]', '', h.lower()).replace(' ', '-')
toc = '<!-- INHALT -->\n**Direkt zu einer Version:**\n\n' + '\n'.join('- [%s](#%s) – %s' % (b, slug(b + ' – ' + t), t.replace('**', '')) for b, t in heads) + '\n<!-- /INHALT -->'
if '<!-- INHALT -->' in src: src2 = re.sub(r'<!-- INHALT -->.*?<!-- /INHALT -->', lambda m: toc, src, count=1, flags=re.S)
else: src2 = src.replace('\n---\n', '\n' + toc + '\n\n---\n', 1)
if src2 != src: io.open('CHANGELOG.md', 'w', encoding='utf-8', newline='').write(src2); src = src2
clean = lambda t: re.sub(r'\s+', ' ', t.replace('**', '').replace('`', '').replace('„', '"').replace('“', '"').replace('”', '"').replace('×', 'x')).strip()
out, cur, buf = [], None, None

def flush():
    global buf
    if buf and cur is not None: cur['rows'].append([buf[0], clean(buf[1])])
    buf = None

for line in src.split('\n'):
    m = re.match(r'^## (\S+) [–-] (.*)$', line)
    if m:
        flush(); cur = {'build': m.group(1), 'title': clean(m.group(2)), 'rows': []}; out.append(cur); continue
    if cur is None: continue
    if line.strip() in ('', '---'): flush(); continue
    m = re.match(r'^\*\*(.+)\*\*\s*$', line.strip())
    if m: flush(); cur['rows'].append(['h', clean(m.group(1))]); continue
    if line.startswith('- '): flush(); buf = ['b', line[2:]]; continue
    if buf: buf[1] += ' ' + line.strip()
    else: buf = ['p', line.strip()]
flush()

js = ('// Erzeugt von tools/make_changelog.py aus CHANGELOG.md – nicht von Hand ändern.\n'
      "'use strict';\nconst CHANGELOG = " + json.dumps(out, ensure_ascii=False, indent=0).replace('\n', '') + ';\n')
io.open('js/changelog.js', 'w', encoding='utf-8', newline='\n').write(js)
print('Versionen:', len(out), '· Zeilen:', sum(len(v['rows']) for v in out))
