// 구글 시트 저장소 연결 — 보통 고칠 필요 없음.
// 연결 주소는 data/sheet-config.js 에, 시트 쪽 코드는 apps-script/Code.gs 에 있습니다.
//
// 저장 구조 (구글 시트)
//   works 시트  한 줄 = 작품 하나. works.js에 있는 작품과 id가 같으면 그 작품을 고친 내용으로 덮어씀
//   site 시트   사이트 이름·소개 (works.js의 SITE를 덮어씀)

const local = /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
const mock = () => { try { return local && localStorage.getItem('lab-mock') === '1'; } catch { return false; } };
const api = () => (window.SHEET_API || '').trim();
export const enabled = () => mock() || /^https:\/\/script\.google\.com\//.test(api());
export const isMock = mock;

const PW_KEY = 'lab-pw';
const getPw = () => { try { return sessionStorage.getItem(PW_KEY) || ''; } catch { return ''; } };
const setPw = v => { try { v ? sessionStorage.setItem(PW_KEY, v) : sessionStorage.removeItem(PW_KEY); } catch {} };
const fail = code => Object.assign(new Error(code), { code });

// ── 시트와 주고받기
async function read() {
  if (mock()) return mockDb().read();
  const r = await fetch(api(), { cache: 'no-store' });
  if (!r.ok) throw fail('network');
  return r.json();
}
async function write(action, payload, pw = getPw()) {
  if (mock()) return mockDb().write(action, payload, pw);
  let r;
  try {
    // text/plain 으로 보내야 구글 서버가 다른 사이트의 요청을 막지 않음
    r = await fetch(api(), { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action, pw, ...payload }) });
  } catch { throw fail('network'); }
  let j; try { j = await r.json(); } catch { throw fail('bad-response'); }
  if (!j.ok) throw fail(j.error || 'unknown');
  return j;
}

// 컴퓨터에서 시험할 때만 쓰는 가짜 시트 (localhost + localStorage 'lab-mock' = '1')
function mockDb() {
  const KEY = 'lab-mock-db';
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || { works: {}, site: {} }; } catch { return { works: {}, site: {} }; } };
  const save = s => localStorage.setItem(KEY, JSON.stringify(s));
  return {
    async read() { return load(); },
    async write(action, p, pw) {
      if (pw !== 'test1234') throw fail('wrong-password');
      const s = load();
      if (action === 'setWork') { const d = { ...(s.works[p.id] || {}), ...p.data }; (p.del || []).forEach(k => delete d[k]); s.works[p.id] = d; }
      if (action === 'delWork') delete s.works[p.id];
      if (action === 'order') p.list.forEach(([id, order]) => { s.works[id] = { ...(s.works[id] || {}), order }; });
      if (action === 'setSite') s.site = { ...s.site, ...p.data };
      save(s); return { ok: true };
    }
  };
}

// ── 공개 함수
export async function loadRemote() {
  const j = await read();
  return { works: j.works || {}, site: j.site || {} };
}

// works.js 목록 + 시트 내용 합치기
export function mergeWorks(base, remote, includeHidden = false) {
  const out = [], seen = new Set();
  base.forEach((b, i) => {
    const r = remote[b.id]; seen.add(b.id);
    const changed = !!r && Object.keys(r).some(k => k !== 'order' && k !== 'updatedAt');
    out.push({ order: i * 10, ...b, ...(r || {}), id: b.id, origin: 'file', changed });
  });
  for (const [id, r] of Object.entries(remote)) {
    if (seen.has(id) || !r.title) continue;
    out.push({ order: 1e6, ...r, id, origin: 'sheet', changed: false });
  }
  out.sort((x, y) => (x.order ?? 0) - (y.order ?? 0));
  return includeHidden ? out : out.filter(w => !w.hidden);
}

// 작품 저장. 값이 undefined 인 항목은 시트에서 지움
export async function saveWork(id, data) {
  const d = {}, del = [];
  for (const [k, v] of Object.entries({ ...data, updatedAt: Date.now() })) v === undefined ? del.push(k) : (d[k] = v);
  await write('setWork', { id, data: d, del });
}
export const removeWork = id => write('delWork', { id });
export const saveSite = data => write('setSite', { data });
export const saveOrder = list => write('order', { list });

// 로그인: 비밀번호가 맞는지 시트에 물어보고, 이 탭을 닫을 때까지 기억
export const auth = {
  async signIn(pw) { await write('check', {}, pw); setPw(pw); },
  signOut() { setPw(''); },
  signedIn: () => !!getPw()
};
