#!/usr/bin/env python3
"""Build the standalone plan explorer from UI-UX-PLAN.md using only Python stdlib."""
import html
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / 'UI-UX-PLAN.md'
OUTPUT = ROOT / 'UI-UX-PLAN.html'


def inline(value):
    tokens = []

    def stash(match):
        if match.group(1) is not None:
            result = '<code>' + html.escape(match.group(1)) + '</code>'
        else:
            label, url = match.group(2), match.group(3)
            if not re.match(r'^(https?://|[\w./#-]+$)', url):
                return html.escape(label)
            external = ' target="_blank" rel="noopener noreferrer"' if url.startswith('http') else ''
            result = f'<a href="{html.escape(url, quote=True)}"{external}>{html.escape(label)}</a>'
        tokens.append(result)
        return f'\x00{len(tokens) - 1}\x00'

    value = re.sub(r'`([^`]+)`|\[([^\]]+)\]\(([^)]+)\)', stash, value)
    value = html.escape(value)
    value = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', value)
    return re.sub(r'\x00(\d+)\x00', lambda m: tokens[int(m.group(1))], value)


def render_markdown(source, roadmap=False):
    lines = source.strip().splitlines()
    result = []
    i = 0
    while i < len(lines):
        line = lines[i].strip()
        if not line:
            i += 1
        elif line.startswith('```'):
            code = []
            i += 1
            while i < len(lines) and not lines[i].strip().startswith('```'):
                code.append(lines[i])
                i += 1
            result.append('<pre><code>' + html.escape('\n'.join(code)) + '</code></pre>')
            i += 1
        elif line.startswith('### '):
            result.append('<h3>' + inline(line[4:]) + '</h3>')
            i += 1
        elif line.startswith('|'):
            rows = []
            while i < len(lines) and lines[i].strip().startswith('|'):
                cells = [cell.strip() for cell in lines[i].strip().strip('|').split('|')]
                if not all(re.fullmatch(r':?-+:?', cell) for cell in cells):
                    rows.append(cells)
                i += 1
            header = '<thead><tr>' + ''.join(f'<th scope="col">{inline(cell)}</th>' for cell in rows[0]) + '</tr></thead>'
            body = []
            for row in rows[1:]:
                priority = row[0].lower() if roadmap else ''
                cells = ''.join(f'<td>{inline(cell)}</td>' for cell in row)
                body.append(f'<tr data-priority="{html.escape(priority)}">{cells}</tr>')
            caption = '<caption>Delivery priorities, acceptance conditions and estimated effort</caption>' if roadmap else ''
            result.append(f'<div class="table-scroll" role="region" aria-label="Scrollable comparison table" tabindex="0"><table>{caption}{header}<tbody>{"".join(body)}</tbody></table></div>')
        elif re.match(r'^(- |\d+\. )', line):
            ordered = bool(re.match(r'^\d+\. ', line))
            tag = 'ol' if ordered else 'ul'
            items = []
            pattern = r'^\d+\. ' if ordered else r'^- '
            while i < len(lines) and re.match(pattern, lines[i].strip()):
                items.append('<li>' + inline(re.sub(pattern, '', lines[i].strip())) + '</li>')
                i += 1
            result.append(f'<{tag}>' + ''.join(items) + f'</{tag}>')
        else:
            paragraph = [line]
            i += 1
            while i < len(lines) and lines[i].strip() and not re.match(r'^(### |```|\||- |\d+\. )', lines[i].strip()):
                paragraph.append(lines[i].strip())
                i += 1
            result.append('<p>' + inline(' '.join(paragraph)) + '</p>')
    return '\n'.join(result)


