// 화면 동작 — 보통 고칠 필요 없음.
// 작품은 편집 화면(edit.html)에서 고치거나, data/works.js 를 직접 고칩니다.
(function () {
  const BASE = (window.WORKS || []).filter(w => w && w.id && w.title);
  let S = { ...(window.SITE || {}) };
  const live = w => !!w.url;                          // 링크가 비어 있는 작품은 숨김
  let W = BASE.filter(live);
  // 마지막으로 받은 목록을 이 브라우저에 기억 — 다음에 열 때 예전 목록이 잠깐 보였다가 바뀌지 않게
  const CACHE = 'lab-cache-7', API = (window.SHEET_API || '').trim();
  try {
    const c = JSON.parse(localStorage.getItem(CACHE));
    if (c && c.api === API && Array.isArray(c.works)) { W = c.works; S = { ...S, ...c.site }; }
  } catch {}
  const $ = id => document.getElementById(id);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const isExt = u => /^https?:\/\//i.test(u || '');
  const href = u => isExt(u) ? u : encodeURI(u || '');
  const code = w => String(W.indexOf(w) + 1).padStart(2, '0');
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
    $('heroKicker').textContent = `// ${[S.role, S.owner].filter(Boolean).join(' · ')} — 2026년부터`;
    $('heroKo').innerHTML = esc(S.subtitle || '').replace(/(실험실|LAB)/, '<em>$1</em>');
    $('heroIntro').textContent = S.intro || '';
    const today = new Date();
    $('statusText').textContent = `실험실 열림 · ${today.getFullYear()}.${String(today.getMonth() + 1).padStart(2, '0')}.${String(today.getDate()).padStart(2, '0')} · 작품 ${W.length}개`;
    $('footName').textContent = `© ${today.getFullYear()} ${S.owner || ''} · ${S.title || 'MATH LAB'}`;
    const foot = [];
    for (const el of [$('navBlog'), $('heroBlog')]) { el.hidden = !S.blog; if (S.blog) el.href = S.blog; }
    $('aboutBlog').innerHTML = S.blog ? ` 수업 운영 방법은 <a href="${esc(S.blog)}" target="_blank" rel="noopener">블로그</a>에 정리합니다.` : '';
    if (S.blog) foot.push(`<a href="${esc(S.blog)}" target="_blank" rel="noopener">블로그 ↗</a>`);
    if (S.email) foot.push(`<a href="mailto:${esc(S.email)}">${esc(S.email)}</a>`);
    $('footLinks').innerHTML = foot.join('');
  }

  // ── 숫자
  function buildStats(animate) {
    const versions = W.reduce((a, w) => a + (+w.versions || 0), 0);
    const subjects = new Set(W.map(w => w.subject).filter(Boolean));
    $('stats').innerHTML = [
      ['만든 작품', W.length, '개'],
      ['고쳐 만든 횟수', versions, '번'],
      ['과목·주제', subjects.size, '가지'],
      ['설치할 프로그램', 0, '개']
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
    : `<div class="glyph-cover" style="--c:${esc(w.color || '#343a40')}">${plotSvg(w)}<div class="gc-text"><span${w.glyph ? '' : ' class="auto"'}>${esc(w.glyph || w.title[0])}</span><strong>${esc(w.title)}</strong></div></div>`;

  // ── 분류(수학 수업·학급 운영·동아리·개인) + 과목·주제
  const GROUPS = ['수학 수업', '학급 운영', '연구회·연수', '동아리', '개인'];
  // 분류를 안 고른 작품은 과목·종류·태그로 짐작
  const groupOf = w => w.group || (() => {
    const t = [w.subject, w.kind, ...(w.tags || [])].join(' ');
    return /동아리/.test(t) ? '동아리' : /학급|담임|입시|진로|생활|습관/.test(t) ? '학급 운영' : /연구회|연수|페스타/.test(t) ? '연구회·연수' : /개인|실험작|취미/.test(t) ? '개인' : '수학 수업';
  })();
  const groupNames = () => [...GROUPS, ...new Set(W.map(groupOf).filter(g => !GROUPS.includes(g)))];

  let group = '전체', subj = '전체', q = '', view = 'grid';
  try { view = localStorage.getItem('lab-view') || 'grid'; } catch {}
  function buildChips() {
    const names = groupNames();
    if (group !== '전체' && !W.some(w => groupOf(w) === group)) group = '전체';
    $('groups').innerHTML = ['전체', ...names].map(g => {
      const n = g === '전체' ? W.length : W.filter(w => groupOf(w) === g).length;
      if (g !== '전체' && !n) return '';
      return `<button class="group-tab" role="tab" aria-selected="${g === group}" data-g="${esc(g)}">` +
        `<b>${esc(g)}<small class="mono">${n}</small></b></button>`;
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
        ? `<li class="group-head" aria-hidden="true"><b>${esc(g)}</b><small class="mono">${n}</small></li>`
        : `<h3 class="group-head"><b>${esc(g)}</b><small class="mono">${n}</small></h3>`;
    };
    document.querySelectorAll('.view-toggle button').forEach(b => b.setAttribute('aria-pressed', b.dataset.view === view));
    $('count').textContent = `[${String(list.length).padStart(2, '0')}]`;
    $('empty').hidden = list.length > 0;
    $('grid').hidden = view !== 'grid'; $('index').hidden = view !== 'index';
    if (view === 'grid') {
      $('grid').innerHTML = list.map((w, i) => head(w, i) + `
        <button class="card${showFeatured && w.featured ? ' featured' : ''}" data-id="${esc(w.id)}" style="transition-delay:${Math.min(i, 8) * 60}ms">
          <div class="card-top"><b>${esc(w.kind || '')}</b><span>${w.versions ? `${w.versions}차` : ''}</span></div>
          <div class="card-cover">${isExt(w.url) ? '<span class="ext">외부 사이트 ↗</span>' : ''}${cover(w)}</div>
          <div class="card-body">
            <div class="card-sub"><b>${esc(w.subject || '')}</b>${w.audience ? `<span>${esc(w.audience)}</span>` : ''}</div>
            <h3>${esc(w.title)}</h3>
            <p>${esc(w.summary || '')}</p>
            <div class="card-foot"><span>${w.updated ? `${esc(w.updated)} 고침` : ''}</span><span class="go">→</span></div>
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
          <span class="r-dim r-ver">${w.versions ? `${w.versions}차` : ''}</span>
          <span class="r-go">${isExt(w.url) ? '↗' : '→'}</span>
        </li>`).join('');
    }
  }
  // ── 작품의 관계도 (실험 기록 옆 단추로 열림): 과목별 작품 + 두 과목을 잇는 작품 + 관련 도서
  const MAP = window.MAP && Array.isArray(window.MAP.subjects) ? window.MAP : { subjects: [], books: [] };
  const workOf = id => W.find(x => x.id === id);
  const booksFor = id => (MAP.books || []).filter(b => b.to === id);
  const bookHtml = (b, here) => {
    const w = workOf(b.to);
    return `<li class="book">
      <span class="book-spine" aria-hidden="true"></span>
      <span class="book-info"><b>『${esc(b.title)}』${b.how ? `<i class="book-how">${esc(b.how)}</i>` : ""}</b><small>${esc([b.author, b.publisher].filter(Boolean).join(' · '))}</small>${b.note ? `<em>${esc(b.note)}${w && w.id !== here ? ` → <a href="#/w/${esc(w.id)}">${esc(w.title.split(' · ')[0])}</a>` : ''}</em>` : ''}</span>
    </li>`;
  };
  // 그래프 뷰(옵시디언처럼 점과 선): 과목 → 작품 → 개념·관련 도서. 점을 누르면 그 작품 소개가 열림
  let graph = null;
  function buildThreads() {
    const subjects = MAP.subjects.map(s => ({ ...s, items: (s.works || []).map(it => [it, workOf(it.id)]).filter(x => x[1]) })).filter(s => s.items.length);
    const bw = MAP.bridge && workOf(MAP.bridge.id);
    $('navMap').hidden = $('mapBtn').hidden = !subjects.length;
    if (graph) graph.stop();
    graph = null;
    if (!subjects.length) { $('mapBody').innerHTML = ''; return; }

    // 점과 선 만들기 (같은 이름의 개념은 한 점으로)
    const nodes = [], links = [], byKey = {};
    const add = (key, o, parent, i) => {
      if (byKey[key]) return byKey[key];
      const a = (i || 0) * 2.4 + (parent ? Math.atan2(parent.y, parent.x) : 0), d = o.type === 'work' ? 120 : 55;
      const n = { x: parent ? parent.x + Math.cos(a) * d : 0, y: parent ? parent.y + Math.sin(a) * d : 0, key, ...o, nb: new Set(), vx: 0, vy: 0 };
      nodes.push(n); byKey[key] = n; return n;
    };
    const link = (a, b, len) => { links.push({ a, b, len }); a.nb.add(b); b.nb.add(a); };
    const addWork = (it, w, color, hubs) => {
      const n = add('w:' + w.id, { type: 'work', label: w.title.split(' · ')[0], id: w.id, color, r: 10 }, hubs[0], hubs[0].nb.size);
      if (hubs.length > 1) { n.x = 0; n.y = 150; }
      hubs.forEach(h => link(h, n, hubs.length > 1 ? 140 : 95));
      (it.concepts || []).forEach((c, i) => link(n, add('c:' + c, { type: 'concept', label: c, id: w.id, color, r: 5 }, n, i), 44));
    };
    const hubs = subjects.map((s, i) => add('s:' + s.title, { type: 'hub', label: s.title, color: s.color || '#5b625a', r: 13, x: (i - (subjects.length - 1) / 2) * 300, y: 0 }));
    subjects.forEach((s, i) => s.items.forEach(([it, w]) => addWork(it, w, s.color, [hubs[i]])));
    if (bw) addWork(MAP.bridge, bw, '', hubs);
    (MAP.books || []).forEach((b, i) => {
      const t = byKey['w:' + b.to];
      if (t) link(t, add('b:' + b.title, { type: 'book', label: `『${b.title}』`, sub: [b.author, b.publisher].filter(Boolean).join(' · '), id: b.to, color: t.color, r: 6 }, t, i + 3), 58);
    });
    (MAP.links || []).forEach(([p, q]) => { const a = byKey['c:' + p], b = byKey['c:' + q]; if (a && b) { link(a, b, 90); links[links.length - 1].weak = true; } });
    nodes.forEach((n, i) => { n.i = i; });

    const bookList = (MAP.books || []).filter(b => byKey['w:' + b.to]);
    $('mapBody').innerHTML = `
      <div class="graph">
        <svg id="gSvg" role="img" aria-label="작품의 관계도"><g id="gView">
          ${links.map(l => `<line class="ge${l.weak ? ' weak' : ''}"/>`).join('')}
          ${nodes.map(n => {
            const tag = n.id ? 'a' : 'g';
            return `<${tag} class="gn t-${n.type}" data-n="${n.i}"${n.id ? ` href="#/w/${esc(n.id)}"` : ''} style="--nc:${esc(n.color || 'var(--ink)')}">
              <title>${esc(n.label)}${n.sub ? ` — ${esc(n.sub)}` : ''}${n.id ? ' (누르면 작품 소개)' : ''}</title>
              <circle r="${n.r}"/><text y="${n.r + 14}">${esc(n.label)}</text>${n.sub ? `<text class="sub" y="${n.r + 28}">${esc(n.sub)}</text>` : ''}
            </${tag}>`;
          }).join('')}
        </g></svg>
        <div class="graph-tools mono">
          <button type="button" data-z="1.25" aria-label="확대">＋</button>
          <button type="button" data-z="0.8" aria-label="축소">−</button>
          <button type="button" data-z="0" aria-label="한눈에 보기">⤢</button>
        </div>
        <p class="graph-legend mono"><span><i class="lg hub"></i>과목</span><span><i class="lg work"></i>작품</span><span><i class="lg concept"></i>개념</span><span><i class="lg book"></i>관련 도서</span></p>
      </div>
      ${bookList.length ? `<div class="graph-books"><h4>관련 도서 <small>읽었거나 작품에 인용한 책</small></h4><ul>${bookList.map(b => bookHtml(b).replace('<li class="book"', `<li class="book" style="--sc:${esc(byKey['w:' + b.to].color || '#5b5bd6')}"`)).join('')}</ul></div>` : ''}`;

    const svg = $('gSvg'), view = $('gView');
    const lineEls = [...svg.querySelectorAll('.ge')], nodeEls = [...svg.querySelectorAll('.gn')];
    let tx = 0, ty = 0, k = 1, alpha = 1, raf = 0, drag = null, moved = false;

    // 힘 계산: 점끼리 밀어내고, 선은 용수철처럼 당기고, 가운데로 살짝 모음
    const push = { hub: 620, work: 400, concept: 130, book: 150 };
    function step() {
      for (let i = 0; i < nodes.length; i++) for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i], b = nodes[j];
        let dx = b.x - a.x, dy = b.y - a.y, d2 = dx * dx + dy * dy;
        if (d2 < 1) { dx = .5; dy = .3; d2 = 1; }
        const d = Math.sqrt(d2), min = a.r + b.r + 26;
        const fa = push[b.type] * alpha / d2, fb = push[a.type] * alpha / d2;
        a.vx -= dx * fa; a.vy -= dy * fa; b.vx += dx * fb; b.vy += dy * fb;
        if (d < min) { const o = (min - d) / d * .25; a.vx -= dx * o; a.vy -= dy * o; b.vx += dx * o; b.vy += dy * o; }
      }
      links.forEach(({ a, b, len, weak }) => {
        const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1, f = (d - len) / d * alpha * (weak ? .12 : .35);
        const wa = b.nb.size / (a.nb.size + b.nb.size);
        a.vx += dx * f * wa; a.vy += dy * f * wa; b.vx -= dx * f * (1 - wa); b.vy -= dy * f * (1 - wa);
      });
      nodes.forEach(n => {
        n.vx -= n.x * .012 * alpha; n.vy -= n.y * .012 * alpha;
        if (n.fx != null) { n.x = n.fx; n.y = n.fy; n.vx = n.vy = 0; return; }
        n.vx *= .55; n.vy *= .55; n.x += n.vx; n.y += n.vy;
      });
      alpha *= .985;
    }
    function draw() {
      links.forEach((l, i) => { const e = lineEls[i]; e.setAttribute('x1', l.a.x); e.setAttribute('y1', l.a.y); e.setAttribute('x2', l.b.x); e.setAttribute('y2', l.b.y); });
      nodes.forEach((n, i) => nodeEls[i].setAttribute('transform', `translate(${n.x.toFixed(1)},${n.y.toFixed(1)})`));
      view.setAttribute('transform', `translate(${tx},${ty}) scale(${k})`);
    }
    function loop() { step(); draw(); raf = alpha > .004 ? requestAnimationFrame(loop) : 0; }
    const heat = a => { alpha = Math.max(alpha, a); if (!raf) raf = requestAnimationFrame(loop); };
    for (let i = 0; i < 260; i++) step();   // 처음부터 거의 자리 잡은 모양으로
    alpha = .12;

    // 화면 크기에 맞춰 한눈에 보이게
    function fit() {
      const w = svg.clientWidth, h = svg.clientHeight;
      if (!w) return;
      svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
      const xs = nodes.map(n => n.x), ys = nodes.map(n => n.y);
      const x0 = Math.min(...xs) - 80, x1 = Math.max(...xs) + 80, y0 = Math.min(...ys) - 30, y1 = Math.max(...ys) + 50;
      k = Math.min(w / (x1 - x0), h / (y1 - y0), 1.5);
      if (w < 600) k = Math.max(k, .8);   // 휴대폰에서는 글자가 읽히게 조금 크게 (옆은 끌어서 보기)
      tx = w / 2 - (x0 + x1) / 2 * k; ty = h / 2 - (y0 + y1) / 2 * k;
      draw(); heat(.12);
    }
    function zoom(f, cx = svg.clientWidth / 2, cy = svg.clientHeight / 2) {
      const nk = Math.min(4, Math.max(.3, k * f));
      tx = cx - (cx - tx) * nk / k; ty = cy - (cy - ty) * nk / k; k = nk; draw();
    }
    svg.closest('.graph').querySelectorAll('[data-z]').forEach(b => { b.onclick = () => +b.dataset.z ? zoom(+b.dataset.z) : fit(); });
    svg.addEventListener('wheel', e => { e.preventDefault(); const r = svg.getBoundingClientRect(); zoom(e.deltaY < 0 ? 1.12 : 1 / 1.12, e.clientX - r.left, e.clientY - r.top); }, { passive: false });

    // 마우스를 올린 점과 이어진 점·선만 진하게
    function focus(n) {
      svg.classList.toggle('focus', !!n);
      nodeEls.forEach((e, i) => e.classList.toggle('hot', !!n && (nodes[i] === n || n.nb.has(nodes[i]))));
      lineEls.forEach((e, i) => e.classList.toggle('hot', !!n && (links[i].a === n || links[i].b === n)));
    }
    nodeEls.forEach((e, i) => {
      e.addEventListener('pointerenter', ev => { if (ev.pointerType === 'mouse' && !drag) focus(nodes[i]); });
      e.addEventListener('pointerleave', () => { if (!drag) focus(null); });
      e.addEventListener('focus', () => focus(nodes[i]));
      e.addEventListener('blur', () => focus(null));
      e.addEventListener('click', ev => { if (moved) ev.preventDefault(); else if (!nodes[i].id) focus(e.classList.contains('hot') && svg.classList.contains('focus') ? null : nodes[i]); });
    });

    // 끌기: 점을 끌면 점이, 빈 곳을 끌면 화면이 움직임 (조금만 움직였으면 누른 것으로 봄)
    svg.addEventListener('pointerdown', e => {
      if (e.button) return;
      const el = e.target.closest('.gn');
      drag = { n: el ? nodes[+el.dataset.n] : null, x: e.clientX, y: e.clientY, tx, ty };
      moved = false;
    });
    addEventListener('pointermove', e => {
      if (!drag) return;
      const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      if (!moved && Math.hypot(dx, dy) < 5) return;
      moved = true;
      if (drag.n) {
        const r = svg.getBoundingClientRect();
        drag.n.fx = (e.clientX - r.left - tx) / k; drag.n.fy = (e.clientY - r.top - ty) / k;
        focus(drag.n); heat(.3);
      } else { tx = drag.tx + dx; ty = drag.ty + dy; draw(); }
    });
    addEventListener('pointerup', () => {
      if (!drag) return;
      if (drag.n) { drag.n.fx = drag.n.fy = null; heat(.15); if (moved) focus(null); }
      drag = null;
      setTimeout(() => { moved = false; });
    });

    graph = { fit, stop: () => cancelAnimationFrame(raf) };
    if (!$('mapView').hidden) requestAnimationFrame(fit);
    draw();
  }
  // 작품 소개 창: 같은 과목의 다른 작품과 관련 도서
  function relatedHtml(w) {
    const s = MAP.subjects.find(s => (s.works || []).some(it => it.id === w.id));
    const isBridge = MAP.bridge && MAP.bridge.id === w.id;
    const others = s ? s.works.map(it => workOf(it.id)).filter(x => x && x.id !== w.id) : [];
    const bw = MAP.bridge && workOf(MAP.bridge.id);
    if (bw && s && bw.id !== w.id) others.push(bw);
    if (isBridge) MAP.subjects.forEach(x => (x.works || []).forEach(it => { const o = workOf(it.id); if (o) others.push(o); }));
    const books = booksFor(w.id);
    return (others.length ? `<h4>// ${isBridge ? '이 작품이 잇는 두 과목의 작품' : `이어지는 작품 · ${esc(s.title)}`}</h4><div class="s-thread">${others.map(o => `<a href="#/w/${esc(o.id)}">${esc(o.title.split(' · ')[0])}</a>`).join('<i>·</i>')}</div>` : '') +
      (books.length ? `<h4>// 관련 도서</h4><ul class="s-books">${books.map(b => bookHtml(b, w.id)).join('')}</ul>` : '');
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
    $('sCode').innerHTML = `<b>${code(w)}</b> / 작품 소개`;
    $('sCover').innerHTML = cover(w);
    $('sKind').textContent = `// ${[groupOf(w), w.kind, w.subject].filter(Boolean).join(' · ')}`;
    $('sTitle').textContent = w.title;
    $('sSpec').innerHTML = [['대상', w.audience], ['버전', w.versions && `${w.versions}차`], ['고친 날', w.updated], ['위치', isExt(w.url) ? '외부 사이트' : '이 사이트 안']]
      .filter(x => x[1]).map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join('');
    const canEmbed = w.embed !== false;
    $('sActions').innerHTML =
      (canEmbed ? `<a class="btn primary" href="#/view/${esc(w.id)}">▶ 실행하기</a>` : `<a class="btn primary" href="${esc(href(w.url))}" target="_blank" rel="noopener">▶ 실행하기 ↗</a>`) +
      (canEmbed ? `<a class="btn" href="${esc(href(w.url))}" target="_blank" rel="noopener">새 탭 ↗</a>` : '') +
      (w.blog ? `<a class="btn" href="${esc(w.blog)}" target="_blank" rel="noopener">✎ 수업 활용 글</a>` : '') +
      `<button class="btn" id="sQr">▦ QR 코드</button>` +
      `<button class="btn" id="sShare">주소 복사</button>`;
    $('sDesc').innerHTML = String(w.desc || w.summary || '').split(/\n+/).map(p => `<p>${esc(p)}</p>`).join('');
    const paras = s => String(s || '').split(/\n+/).filter(Boolean).map(p => `<p>${esc(p)}</p>`).join('');
    $('sWhy').innerHTML = w.why ? `<h4>// 만든 이유</h4><div class="why">${paras(w.why)}</div>` : '';
    $('sUses').innerHTML = (w.uses || []).length ? `<h4>// 수업에서 이렇게 써요</h4><ul class="uses">${w.uses.map(u => `<li>${esc(u)}</li>`).join('')}</ul>` : '';
    // 써 보고 고친 기록: "16차 | 내용"
    $('sLog').innerHTML = (w.log || []).length ? `<h4>// 써 보고 고친 기록</h4><ol class="log">${w.log.map(l => {
      const [v, ...r] = String(l).split('|');
      return r.length ? `<li><b class="mono">${esc(v.trim())}</b><span>${esc(r.join('|').trim())}</span></li>` : `<li><span>${esc(l)}</span></li>`;
    }).join('')}</ol>` : '';
    $('sVoices').innerHTML = (w.voices || []).length ? `<h4>// 수업 후기</h4><div class="voices">${w.voices.map(v => `<blockquote>${esc(v)}</blockquote>`).join('')}</div>` : '';
    $('sThreads').innerHTML = relatedHtml(w);
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
    $('vTitle').textContent = w.title;
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
  let back = '#works';                                   // 작품 소개를 닫으면 돌아갈 곳 (줄기 화면에서 열었으면 줄기로)
  document.querySelectorAll('[data-close]').forEach(el => el.addEventListener('click', () => { location.hash = back; }));
  $('mapClose').onclick = () => { location.hash = '#works'; };
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (!$('qr').hidden) closeQr();
    else if (!$('viewer').hidden) $('vBack').click(); else if (!$('sheet').hidden) location.hash = back;
    else if (!$('mapView').hidden) location.hash = '#works';
  });

  // ── 주소(#)로 화면 고르기 — 공유한 주소로 들어와도 같은 화면이 열림
  function route() {
    const m = location.hash.match(/^#\/(w|view)\/(.+)$/);
    const w = m && W.find(x => x.id === decodeURIComponent(m[2]));
    if (w && m[1] === 'view' && w.embed !== false) { $('sheet').hidden = true; openViewer(w); }
    else if (w) { closeViewer(); openSheet(w); }
    else { closeViewer(); $('sheet').hidden = true; }
    const onMap = location.hash === '#/map';
    if (onMap && $('mapView').hidden) $('mapView').scrollTop = 0;
    const opening = onMap && $('mapView').hidden;
    $('mapView').hidden = !onMap;
    if (opening && graph) requestAnimationFrame(graph.fit);
    if (onMap) back = '#/map'; else if (!w) back = '#works';
    document.body.classList.toggle('locked', !$('sheet').hidden || !$('viewer').hidden || onMap);
    document.title = w ? `${w.title} · ${S.title}` : `${S.title} · ${S.subtitle || ''}`;
  }
  addEventListener('hashchange', route);
  addEventListener('resize', () => { if (graph && !$('mapView').hidden) graph.fit(); });

  const top = $('top');
  addEventListener('scroll', () => top.classList.toggle('scrolled', scrollY > 20), { passive: true });

  function refresh(animate) { applySite(); buildStats(animate); buildChips(); render(); buildThreads(); route(); }
  refresh(true);

  // ── 편집실에서 저장한 내용(구글 시트) 합치기
  import('./store.js').then(async m => {
    if (!m.enabled()) return;
    const remote = await m.loadRemote();
    const site = { ...(window.SITE || {}), ...remote.site };
    // 같은 주소의 작품이 시트에 따로 또 있으면 하나만 (사이트 파일 쪽을 남김)
    const key = u => String(u || '').split('#')[0].replace(/\/+$/, '');
    const works = m.mergeWorks(BASE, remote.works).filter(live)
      .filter((w, i, a) => w.origin !== 'sheet' || !a.some(x => x !== w && x.origin === 'file' && key(x.url) === key(w.url)));
    const same = JSON.stringify([works, site]) === JSON.stringify([W, S]);   // 기억해 둔 것과 같으면 다시 그리지 않음
    S = site; W = works;
    const keep = list => localStorage.setItem(CACHE, JSON.stringify({ api: API, works: list, site: remote.site }));
    try { keep(W); } catch { try { keep(W.map(({ coverData, ...w }) => w)); } catch {} }   // 자리가 모자라면 넣어 둔 그림은 빼고 기억
    if (!same) refresh(false);
  }).catch(err => console.warn('편집 내용을 불러오지 못했어요:', err));
})();
