/* The prompt on the monitor. A local simulation: input is never evaluated as code. */
(function () {
  const DD = (window.DD = window.DD || {});
  const out = document.getElementById('term-out');
  const form = document.getElementById('term-form');
  const input = document.getElementById('term-in');

  const history = [];
  let hIdx = 0, searching = false;

  function print(text, cls) {
    const p = document.createElement('p');
    if (cls) p.className = cls;
    p.textContent = text;
    out.appendChild(p);
    while (out.children.length > 160) out.firstChild.remove();
    out.scrollTop = out.scrollHeight;
    return p;
  }
  const lines = (arr, cls) => arr.forEach((l) => print(l, cls));
  const pad = (n) => String(n).padStart(2, '0');
  const STATUSES = ['all', 'open', 'restricted', 'solved'];

  const commands = {
    help() {
      lines([
        'COMMANDS',
        '  help             this list',
        '  status           archive and index status',
        '  cases            list every case on file',
        '  inspect <id>     summary of a case, e.g. inspect DD-001',
        '  open <id>        open a case file',
        '  random           pick a case for you',
        '  progress         your ledger so far',
        '  find <text>      search (or type /text)',
        '  filter <x>       all · open · restricted · solved · or a class',
        '  sort <x>         newest · oldest · difficulty',
        '  about            the orientation briefing',
        '  sound            toggle sound',
        '  clear            clear this screen'
      ]);
    },
    status() {
      lines([
        'ARCHIVE ........ ONLINE',
        'CASES INDEXED .. 006 / 009',
        'INDEX GAP ...... 007–009  [UNLISTED]',
        'CLASSIFICATION . PUBLIC FICTION',
        'CASES CLOSED ... ' + pad(DD.store.solvedCount()) + ' / 03 PLAYABLE',
        'SIGNAL 09 ...... no source'
      ]);
      print('Entries 007 to 009 exist in the index but not in the listing.', 'dim');
    },
    cases() {
      DD.cases.forEach((c) => print(`${c.id}  ${DD.statusOf(c).padEnd(10)}  ${c.cls.padEnd(13)}  ${c.title}`));
    },
    inspect(arg) {
      if (!arg) return print('usage: inspect <id>   e.g. inspect DD-001', 'warn');
      const id = arg.toUpperCase();
      const c = DD.byId(id);
      if (c) {
        lines([
          `${c.id} — ${c.title.toUpperCase()}`,
          `  class ....... ${c.cls}`,
          `  status ...... ${DD.statusOf(c)}`,
          `  evidence .... ${c.evidence} items · ~${c.minutes} min · difficulty ${c.difficulty}/3`,
          `  summary ..... ${c.desc}`
        ]);
        if (c.id === 'DD-004') print('  note ........ say the name to the machine, and it lights a lamp.', 'dim');
        print(`  → 'open ${c.id}' to read it.`, 'dim');
        return;
      }
      if (id === 'DD-009') {
        const first = DD.store.secret('index-gap');
        lines([
          'DD-009 — [NO TITLE]',
          '  class ....... —',
          '  status ...... UNLISTED',
          '  summary ..... The ninth drop was never filed. It is left, not logged.',
          '               Someone has been leaving the others.'
        ]);
        if (first) DD.discover('The index gap', 'Something answers where nothing is listed.');
        return;
      }
      if (/^DD-00[78]$/.test(id)) return print(`${id}: index entry withheld.`, 'warn');
      print(`No file '${arg}'. Try 'cases'.`, 'warn');
    },
    open(arg) {
      const c = arg && DD.byId(arg);
      if (!c) return print(arg ? `No file '${arg}'. Try 'cases'.` : 'usage: open <id>', 'warn');
      print(`Opening ${c.id}…`, 'dim');
      setTimeout(() => { location.hash = '#/case/' + c.id.toLowerCase(); }, 220);
    },
    random() {
      const c = DD.archive.random();
      DD.dir.clear(); DD.dir.select(c.id);
      print(`Selected: ${c.id} — ${c.title}`, 'em');
      print(`  ${c.desc}`, 'dim');
      print('  Press ENTER on an empty prompt to open it.', 'dim');
    },
    progress() {
      const playable = DD.cases.filter((c) => c.playable);
      playable.forEach((c) => print(`${c.id}  ${DD.store.isSolved(c.id) ? 'CLOSED   fragment: ' + DD.FRAGMENTS[c.id] : 'OPEN     fragment: ▒▒▒▒'}`));
      print(`HINTS USED ...... ${DD.store.hintsTotal()}`);
      print(`DISCOVERIES ..... ${DD.store.secretCount()} (more exist)`);
      if (playable.every((c) => DD.store.isSolved(c.id))) {
        print('All fragments recovered. Together they form a phrase.', 'em');
        print('Phrases are addresses.', 'dim');
      }
    },
    find(arg) { DD.dir.setQuery(arg || ''); print(arg ? `Searching “${arg}”.` : 'Search cleared.', 'dim'); },
    filter(arg) {
      const v = (arg || '').toLowerCase();
      if (!v) return print('usage: filter all | open | restricted | solved | <class>', 'warn');
      if (STATUSES.includes(v)) { DD.dir.setStatus(v.toUpperCase()); return print(`Filter: ${v.toUpperCase()}.`, 'dim'); }
      const cls = [...new Set(DD.cases.map((c) => c.cls))].find((c) => c.toLowerCase() === v);
      if (cls) { DD.dir.setClass(cls); return print(`Filter: ${cls}.`, 'dim'); }
      print(`Unknown filter '${arg}'. Classes: ${[...new Set(DD.cases.map((c) => c.cls.toLowerCase()))].join(', ')}.`, 'warn');
    },
    sort(arg) {
      const v = (arg || '').toLowerCase();
      if (!['newest', 'oldest', 'difficulty'].includes(v)) return print('usage: sort newest | oldest | difficulty', 'warn');
      DD.dir.setSort(v); print(`Sorted by ${v}.`, 'dim');
    },
    about() { DD.BRIEF.forEach((l) => print(l, 'dim')); },
    sound() { DD.audio.toggle(); print(`Sound ${DD.audio.on ? 'on' : 'off'}.`, 'dim'); },
    lantern() { DD.lantern(); },
    replay() { print('Rewinding…', 'dim'); setTimeout(() => { location.hash = ''; location.reload(); }, 400); },
    reset(arg) {
      if ((arg || '').toLowerCase() !== 'confirm') return print("This clears solved cases, hints and discoveries on this device. Type 'reset confirm'.", 'warn');
      DD.store.reset(); print('Ledger cleared.', 'dim');
    },
    clear() { out.innerHTML = ''; }
  };

  function run(raw) {
    const text = raw.trim();
    if (!text) return;
    print('› ' + raw, 'echo');
    if (text[0] === '/') return;
    const [cmd, ...rest] = text.split(/\s+/);
    const key = cmd.toLowerCase();
    if (Object.prototype.hasOwnProperty.call(commands, key)) commands[key](rest.join(' '));
    else print(`'${cmd}' is not a command. Type 'help' for the list.`, 'warn');
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const v = input.value;
    if (!v.trim()) { DD.dir.openSelected(); return; }
    history.push(v); hIdx = history.length;
    input.value = '';
    run(v);
    if (v.trim()[0] === '/') { input.value = v; }   // keep the search visible until Esc
  });

  input.addEventListener('input', () => {
    DD.audio.tick();
    const v = input.value;
    if (v[0] === '/') { searching = true; DD.dir.setQuery(v.slice(1)); }
    else if (searching) { searching = false; DD.dir.setQuery(''); }
  });

  input.addEventListener('keydown', (e) => {
    const k = e.key;
    if ((k === 'ArrowUp' || k === 'ArrowDown') && (e.ctrlKey || e.altKey)) {
      e.preventDefault();
      if (k === 'ArrowUp' && hIdx > 0) { hIdx--; input.value = history[hIdx]; }
      else if (k === 'ArrowDown') { if (hIdx < history.length - 1) { hIdx++; input.value = history[hIdx]; } else { hIdx = history.length; input.value = ''; } }
    } else if (k === 'ArrowUp') { e.preventDefault(); DD.dir.move(-1); }
    else if (k === 'ArrowDown') { e.preventDefault(); DD.dir.move(1); }
    else if (k === 'Escape') { input.value = ''; if (searching || DD.dir.state().q) { searching = false; DD.dir.setQuery(''); } }
    else if (k === 'Tab' && input.value && input.value[0] !== '/') {
      const m = Object.keys(commands).filter((c) => c.startsWith(input.value.toLowerCase()));
      if (m.length === 1) { e.preventDefault(); input.value = m[0] + ' '; }
    }
  });

  DD.terminal = { print, run, focus: () => input.focus({ preventScroll: true }) };
})();
