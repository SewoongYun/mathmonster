// 편집실 동작 — 보통 고칠 필요 없음.
import * as store from './store.js';

const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const isExt = u => /^https?:\/\//i.test(u || '');
const loadScript = src => new Promise(r => { const s = document.createElement('script'); s.src = src; s.onload = s.onerror = r; document.head.appendChild(s); });

const v = Date.now();
await loadScript('data/works.js?v=' + v);
await loadScript('data/sheet-config.js?v=' + v);
const BASE = (window.WORKS || []).filter(w => w && w.id && w.title);
const BASE_SITE = window.SITE || {};
const baseOf = id => BASE.find(b => b.id === id);
let remote = { works: {}, site: {} }, list = [];

const show = id => { for (const s of ['loading', 'setup', 'login', 'app']) $(s).hidden = s !== id; scrollTo(0, 0); };
let toastT;
function toast(msg, bad) {
  const t = $('toast'); t.textContent = msg; t.classList.toggle('bad', !!bad); t.hidden = false;
  clearTimeout(toastT); toastT = setTimeout(() => { t.hidden = true; }, bad ? 6000 : 2600);
}
function errMsg(e) {
  const c = e?.code || e?.message || '';
  if (c === 'wrong-password') return '비밀번호가 맞지 않아요.';
  if (c === 'too-many-requests') return '여러 번 틀려서 10분 동안 잠겼어요. 잠시 뒤 다시 해 주세요.';
  if (c === 'network') return '인터넷 연결이나 웹 앱 주소를 확인해 주세요.';
  if (c === 'bad-response') return '구글 시트가 이상한 답을 보냈어요. 배포할 때 액세스를 "모든 사용자"로 했는지 확인해 주세요.';
  return '문제가 생겼어요: ' + c;
}

// ── 처음 설정 안내
let codeTpl = '';
fetch('apps-script/Code.gs?v=' + v).then(r => r.text()).then(t => { codeTpl = t; updSetup(); }).catch(() => { $('codeOut').textContent = '코드를 불러오지 못했어요. 이 폴더의 apps-script/Code.gs 파일을 열어 복사해 주세요.'; });
function updSetup() {
  const pw = $('pwIn').value;
  if (codeTpl) $('codeOut').textContent = codeTpl.replace("'__PASSWORD__';", `'${pw.replace(/\\/g, '\\\\').replace(/'/g, "\\'") || '__PASSWORD__'}';`);
  $('codeHint').textContent = pw ? (pw.length < 8 ? '⚠ 비밀번호가 짧아요. 8자 이상을 권해요.' : '✓ 코드 맨 위에 비밀번호가 들어갔어요.') : '1단계에 비밀번호를 적으면 코드 맨 위에 자동으로 들어가요.';
  const url = $('urlIn').value.trim();
  $('cfgOut').textContent = /^https:\/\/script\.google\.com\/macros\/s\/.+\/exec/.test(url)
    ? `/* 편집실 저장소(구글 시트) 연결 주소 — 편집실 처음 설정에서 만듦 */\nwindow.SHEET_API = "${url}";\n`
    : '(3단계 칸에 https://script.google.com/macros/s/…/exec 주소를 붙여 넣으면 여기에 만들어져요)';
}
['pwIn', 'urlIn'].forEach(id => $(id).addEventListener('input', updSetup));
document.querySelectorAll('[data-copy]').forEach(b => b.addEventListener('click', async () => {
  try { await navigator.clipboard.writeText($(b.dataset.copy).textContent); b.textContent = '✓ 복사됨'; setTimeout(() => { b.textContent = '복사'; }, 1500); }
  catch { toast('복사가 안 되면 글자를 직접 드래그해서 복사해 주세요', true); }
}));
$('showSetup').addEventListener('click', () => {
  show('setup');
  if (!$('backToApp')) {
    const b = document.createElement('button');
    b.id = 'backToApp'; b.className = 'pill'; b.textContent = '← 편집실로 돌아가기';
    b.onclick = () => show('app');
    $('setup').prepend(b);
  }
});

