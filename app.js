// 화면 동작 — 보통 고칠 필요 없음.
// 작품은 편집 화면(edit.html)에서 고치거나, data/works.js 를 직접 고칩니다.
(function () {
  const BASE = (window.WORKS || []).filter(w => w && w.id && w.title);
  let S = { ...(window.SITE || {}) };
  const live = w => !!w.url;                          // 링크가 비어 있는 작품은 숨김
  let W = BASE.filter(live);
  const $ = id => document.getElementById(id);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const isExt = u => /^https?:\/\//i.test(u || '');
  const href = u => isExt(u) ? u : encodeURI(u || '');
  const code = w => 'EXP-' + String(W.indexOf(w) + 1).padStart(2, '0');
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ── 밝게/어둡게
  const P = {};                                     // 그래프 색 (CSS 변수에서 읽음)
  const readPlot = () => { const cs = getComputedStyle(document.documentElement); for (const k of ['--plot-1', '--plot-2', '--plot-3', '--plot-grid', '--plot-major', '--plot-axis']) P[k] = cs.getPropertyValue(k).trim(); };
  const themeBtn = $('themeBtn');
  const setThemeIcon = () => { themeBtn.textContent = document.documentElement.dataset.theme === 'dark' ? '☀' : '☾'; };
  themeBtn.addEventListener('click', () => {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem('lab-theme', next); } catch {}
    setThemeIcon(); readPlot(); if (calm) draw(performance.now());
  });
  setThemeIcon(); readPlot();

  // ── 사이트 정보
  function applySite() {
    $('brandName').textContent = S.title || 'MATH LAB';
    $('brandSub').textContent = S.subtitle || '';
    // 큰 제목: 띄어쓰기마다 한 줄 (마지막 줄은 강조색)
    const lines = String(S.title || 'MATH LAB').trim().split(/\s+/);
    const h1 = document.querySelector('.hero-title');
    const html = lines.map((l, i) => `<span class="line"><span>${esc(l)}${i === lines.length - 1 ? '<sup>®</sup>' : ''}</span></span>`).join('');
    if (h1.innerHTML !== html) h1.innerHTML = html;
    h1.setAttribute('aria-label', lines.join(' '));
    $('heroKicker').textContent = `// ${[S.role, S.owner].filter(Boolean).join(' · ')} — EST. 2026`;
    $('heroKo').innerHTML = esc(S.subtitle || '').replace(/(실험실|LAB)/, '<em>$1</em>');
    $('heroIntro').textContent = S.intro || '';
    const today = new Date();
    $('statusText').textContent = `LAB OPEN · ${today.getFullYear()}.${String(today.getMonth() + 1).padStart(2, '0')}.${String(today.getDate()).padStart(2, '0')} · ${W.length} EXP`;
    $('footName').textContent = `© ${today.getFullYear()} ${S.owner || ''} · ${S.title || 'MATH LAB'}`;
    const foot = [];
    for (const el of [$('navBlog'), $('heroBlog')]) { el.hidden = !S.blog; if (S.blog) el.href = S.blog; }
    $('aboutBlog').innerHTML = S.blog ? `<a href="${esc(S.blog)}" target="_blank" rel="noopener">블로그</a>` : '블로그';
    if (S.blog) foot.push(`<a href="${esc(S.blog)}" target="_blank" rel="noopener">BLOG ↗</a>`);
    if (S.email) foot.push(`<a href="mailto:${esc(S.email)}">${esc(S.email)}</a>`);
    $('footLinks').innerHTML = foot.join('');
  }

  // ── 숫자
  function buildStats(animate) {
    const versions = W.reduce((a, w) => a + (+w.versions || 0), 0);
    const subjects = new Set(W.map(w => w.subject).filter(Boolean));
    $('stats').innerHTML = [
      ['Experiments', W.length, 'EA'],
      ['Iterations', versions, 'REV'],
      ['Subjects', subjects.size, 'FIELD'],
      ['Install', 0, 'NEED']
    ].map(([t, n, u]) => `<div><dd data-n="${n}">${animate ? '00' : String(n).padStart(2, '0')}<small>${u}</small></dd><dt>${t}</dt></div>`).join('');
    if (!animate) return;
    document.querySelectorAll('.stats dd').forEach(dd => {
      const n = +dd.dataset.n, small = dd.querySelector('small').outerHTML, t0 = performance.now() + 500;
      const step = t => {
        const k = Math.max(0, Math.min(1, (t - t0) / 1200));
        dd.innerHTML = String(Math.round(n * (1 - Math.pow(1 - k, 3)))).padStart(2, '0') + small;
        if (k < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }

  // ── 수식 띠
  const formulas = [
    ['P(A|B)', 'P(A∩B) / P(B)'], ['ₙCᵣ', 'n! / r!(n−r)!'], ['E(X)', 'Σ xᵢ pᵢ'], ['Z', '(X − m) / σ'],
    ['A', 'P(1 + r)ⁿ'], ['(a+b)ⁿ', 'Σ ₙCₖ aⁿ⁻ᵏ bᵏ'], ['σ(X̄)', 'σ / √n'], ['ₙHᵣ', 'ₙ₊ᵣ₋₁Cᵣ'], ['V(X)', 'E(X²) − {E(X)}²']
  ].map(([a, b]) => `<span><b>${a}</b>= ${b}</span>`).join('');
  $('ticker').innerHTML = formulas + formulas;

  // ── 첫 화면 그래프 (움직이는 함수 + 커서 좌표)
  const cv = $('plot'), ctx = cv.getContext('2d'), hero = $('hero'), ro = $('readout');
  let Wd = 0, Ht = 0, dpr = 1, mouse = null, t0 = performance.now(), raf;
  const U = () => Math.max(46, Math.min(90, Wd / 18));            // 1 단위 = U px
  const ox = () => Wd * (Wd < 720 ? .5 : .62), oy = () => Ht * (Wd < 720 ? .25 : .46);   // 원점
  function size() {
    dpr = Math.min(2, devicePixelRatio || 1);
    Wd = hero.clientWidth; Ht = hero.clientHeight;
    cv.width = Wd * dpr; cv.height = Ht * dpr;
  }
  const curves = [
    { f: (x, t) => Math.sin(x * 1.1 + t * .9) * 1.2, v: '--plot-1', w: 2 },
    { f: (x, t) => 3.2 * Math.exp(-((x - 2.2 - Math.sin(t * .4)) ** 2) / 2) - 1.6, v: '--plot-2', w: 1.5 },
    { f: (x, t) => .35 * x * Math.cos(x * .5 - t * .5), v: '--plot-3', w: 1.2 }
  ];
  function draw(now) {
    const t = calm ? 0 : (now - t0) / 1000, u = U(), X0 = ox(), Y0 = oy();
    const intro = calm ? 1 : Math.min(1, (now - t0) / 1600);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, Wd, Ht);
    // 모눈
    ctx.lineWidth = 1;
    for (let k = -Math.ceil(X0 / (u / 4)); X0 + k * u / 4 < Wd; k++) {
      const x = Math.round(X0 + k * u / 4) + .5;
      ctx.strokeStyle = k % 4 ? P['--plot-grid'] : P['--plot-major'];
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, Ht); ctx.stroke();
    }
    for (let k = -Math.ceil(Y0 / (u / 4)); Y0 + k * u / 4 < Ht; k++) {
      const y = Math.round(Y0 + k * u / 4) + .5;
      ctx.strokeStyle = k % 4 ? P['--plot-grid'] : P['--plot-major'];
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(Wd, y); ctx.stroke();
    }
    // 축과 눈금
    ctx.strokeStyle = P['--plot-axis'];
    ctx.beginPath(); ctx.moveTo(0, Y0 + .5); ctx.lineTo(Wd, Y0 + .5); ctx.moveTo(X0 + .5, 0); ctx.lineTo(X0 + .5, Ht); ctx.stroke();
    ctx.fillStyle = P['--plot-axis']; ctx.font = '11px "JetBrains Mono", monospace';
    for (let k = -12; k <= 12; k++) if (k) {
      const x = X0 + k * u; if (x > 0 && x < Wd) ctx.fillText(k, x + 3, Y0 + 13);
      const y = Y0 - k * u; if (y > 60 && y < Ht) ctx.fillText(k, X0 + 5, y - 3);
    }
    // 곡선 (처음엔 왼쪽에서 오른쪽으로 그려짐)
    const xmin = -X0 / u, xmax = (Wd - X0) / u, xEnd = xmin + (xmax - xmin) * intro;
    for (const cu of curves) {
      ctx.strokeStyle = P[cu.v]; ctx.lineWidth = cu.w; ctx.beginPath();
      for (let x = xmin; x <= xEnd; x += 2 / u) {
        const px = X0 + x * u, py = Y0 - cu.f(x, t) * u;
        x === xmin ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.stroke();
    }
    // 커서
    if (mouse) {
      const mx = (mouse.x - X0) / u, fy = curves[0].f(mx, t), py = Y0 - fy * u;
      ctx.strokeStyle = P['--plot-1']; ctx.globalAlpha = .45; ctx.setLineDash([3, 4]); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(mouse.x + .5, 0); ctx.lineTo(mouse.x + .5, Ht); ctx.moveTo(0, py + .5); ctx.lineTo(Wd, py + .5); ctx.stroke();
      ctx.setLineDash([]); ctx.globalAlpha = 1;
      ctx.fillStyle = P['--plot-1']; ctx.beginPath(); ctx.arc(mouse.x, py, 4.5, 0, 7); ctx.fill();
      ctx.strokeStyle = P['--plot-1']; ctx.beginPath(); ctx.arc(mouse.x, py, 11, 0, 7); ctx.stroke();
      ro.style.left = mouse.x + 'px'; ro.style.top = py + 'px';
      ro.innerHTML = `x = ${mx.toFixed(3)}<br>f(x) = ${fy.toFixed(3)}`;
    }
    if (!calm || intro < 1) raf = requestAnimationFrame(draw);
  }
  size(); addEventListener('resize', () => { size(); if (calm) draw(performance.now()); });
  hero.addEventListener('pointermove', e => { const b = hero.getBoundingClientRect(); mouse = { x: e.clientX - b.left, y: e.clientY - b.top }; if (calm) draw(performance.now()); });
  hero.addEventListener('pointerleave', () => { mouse = null; });
  new IntersectionObserver(([e]) => {
    cancelAnimationFrame(raf);
    if (e.isIntersecting) raf = requestAnimationFrame(draw);
  }).observe(hero);

  // ── 표지
  const seed = s => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
  function plotSvg(w) {
    const r = seed(w.id), a = 1 + (r % 5) * .35, b = (r >> 3) % 7 * .3, k = .25 + ((r >> 6) % 4) * .12;
    let d = '';
    for (let i = 0; i <= 80; i++) {
      const x = i / 80, y = .55 - Math.sin(x * Math.PI * a * 2 + b) * k * Math.exp(-x * .6) - x * .12;
      d += (i ? 'L' : 'M') + (x * 400).toFixed(1) + ' ' + (y * 250).toFixed(1);
    }
    return `<svg viewBox="0 0 400 250" preserveAspectRatio="none"><path d="${d}" fill="none" stroke="${esc(w.color || '#c8f54a')}" stroke-width="2" vector-effect="non-scaling-stroke" opacity=".9"/></svg>`;
  }
  const coverSrc = w => w.coverData || (w.cover ? href(w.cover) : '');
  const cover = w => coverSrc(w)
    ? `<img src="${esc(coverSrc(w))}" alt="" loading="lazy">`
    : `<div class="glyph-cover" style="--c:${esc(w.color || '#343a40')}">${plotSvg(w)}<span>${esc(w.glyph || w.title[0])}</span></div>`;

  // ── 분류(수학 수업·학급 운영·동아리·개인) + 과목·주제
  const GROUPS = [['수학 수업', 'MATH CLASS'], ['학급 운영', 'HOMEROOM'], ['동아리', 'CLUB'], ['개인', 'PERSONAL']];
  // 분류를 안 고른 작품은 과목·종류·태그로 짐작
  const groupOf = w => w.group || (() => {
    const t = [w.subject, w.kind, ...(w.tags || [])].join(' ');
    return /동아리/.test(t) ? '동아리' : /학급|담임|입시|진로|생활|습관/.test(t) ? '학급 운영' : /개인|실험작|취미/.test(t) ? '개인' : '수학 수업';
  })();
  const groupNames = () => [...GROUPS.map(g => g[0]), ...new Set(W.map(groupOf).filter(g => !GROUPS.some(x => x[0] === g)))];
  const enOf = g => (GROUPS.find(x => x[0] === g) || [, 'ETC'])[1];

  let group = '전체', subj = '전체', q = '', view = 'grid';
  try { view = localStorage.getItem('lab-view') || 'grid'; } catch {}
  function buildChips() {
    const names = groupNames();
    if (group !== '전체' && !W.some(w => groupOf(w) === group)) group = '전체';
    $('groups').innerHTML = ['전체', ...names].map((g, i) => {
      const n = g === '전체' ? W.length : W.filter(w => groupOf(w) === g).length;
      if (g !== '전체' && !n) return '';
      return `<button class="group-tab" role="tab" aria-selected="${g === group}" data-g="${esc(g)}">` +
        `<span class="mono">${g === '전체' ? 'ALL' : String(i).padStart(2, '0') + ' · ' + enOf(g)}</span><b>${esc(g)}<small class="mono">${n}</small></b></button>`;
    }).join('');
    // 고른 분류 안의 과목·주제 (분류를 골랐고, 2개 이상일 때만 보임)
    const inG = W.filter(w => group === '전체' || groupOf(w) === group);
    const subs = group === '전체' ? [] : [...new Set(inG.map(w => w.subject).filter(Boolean))];
    if (!subs.includes(subj)) subj = '전체';
    $('chips').hidden = subs.length < 2;
    $('chips').innerHTML = ['전체', ...subs].map(s => {
      const n = s === '전체' ? inG.length : inG.filter(w => w.subject === s).length;
      return `<button class="chip" role="tab" aria-selected="${s === subj}" data-k="${esc(s)}">${esc(s)}<small>${n}</small></button>`;
    }).join('');
  }
  $('groups').addEventListener('click', e => {
    const b = e.target.closest('.group-tab'); if (!b) return;
    group = b.dataset.g; subj = '전체';
    buildChips(); render();
  });
  $('chips').addEventListener('click', e => {
    const b = e.target.closest('.chip'); if (!b) return;
    subj = b.dataset.k;
    $('chips').querySelectorAll('.chip').forEach(c => c.setAttribute('aria-selected', c === b));
    render();
  });
  $('q').addEventListener('input', e => { q = e.target.value.trim().toLowerCase(); render(); });
  document.querySelectorAll('.view-toggle button').forEach(b => b.addEventListener('click', () => {
    view = b.dataset.view; try { localStorage.setItem('lab-view', view); } catch {}
    render();
  }));

  const io = 'IntersectionObserver' in window
    ? new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -40px' })
    : null;

  function render() {
    let list = W.filter(w => (group === '전체' || groupOf(w) === group) && (subj === '전체' || w.subject === subj) &&
      (!q || [w.title, w.kind, w.subject, groupOf(w), w.summary, ...(w.tags || [])].join(' ').toLowerCase().includes(q)));
    const showFeatured = group === '전체' && !q;
    // '전체'일 때는 분류별로 모아서 제목을 붙여 보여 줌
    const sections = group === '전체' && !q;
    if (sections) { const names = groupNames(); list = names.flatMap(g => list.filter(w => groupOf(w) === g)); }
    const head = (w, i, tag) => {
      const g = groupOf(w);
      if (!sections || (i && groupOf(list[i - 1]) === g)) return '';
      const n = list.filter(x => groupOf(x) === g).length;
      return tag === 'li'
        ? `<li class="group-head" aria-hidden="true"><span class="mono">${enOf(g)}</span><b>${esc(g)}</b><small class="mono">${n}</small></li>`
        : `<h3 class="group-head"><span class="mono">${enOf(g)}</span><b>${esc(g)}</b><small class="mono">${n}</small></h3>`;
    };
    document.querySelectorAll('.view-toggle button').forEach(b => b.setAttribute('aria-pressed', b.dataset.view === view));
    $('count').textContent = `[${String(list.length).padStart(2, '0')}]`;
    $('empty').hidden = list.length > 0;
    $('grid').hidden = view !== 'grid'; $('index').hidden = view !== 'index';
    if (view === 'grid') {
      $('grid').innerHTML = list.map((w, i) => head(w, i) + `
        <button class="card${showFeatured && w.featured ? ' featured' : ''}" data-id="${esc(w.id)}" style="transition-delay:${Math.min(i, 8) * 60}ms">
          <div class="card-top"><b>${code(w)}</b><span>${esc(w.kind || '')}${w.versions ? ` · REV.${String(w.versions).padStart(2, '0')}` : ''}</span></div>
          <div class="card-cover">${isExt(w.url) ? '<span class="ext">EXTERNAL ↗</span>' : ''}${cover(w)}</div>
          <div class="card-body">
            <div class="card-sub"><b>${esc(w.subject || '')}</b>${w.audience ? `<span>${esc(w.audience)}</span>` : ''}</div>
            <h3>${esc(w.title)}</h3>
            <p>${esc(w.summary || '')}</p>
            <div class="card-foot"><span>${w.updated ? `UPDATED ${esc(w.updated)}` : ''}</span><span class="go">→</span></div>
          </div>
        </button>`).join('');
      $('grid').querySelectorAll('.card').forEach(c => io ? io.observe(c) : c.classList.add('in'));
    } else {
      $('index').innerHTML = list.map((w, i) => head(w, i, 'li') + `
        <li class="row" tabindex="0" data-id="${esc(w.id)}">
          <span class="r-no">${code(w)}</span>
          <span class="r-title">${esc(w.title)}</span>
          <span class="r-dim r-sub">${esc(w.subject || '')}</span>
          <span class="r-dim r-kind">${esc(w.kind || '')}</span>
          <span class="r-dim r-ver">${w.versions ? `REV.${String(w.versions).padStart(2, '0')}` : ''}</span>
          <span class="r-go">${isExt(w.url) ? '↗' : '→'}</span>
        </li>`).join('');
    }
  }
  const open = id => { location.hash = `#/w/${id}`; };
  $('grid').addEventListener('click', e => { const c = e.target.closest('.card'); if (c) open(c.dataset.id); });
  $('index').addEventListener('click', e => { const r = e.target.closest('.row'); if (r) open(r.dataset.id); });
  $('index').addEventListener('keydown', e => { const r = e.target.closest('.row'); if (r && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); open(r.dataset.id); } });

  // INDEX 보기: 마우스를 따라오는 미리보기
  const peek = $('peek'); let px = 0, py = 0, tx = 0, ty = 0, peekOn = false;
  $('index').addEventListener('pointerover', e => {
    const r = e.target.closest('.row'); if (!r) return;
    const w = W.find(x => x.id === r.dataset.id);
    peek.innerHTML = cover(w); peek.classList.add('on'); peekOn = true;
  });
  $('index').addEventListener('pointerleave', () => { peek.classList.remove('on'); peekOn = false; });
  addEventListener('pointermove', e => { tx = Math.min(e.clientX + 36, innerWidth - 320); ty = e.clientY; });
  (function follow() {
    px += (tx - px) * .18; py += (ty - py) * .18;
    if (peekOn) peek.style.translate = `${px}px ${py}px`;
    requestAnimationFrame(follow);
  })();

  // ── 실험 보고서(자세히 보기)
  function openSheet(w) {
    $('sCode').innerHTML = `<b>${code(w)}</b> / LAB REPORT`;
    $('sCover').innerHTML = cover(w);
    $('sKind').textContent = `// ${[groupOf(w), w.kind, w.subject].filter(Boolean).join(' · ')}`;
    $('sTitle').textContent = w.title;
    $('sSpec').innerHTML = [['Target', w.audience], ['Revision', w.versions && `${w.versions}차`], ['Updated', w.updated], ['Source', isExt(w.url) ? '외부 링크' : '사이트 안']]
      .filter(x => x[1]).map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join('');
    const canEmbed = w.embed !== false;
    $('sActions').innerHTML =
      (canEmbed ? `<a class="btn primary" href="#/view/${esc(w.id)}">▶ 실행하기</a>` : `<a class="btn primary" href="${esc(href(w.url))}" target="_blank" rel="noopener">▶ 실행하기 ↗</a>`) +
      (canEmbed ? `<a class="btn" href="${esc(href(w.url))}" target="_blank" rel="noopener">새 탭 ↗</a>` : '') +
      (w.blog ? `<a class="btn" href="${esc(w.blog)}" target="_blank" rel="noopener">✎ 수업 활용 글</a>` : '') +
      `<button class="btn" id="sQr">▦ QR 코드</button>` +
      `<button class="btn" id="sShare">주소 복사</button>`;
    $('sDesc').innerHTML = String(w.desc || w.summary || '').split(/\n+/).map(p => `<p>${esc(p)}</p>`).join('');
    $('sUses').innerHTML = (w.uses || []).length ? `<h4>// 수업 적용 프로토콜</h4><ul class="uses">${w.uses.map(u => `<li>${esc(u)}</li>`).join('')}</ul>` : '';
    $('sFiles').innerHTML = (w.files || []).length ? `<h4>// 첨부 자료</h4><div class="files">${w.files.map(f => `<a class="pill" href="${esc(href(f.url))}" target="_blank" rel="noopener">⤓ ${esc(f.name)}</a>`).join('')}</div>` : '';
    $('sTags').innerHTML = (w.tags || []).map(t => `<li>#${esc(t)}</li>`).join('');
    $('sShare').onclick = async e => {
      const url = location.href.split('#')[0] + `#/w/${w.id}`;
      try { await navigator.clipboard.writeText(url); e.target.textContent = '✓ 복사됨'; }
      catch { prompt('이 주소를 복사하세요', url); }
    };
    $('sQr').onclick = () => openQr(w);
    $('sheet').hidden = false;
    $('sheet').querySelector('.sheet-panel').scrollTop = 0;
  }

  // ── QR 코드 — 작품 주소를 QR로 (QR 그리는 코드는 처음 열 때 한 번만 받아 옴)
  let qrLib, qrWork, qrMode = 'work';
  const loadQr = () => qrLib ||= new Promise((ok, no) => {
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js';
    s.onload = () => ok(window.qrcode); s.onerror = () => { qrLib = null; no(new Error('qr')); };
    document.head.appendChild(s);
  });
  const qrTarget = (w, mode) => mode === 'page'
    ? location.href.split('#')[0] + `#/w/${encodeURIComponent(w.id)}`
    : new URL(href(w.url), location.href).href;
  async function drawQr() {
    const url = qrTarget(qrWork, qrMode), cv = $('qrCanvas');
    let shown = url; try { shown = decodeURI(url); } catch {}
    $('qrUrl').textContent = shown.replace(/^https?:\/\//, '');
    $('qrSeg').querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.qrMode === qrMode));
    try {
      const qr = (await loadQr())(0, 'M');
      qr.addData(url); qr.make();
      const n = qr.getModuleCount(), q = 4, cell = Math.ceil(1000 / (n + q * 2)), size = cell * (n + q * 2);
      cv.width = cv.height = size;
      const g = cv.getContext('2d');
      g.fillStyle = '#fff'; g.fillRect(0, 0, size, size);
      g.fillStyle = '#111';
      for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (qr.isDark(r, c)) g.fillRect((c + q) * cell, (r + q) * cell, cell, cell);
      cv.classList.remove('err');
    } catch { cv.width = cv.height = 0; cv.classList.add('err'); $('qrUrl').textContent = 'QR을 만들지 못했어요. 인터넷 연결을 확인해 주세요.'; }
  }
  function openQr(w) {
    qrWork = w; qrMode = 'work';
    $('qrTitle').textContent = w.title;
    $('qrCopy').textContent = '주소 복사';
    $('qr').hidden = false; $('qr').classList.remove('big');
    drawQr();
  }
  const closeQr = () => { if (document.fullscreenElement) document.exitFullscreen(); $('qr').hidden = true; $('qr').classList.remove('big'); };
  $('qrSeg').addEventListener('click', e => { const m = e.target.dataset.qrMode; if (m) { qrMode = m; drawQr(); } });
  document.querySelectorAll('[data-qr-close]').forEach(el => el.addEventListener('click', closeQr));
  $('qrBig').onclick = () => { $('qr').classList.add('big'); $('qr').requestFullscreen?.().catch(() => {}); };
  $('qrSave').onclick = () => {
    const a = document.createElement('a');
    a.href = $('qrCanvas').toDataURL('image/png');
    a.download = `QR-${qrWork.title.replace(/[\\/:*?"<>|]/g, '')}.png`;
    a.click();
  };
  $('qrCopy').onclick = async e => {
    const url = qrTarget(qrWork, qrMode);
    try { await navigator.clipboard.writeText(url); e.target.textContent = '✓ 복사됨'; }
    catch { prompt('이 주소를 복사하세요', url); }
  };
  document.addEventListener('fullscreenchange', () => { if (!document.fullscreenElement) $('qr').classList.remove('big'); });
  addEventListener('hashchange', () => { if (!$('qr').hidden) closeQr(); });

  // ── 바로 보기
  function openViewer(w) {
    $('vTitle').textContent = `${code(w)}  ${w.title}`;
    $('viewer').hidden = false;
    $('vNew').href = href(w.url);
    if ($('vFrame').dataset.id !== w.id) { $('vFrame').src = href(w.url); $('vFrame').dataset.id = w.id; }
  }
  function closeViewer() {
    if ($('viewer').hidden) return;
    $('viewer').hidden = true;
    $('vFrame').src = 'about:blank'; $('vFrame').dataset.id = '';
  }
  $('vFull').onclick = () => $('viewer').requestFullscreen?.();
  $('vBack').onclick = () => { const id = (location.hash.match(/^#\/view\/(.+)/) || [])[1]; location.hash = id ? `#/w/${id}` : '#works'; };
  $('vClose').onclick = () => { location.hash = '#works'; };
  document.querySelectorAll('[data-close]').forEach(el => el.addEventListener('click', () => { location.hash = '#works'; }));
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (!$('qr').hidden) closeQr();
    else if (!$('viewer').hidden) $('vBack').click(); else if (!$('sheet').hidden) location.hash = '#works';
  });

  // ── 주소(#)로 화면 고르기 — 공유한 주소로 들어와도 같은 화면이 열림
  function route() {
    const m = location.hash.match(/^#\/(w|view)\/(.+)$/);
    const w = m && W.find(x => x.id === decodeURIComponent(m[2]));
    if (w && m[1] === 'view' && w.embed !== false) { $('sheet').hidden = true; openViewer(w); }
    else if (w) { closeViewer(); openSheet(w); }
    else { closeViewer(); $('sheet').hidden = true; }
    document.body.classList.toggle('locked', !$('sheet').hidden || !$('viewer').hidden);
    document.title = w ? `${w.title} · ${S.title}` : `${S.title} · ${S.subtitle || ''}`;
  }
  addEventListener('hashchange', route);

  const top = $('top');
  addEventListener('scroll', () => top.classList.toggle('scrolled', scrollY > 20), { passive: true });

  function refresh(animate) { applySite(); buildStats(animate); buildChips(); render(); route(); }
  refresh(true);

  // ── 편집실에서 저장한 내용(구글 시트) 합치기
  import('./store.js').then(async m => {
    if (!m.enabled()) return;
    const remote = await m.loadRemote();
    S = { ...S, ...remote.site };
    W = m.mergeWorks(BASE, remote.works).filter(live);
    refresh(false);
  }).catch(err => console.warn('편집 내용을 불러오지 못했어요:', err));
})();