def build():
    source = SOURCE.read_text(encoding='utf-8')
    pieces = re.split(r'^## (.+)$', source, flags=re.MULTILINE)
    chapters = []
    navigation = []
    short_titles = {
        1: 'Navigation', 2: 'Create a QR', 3: 'Edit a live QR', 4: 'Designer & appearance',
        5: 'Saving & recovery', 6: 'Downloads & sharing', 7: 'My Codes', 8: 'Analytics',
        9: 'WordPress & access', 10: 'Accessibility', 11: 'Delivery roadmap',
        12: 'Acceptance checks', 13: 'Git & releases', 14: 'Usability goals',
    }
    group_names = {0: 'Start here', 1: 'The experience', 9: 'The platform', 11: 'The delivery'}
    for index in range(1, len(pieces), 2):
        title, content = pieces[index], pieces[index + 1]
        match = re.match(r'(\d+)\. (.+)', title)
        number = int(match.group(1)) if match else 0
        if match:
            section_id = f'topic-{number:02}'
            label = short_titles[number]
            display_title = match.group(2)
        else:
            section_id = 'vision' if index == 1 else 'release-scope'
            label = 'The vision' if index == 1 else 'Shipped vs. planned'
            display_title = title
        if (index == 1 or number in (1, 9, 11)):
            navigation.append(f'<p class="nav-group">{group_names[number]}</p>')
        navigation.append(f'<a href="#{section_id}" data-nav="{section_id}"><span class="nav-index">{number:02}'
                          f'</span>{html.escape(label)}</a>' if number else
                          f'<a href="#{section_id}" data-nav="{section_id}"><span class="nav-index">↗</span>{html.escape(label)}</a>')
        body = render_markdown(content, roadmap=number == 11)
        if number == 11:
            body = '''<div class="roadmap-controls" role="group" aria-label="Filter roadmap priority">
              <button type="button" data-filter="all" aria-pressed="true">All priorities</button>
              <button type="button" data-filter="p1" aria-pressed="false">P1 · First</button>
              <button type="button" data-filter="p2" aria-pressed="false">P2 · Next</button>
              <button type="button" data-filter="p3" aria-pressed="false">P3 · Later</button>
            </div><p id="roadmap-result" class="filter-result" role="status">Showing all 8 work packages</p>''' + body
        if number:
            chapters.append(f'''<details class="chapter" id="{section_id}" data-chapter>
              <summary><span class="chapter-number">{number:02}</span><h2>{html.escape(display_title)}</h2><span class="expand-icon" aria-hidden="true"></span></summary>
              <div class="chapter-body">{body}</div>
            </details>''')
        else:
            chapters.append(f'<section class="chapter overview" id="{section_id}" data-chapter><h2>{html.escape(display_title)}</h2><div class="chapter-body">{body}</div></section>')
    page = TEMPLATE.replace('<!-- NAVIGATION -->', '\n'.join(navigation)).replace('<!-- CHAPTERS -->', '\n'.join(chapters))
    OUTPUT.write_text(page, encoding='utf-8', newline='\n')
    print(f'Built {OUTPUT.name}: {len(chapters)} sections, all content embedded, no external dependencies.')


