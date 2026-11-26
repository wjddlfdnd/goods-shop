#!/usr/bin/env node
// 굿즈샵 디자인 QA 러너
// 사용: node run.js <캔버스 project 폴더> [--out <결과 폴더>] [--only <파일 일부>]
// 캔버스의 .dc.html을 디자인 캔버스 런타임(runtime/support.js)으로 실제 렌더링해 cases.json의 테스트 케이스를 돌린다.
const fs = require('fs');
const path = require('path');
const http = require('http');
const { chromium } = require('playwright');

const args = process.argv.slice(2);
if (!args[0]) { console.error('usage: node run.js <project dir> [--out dir] [--only text]'); process.exit(2); }
const SRC = path.resolve(args[0]);
const opt = (k, d) => { const i = args.indexOf(k); return i > 0 ? args[i + 1] : d; };
const OUT = path.resolve(opt('--out', path.join(__dirname, 'out')));
const ONLY = opt('--only', '');
const cases = JSON.parse(fs.readFileSync(path.join(__dirname, 'cases.json'), 'utf8'));
const RUNTIME = fs.readFileSync(path.join(__dirname, 'runtime', 'support.js'));
fs.mkdirSync(path.join(OUT, 'shots'), { recursive: true });

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png' };
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p.endsWith('/support.js')) { res.writeHead(200, { 'content-type': MIME['.js'] }); return res.end(RUNTIME); }
  const f = path.join(SRC, p);
  if (!f.startsWith(SRC) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': MIME[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
});