// ── 들어가기
async function enter() {
  $('logout').hidden = false;
  try { await reload(); } catch (e) { toast(errMsg(e), true); }
  show('app');
}
if (!store.enabled()) show('setup');
else {
  $('mockHint').hidden = !store.isMock();
  if (store.auth.signedIn()) enter(); else show('login');
  $('loginForm').addEventListener('submit', async e => {
    e.preventDefault(); $('loginErr').hidden = true;
    const btn = e.target.querySelector('[type=submit]'); btn.disabled = true; btn.textContent = '확인하는 중…';
    try { await store.auth.signIn($('pw').value); $('pw').value = ''; await enter(); }
    catch (err) { $('loginErr').textContent = errMsg(err); $('loginErr').hidden = false; }
    finally { btn.disabled = false; btn.textContent = '들어가기 →'; }
  });
  $('logout').addEventListener('click', () => { store.auth.signOut(); $('logout').hidden = true; show('login'); });
}

// ── 탭
document.querySelectorAll('.tab').forEach(t => t.addEventListener('click', () => {
  document.querySelectorAll('.tab').forEach(x => x.setAttribute('aria-selected', x === t));
  document.querySelectorAll('[data-pane]').forEach(p => { p.hidden = p.dataset.pane !== t.dataset.tab; });
}));

// ── 목록
async function reload() {
  remote = await store.loadRemote();
  list = store.mergeWorks(BASE, remote.works, true);
  renderList(); fillSite();
}

const coverHtml = w => {
  const src = w.coverData || (w.cover ? encodeURI(w.cover) : '');
  return src ? `<img src="${esc(src)}" alt="">`
    : `<div class="glyph-cover" style="--c:${esc(w.color || '#343a40')}"><span>${esc(w.glyph || (w.title || '?')[0])}</span></div>`;
};

function renderList() {
  $('list').innerHTML = list.map((w, i) => {
    const badges = [
      w.origin === 'file' ? '<span class="badge-s">사이트 파일</span>' : '<span class="badge-s cloud">편집실에서 추가</span>',
      w.changed && w.origin === 'file' ? '<span class="badge-s cloud">고침</span>' : '',
      isExt(w.url) ? '<span class="badge-s">링크</span>' : !w.url ? '<span class="badge-s warn">링크 필요 · 사이트에서 안 보임</span>' : '',
      w.hidden ? '<span class="badge-s warn">숨김</span>' : ''
    ].join('');
    const acts = [`<button class="pill" data-act="edit">편집</button>`,
      w.hidden ? `<button class="pill" data-act="unhide">보이기</button>` : `<button class="pill" data-act="hide">숨기기</button>`,
      w.origin === 'file'
        ? (w.changed ? `<button class="pill danger" data-act="revert">되돌리기</button>` : '')
        : `<button class="pill danger" data-act="delete">삭제</button>`].join('');
    return `<li class="ed-item${w.hidden ? ' hidden-item' : ''}" data-id="${esc(w.id)}">
      <div class="ed-move"><button data-act="up" ${i ? '' : 'disabled'} aria-label="위로">▲</button><button data-act="down" ${i < list.length - 1 ? '' : 'disabled'} aria-label="아래로">▼</button></div>
      <div class="ed-thumb">${coverHtml(w)}</div>
      <div class="ed-info"><b>${esc(w.title)}</b><span>${esc([w.kind, w.subject].filter(Boolean).join(' · '))}</span><span class="badges">${badges}</span></div>
      <div class="ed-acts">${acts}</div>
    </li>`;
  }).join('') || '<li class="hint">아직 작품이 없어요. ＋ 새 링크 추가를 눌러 보세요.</li>';
}

let busy = false;
$('list').addEventListener('click', async e => {
  const b = e.target.closest('button[data-act]'); if (!b || busy) return;
  const li = b.closest('.ed-item'), id = li.dataset.id, i = list.findIndex(w => w.id === id), w = list[i];
  const act = b.dataset.act;
  if (act === 'edit') return openEditor(w);
  if (act === 'revert' && !confirm(`'${w.title}'을(를) 사이트 파일의 처음 내용으로 되돌릴까요?\n편집실에서 고친 내용이 사라져요.`)) return;
  if (act === 'delete' && !confirm(`'${w.title}'을(를) 지울까요?\n되살릴 수 없어요.`)) return;
  busy = true; document.body.style.cursor = 'progress';
  try {
    if (act === 'up' || act === 'down') {
      const j = act === 'up' ? i - 1 : i + 1;
      [list[i], list[j]] = [list[j], list[i]];
      renderList();
      await store.saveOrder(list.map((x, k) => [x.id, k * 10]));
      toast('순서를 저장했어요');
    } else if (act === 'hide' || act === 'unhide') {
      await store.saveWork(id, { hidden: act === 'hide' });
      toast(act === 'hide' ? '사이트에서 숨겼어요' : '다시 보이게 했어요');
    } else if (act === 'revert') {
      await store.removeWork(id);
      toast('처음 내용으로 되돌렸어요');
    } else if (act === 'delete') {
      await store.removeWork(id);
      toast('지웠어요');
    }
    await reload();
  } catch (err) { toast(errMsg(err), true); await reload().catch(() => {}); }
  finally { busy = false; document.body.style.cursor = ''; }
});