TEMPLATE = r'''<!doctype html>
<html lang="en" data-theme="dark">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="description" content="Explore the 4QR Studio UI/UX plan: shipped features, user journeys, priorities and release checks.">
<meta name="color-scheme" content="dark light">
<title>4QR Studio · UI/UX Plan</title>
<style>
:root{color-scheme:dark;--bg:#0b1014;--panel:#10181e;--raised:#16232b;--text:#e7eef1;--muted:#9aaeb9;--line:#263741;--accent:#59d7e8;--accent-bg:#16333c;--green:#83e2b5;--amber:#f1cb82;--code:#122028;--shadow:0 16px 60px #0002}
html[data-theme=light]{color-scheme:light;--bg:#f5f7f8;--panel:#fff;--raised:#e9f0f3;--text:#172832;--muted:#526873;--line:#d4e0e6;--accent:#006b7a;--accent-bg:#dff4f7;--green:#147648;--amber:#80540b;--code:#eaf0f3;--shadow:0 16px 60px #16333c08}
*{box-sizing:border-box}html{scroll-behavior:smooth;scroll-padding-top:30px}body{margin:0;background:var(--bg);color:var(--text);font:15px/1.75 Inter,"Segoe UI",system-ui,sans-serif}a{color:var(--accent);text-decoration:none}a:hover{text-decoration:underline}button,input{font:inherit}button{cursor:pointer}button,a,input,summary{touch-action:manipulation}button:focus-visible,a:focus-visible,input:focus-visible,summary:focus-visible,.table-scroll:focus-visible{outline:3px solid var(--accent);outline-offset:4px}button{border:1px solid var(--line);border-radius:9px;padding:8px 13px;color:var(--text);background:var(--panel);line-height:1.5}button:hover{background:var(--raised)}[hidden]{display:none!important}.skip-link{position:fixed;left:16px;top:-100px;background:var(--panel);padding:10px;z-index:10}.skip-link:focus{top:16px}.reading-track{position:fixed;left:0;top:0;height:3px;width:100%;z-index:20;background:transparent}.reading-bar{height:100%;background:var(--accent);width:0;transition:width .1s linear}
.shell{display:grid;grid-template-columns:265px minmax(0,1fr);max-width:1600px;margin:auto;min-height:100vh}.sidebar{position:sticky;top:0;height:100vh;overflow:auto;padding:30px 22px;border-right:1px solid var(--line);background:var(--bg);scrollbar-width:thin;scrollbar-color:var(--line) transparent}.brand{display:flex;align-items:center;gap:12px;color:var(--text);font-size:19px;font-weight:750;letter-spacing:-.6px}.brand:hover{text-decoration:none}.brand-mark{display:grid;grid-template-columns:repeat(2,8px);gap:4px;padding:10px;border:1px solid var(--accent);border-radius:10px}.brand-mark i{width:8px;height:8px;border:2px solid var(--accent);border-radius:2px}.brand-mark i:last-child{background:var(--accent)}.sidebar-description{font-size:12px;color:var(--muted);margin:8px 0 24px 51px}.search-label{display:block;font-size:12px;font-weight:650;color:var(--muted);margin-bottom:7px}.search-wrap{position:relative}.search-wrap input{display:block;width:100%;min-width:0;background:var(--panel);color:var(--text);border:1px solid var(--line);border-radius:9px;padding:10px 34px 10px 12px;font-size:14px}.search-hint{position:absolute;right:12px;top:8px;color:var(--muted);font:14px/27px monospace}.search-status{font-size:12px;color:var(--muted);min-height:22px;margin:7px 0 16px}.nav-group{font-size:10px;text-transform:uppercase;letter-spacing:1.6px;color:var(--muted);margin:23px 10px 8px;font-weight:700}.toc a{display:flex;align-items:baseline;gap:11px;color:var(--muted);font-size:13px;line-height:1.45;padding:9px 10px;border-radius:7px;margin:2px 0}.toc a:hover{background:var(--panel);color:var(--text);text-decoration:none}.toc a[aria-current=true]{background:var(--accent-bg);color:var(--accent)}.nav-index{font:10px/1.5 ui-monospace,monospace;opacity:.7;min-width:17px}.sidebar-footer{border-top:1px solid var(--line);margin-top:26px;padding-top:16px;font-size:12px;color:var(--muted)}.sidebar-footer a{display:block;margin:5px 0}.main{padding:35px clamp(22px,5vw,82px) 45px;min-width:0}.topline{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:14px;margin-bottom:52px}.breadcrumb{font-size:12px;color:var(--muted)}.breadcrumb span{color:var(--text)}.top-actions{display:flex;gap:8px}.top-actions button{font-size:12px}.eyebrow{display:flex;flex-wrap:wrap;gap:10px;align-items:center;font-size:11px;font-weight:700;letter-spacing:1.4px;text-transform:uppercase;color:var(--accent)}.badge{font-size:10px;padding:4px 9px;border-radius:5px;background:var(--accent-bg);letter-spacing:.5px}.hero h1{font-size:clamp(38px,4.9vw,66px);line-height:1.09;letter-spacing:-2.4px;max-width:780px;font-weight:730;margin:20px 0}.hero h1 em{font-style:normal;color:var(--accent)}.hero-intro{font-size:16px;color:var(--muted);max-width:670px;line-height:1.8;margin:23px 0}.hero-meta{display:flex;flex-wrap:wrap;gap:8px 22px;font-size:12px;color:var(--muted);margin:24px 0 34px}.hero-meta strong{font-weight:600;color:var(--text)}.hero-actions{display:flex;flex-wrap:wrap;gap:12px;align-items:center}.primary-link{display:inline-block;background:var(--accent);color:var(--bg);font-size:13px;font-weight:700;border-radius:8px;padding:12px 18px}.primary-link:hover{text-decoration:none;filter:brightness(1.08)}.quiet-link{font-size:13px;padding:10px}.snapshot{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:0;margin:36px 0 28px;padding:24px 0;border-block:1px solid var(--line)}.stat{padding:0 22px;border-right:1px solid var(--line)}.stat:first-child{padding-left:0}.stat:last-child{border:0}.stat-label{font-size:10px;text-transform:uppercase;letter-spacing:1.3px;color:var(--muted);margin-bottom:5px}.stat-value{font-size:28px;font-weight:700;letter-spacing:-1px;line-height:1.4}.stat-note{font-size:12px;color:var(--muted);margin-top:3px}.green{color:var(--green)}.amber{color:var(--amber)}.scope-note{border-left:3px solid var(--amber);padding:6px 0 6px 16px;font-size:13px;color:var(--muted);margin:0 0 40px}.scope-note strong{color:var(--text)}.explorer-toolbar{display:flex;flex-wrap:wrap;gap:14px;align-items:center;justify-content:space-between;border-bottom:1px solid var(--line);padding:0 0 14px}.explorer-toolbar h2{font-size:12px;letter-spacing:1.3px;text-transform:uppercase;font-weight:700;margin:0}.explorer-actions{display:flex;gap:8px}.explorer-actions button{font-size:11px;padding:6px 10px;background:transparent}.chapter{margin:0;border-bottom:1px solid var(--line);scroll-margin-top:28px}.chapter.overview{padding:28px 0 16px}.chapter h2{font-size:20px;font-weight:650;line-height:1.45;letter-spacing:-.45px;margin:0}.chapter summary{display:flex;align-items:center;gap:16px;padding:27px 0;cursor:pointer;list-style:none}.chapter summary::-webkit-details-marker{display:none}.chapter summary:hover h2{color:var(--accent)}.chapter summary h2{flex:1;min-width:0}.chapter-number{font:12px ui-monospace,monospace;color:var(--accent);min-width:24px}.expand-icon{width:20px;height:20px;position:relative;flex-shrink:0}.expand-icon::before,.expand-icon::after{content:"";background:var(--muted);position:absolute;top:9px;left:4px;width:12px;height:1px}.expand-icon::after{transform:rotate(90deg)}details[open]>.summary .expand-icon::after,details[open]>summary .expand-icon::after{transform:rotate(0)}.chapter-body{padding:0 0 25px}.overview .chapter-body{padding:4px 0 0}.chapter-body p{color:var(--muted);margin:15px 0;overflow-wrap:anywhere}.chapter-body strong{color:var(--text);font-weight:650}.chapter-body h3{font-size:15px;letter-spacing:-.15px;margin:30px 0 10px;font-weight:700}.chapter-body ul,.chapter-body ol{padding-left:23px;color:var(--muted);margin:16px 0}.chapter-body li{padding-left:5px;margin:10px 0}.chapter-body li::marker{color:var(--accent)}code{font:12px/1.65 ui-monospace,"Cascadia Code",Consolas,monospace;background:var(--code);border:1px solid var(--line);border-radius:4px;padding:2px 5px;color:var(--accent);overflow-wrap:anywhere}pre{margin:20px 0;padding:20px;border-radius:10px;border:1px solid var(--line);background:var(--panel);overflow:auto;max-width:100%}pre code{border:0;background:transparent;padding:0;white-space:pre;line-height:1.9}.table-scroll{overflow:auto;margin:22px 0;max-width:100%;border:1px solid var(--line);border-radius:10px;scrollbar-width:thin;scrollbar-color:var(--line) transparent}table{width:100%;border-collapse:collapse;min-width:520px;font-size:12px;line-height:1.75;text-align:left}caption{text-align:left;padding:12px 16px;background:var(--panel);color:var(--muted);font-size:11px}th{background:var(--raised);font-size:10px;letter-spacing:.65px;text-transform:uppercase;color:var(--text);font-weight:700}td,th{padding:13px 16px;vertical-align:top;border-bottom:1px solid var(--line)}td{color:var(--muted)}td:first-child{color:var(--text);font-weight:600;min-width:110px}tr:last-child td{border-bottom:0}tbody tr:hover td{background:var(--panel)}#release-scope th:nth-child(2){color:var(--green)}#release-scope th:nth-child(3){color:var(--amber)}[data-priority=p1] td:first-child{color:var(--accent)}[data-priority=p2] td:first-child{color:var(--amber)}[data-priority=released] td:first-child{color:var(--green)}.roadmap-controls{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 12px}.roadmap-controls button{font-size:12px}.roadmap-controls [aria-pressed=true]{background:var(--accent-bg);border-color:var(--accent);color:var(--accent)}.chapter-body .filter-result{font-size:12px;margin:8px 0}.no-results{padding:50px 10px;text-align:center;color:var(--muted)}mark{background:var(--accent-bg);color:var(--text);border-radius:2px;padding:0 1px}.footer{display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;padding-top:35px;margin-top:10px;font-size:11px;color:var(--muted)}.footer a{color:var(--muted)}.js-hint{font-size:12px;color:var(--amber)}
@media(min-width:1500px){.main{padding-inline:92px}.hero h1{font-size:68px}}
@media(max-width:1050px){.shell{grid-template-columns:220px minmax(0,1fr)}.sidebar{padding:25px 16px}.main{padding-inline:28px}.hero h1{font-size:48px;letter-spacing:-1.7px}.stat{padding-inline:14px}.stat-value{font-size:24px}}
@media(max-width:760px){.shell{display:block}.sidebar{position:relative;height:auto;border-right:0;border-bottom:1px solid var(--line);padding:22px 22px 14px}.sidebar-description{margin-bottom:18px}.toc{display:none}.sidebar-footer{display:none}.search-status{margin-bottom:0}.sidebar .search-wrap{max-width:none}.main{padding:25px 22px 35px}.topline{margin-bottom:30px}.hero h1{font-size:45px}.hero-intro{font-size:15px}.snapshot{margin-top:26px}.chapter h2{font-size:18px}.chapter summary{gap:10px}.breadcrumb{max-width:180px}.hero-meta{margin-block:20px}.stat-note{font-size:11px}.stat-label{font-size:9px;letter-spacing:.7px}.stat-value{font-size:23px}.search-wrap input{font-size:16px}}
@media(max-width:400px){.main,.sidebar{padding-inline:17px}.hero h1{font-size:39px;letter-spacing:-1.5px}.stat{padding-inline:9px}.stat-value{font-size:21px}.topline{align-items:flex-start}.top-actions{gap:5px}.top-actions button{padding:7px 9px;font-size:11px}.breadcrumb{max-width:140px}.chapter h2{font-size:17px}.explorer-toolbar{align-items:flex-start}.explorer-actions{gap:5px}.explorer-actions button{padding-inline:7px}}
@media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}.reading-bar{transition:none}}
@media print{html{color-scheme:light}body{background:white;color:#142630;font-size:10pt;line-height:1.6}.shell{display:block}.sidebar,.top-actions,.hero-actions,.explorer-actions,.roadmap-controls,.reading-track,.search-status,.no-results,.js-hint{display:none!important}.main{padding:0}.topline{margin-bottom:20px}.hero h1{font-size:30pt;color:#142630}.hero h1 em,a,code{color:#006b7a}.hero-intro,.hero-meta,.scope-note,.chapter-body p,.chapter-body li,.stat-note,.stat-label,td{color:#405761}.chapter-body strong,.chapter h2,td:first-child{color:#142630}.hero-meta{margin-block:12px}.snapshot{margin:20px 0}.chapter summary{padding:15px 0}.chapter-body{padding-bottom:15px}h2,h3,summary{break-after:avoid}.chapter{break-inside:auto;border-color:#ccd7dd}.table-scroll{overflow:visible;border-color:#ccd7dd}table{min-width:0;font-size:9pt}td,th{padding:8px;background:white!important;border-color:#ccd7dd}pre{white-space:pre-wrap;background:#f5f8f9}pre code{white-space:pre-wrap}code{background:#f5f8f9;border-color:#ccd7dd}.stat{border-color:#ccd7dd}.expand-icon{display:none}.footer{padding-top:20px}.filter-result{display:none}.scope-note{margin-bottom:20px}}
</style>
</head>
<body>
<a class="skip-link" href="#content">Skip to the plan</a>
<div class="reading-track" aria-hidden="true"><div class="reading-bar" id="reading-bar"></div></div>
<div class="shell">
  <aside class="sidebar" aria-label="Plan navigation">
    <a class="brand" href="#top"><span class="brand-mark" aria-hidden="true"><i></i><i></i><i></i><i></i></span>4QR Studio</a>
    <p class="sidebar-description">Product experience plan</p>
    <label for="plan-search" class="search-label">Find a topic</label>
    <div class="search-wrap"><input id="plan-search" type="search" placeholder="Search the plan…" autocomplete="off" aria-controls="chapters"><span class="search-hint" aria-hidden="true">/</span></div>
    <p id="search-status" class="search-status" role="status">16 sections · 14 focus areas</p>
    <a id="search-jump" href="#chapters" hidden>View matching sections ↓</a>
    <nav class="toc" aria-label="Chapters"><!-- NAVIGATION --></nav>
    <div class="sidebar-footer">A roadmap for simpler QR workflows.<a href="UI-UX-PLAN.md">View Markdown source ↗</a><a href="https://github.com/JadaanDev/4QR_Studio" target="_blank" rel="noopener noreferrer">Project on GitHub ↗</a></div>
  </aside>
  <main class="main" id="content">
    <div class="topline" id="top"><div class="breadcrumb">4QR Studio <span>/ UI & UX strategy</span></div><div class="top-actions"><button id="theme-toggle" type="button" aria-pressed="false">Light mode</button><button id="print-plan" type="button">Print / PDF</button></div></div>
    <header class="hero">
      <div class="eyebrow"><span>Designing the next chapter</span><span class="badge">Plan · v1.1.0</span></div>
      <h1>Simple to create.<br><em>Confident to share.</em></h1>
      <p class="hero-intro">An experience plan for 4QR Studio. Explore the journeys, decisions and priorities that make creating and managing QR codes easier.</p>
      <div class="hero-meta"><span><strong>21 October 2026</strong> · Plan date</span><span><strong>WordPress admin</strong> · Product home</span><span><strong>14</strong> focus areas</span></div>
      <div class="hero-actions"><a class="primary-link" href="#topic-11">Explore the roadmap <span aria-hidden="true">↗</span></a><a class="quiet-link" href="#release-scope">See what has shipped →</a></div>
    </header>
    <div class="snapshot" aria-label="Plan at a glance">
      <div class="stat"><div class="stat-label">The foundation</div><div class="stat-value green">v1.1.0</div><div class="stat-note">Shipped release scope</div></div>
      <div class="stat"><div class="stat-label">The next steps</div><div class="stat-value">7 packages</div><div class="stat-note">Prioritized P1 through P3</div></div>
      <div class="stat"><div class="stat-label">The usability goal</div><div class="stat-value amber">&lt; 2 min</div><div class="stat-note">Target for a first QR</div></div>
    </div>
    <p class="scope-note"><strong>A plan, with a clear boundary.</strong> v1.1.0 is the starting point. Future improvements and usability targets below are proposals, not features already delivered.</p>
    <noscript><p class="js-hint">All plan content is available below. Search, filters and theme controls need JavaScript; chapters still expand normally.</p></noscript>
    <div class="explorer-toolbar"><h2>Explore the plan</h2><div class="explorer-actions"><button id="expand-all" type="button">Expand all</button><button id="collapse-all" type="button">Collapse all</button></div></div>
    <div id="no-results" class="no-results" hidden><strong>No matching sections.</strong><p>Try “analytics”, “link”, “WordPress” or “saving”.</p><button id="clear-search" type="button">Clear search</button></div>
    <article id="chapters" aria-label="Complete UI/UX plan"><!-- CHAPTERS --></article>
    <footer class="footer"><span>4QR Studio · UI/UX and ease-of-use plan</span><a href="#top">Back to top ↑</a><span>Offline-ready · Built from the Markdown plan</span></footer>
  </main>
</div>
<script>
(() => {
  const root = document.documentElement;
  const chapters = [...document.querySelectorAll('[data-chapter]')];
  const details = [...document.querySelectorAll('details.chapter')];
  const links = [...document.querySelectorAll('[data-nav]')];
  const search = document.querySelector('#plan-search');
  const status = document.querySelector('#search-status');
  const themeButton = document.querySelector('#theme-toggle');
  let previousSearchState = null;
  let printState = null;
  function setTheme(theme) {
    root.dataset.theme = theme;
    themeButton.textContent = theme === 'dark' ? 'Light mode' : 'Dark mode';
    themeButton.setAttribute('aria-pressed', String(theme === 'light'));
    try { localStorage.setItem('4qr-plan-theme', theme); } catch {}
  }
  try { if (localStorage.getItem('4qr-plan-theme') === 'light') setTheme('light'); } catch {}
  themeButton.addEventListener('click', () => setTheme(root.dataset.theme === 'dark' ? 'light' : 'dark'));
  function removeHighlights() {
    document.querySelectorAll('#chapters mark').forEach(mark => mark.replaceWith(document.createTextNode(mark.textContent)));
    chapters.forEach(chapter => chapter.normalize());
  }
  function highlight(chapter, query) {
    const walker = document.createTreeWalker(chapter, NodeFilter.SHOW_TEXT, { acceptNode: node =>
      node.parentElement.closest('button,script,style') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT });
    const nodes = []; while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(node => {
      const text = node.textContent, lower = text.toLocaleLowerCase();
      if (!lower.includes(query)) return;
      const fragment = document.createDocumentFragment(); let offset = 0, index;
      while ((index = lower.indexOf(query, offset)) !== -1) {
        fragment.append(document.createTextNode(text.slice(offset, index)));
        const mark = document.createElement('mark'); mark.textContent = text.slice(index, index + query.length); fragment.append(mark);
        offset = index + query.length;
      }
      fragment.append(document.createTextNode(text.slice(offset))); node.replaceWith(fragment);
    });
  }
  function filterSearch() {
    const query = search.value.trim().toLocaleLowerCase();
    if (query && previousSearchState === null) previousSearchState = details.map(d => d.open);
    if (query) applyPriority('all');
    removeHighlights(); let matches = 0;
    chapters.forEach(chapter => {
      const match = !query || chapter.textContent.toLocaleLowerCase().includes(query);
      chapter.hidden = !match;
      const link = links.find(link => link.dataset.nav === chapter.id); if (link) link.hidden = !match;
      if (match) {
        matches++;
        if (query) { if (chapter.tagName === 'DETAILS') chapter.open = true; highlight(chapter, query); }
      }
    });
    if (!query && previousSearchState) { details.forEach((d,i) => d.open = previousSearchState[i]); previousSearchState = null; }
    status.textContent = query ? `${matches} matching ${matches === 1 ? 'section' : 'sections'}` : '16 sections · 14 focus areas';
    document.querySelector('#no-results').hidden = matches !== 0;
    document.querySelector('#search-jump').hidden = !query || matches === 0;
    updateReading();
  }
  search.addEventListener('input', filterSearch);
  function clearSearch() { search.value = ''; filterSearch(); search.focus(); }
  document.querySelector('#clear-search').addEventListener('click', clearSearch);
  document.addEventListener('keydown', event => {
    if (event.key === '/' && !event.ctrlKey && !event.metaKey && !event.altKey && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) { event.preventDefault(); search.focus(); }
    if (event.key === 'Escape' && document.activeElement === search) clearSearch();
  });
  document.querySelector('#expand-all').addEventListener('click', () => details.filter(d => !d.hidden).forEach(d => d.open = true));
  document.querySelector('#collapse-all').addEventListener('click', () => details.filter(d => !d.hidden).forEach(d => d.open = false));
  function revealHash() {
    const id = location.hash.slice(1), target = document.getElementById(id);
    if (!target) return;
    if (target.hidden && search.value) { search.value = ''; filterSearch(); }
    if (target.tagName === 'DETAILS') target.open = true;
    links.forEach(link => { if (link.dataset.nav === id) link.setAttribute('aria-current','true'); else link.removeAttribute('aria-current'); });
  }
  document.querySelectorAll('a[href^="#"]').forEach(link => link.addEventListener('click', () => {
    const target = document.getElementById(link.hash.slice(1));
    if (target?.hidden) { search.value = ''; filterSearch(); }
    if (target?.tagName === 'DETAILS') target.open = true;
  }));
  window.addEventListener('hashchange', revealHash); revealHash();
  const filters = [...document.querySelectorAll('[data-filter]')];
  const rows = [...document.querySelectorAll('#topic-11 tbody tr')];
  function applyPriority(filter) {
    filters.forEach(item => item.setAttribute('aria-pressed', String(item.dataset.filter === filter)));
    rows.forEach(row => row.hidden = filter !== 'all' && row.dataset.priority !== filter);
    const count = rows.filter(row => !row.hidden).length;
    document.querySelector('#roadmap-result').textContent = `Showing ${filter === 'all' ? 'all ' : ''}${count} work ${count === 1 ? 'package' : 'packages'}`;
  }
  filters.forEach(button => button.addEventListener('click', () => applyPriority(button.dataset.filter)));
  function updateReading() {
    const available = root.scrollHeight - window.innerHeight;
    document.querySelector('#reading-bar').style.width = `${available > 0 ? Math.min(100, window.scrollY / available * 100) : 0}%`;
  }
  window.addEventListener('scroll', updateReading, {passive:true}); window.addEventListener('resize', updateReading);
  details.forEach(d => d.addEventListener('toggle', updateReading)); updateReading();
  const observer = new IntersectionObserver(entries => {
    const visible = entries.filter(entry => entry.isIntersecting && !entry.target.hidden);
    if (!visible.length) return;
    const current = visible.sort((a,b) => a.boundingClientRect.top - b.boundingClientRect.top)[0].target.id;
    links.forEach(link => { if (link.dataset.nav === current) link.setAttribute('aria-current','true'); else link.removeAttribute('aria-current'); });
  }, { rootMargin: '-5% 0px -60% 0px' });
  chapters.forEach(chapter => observer.observe(chapter));
  document.querySelector('#print-plan').addEventListener('click', () => window.print());
  window.addEventListener('beforeprint', () => {
    printState = { details: details.map(d=>d.open), chapters: chapters.map(c=>c.hidden), rows: rows.map(r=>r.hidden) };
    details.forEach(d=>d.open=true); chapters.forEach(c=>c.hidden=false); rows.forEach(r=>r.hidden=false);
  });
  window.addEventListener('afterprint', () => {
    if (!printState) return;
    details.forEach((d,i)=>d.open=printState.details[i]); chapters.forEach((c,i)=>c.hidden=printState.chapters[i]); rows.forEach((r,i)=>r.hidden=printState.rows[i]); printState=null;
  });
})();
</script>
</body>
</html>
'''

if __name__ == '__main__':
    build()
