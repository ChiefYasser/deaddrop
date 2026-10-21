/* Wiring: video, secrets, routing. */
(function () {
  const DD = (window.DD = window.DD || {});
  const $ = (s, r) => (r || document).querySelector(s);
  const pad = (n) => String(n).padStart(2, '0');
  const reduced = DD.reducedMotion();

  /* ---------- the room (video) ---------- */
  const video = $('#room-video'), room = $('#room');
  video.muted = true;
  if (reduced) { video.pause(); video.removeAttribute('autoplay'); }
  const fail = () => room.classList.add('is-fallback');
  video.addEventListener('error', fail);
  const srcEl = video.querySelector('source');
  if (srcEl) srcEl.addEventListener('error', fail);
  document.addEventListener('visibilitychange', () => { if (!reduced) document.hidden ? video.pause() : video.play().catch(() => {}); });

  /* ---------- document overlay (secrets + hidden route) ---------- */
  const docView = $('#docview'), docCard = $('#doc-card');
  let docReturn = null;
  const lock = () => document.documentElement.classList.toggle('lock', !docView.hidden || DD.caseView.isOpen);
  DD.showDoc = function (html, opts) {
    opts = opts || {};
    docReturn = document.activeElement;
    docCard.innerHTML = html + '<button type="button" class="btn btn-small doc-close" data-close>CLOSE</button>';
    docView.hidden = false;
    requestAnimationFrame(() => docView.classList.add('is-open'));
    docCard.querySelector('[data-close]').focus();
    docView._onClose = opts.onClose;
  };
  function hideDoc() {
    if (docView.hidden) return;
    docView.classList.remove('is-open');
    docView.hidden = true;
    const cb = docView._onClose; docView._onClose = null;
    const back = DD.caseView.isOpen ? null : (DD.terminal.focus(), true);
    if (!back && docReturn && docReturn.focus) docReturn.focus({ preventScroll: true });
    if (cb) cb();
  }
  docView.addEventListener('click', (e) => { if (e.target === docView || e.target.closest('[data-close]')) hideDoc(); });
  docView.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') hideDoc();
    if (e.key === 'Tab') { e.preventDefault(); docCard.querySelector('[data-close]').focus(); }
  });
  DD.discover = (title, text) => DD.toast('DISCOVERY ' + pad(DD.store.secretCount()), title + ' — ' + text);

  /* ---------- secret 1: knock on the 09 (cold open or monitor) ---------- */
  let knocks = 0, knockT = 0;
  document.querySelectorAll('#wm-09, #wm-09-b').forEach((el) => el.addEventListener('click', (e) => {
    e.preventDefault(); e.stopPropagation();
    const now = Date.now();
    knocks = now - knockT > 2500 ? 1 : knocks + 1;
    knockT = now;
    el.classList.remove('knock'); void el.offsetWidth; el.classList.add('knock');
    DD.audio.tick();
    if (knocks >= 9) {
      knocks = 0;
      const first = DD.store.secret('knock');
      DD.showDoc(`<div class="doc-head mono"><span>DROP 00 / THE FIRST ENTRY</span><span class="stamp">NO CASE NUMBER</span></div>
        <h2>Someone is still leaving these.</h2>
        <p>This is the oldest entry in the archive and the only one without a case number. Nobody remembers filing it. It reads:</p>
        <p class="quote">“I leave them where they’ll be found. Not for everyone. For whoever knocks.”</p>
        <p class="small mono">Below, in smaller print: <i>some files are lit by a word. Say it to the machine.</i></p>`);
      if (first) DD.discover('A knock answered', 'The wordmark was a door.');
    }
  }));

  /* ---------- secret 2: the name, said to the machine ---------- */
  const mask = $('#lantern-mask');
  let lanternOn = false;
  const setLantern = (on) => {
    lanternOn = on; document.body.classList.toggle('lantern', on);
    if (on) { mask.style.setProperty('--mx', innerWidth / 2 + 'px'); mask.style.setProperty('--my', innerHeight / 2 + 'px'); }
  };
  const moveMask = (x, y) => { mask.style.setProperty('--mx', x + 'px'); mask.style.setProperty('--my', y + 'px'); };
  addEventListener('mousemove', (e) => { if (lanternOn) moveMask(e.clientX, e.clientY); }, { passive: true });
  addEventListener('touchmove', (e) => { if (lanternOn && e.touches[0]) moveMask(e.touches[0].clientX, e.touches[0].clientY); }, { passive: true });
  DD.lantern = function () {
    if (lanternOn) { setLantern(false); DD.terminal.print('The light goes out.', 'dim'); return; }
    const first = DD.store.secret('lantern');
    setLantern(true);
    DD.terminal.print('A lamp comes on somewhere. Move your cursor. Say it again to put it out.', 'em');
    if (first) {
      DD.discover('The name was enough', 'A light came on.');
      DD.showDoc(`<div class="doc-head mono"><span>BONUS TRANSMISSION / LANTERN</span><span class="stamp">UNLISTED</span></div>
        <h2>You said it to the machine.</h2>
        <p>Project Lantern never needed a bulb. It needed someone, in the dark, who knew what to call it. The archive keeps a light for whoever is listening. Move your cursor. Look around.</p>
        <p class="small mono">Say the name again, or press Esc, to put the light out.</p>`);
    }
  };
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && lanternOn && docView.hidden && !DD.caseView.isOpen) setLantern(false);
  });

  /* ---------- hidden route ---------- */
  function ninthDrop() {
    const all = DD.cases.filter((c) => c.playable).every((c) => DD.store.isSolved(c.id));
    const leave = () => { if (location.hash === '#/the-ninth-drop') history.replaceState(null, '', '#/desk'); };
    if (!all) {
      DD.showDoc(`<div class="doc-head mono"><span>404</span><span class="stamp">NO SUCH FILE</span></div><h2>Nothing is filed here.</h2><p>Not yet.</p>`, { onClose: leave });
      return;
    }
    const first = DD.store.secret('ninth-drop');
    DD.showDoc(`<div class="doc-head mono"><span>DROP 09</span><span class="stamp">UNFILED</span></div>
      <h2>The Ninth Drop.</h2>
      <p>Three files, three fragments, one phrase: the only address in the archive that cannot be reached by clicking.</p>
      <p>You never needed the answers. You needed to read the evidence carefully, to distrust the clock, and to notice what stays the same when everything else changes. That was the whole case, every time.</p>
      <p class="quote">“Nothing here was hidden from you. It was only fragmented.”</p>
      <p class="small mono">HINTS USED: ${DD.store.hintsTotal()} · DISCOVERIES: ${DD.store.secretCount()} (MORE EXIST) · THIS PAGE IS FICTION.</p>`, { onClose: leave });
    if (first) DD.discover('The ninth drop', 'Left for whoever read carefully.');
  }

  /* ---------- routing ---------- */
  let prevHash = '', booted = false;
  const isCase = (h) => /^#\/case\//i.test(h);
  function route() {
    const h = location.hash;
    const m = h.match(/^#\/case\/([\w-]+)$/i);
    const deep = m || /^#\/the-ninth-drop\/?$/i.test(h);
    if (deep && !DD.story.inDesk) DD.story.toDesk(true);
    if (m) {
      DD.caseView._pushed = booted && !isCase(prevHash);   // close may use history.back() only if opened from the page
      if (!DD.caseView.open(m[1])) history.replaceState(null, '', '#/desk');
    } else if (/^#\/the-ninth-drop\/?$/i.test(h)) {
      if (DD.caseView.isOpen) DD.caseView.hide();
      ninthDrop();
    } else if (DD.caseView.isOpen) {
      DD.caseView.hide();
    }
    lock();
    prevHash = h;
  }
  addEventListener('hashchange', route);
  route();
  booted = true;

  /* typing anywhere on the monitor goes to the prompt */
  document.addEventListener('keydown', (e) => {
    if (!DD.story.inDesk || DD.caseView.isOpen || !docView.hidden) return;
    if (e.ctrlKey || e.metaKey || e.altKey || e.key.length !== 1) return;
    if (!/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) && !e.target.closest('button')) DD.terminal.focus();
  });
  $('#crt').addEventListener('click', (e) => {
    if (!e.target.closest('button') && !getSelection().toString() && !DD.caseView.isOpen) DD.terminal.focus();
  });
})();
