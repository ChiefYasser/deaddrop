/* The story: dark → the room → a signal → the monitor → the archive.
   Everything is skippable. Nothing blocks access. */
(function () {
  const DD = (window.DD = window.DD || {});
  const $ = (s) => document.querySelector(s);
  const body = document.body;
  const reduced = DD.reducedMotion();
  const room = $('#room'), video = $('#room-video'), caption = $('#caption'), boot = $('#boot');
  const ui = $('#stage-ui'), beatsEl = $('#beats'), advance = $('#advance');
  const crt = $('#crt'), brief = $('#brief'), dir = $('#dir');

  DD.BRIEF = [
    'DEAD DROP 09 — INDEPENDENT INVESTIGATION ARCHIVE / EST. 09',
    'An archive of anomalies, intercepted signals, and unresolved investigations. Every artifact leaves a trace.',
    'Every case here is invented. Nothing in this archive is a real record.',
    'Each file holds partial evidence, contradictory records, and clues that have to be assembled.',
    'Open a file. Read everything. Test a theory. Close the case. Hints exist.',
    'Progress is kept in this browser only. Nothing leaves this page.',
    'The ninth drop answers to whoever knocks.'
  ];

  const BEATS = [
    { t: '03:12', l: 'A carrier wave, on a frequency no one uses.', fx: 'signal' },
    { t: '03:12:41', l: 'No voice. No music. Forty-one seconds of pulses.' },
    { t: '04:10', l: 'It came back twice more before dawn. Identical every time.' },
    { big: true, l: 'Some files were never meant to be found.' },
    { big: true, l: 'Truth isn’t always hidden. Sometimes, it’s fragmented.' },
    { t: 'NOW', l: 'You are the night archivist. Everything left behind is on this desk.', push: true },
    { t: '03:12', l: 'A file is waiting on the screen.', last: true }
  ];

  let idx = -1, timer = 0, active = false, desk = false, typing = null;
  const dotsHTML = BEATS.map(() => '<i></i>').join('');
  beatsEl.innerHTML = dotsHTML;

  /* ---- where the monitor is, whatever the viewport ---- */
  const VW = 1280, VH = 720, MON = { x: 1030, y: 275, w: 400, h: 370 };   // monitor screen, in video pixels
  function place() {
    const W = innerWidth, H = innerHeight, s = Math.max(W / VW, H / VH);
    const px = W / H < 1.2 ? 0.8 : 0.5;                       // keep the monitor in frame on tall screens
    video.style.objectPosition = `${px * 100}% 50%`;
    const ox = (W - VW * s) * px, oy = (H - VH * s) * 0.5;
    const mx = ox + MON.x * s, my = oy + MON.y * s;
    const fit = Math.min(W / (MON.w * s), H / (MON.h * s)) * 0.9;
    const k = 1.04 * Math.max(fit, (W / 2) / Math.max(W - mx, 1), (W / 2) / Math.max(mx, 1), (H / 2) / Math.max(H - my, 1), (H / 2) / Math.max(my, 1));
    room.style.transformOrigin = `${mx}px ${my}px`;
    room.dataset.push = `translate(${W / 2 - mx}px, ${H / 2 - my}px) scale(${k.toFixed(3)})`;
    if (body.classList.contains('scene-push') || desk) room.style.transform = room.dataset.push;
  }
  window.addEventListener('resize', place);
  place();

  /* ---- captions ---- */
  function showBeat(b) {
    caption.className = 'caption' + (b.big ? ' big' : '');
    const words = b.l.split(' ').map((w, i) => `<span style="--i:${i}">${w}</span>`).join(' ');
    caption.innerHTML = `<p class="cap">${b.t ? `<span class="cap-t mono">${b.t}</span>` : ''}<span class="cap-l">${words}</span></p>`;
    caption.classList.add('in');
  }
  function hideBeat(cb) {
    caption.classList.remove('in'); caption.classList.add('out');
    setTimeout(cb, reduced ? 0 : 520);
  }

  function next() {
    if (!active || desk) return;
    clearTimeout(timer);
    const go = () => {
      if (desk) return;
      idx++;
      if (idx >= BEATS.length) return toDesk(false);
      const b = BEATS[idx];
      beatsEl.querySelectorAll('i').forEach((d, i) => d.classList.toggle('on', i <= idx));
      showBeat(b);
      if (b.fx === 'signal') DD.audio.signal(2);
      if (b.push) { body.classList.add('scene-push'); room.style.transform = room.dataset.push; }
      const dur = Math.max(3400, 1500 + b.l.length * 62);
      timer = setTimeout(next, b.last ? 2600 : dur);
    };
    if (idx >= 0) hideBeat(go); else go();
  }

  function start(withSound) {
    if (active) return;
    active = true;
    DD.audio.set(withSound);
    video.muted = true; video.play().catch(() => {});
    boot.classList.add('gone');
    setTimeout(() => { boot.hidden = true; }, 900);
    body.classList.remove('scene-boot'); body.classList.add('scene-room');
    ui.hidden = false; advance.hidden = false;
    setTimeout(() => { advance.classList.add('in'); }, 3000);
    timer = setTimeout(next, reduced ? 400 : 3200);
  }

  /* ---- typed orientation on the monitor ---- */
  function typeBrief(done) {
    brief.innerHTML = '';
    let li = 0, ci = 0, p = null, skipped = false, t = 0;
    const finish = () => { clearTimeout(t); typing = null; done(); };
    typing = () => { skipped = true; brief.innerHTML = DD.BRIEF.map((l, i) => `<p class="${i === 0 ? 'em' : ''}">${l}</p>`).join(''); finish(); };
    if (reduced) return typing();
    (function step() {
      if (skipped) return;
      if (!p) {
        if (li >= DD.BRIEF.length) { t = setTimeout(finish, 1600); return; }
        p = document.createElement('p'); if (li === 0) p.className = 'em'; brief.appendChild(p); ci = 0;
      }
      const line = DD.BRIEF[li];
      p.textContent = line.slice(0, ++ci);
      if (ci % 3 === 0) DD.audio.tick();
      if (ci >= line.length) { p = null; li++; t = setTimeout(step, 340); }
      else t = setTimeout(step, 13);
    })();
  }

  /* ---- the monitor wakes ---- */
  function showDirectory() {
    brief.classList.add('fade'); typing = null;
    setTimeout(() => {
      brief.hidden = true; dir.hidden = false; dir.classList.add('in');
      DD.dir.render();
      DD.terminal.print("Type 'help' for commands. Press ENTER to open the highlighted file.", 'dim');
      DD.terminal.focus();
    }, reduced ? 0 : 500);
  }

  function toDesk(quick) {
    if (desk) return;
    desk = true; active = true; clearTimeout(timer);
    caption.className = 'caption'; caption.innerHTML = '';
    ui.hidden = true; advance.hidden = true; boot.hidden = true;
    body.classList.remove('scene-boot', 'scene-room'); body.classList.add('scene-push', 'scene-desk');
    room.style.transform = room.dataset.push;
    crt.hidden = false;
    if (quick) {
      crt.classList.add('on', 'quick'); brief.hidden = true; dir.hidden = false; dir.classList.add('in');
      DD.dir.render(); video.play().catch(() => {});
      DD.terminal.print("Type 'help' for commands. Press ENTER to open the highlighted file.", 'dim');
      return;
    }
    DD.audio.powerOn();
    requestAnimationFrame(() => crt.classList.add('on'));
    setTimeout(() => typeBrief(showDirectory), reduced ? 0 : 900);
  }

  /* ---- input ---- */
  $('#enter-sound').addEventListener('click', () => start(true));
  $('#enter-silent').addEventListener('click', () => start(false));
  $('#stage-skip').addEventListener('click', () => toDesk(false));
  $('#stage').addEventListener('click', (e) => { if (!e.target.closest('button') && active && !desk) next(); });
  crt.addEventListener('click', (e) => { if (typing && !e.target.closest('button')) typing(); });
  document.addEventListener('keydown', (e) => {
    if (desk && typing && (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape')) { e.preventDefault(); typing(); return; }
    if (!active && !desk && (e.key === 'Enter') && document.activeElement === document.body) { start(false); return; }
    if (!active || desk) return;
    if (e.key === ' ' || e.key === 'ArrowRight' || e.key === 'Enter') { if (!e.target.closest('button')) { e.preventDefault(); next(); } }
    else if (e.key === 'Escape') toDesk(false);
  });

  /* sound buttons */
  const sbtns = ['#stage-sound', '#crt-sound'].map($);
  const syncSound = (on) => sbtns.forEach((b) => { b.textContent = on ? 'SOUND ON' : 'SOUND OFF'; b.setAttribute('aria-pressed', String(on)); });
  sbtns.forEach((b) => b.addEventListener('click', () => DD.audio.toggle()));
  DD.audio.onChange(syncSound); syncSound(false);

  /* the fictional clock on the monitor */
  const clockEl = $('#clock'), t0 = 3 * 3600 + 12 * 60 + 7, born = Date.now();
  setInterval(() => {
    const s = t0 + Math.floor((Date.now() - born) / 1000);
    clockEl.textContent = [Math.floor(s / 3600) % 24, Math.floor(s / 60) % 60, s % 60].map((n) => String(n).padStart(2, '0')).join(':');
  }, 1000);

  DD.story = { start, toDesk, get inDesk() { return desk; }, get started() { return active; } };
})();
