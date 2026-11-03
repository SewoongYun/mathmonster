// MATH LAB 편집실 저장소 (구글 시트 + Apps Script)
// 편집실(edit.html)의 '처음 설정' 안내에 따라 Apps Script 편집기에 통째로 붙여 넣으세요.
// 비밀번호를 바꾸면: 저장 → 배포 → 배포 관리 → 연필 → 버전 '새 버전' → 배포

const PASSWORD = '__PASSWORD__';

// 시트 'works' : 한 줄 = 작품 하나 (data 칸이 실제 내용, 나머지는 보기 편하라고 같이 적음)
// 시트 'site'  : 사이트 이름·소개
const COLS = ['id', 'title', 'url', 'hidden', 'order', 'data', 'cover', 'updatedAt'];

function sheet_(name, cols) {
  const ss = SpreadsheetApp.getActive();
  let sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.getRange('A:A').setNumberFormat('@');
    sh.appendRow(cols);
    sh.setFrozenRows(1);
  }
  return sh;
}
const json_ = s => { try { return JSON.parse(s || '{}'); } catch (e) { return {}; } };
const text_ = s => /^[=+\-@]/.test(String(s)) ? "'" + s : String(s);   // 수식으로 바뀌지 않게
const out_ = o => ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);

function readAll_() {
  const works = {};
  const rows = sheet_('works', COLS).getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (!r[0]) continue;
    const d = json_(r[5]);
    if (r[6]) d.coverData = r[6];
    works[String(r[0])] = d;
  }
  let site = {};
  const sr = sheet_('site', ['key', 'data']).getDataRange().getValues();
  for (let i = 1; i < sr.length; i++) if (sr[i][0] === 'main') site = json_(sr[i][1]);
  return { works: works, site: site };
}

function findRow_(sh, id) {
  const n = sh.getLastRow();
  if (n < 2) return 0;
  const ids = sh.getRange(2, 1, n - 1, 1).getValues();
  for (let i = 0; i < ids.length; i++) if (String(ids[i][0]) === id) return i + 2;
  return 0;
}

function setWork_(id, patch, del) {
  if (!/^[a-z0-9][a-z0-9-]*$/.test(id)) throw new Error('bad-id');
  const sh = sheet_('works', COLS);
  const row = findRow_(sh, id);
  let d = {};
  if (row) {
    d = json_(sh.getRange(row, 6).getValue());
    const c = sh.getRange(row, 7).getValue();
    if (c) d.coverData = c;
  }
  Object.assign(d, patch);
  (del || []).forEach(k => { delete d[k]; });
  const cover = d.coverData || '';
  delete d.coverData;
  const vals = [id, text_(d.title || ''), text_(d.url || ''), d.hidden ? 'TRUE' : '', d.order == null ? '' : d.order, JSON.stringify(d), cover, new Date()];
  if (row) sh.getRange(row, 1, 1, vals.length).setValues([vals]);
  else sh.appendRow(vals);
}

// 누구나: 목록 읽기
function doGet() {
  return out_(readAll_());
}

// 비밀번호를 아는 사람만: 저장
function doPost(e) {
  let b;
  try { b = JSON.parse(e.postData.contents); } catch (err) { return out_({ ok: false, error: 'bad-request' }); }
  const cache = CacheService.getScriptCache();
  const fails = Number(cache.get('fails') || 0);
  if (fails >= 10) return out_({ ok: false, error: 'too-many-requests' });
  if (b.pw !== PASSWORD || PASSWORD === '__PASSWORD__') {
    cache.put('fails', String(fails + 1), 600);
    return out_({ ok: false, error: 'wrong-password' });
  }
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    if (b.action === 'check') return out_({ ok: true });
    if (b.action === 'setWork') { setWork_(b.id, b.data || {}, b.del); return out_({ ok: true }); }
    if (b.action === 'delWork') {
      const sh = sheet_('works', COLS), row = findRow_(sh, b.id);
      if (row) sh.deleteRow(row);
      return out_({ ok: true });
    }
    if (b.action === 'order') { (b.list || []).forEach(x => setWork_(x[0], { order: x[1] }, [])); return out_({ ok: true }); }
    if (b.action === 'setSite') {
      const sh = sheet_('site', ['key', 'data']), row = findRow_(sh, 'main');
      const d = Object.assign(row ? json_(sh.getRange(row, 2).getValue()) : {}, b.data || {});
      if (row) sh.getRange(row, 2).setValue(JSON.stringify(d)); else sh.appendRow(['main', JSON.stringify(d)]);
      return out_({ ok: true });
    }
    return out_({ ok: false, error: 'unknown-action' });
  } catch (err) {
    return out_({ ok: false, error: String(err.message || err) });
  } finally {
    lock.releaseLock();
  }
}
