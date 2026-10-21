/* The directory on the monitor: a keyboard-driven list with a live preview.
   Search, filter and sort are all prompt commands (see terminal.js). */
(function () {
  const DD = (window.DD = window.DD || {});
  const $ = (s) => document.querySelector(s);
  const esc = DD.esc;

  const FKEY = 'dd09.filters';
  let f = { q: '', status: 'ALL', cls: 'ALL', sort: 'oldest' };
  try { Object.assign(f, JSON.parse(sessionStorage.getItem(FKEY) || '{}')); } catch (e) {}
  const saveF = () => { try { sessionStorage.setItem(FKEY, JSON.stringify(f)); } catch (e) {} };

  DD.statusOf = (c) => (DD.store.isSolved(c.id) ? 'SOLVED' : c.status);
  const dots = (n) => '●'.repeat(n) + '○'.repeat(3 - n);
  const list = $('#dir-list'), prev = $('#dir-prev'), status = $('#dir-status');
  let rows = [], sel = 0;

  function matches(c) {
    if (f.status !== 'ALL' && DD.statusOf(c) !== f.status) return false;
    if (f.cls !== 'ALL' && c.cls !== f.cls) return false;
    const t = f.q.trim().toLowerCase();
    if (!t) return true;
    const hay = [c.id, c.id.replace('-', ''), c.title, c.desc, c.tagline, c.cls, c.keywords].join(' ').toLowerCase();
    return t.split(/\s+/).every((w) => hay.includes(w));
  }
  function sorted(arr) {
    const a = arr.slice();
    if (f.sort === 'newest') a.sort((x, y) => y.opened.localeCompare(x.opened));
    else if (f.sort === 'difficulty') a.sort((x, y) => x.difficulty - y.difficulty || x.id.localeCompare(y.id));
    else a.sort((x, y) => x.opened.localeCompare(y.opened));
    return a;
  }

  function rowHTML(c, i) {
    const st = DD.statusOf(c);
    return `<button type="button" role="option" class="d-row tone-${c.art}" data-id="${c.id}" data-i="${i}" aria-selected="${i === sel}" style="--i:${i}">
      <span class="d-id mono">${esc(c.id)}</span>
      <span class="d-title">${esc(c.title)}</span>
      <span class="d-cls mono">${esc(c.cls)}</span>
      <span class="d-st mono st-${st.toLowerCase()}"><i aria-hidden="true"></i>${st}</span>
    </button>`;
  }

  function previewHTML() {
    const c = rows[sel];
    if (!c) return '';
    const st = DD.statusOf(c);
    return `<div class="pv tone-${c.art}" key="${c.id}">
      <div class="pv-art" aria-hidden="true">${DD.art[c.art]()}</div>
      <p class="pv-kick mono"><span>${esc(c.id)}</span><span>${esc(c.cls)}</span><span class="st st-${st.toLowerCase()}"><i></i>${st}</span></p>
      <h2 class="pv-title">${esc(c.title)}</h2>
      <p class="pv-tag">${esc(c.tagline)}</p>
      <dl class="pv-facts mono"><div><dt>EVIDENCE</dt><dd>${c.evidence}</dd></div><div><dt>TIME</dt><dd>~${c.minutes} MIN</dd></div><div><dt>DIFFICULTY</dt><dd>${dots(c.difficulty)}</dd></div></dl>
      <p class="pv-go mono">${c.playable ? 'ENTER ↵ TO OPEN' : 'ENTER ↵ TO VIEW (SEALED)'}</p>
    </div>`;
  }

  function render() {
    rows = sorted(DD.cases.filter(matches));
    sel = Math.max(0, Math.min(sel, rows.length - 1));
    if (!rows.length) {
      list.innerHTML = `<div class="d-empty"><p class="mono">NO FILE MATCHES ${f.q ? '“' + esc(f.q) + '”' : 'THESE FILTERS'}</p><p>Nothing in the archive fits those terms. Some things are filed under names you haven’t learned yet.</p><button type="button" class="btn btn-small" data-clear>CLEAR FILTERS</button></div>`;
    } else {
      list.innerHTML = rows.map(rowHTML).join('');
    }
    prev.innerHTML = previewHTML();
    const bits = [`FILES ${String(rows.length).padStart(2, '0')}/${String(DD.cases.length).padStart(2, '0')}`, `FILTER ${f.cls !== 'ALL' ? f.cls : f.status}`, `SORT ${f.sort.toUpperCase()}`];
    if (f.q) bits.push(`SEARCH “${f.q}”`);
    status.textContent = bits.join(' · ');
    saveF();
  }

  function select(i, scroll) {
    if (!rows.length) return;
    sel = (i + rows.length) % rows.length;
    list.querySelectorAll('.d-row').forEach((b, k) => b.setAttribute('aria-selected', String(k === sel)));
    prev.innerHTML = previewHTML();
    const el = list.children[sel];
    if (scroll && el && el.scrollIntoView) el.scrollIntoView({ block: 'nearest' });
  }

  DD.dir = {
    state: () => f,
    render,
    move: (d) => select(sel + d, true),
    selected: () => rows[sel],
    openSelected() { const c = rows[sel]; if (c) { DD.audio.open(); location.hash = '#/case/' + c.id.toLowerCase(); } },
    select(id) { const i = rows.findIndex((c) => c.id === id); if (i >= 0) select(i, true); },
    setQuery(q) { f.q = q; sel = 0; render(); },
    setStatus(v) { f.status = v; f.cls = 'ALL'; sel = 0; render(); },
    setClass(v) { f.cls = v; f.status = 'ALL'; sel = 0; render(); },
    setSort(v) { f.sort = v; sel = 0; render(); },
    clear() { f = { q: '', status: 'ALL', cls: 'ALL', sort: f.sort }; sel = 0; render(); }
  };
  DD.archive = {
    random() {
      const pool = DD.cases.filter((c) => c.playable && !DD.store.isSolved(c.id));
      const from = pool.length ? pool : DD.cases;
      return from[Math.floor(Math.random() * from.length)];
    }
  };

  list.addEventListener('click', (e) => {
    if (e.target.closest('[data-clear]')) { DD.dir.clear(); return; }
    const b = e.target.closest('.d-row'); if (!b) return;
    select(+b.dataset.i); DD.dir.openSelected();
  });
  list.addEventListener('mousemove', (e) => { const b = e.target.closest('.d-row'); if (b && +b.dataset.i !== sel) select(+b.dataset.i); });
  document.addEventListener('dd:progress', render);
  render();
})();