const glob = (pat, name) => new RegExp('^' + pat.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*') + '$').test(name);
const widthOf = (f) => { for (const [k, w] of Object.entries(cases.widths)) if (f.startsWith(k) || f === k) return w; return 390; };
const sev = Object.fromEntries([...cases.screenChecks, ...cases.stateChecks, ...cases.dataChecks].map(c => [c.id, c.severity]));
const names = Object.fromEntries([...cases.screenChecks, ...cases.stateChecks, ...cases.dataChecks].map(c => [c.id, c.name]));

// 정적 소스 검사
function staticChecks(file, src) {
  const out = [];
  const styles = [...src.matchAll(/style="([^"]*)"/g)].map(m => m[1]);
  const hex = styles.filter(s => /#[0-9a-fA-F]{3,8}\b/.test(s));
  if (hex.length) out.push({ id: 'S01', detail: `${hex.length}곳: ${hex[0].slice(0, 80)}` });
  const pxSpace = styles.filter(s => /(margin|padding|gap)[^;:]*:[^;]*\b\d+px/.test(s));
  if (pxSpace.length) out.push({ id: 'S02', detail: `${pxSpace.length}곳: ${pxSpace[0].slice(0, 80)}` });
  return out;
}

(async () => {
  await new Promise(r => server.listen(0, r));
  const base = `http://127.0.0.1:${server.address().port}/`;
  const all = fs.readdirSync(SRC).filter(f => f.endsWith('.dc.html')).sort();
  const files = all.filter(f => !ONLY || f.includes(ONLY));
  const browser = await chromium.launch();
  const results = [];
  const amounts = {};

  for (const file of files) {
    const W = widthOf(file);
    const page = await browser.newPage({ viewport: { width: W, height: 900 }, deviceScaleFactor: 1 });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error' && !/fonts\.googleapis|Failed to load resource/.test(m.text())) errors.push(m.text()); });
    await page.goto(base + file, { waitUntil: 'networkidle', timeout: 30000 }).catch(e => errors.push('load: ' + e.message));
    await page.waitForTimeout(1200);
    const r = await page.evaluate(({ W, forbidden, isAdmin }) => {
      const vis = el => { const s = getComputedStyle(el); const b = el.getBoundingClientRect(); return b.width > 0 && b.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' && !el.closest('.gs-sr,[aria-hidden="true"]'); };
      const desc = el => (el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + ' "' + ((el.getAttribute('aria-label') || el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 24)) + '"');
      const root = [...document.querySelectorAll('x-dc div, body div')].find(d => /px$/.test(d.style.height || '') && d.getBoundingClientRect().width >= W - 1);
      const H = root ? parseInt(root.style.height) : null;
      let bottom = 0; const wide = [];
      document.querySelectorAll('body *').forEach(el => {
        const b = el.getBoundingClientRect(); if (!b.width || !b.height) return;
        bottom = Math.max(bottom, b.bottom + scrollY);
        if (b.right > W + 1 && !el.closest('.gs-tabs,.gs-table-wrap,[style*="overflow-x"]')) wide.push(desc(el) + ' →' + Math.round(b.right));
      });
      const h1 = [...document.querySelectorAll('h1')].filter(vis).length;
      const noName = [...document.querySelectorAll('button, a[href], [role="img"]')].filter(el => {
        if (el.closest('[aria-hidden="true"]')) return false;
        const t = (el.textContent || '').trim(); const lab = el.getAttribute('aria-label') || el.getAttribute('aria-labelledby') || el.getAttribute('title');
        return !t && !lab;
      }).map(desc);
      const unlabeled = [...document.querySelectorAll('input:not([type=hidden]), select, textarea')].filter(el => {
        if (el.getAttribute('aria-label') || el.getAttribute('aria-labelledby')) return false;
        if (el.id && document.querySelector('label[for="' + CSS.escape(el.id) + '"]')) return false;
        return !el.closest('label');
      }).map(desc);
      const small = [...document.querySelectorAll('button, a[href], .gs-check')].filter(vis).filter(el => {
        if (el.closest('.gs-check') && el.tagName === 'INPUT') return false;
        const b = el.getBoundingClientRect(); const inline = el.tagName === 'A' && getComputedStyle(el).display === 'inline';
        const textLink = el.tagName === 'A' && !el.className.toString().match(/gs-btn|gs-icon-btn/);
        if (inline || textLink) return b.height < 24;
        return b.height < 44 || b.width < 44;
      }).map(el => desc(el) + ' ' + Math.round(el.getBoundingClientRect().width) + '×' + Math.round(el.getBoundingClientRect().height));
      // 대비
      const lum = c => { const m = c.match(/[\d.]+/g); if (!m) return null; const [r, g, b] = m.slice(0, 3).map(v => { v = v / 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); return [0.2126 * r + 0.7152 * g + 0.0722 * b, m[3] != null ? +m[3] : 1]; };
      const bgOf = el => { for (let e = el; e; e = e.parentElement) { const c = getComputedStyle(e).backgroundColor; const l = lum(c); if (l && l[1] > 0.5) return l[0]; } return 1; };
      const lowContrast = [];
      document.querySelectorAll('body *').forEach(el => {
        if (!vis(el)) return;
        const own = [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim()); if (!own) return;
        if (el.closest('[disabled],[aria-disabled="true"],.gs-btn[disabled]')) return;
        const s = getComputedStyle(el); const fg = lum(s.color); if (!fg) return;
        const bg = bgOf(el); const [a, b2] = [Math.max(fg[0], bg), Math.min(fg[0], bg)]; const ratio = (a + 0.05) / (b2 + 0.05);
        const px = parseFloat(s.fontSize); const bold = parseInt(s.fontWeight) >= 700; const large = px >= 24 || (bold && px >= 18.66);
        if (ratio < (large ? 3 : 4.5)) lowContrast.push(desc(el) + ' ' + ratio.toFixed(2) + ':1');
      });
      const hrefs = [...document.querySelectorAll('a[href]')].map(a => a.getAttribute('href')).filter(h => /\.dc\.html$/.test(h));
      const primaries = [...document.querySelectorAll('.gs-btn--primary')].filter(vis).length;
      const bodyText = document.body.innerText;
      const forbiddenHits = forbidden.filter(w => bodyText.includes(w));
      const empty = !!document.querySelector('.gs-empty');
      const actions = [...document.querySelectorAll('a[href], button')].filter(vis).length;
      const buyBtns = [...document.querySelectorAll('button, a')].filter(el => /주문하기|바로 구매|장바구니 담기|결제하기/.test(el.textContent || ''));
      const buyEnabled = buyBtns.filter(el => !(el.disabled || el.getAttribute('aria-disabled') === 'true' || el.closest('[disabled]'))).map(desc);
      const invalid = document.querySelectorAll('[aria-invalid="true"]').length;
      const errText = [...document.querySelectorAll('.gs-field__error')].filter(vis).length;
      const homeLink = [...document.querySelectorAll('a[href]')].some(a => /(^|\/)(D-)?Main\.dc\.html$/.test(a.getAttribute('href')));
      const filled = [...document.querySelectorAll('input:not([type=hidden]):not([type=checkbox]):not([type=radio]), textarea')].filter(el => (el.value || '').trim()).length;
      const won = (bodyText.match(/(결제 예정 금액|예상 결제 금액|결제 금액)\s*\n?\s*([\d,]+원)/) || [])[2] || null;
      // S05 미분류: 선택지·탭·내비·카테고리 그리드에 없음(관리자 표의 시스템 행·안내 문구는 허용)
      const uncat = [...document.querySelectorAll('option, [role="option"], [role="tab"], .gs-tabs *, nav a, .gs-catgrid *, .gs-category-grid *')]
        .filter(el => /미분류/.test(el.textContent || '') && !el.querySelector('*') && !(isAdmin && el.closest('[role="search"]'))).map(desc);
      // S06 그림자 불투명도 10% 초과·그라데이션, S07 코랄 외 유채색
      const heavy = [], chroma = [];
      const isCoral = (r, g, b) => [[214, 47, 69], [179, 38, 59]].some(([a, b2, c]) => Math.abs(r - a) + Math.abs(g - b2) + Math.abs(b - c) <= 24);
      document.querySelectorAll('body *').forEach(el => {
        if (!vis(el) || el.closest('svg')) return;
        const s = getComputedStyle(el);
        if (/gradient/.test(s.backgroundImage)) heavy.push(desc(el) + ' gradient');
        if (s.boxShadow && s.boxShadow !== 'none') {
          for (const m of s.boxShadow.matchAll(/rgba?\(([^)]*)\)([^,]*)/g)) {
            const v = m[1].split(',').map(Number); const a = v[3] == null ? 1 : v[3];
            const inset = /inset/.test(m[2]) || /inset/.test(s.boxShadow); const blur = (m[2].match(/-?[\d.]+px/g) || []).map(parseFloat);
            const isRing = blur.length >= 4 && blur[2] === 0; // 포커스·오류 링(퍼짐만 있는 선)은 제외
            if (a > 0.1 && !inset && !isRing) heavy.push(desc(el) + ' shadow α' + a);
          }
        }
        const props = [['color', s.color], ['background', s.backgroundColor], ['border', s.borderTopWidth !== '0px' ? s.borderTopColor : null], ['outline', s.outlineStyle !== 'none' ? s.outlineColor : null]];
        for (const [k, c] of props) {
          if (!c) continue; const m = c.match(/[\d.]+/g); if (!m) continue;
          const [r, g, b] = m.slice(0, 3).map(Number); const a = m[3] == null ? 1 : +m[3]; if (a < 0.05) continue;
          if (Math.max(r, g, b) - Math.min(r, g, b) > 16 && !isCoral(r, g, b)) chroma.push(desc(el) + ' ' + k + ' ' + c);
        }
      });
      return { homeLink, filled, uncat, heavy: [...new Set(heavy)], chroma: [...new Set(chroma)], H, bottom: Math.round(bottom), wide, h1, noName, unlabeled, small, lowContrast, hrefs, primaries, forbiddenHits, empty, actions, buyEnabled, invalid, errText, bodyText: bodyText.slice(0, 12000), won };
    }, { W, forbidden: cases.screenChecks.find(c => c.id === 'S04').forbidden, isAdmin: /^D-Admin/.test(file) });
    await page.screenshot({ path: path.join(OUT, 'shots', file.replace('.dc.html', '.png')), fullPage: true });
    await page.close();

    const f = [];
    if (errors.length) f.push({ id: 'R03', detail: errors.slice(0, 2).join(' | ') });
    if (r.H && r.bottom > r.H + 1) f.push({ id: 'R01', detail: `내용 ${r.bottom}px > 아트보드 ${r.H}px (${r.bottom - r.H}px 잘림)` });
    if (r.wide.length) f.push({ id: 'R02', detail: r.wide.slice(0, 3).join(', ') });
    if (r.h1 !== 1) f.push({ id: 'A01', detail: `h1 ${r.h1}개` });
    if (r.noName.length) f.push({ id: 'A02', detail: r.noName.slice(0, 3).join(', ') });
    if (r.unlabeled.length) f.push({ id: 'A03', detail: r.unlabeled.slice(0, 3).join(', ') });
    if (r.small.length) f.push({ id: 'A04', detail: r.small.slice(0, 4).join(', ') });
    if (r.lowContrast.length) f.push({ id: 'A05', detail: r.lowContrast.slice(0, 3).join(', ') });
    const missing = r.hrefs.filter(h => !all.includes(h.replace(/^\.\//, '')));
    if (missing.length) f.push({ id: 'L01', detail: [...new Set(missing)].join(', ') });
    if (r.primaries > 1) f.push({ id: 'S03', detail: `주요 버튼 ${r.primaries}개` });
    if (r.uncat.length) f.push({ id: 'S05', detail: r.uncat.slice(0, 3).join(', ') });
    if (r.heavy.length) f.push({ id: 'S06', detail: r.heavy.slice(0, 3).join(', ') });
    if (r.chroma.length) f.push({ id: 'S07', detail: r.chroma.slice(0, 3).join(', ') });
    if (r.forbiddenHits.length) f.push({ id: 'S04', detail: r.forbiddenHits.join(', ') });
    f.push(...staticChecks(file, fs.readFileSync(path.join(SRC, file), 'utf8')));
    for (const st of cases.stateChecks) {
      if (!st.files.some(p => glob(p, file))) continue;
      if (st.id === 'ST01' && !(r.empty || r.actions > 2)) f.push({ id: 'ST01', detail: '빈 상태 컴포넌트·다음 행동 없음' });
      if (st.id === 'ST02' && r.buyEnabled.length) f.push({ id: 'ST02', detail: '활성 상태: ' + r.buyEnabled.slice(0, 3).join(', ') });
      if (st.id === 'ST03' && !(r.invalid && r.errText)) f.push({ id: 'ST03', detail: `aria-invalid ${r.invalid}개, 오류 문구 ${r.errText}개` });
      if (st.id === 'ST05' && st.texts[file] && !r.bodyText.includes(st.texts[file])) f.push({ id: 'ST05', detail: `'${st.texts[file]}' 문구 없음` });
      if (st.id === 'ST06' && !r.homeLink) f.push({ id: 'ST06', detail: '홈 링크 없음' });
      if (st.id === 'ST07' && !r.filled) f.push({ id: 'ST07', detail: '값이 남은 입력 없음' });
      if (st.id === 'ST04' && !r.bodyText.includes(st.text)) f.push({ id: 'ST04', detail: `'${st.text}' 없음` });
      if (st.id === 'ST08') { const hit = st.forbidden.filter(w => r.bodyText.includes(w)); if (hit.length) f.push({ id: 'ST08', detail: hit.join(', ') }); }
    }
    if (r.won) amounts[file] = r.won;
    results.push({ file, width: W, findings: f.map(x => ({ ...x, severity: sev[x.id], name: names[x.id] })) });
    process.stdout.write(`${file}: ${f.length ? f.map(x => x.id).join(',') : 'PASS'}\n`);
  }
  await browser.close(); server.close();

  // 데이터·커버리지 검사
  const global = [];
  for (const d of cases.dataChecks) {
    const bad = d.files.filter(f => files.includes(f) && amounts[f] && amounts[f] !== d.expect).map(f => `${f}=${amounts[f]}`);
    const none = d.files.filter(f => files.includes(f) && !amounts[f]);
    if (bad.length) global.push({ id: d.id, severity: d.severity, name: d.name, detail: `기대 ${d.expect}, 다름: ${bad.join(', ')}` });
    if (none.length) global.push({ id: d.id, severity: 'P3', name: d.name + '(금액 못 찾음)', detail: none.join(', ') });
  }
  if (!ONLY) for (const c of cases.coverage.required) if (!all.includes(c.file)) global.push({ id: 'C01', severity: 'P1', name: '상태 화면 누락', detail: `${c.file} — ${c.why}` });

  // 보고서
  const flat = [...results.flatMap(r => r.findings.map(x => ({ ...x, file: r.file }))), ...global.map(g => ({ ...g, file: '(전체)' }))];
  const count = s => flat.filter(x => x.severity === s).length;
  const order = ['P0', 'P1', 'P2', 'P3'];
  let md = `# 디자인 QA 자동 점검 결과\n\n- 대상: ${SRC}\n- 화면 ${files.length}개 · 케이스 ${cases.screenChecks.length + cases.stateChecks.length + cases.dataChecks.length}종 + 상태 화면 커버리지 ${cases.coverage.required.length}개\n- 결과: P0 ${count('P0')} · P1 ${count('P1')} · P2 ${count('P2')} · P3 ${count('P3')}\n- 판정: ${count('P0') === 0 && count('P1') === 0 ? '통과' : '수정 필요'} (기준: P0 = 0, P1 = 0)\n\n`;
  for (const s of order) {
    const rows = flat.filter(x => x.severity === s); if (!rows.length) continue;
    md += `## ${s}\n\n| 화면 | 케이스 | 내용 |\n|---|---|---|\n` + rows.map(x => `| ${x.file} | ${x.id} ${x.name} | ${String(x.detail).replace(/\|/g, '/')} |`).join('\n') + '\n\n';
  }
  md += `## 화면별\n\n| 화면 | 결과 |\n|---|---|\n` + results.map(r => `| ${r.file} | ${r.findings.length ? r.findings.map(x => x.severity + ' ' + x.id).join(', ') : '통과'} |`).join('\n') + '\n';
  fs.writeFileSync(path.join(OUT, 'report.md'), md);
  fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify({ results, global, amounts }, null, 2));
  console.log(`\nP0 ${count('P0')} · P1 ${count('P1')} · P2 ${count('P2')} · P3 ${count('P3')} → ${path.join(OUT, 'report.md')}`);
  process.exit(count('P0') + count('P1') > 0 ? 1 : 0);
})().catch(e => { console.error(e); process.exit(3); });