// ── 사이트 정보
const SITE_KEYS = ['title', 'subtitle', 'intro', 'owner', 'role', 'blog', 'email'];
function fillSite() {
  const s = { ...BASE_SITE, ...remote.site }, f = $('siteForm');
  SITE_KEYS.forEach(k => { f.elements[k].value = s[k] || ''; });
}
$('siteForm').addEventListener('submit', async e => {
  e.preventDefault();
  const f = e.target, d = {};
  SITE_KEYS.forEach(k => { d[k] = f.elements[k].value.trim(); });
  const btn = f.querySelector('[type=submit]'); btn.disabled = true;
  try { await store.saveSite(d); remote.site = d; toast('사이트 정보를 저장했어요'); }
  catch (err) { toast(errMsg(err), true); }
  finally { btn.disabled = false; }
});

// ── 작품 편집 창
const F = $('edForm'), E = F.elements;
let cur = null, coverState = { data: '', path: '' }, idTouched = false;

const lines = s => s.split('\n').map(x => x.trim()).filter(Boolean);
const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40);
function autoId() {
  const s = slug(E.title.value);
  const d = new Date(), ymd = `${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  let id = s.length >= 3 ? s : `lab-${ymd}`, n = 2;
  const base = id;
  while (list.some(w => w.id === id)) id = `${base}-${n++}`;
  return id;
}
function setSrc(v) {
  [...E.src].forEach(r => { r.checked = r.value === v; });
  document.querySelectorAll('[data-src]').forEach(b => { b.hidden = b.dataset.src !== v; });
}
F.addEventListener('change', e => { if (e.target.name === 'src') setSrc(e.target.value); });
function drawCover() {
  $('coverPrev').innerHTML = coverHtml({ coverData: coverState.data, cover: coverState.path, glyph: E.glyph.value, color: E.color.value, title: E.title.value });
  $('coverClear').hidden = !(coverState.data || coverState.path);
}
E.glyph.addEventListener('input', drawCover);
E.color.addEventListener('input', drawCover);
E.title.addEventListener('input', () => { if (!cur && !idTouched) E.id.value = autoId(); drawCover(); });
E.id.addEventListener('input', () => { idTouched = true; });

function openEditor(w) {
  cur = w || null; idTouched = false;
  F.reset(); $('edErr').hidden = true; $('edStep').textContent = '';
  const x = w || { color: '#3b5bdb', updated: new Date().toISOString().slice(0, 10), embed: true };
  $('edHead').innerHTML = w ? `<b>EDIT</b> / ${esc(w.title)}` : '<b>NEW</b> / 새 링크';
  for (const k of ['title', 'kind', 'subject', 'audience', 'summary', 'desc', 'glyph', 'updated', 'blog', 'versions']) E[k].value = x[k] ?? '';
  E.color.value = /^#[0-9a-f]{6}$/i.test(x.color || '') ? x.color : '#3b5bdb';
  E.uses.value = (x.uses || []).join('\n');
  E.tags.value = (x.tags || []).join(', ');
  E.files.value = (x.files || []).map(f => `${f.name} | ${f.url}`).join('\n');
  E.featured.checked = !!x.featured;
  E.embed.checked = x.embed !== false;
  E.id.value = w ? w.id : autoId(); E.id.readOnly = !!w;
  const b = w && baseOf(w.id), fileUrl = b && !isExt(b.url) ? b.url : '';
  $('srcFileOpt').hidden = !fileUrl;
  $('fileInfo').textContent = fileUrl ? `사이트 폴더에 올라가 있는 파일: ${fileUrl}` : '';
  E.url.value = isExt(x.url) ? x.url : '';
  setSrc(fileUrl && x.url === fileUrl ? 'file' : 'link');
  coverState = { data: x.coverData || '', path: x.cover || '' };
  drawCover();
  $('ed').hidden = false; document.body.classList.add('locked');
  F.querySelector('.ed-form-body').scrollTop = 0;
  setTimeout(() => E.title.focus(), 50);
}
const closeEditor = () => { $('ed').hidden = true; document.body.classList.remove('locked'); };
document.querySelectorAll('[data-ed-close]').forEach(b => b.addEventListener('click', closeEditor));
document.addEventListener('keydown', e => { if (e.key === 'Escape' && !$('ed').hidden) closeEditor(); });
$('addBtn').addEventListener('click', () => openEditor(null));

// 표지 그림: 시트 한 칸(5만 글자)에 들어가게 줄여서 저장
$('coverFile').addEventListener('change', async e => {
  const f = e.target.files[0]; if (!f) return;
  try {
    const img = await createImageBitmap(f);
    let w = 720, q = .8, data = '';
    do {
      const k = Math.min(1, w / img.width), c = document.createElement('canvas');
      c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
      const g = c.getContext('2d'); g.fillStyle = '#12161a'; g.fillRect(0, 0, c.width, c.height); g.drawImage(img, 0, 0, c.width, c.height);
      data = c.toDataURL('image/jpeg', q);
      if (q > .55) q -= .1; else w = Math.round(w * .8);
    } while (data.length > 45000 && w > 160);
    coverState = { data, path: '' };
    drawCover();
  } catch { toast('그림을 읽지 못했어요. JPG나 PNG로 다시 골라 주세요.', true); }
  e.target.value = '';
});
$('coverClear').addEventListener('click', () => { coverState = { data: '', path: '' }; drawCover(); });

// 저장
F.addEventListener('submit', async e => {
  e.preventDefault();
  const fail = m => { $('edErr').textContent = m; $('edErr').hidden = false; $('edErr').scrollIntoView({ block: 'center', behavior: 'smooth' }); };
  $('edErr').hidden = true;
  const src = [...E.src].find(r => r.checked)?.value;
  const id = E.id.value.trim();
  if (!E.title.value.trim()) return fail('제목을 적어 주세요.');
  if (!cur && !/^[a-z0-9][a-z0-9-]*$/.test(id)) return fail('공유 주소 이름은 영문 소문자·숫자·하이픈(-)만 쓸 수 있어요.');
  if (!cur && list.some(w => w.id === id)) return fail('같은 공유 주소 이름이 이미 있어요. 다른 이름을 적어 주세요.');

  let url, embed;
  if (src === 'file') { url = baseOf(cur.id).url; embed = baseOf(cur.id).embed !== false; }
  else {
    url = E.url.value.trim(); embed = E.embed.checked;
    if (!isExt(url)) return fail('https:// 로 시작하는 링크 주소를 넣어 주세요.');
  }
  if (!E.summary.value.trim()) return fail('한 줄 소개를 적어 주세요.');

  const files = lines(E.files.value).map(l => { const [name, ...r] = l.split('|'); return { name: name.trim(), url: r.join('|').trim() }; }).filter(f => f.name && f.url);
  const d = {
    title: E.title.value.trim(), kind: E.kind.value.trim(), subject: E.subject.value.trim(), audience: E.audience.value.trim(),
    summary: E.summary.value.trim(), desc: E.desc.value.trim(), uses: lines(E.uses.value),
    tags: E.tags.value.split(',').map(s => s.trim()).filter(Boolean),
    url, embed, cover: coverState.path, coverData: coverState.data, glyph: E.glyph.value.trim(), color: E.color.value,
    versions: E.versions.value === '' ? '' : +E.versions.value, updated: E.updated.value.trim(), blog: E.blog.value.trim(),
    files, featured: E.featured.checked
  };
  // 사이트 파일 작품은 원래와 달라진 것만 저장 (나중에 works.js를 고쳐도 반영되게)
  const b = cur && baseOf(cur.id);
  if (b) {
    const norm = x => JSON.stringify(x ?? '');
    for (const k of Object.keys(d)) {
      const bv = b[k] ?? (Array.isArray(d[k]) ? [] : k === 'embed' ? true : k === 'featured' ? false : '');
      if (norm(d[k]) === norm(bv)) d[k] = undefined;
    }
  }
  if (!cur) d.order = Math.min(0, ...list.map(w => w.order ?? 0)) - 10;   // 새 링크는 맨 앞에

  const btn = $('edSave'); btn.disabled = true; $('edStep').textContent = '저장하는 중…';
  try {
    await store.saveWork(cur ? cur.id : id, d);
    closeEditor(); toast('저장했어요 — 사이트에 바로 보여요');
    await reload();
  } catch (err) { fail(errMsg(err)); }
  finally { btn.disabled = false; $('edStep').textContent = ''; }
});
