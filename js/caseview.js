/* Case overlay: evidence, investigation bench (3 puzzle mechanics), conclusion. */
(function () {
  const DD = (window.DD = window.DD || {});
  const esc = DD.esc;
  const root = document.getElementById('caseview');
  const scroller = document.getElementById('cv-scroll');
  const $ = (s, r) => (r || scroller).querySelector(s);
  const $$ = (s, r) => [...(r || scroller).querySelectorAll(s)];
  const INERT = ['#stage', '#crt'];
  let current = null, lastFocus = null;

  const stLabel = (c) => DD.statusOf(c);
  const dots = (n) => '●'.repeat(n) + '○'.repeat(3 - n);
  const pad = (n) => String(n).padStart(2, '0');

  /* ---------- sections ---------- */
  function topbar(c) {
    const idx = DD.cases.indexOf(c);
    const pips = DD.cases.map((x) => `<i class="${x.id === c.id ? 'cur' : ''} ${DD.store.isSolved(x.id) ? 'done' : ''}"></i>`).join('');
    return `<div class="cv-top"><div class="cv-top-in">
      <button type="button" class="back mono" data-act="back"><span aria-hidden="true">←</span> CLOSE FILE</button>
      <span class="mono cv-pos">FILE ${pad(idx + 1)} / ${pad(DD.cases.length)}</span>
      <span class="pips" aria-hidden="true">${pips}</span>
      <button type="button" class="x" data-act="back" aria-label="Close case and return to the archive"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 4l12 12M16 4L4 16"/></svg></button>
    </div></div>`;
  }

  function header(c) {
    const st = stLabel(c);
    return `<header class="cv-head">
      <p class="mono cv-kick"><span>${esc(c.id)}</span><span>${esc(c.cls)}</span><span class="st st-${st.toLowerCase()}"><i aria-hidden="true"></i>${st}</span></p>
      <h1 id="cv-title" class="cv-title">${esc(c.title)}</h1>
      <p class="cv-tag">${esc(c.tagline)}</p>
      <dl class="cv-facts mono">
        <div><dt>EVIDENCE</dt><dd>${c.evidence}</dd></div>
        <div><dt>EST. TIME</dt><dd>~${c.minutes} MIN</dd></div>
        <div><dt>DIFFICULTY</dt><dd>${dots(c.difficulty)}</dd></div>
        ${c.meta.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}
      </dl>
    </header>`;
  }

  function brief(c) {
    const tl = c.timeline ? `<ol class="tl-list">${c.timeline.map(([t, x]) => `<li><span class="mono">${esc(t)}</span><p>${esc(x)}</p></li>`).join('')}</ol>` : '';
    return `<section class="cv-brief">
      <div><h2 class="mono sec">OVERVIEW</h2><p class="lead">${esc(c.overview)}</p>
        ${c.objective ? `<div class="objective"><span class="mono">OBJECTIVE</span><p>${esc(c.objective)}</p></div>` : ''}
      </div>
      ${tl ? `<div><h2 class="mono sec">TIMELINE</h2>${tl}</div>` : ''}
    </section>`;
  }

  function evidence(c, fresh) {
    if (!c.artifacts) {
      return `<section class="cv-evidence"><h2 class="mono sec">EVIDENCE · 1 OF ${c.evidence} RELEASED</h2>
        <div class="artifacts"><article class="artifact paper" style="--span:7"><header class="mono"><span>EX-1</span><span>${esc(c.teaserTitle)}</span></header>${c.teaser()}</article>
        <article class="artifact sealed-card" style="--span:5"><p class="mono">${c.evidence - 1} ITEMS SEALED</p><span>${esc(c.lockedNote)}</span></article></div></section>`;
    }
    const solved = DD.store.isSolved(c.id);
    const shown = c.artifacts.filter((a) => !a.sealed || solved).length;
    const cards = c.artifacts.map((a) => {
      const locked = a.sealed && !solved;
      const isFresh = fresh && a.sealed;
      if (locked) return `<article class="artifact sealed-card" style="--span:${a.span}"><p class="mono">${esc(a.id)} · SEALED</p><span>Release this item by closing the case.</span></article>`;
      return `<article class="artifact ${a.tone === 'paper' ? 'paper' : ''} ${isFresh ? 'fresh' : ''}" style="--span:${a.span}">
        <header class="mono"><span>${esc(a.id)} · ${esc(a.kind)}</span><span>${esc(a.title)}</span></header>${a.html()}</article>`;
    }).join('');
    return `<section class="cv-evidence"><h2 class="mono sec">EVIDENCE · ${shown} OF ${c.artifacts.length} RELEASED</h2><div class="artifacts">${cards}</div></section>`;
  }

  /* ---------- bench ---------- */
  function bench(c, fresh) {
    if (!c.puzzle) {
      const nxt = DD.cases.find((x) => x.playable && !DD.store.isSolved(x.id));
      return `<section class="bench sealed-bench"><h2 class="mono sec">INVESTIGATION BENCH</h2>
        <div class="sealed-msg"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="11" width="14" height="9"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>
        <div><h3>This file is sealed.</h3><p>${esc(c.lockedNote)} Meanwhile, other files are open.</p>
        ${nxt ? `<a class="btn btn-small" href="#/case/${nxt.id.toLowerCase()}">OPEN ${esc(nxt.id)} →</a>` : `<a class="btn btn-small" href="#/desk">BACK TO THE DESK</a>`}</div></div></section>`;
    }
    const p = c.puzzle, solved = DD.store.isSolved(c.id);
    let body = '';
    if (p.type === 'cipher') body = cipherBench(c, p, solved);
    if (p.type === 'sequence') body = sequenceBench(c, p, solved);
    if (p.type === 'flag') body = flagBench(c, p, solved);
    const banner = solved ? `<div class="solved-banner ${fresh ? 'fresh' : ''}" role="status"><span class="ring" aria-hidden="true"></span><div><b class="mono">CASE CLOSED</b><span class="mono">FRAGMENT RECOVERED · ${esc(DD.FRAGMENTS[c.id])}</span></div></div>` : '';
    return `<section class="bench" id="bench"><h2 class="mono sec">INVESTIGATION BENCH · ${p.type === 'cipher' ? 'DECODER' : p.type === 'sequence' ? 'FRAME SEQUENCER' : 'LOG COMPARATOR'}</h2>
      ${banner}<p class="bench-q">${esc(p.prompt)}</p>${body}
      <p class="feedback" id="fb" role="status" aria-live="polite"></p>
      ${hintsBlock(c)}</section>`;
  }

  function hintsBlock(c) {
    const lvl = DD.store.hintLevel(c.id), solved = DD.store.isSolved(c.id);
    const shown = c.hints.slice(0, lvl).map((h, i) => `<li><span class="mono">HINT ${i + 1}</span>${esc(h)}</li>`).join('');
    const btn = !solved && lvl < c.hints.length ? `<button type="button" class="btn btn-small" data-act="hint">${lvl ? 'ANOTHER HINT' : 'REVEAL A HINT'} <span class="mono">(${lvl}/${c.hints.length})</span></button>` : '';
    return `<div class="hints" id="hints">${btn}<ol>${shown}</ol></div>`;
  }

  /* cipher */
  function cipherBench(c, p, solved) {
    const A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    return `<div class="decoder">
      <div class="dec-block"><span class="mono lbl">INTERCEPT</span><div class="dec-text mono cipher">${esc(p.cipher)}</div></div>
      <div class="dec-ctl">
        <button type="button" class="step" data-act="shift-dn" aria-label="Decrease shift">−</button>
        <input type="range" id="shift" min="0" max="25" value="${solved ? 3 : 0}" aria-label="Shift each letter back by">
        <button type="button" class="step" data-act="shift-up" aria-label="Increase shift">+</button>
        <output class="mono" id="shift-out" for="shift">SHIFT BACK 00</output>
      </div>
      <div class="alpha mono" aria-hidden="true"><div class="row top">${[...A].map((l) => `<span>${l}</span>`).join('')}</div><div class="row map" id="alpha-map"></div></div>
      <div class="dec-block"><span class="mono lbl">OUTPUT</span><div class="dec-text mono" id="dec-out" aria-live="polite"></div></div>
    </div>
    ${solved ? '' : `<form class="answer" id="answer" autocomplete="off"><label class="mono" for="ans">${esc(p.label)}</label><input id="ans" type="text" placeholder="${esc(p.placeholder)}" spellcheck="false" autocapitalize="off"><button class="btn btn-primary" type="submit">SUBMIT ↗</button></form>`}`;
  }
  function wireCipher(c, p) {
    const A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const range = $('#shift'), out = $('#dec-out'), map = $('#alpha-map'), lab = $('#shift-out');
    const upd = () => {
      const n = +range.value;
      out.textContent = DD.caesar(p.cipher, -n);
      out.classList.toggle('plain', n === 3);
      map.innerHTML = [...A].map((l) => `<span>${DD.caesar(l, -n)}</span>`).join('');
      lab.textContent = 'SHIFT BACK ' + pad(n);
    };
    range.addEventListener('input', upd);
    scroller.addEventListener('click', (e) => {
      const b = e.target.closest('[data-act]'); if (!b) return;
      if (b.dataset.act === 'shift-up') { range.value = Math.min(25, +range.value + 1); upd(); }
      if (b.dataset.act === 'shift-dn') { range.value = Math.max(0, +range.value - 1); upd(); }
    }, { signal: viewAbort.signal });
    upd();
    const form = $('#answer');
    if (form) form.addEventListener('submit', (e) => {
      e.preventDefault();
      const v = $('#ans').value.trim();
      if (!v) return feedback('Enter an answer first.', 'warn');
      if (p.accept.test(v)) return solve(c);
      if (p.near.test(v)) return feedback('Close, but not quite. Check the number in the decoded message again.', 'warn');
      feedback('That doesn’t match the message. Decode it fully, then read it slowly: it names a place.', 'warn');
    });
  }

  /* sequence */
  function sequenceBench(c, p, solved) {
    return `<ol class="seq" id="seq"></ol>
      ${solved ? '' : '<div class="answer-row"><button class="btn btn-primary" type="button" data-act="test-seq">TEST SEQUENCE ↗</button></div>'}`;
  }
  function wireSequence(c, p) {
    const correct = p.frames.map((f) => f.id);
    const byId = Object.fromEntries(p.frames.map((f) => [f.id, f]));
    let order = DD.store.isSolved(c.id) ? correct.slice() : p.initial.slice();
    const solved = DD.store.isSolved(c.id);
    const ol = $('#seq');
    function draw(focusKey) {
      ol.innerHTML = order.map((id, i) => `<li class="seq-item" data-id="${id}">
        <div class="seq-head mono"><span>SLOT ${i + 1}</span><span>${i === 0 ? 'EARLIEST' : i === order.length - 1 ? 'LATEST' : ''}</span></div>
        ${DD.frameSVG(byId[id], id)}
        ${solved ? '' : `<div class="seq-ctl"><button type="button" class="mv" data-mv="-1" data-id="${id}" aria-label="Move ${id} earlier" ${i === 0 ? 'disabled' : ''}>◀ EARLIER</button><button type="button" class="mv" data-mv="1" data-id="${id}" aria-label="Move ${id} later" ${i === order.length - 1 ? 'disabled' : ''}>LATER ▶</button></div>`}
      </li>`).join('');
      if (focusKey) { const b = ol.querySelector(`[data-id="${focusKey.id}"][data-mv="${focusKey.mv}"]:not([disabled])`) || ol.querySelector(`[data-id="${focusKey.id}"][data-mv]:not([disabled])`); if (b) b.focus(); }
    }
    draw();
    scroller.addEventListener('click', (e) => {
      const m = e.target.closest('.mv');
      if (m) {
        const id = m.dataset.id, mv = +m.dataset.mv, i = order.indexOf(id), j = i + mv;
        if (j < 0 || j >= order.length) return;
        [order[i], order[j]] = [order[j], order[i]];
        draw({ id, mv: m.dataset.mv });
        feedback('');
      }
      if (e.target.closest('[data-act="test-seq"]')) {
        if (order.join() === correct.join()) return solve(c);
        for (let i = 0; i < order.length - 1; i++) {
          if (byId[order[i]].candle < byId[order[i + 1]].candle) {
            return feedback(`Slots ${i + 1} and ${i + 2} can’t both be right. Something in that pair runs against time.`, 'warn');
          }
        }
        feedback('The sequence is rejected. Something runs against time.', 'warn');
      }
    }, { signal: viewAbort.signal });
  }

  /* flag */
  function flagBench(c, p, solved) {
    const lvl = DD.store.hintLevel(c.id);
    const showD = solved || lvl >= 2;
    const row = (r) => `<tr class="${solved && r.anomaly ? 'is-anom' : ''}" data-key="${r.key}">
      <td><button type="button" class="flagbtn mono" data-flag="${r.key}" aria-pressed="${solved && r.anomaly}" ${solved ? 'disabled' : ''} aria-label="Flag ${r.sys} sequence ${r.seq}">${solved && r.anomaly ? '⚑' : '○'}</button></td>
      <td>${r.sys}</td><td>${String(r.seq).padStart(4, '0')}</td><td>${r.t}</td><td class="ev">${esc(r.ev)}</td>
      ${showD ? `<td class="d">${r.dseq == null ? '—' : '+' + r.dseq}</td><td class="d">${r.dt == null ? '—' : '+' + r.dt + 's'}</td>` : ''}</tr>`;
    return `<div class="tablewrap"><table class="logtable mono" id="logtable"><thead><tr><th>FLAG</th><th>SYSTEM</th><th>SEQ</th><th>TIME</th><th>EVENT</th>${showD ? '<th>Δ SEQ</th><th>Δ TIME</th>' : ''}</tr></thead><tbody>${p.rows.map(row).join('')}</tbody></table></div>
      ${solved ? '' : `<div class="answer-row"><span class="mono flagcount" id="flagcount">0 FLAGGED</span><button class="btn btn-primary" type="button" data-act="submit-flags">SUBMIT FLAGGED ENTRIES ↗</button></div>`}`;
  }
  function wireFlag(c, p) {
    if (DD.store.isSolved(c.id)) return;
    const flagged = new Set();
    scroller.addEventListener('click', (e) => {
      const b = e.target.closest('[data-flag]');
      if (b) {
        const k = b.dataset.flag;
        flagged.has(k) ? flagged.delete(k) : flagged.add(k);
        const on = flagged.has(k);
        b.setAttribute('aria-pressed', on); b.textContent = on ? '⚑' : '○';
        b.closest('tr').classList.toggle('is-flag', on);
        $('#flagcount').textContent = `${flagged.size} FLAGGED`;
        feedback('');
      }
      if (e.target.closest('[data-act="submit-flags"]')) {
        if (!flagged.size) return feedback('Nothing flagged yet. Select the entries you believe are anomalous.', 'warn');
        const wrong = p.rows.filter((r) => flagged.has(r.key) && !r.anomaly);
        const missing = p.rows.filter((r) => r.anomaly && !flagged.has(r.key));
        if (!wrong.length && !missing.length) return solve(c);
        if (wrong.length) return feedback(`${wrong[0].sys} #${wrong[0].seq} doesn’t belong. Its counter and its clock tell a consistent story. Re-check it.`, 'warn');
        feedback(`Good instincts, but ${missing.length === 1 ? 'one anomalous entry is' : 'more anomalous entries are'} still unflagged.`, 'warn');
      }
    }, { signal: viewAbort.signal });
  }

  /* ---------- conclusion & footer ---------- */
  function conclusion(c, fresh) {
    if (!c.puzzle) return '';
    if (!DD.store.isSolved(c.id)) {
      return `<section class="conclusion locked" id="conclusion"><h2 class="mono sec">CONCLUSION</h2><div class="lock-line mono"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="11" width="14" height="9"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>LOCKED — SOLVE THE CASE TO READ IT</div></section>`;
    }
    const all = DD.cases.filter((x) => x.playable).every((x) => DD.store.isSolved(x.id));
    return `<section class="conclusion ${fresh ? 'fresh' : ''}" id="conclusion"><h2 class="mono sec">CONCLUSION</h2>
      <p class="conc-text">${esc(c.conclusion)}</p>
      <p class="mono frag-line">FRAGMENT <b>${esc(DD.FRAGMENTS[c.id])}</b> ADDED TO YOUR LEDGER</p>
      ${all ? '<p class="conc-final">Three files closed. The fragments never belonged to the cases. They belong to each other.</p>' : ''}</section>`;
  }

  function footer(c) {
    const solved = DD.store.isSolved(c.id);
    const nxt = c.next && DD.byId(c.next);
    const open = DD.cases.find((x) => x.playable && !DD.store.isSolved(x.id) && x.id !== c.id);
    let primary = '';
    if (c.puzzle && solved && nxt) primary = `<a class="btn btn-primary" href="#/case/${nxt.id.toLowerCase()}">NEXT FILE: ${esc(nxt.id)} ↗</a>`;
    else if (c.puzzle && solved && open) primary = `<a class="btn btn-primary" href="#/case/${open.id.toLowerCase()}">OPEN ${esc(open.id)} ↗</a>`;
    return `<footer class="cv-foot">${primary}<button type="button" class="btn btn-ghost" data-act="back">BACK TO THE DESK</button></footer>`;
  }

  /* ---------- lifecycle ---------- */
  let viewAbort = new AbortController();

  function feedback(msg, kind) {
    const el = $('#fb'); if (!el) return;
    el.textContent = msg; el.className = 'feedback' + (kind ? ' ' + kind : '');
    if (msg && !DD.reducedMotion()) { el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); }
  }

  function solve(c) {
    DD.store.solve(c.id);
    const y = scroller.scrollTop;
    render(c, true);
    scroller.scrollTop = y;
    DD.audio.solved();
    DD.toast('CASE CLOSED', `${c.id} · Fragment recovered: ${DD.FRAGMENTS[c.id]}`);
    const target = $('#conclusion');
    if (target) setTimeout(() => target.scrollIntoView({ behavior: DD.reducedMotion() ? 'auto' : 'smooth', block: 'center' }), 650);
    const done = DD.cases.filter((x) => x.playable).every((x) => DD.store.isSolved(x.id));
    if (done) setTimeout(() => DD.toast('LEDGER UPDATED', 'All fragments recovered. They form a phrase.'), 1800);
  }

  function render(c, fresh) {
    viewAbort.abort(); viewAbort = new AbortController();
    scroller.innerHTML = topbar(c) + `<article class="cv wrap">${header(c)}${brief(c)}${evidence(c, fresh)}${bench(c, fresh)}${conclusion(c, fresh)}${footer(c)}</article>`;
    if (c.puzzle) {
      if (c.puzzle.type === 'cipher') wireCipher(c, c.puzzle);
      if (c.puzzle.type === 'sequence') wireSequence(c, c.puzzle);
      if (c.puzzle.type === 'flag') wireFlag(c, c.puzzle);
    }
    scroller.addEventListener('click', (e) => {
      const b = e.target.closest('[data-act]'); if (!b) return;
      if (b.dataset.act === 'back') DD.caseView.close();
      if (b.dataset.act === 'hint') {
        DD.store.useHint(c.id);
        const y = scroller.scrollTop;
        const keepFlags = c.puzzle.type === 'flag' ? $$('.flagbtn[aria-pressed="true"]').map((x) => x.dataset.flag) : null;
        const ans = $('#ans') ? $('#ans').value : '';
        const shift = $('#shift') ? $('#shift').value : null;
        render(c, false);
        scroller.scrollTop = y;
        if (keepFlags) keepFlags.forEach((k) => { const x = $(`[data-flag="${k}"]`); if (x) x.click(); });
        if ($('#ans')) $('#ans').value = ans;
        if (shift !== null && $('#shift')) { $('#shift').value = shift; $('#shift').dispatchEvent(new Event('input')); }
        const h = $$('#hints li').pop(); if (h) h.classList.add('fresh');
        const nb = $('[data-act="hint"]'); if (nb) nb.focus();
      }
    }, { signal: viewAbort.signal });
  }

  DD.caseView = {
    get current() { return current; },
    get isOpen() { return !root.hidden; },
    open(id) {
      const c = DD.byId(id);
      if (!c) return false;
      if (root.hidden) lastFocus = document.activeElement;
      current = c;
      render(c, false);
      root.hidden = false;
      INERT.forEach((s) => { const el = document.querySelector(s); if (el) el.inert = true; });
      document.documentElement.classList.add('lock');
      scroller.scrollTop = 0;
      requestAnimationFrame(() => { root.classList.add('is-open'); scroller.focus({ preventScroll: true }); });
      return true;
    },
    close() {
      if (root.hidden) return;
      // Prefer history so the browser Back button and our button agree.
      if (/^#\/case\//.test(location.hash)) {
        if (DD.caseView._pushed) { DD.caseView._pushed = false; history.back(); return; }
        location.hash = '#/desk'; return;
      }
      DD.caseView.hide();
    },
    hide() {
      if (root.hidden) return;
      root.classList.remove('is-open');
      root.hidden = true;
      INERT.forEach((s) => { const el = document.querySelector(s); if (el) el.inert = false; });
      document.documentElement.classList.remove('lock');
      if (DD.terminal) DD.terminal.focus();
      current = null;
    }
  };

  /* Esc closes; Tab stays inside the overlay. */
  root.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { e.preventDefault(); DD.caseView.close(); }
    if (e.key === 'Tab') {
      const f = $$('a[href],button:not([disabled]),input,select,textarea,[tabindex="0"]', root).filter((el) => el.offsetParent !== null);
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && (document.activeElement === first || document.activeElement === scroller)) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
})();
