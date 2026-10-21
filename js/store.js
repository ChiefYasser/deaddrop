/* Local-only progress. Nothing here ever leaves the browser. */
(function () {
  const DD = (window.DD = window.DD || {});
  const KEY = 'dd09.v1';
  let state = { solved: {}, hints: {}, secrets: {} };

  try {
    const raw = localStorage.getItem(KEY);
    if (raw) state = Object.assign(state, JSON.parse(raw));
  } catch (e) { /* storage unavailable: run in memory */ }

  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} };
  const emit = () => document.dispatchEvent(new CustomEvent('dd:progress'));

  DD.store = {
    isSolved: (id) => !!state.solved[id],
    solvedCount: () => Object.keys(state.solved).length,
    solve(id) {
      if (state.solved[id]) return false;
      state.solved[id] = Date.now();
      save(); emit();
      return true;
    },
    hintLevel: (id) => state.hints[id] || 0,
    useHint(id) {
      state.hints[id] = (state.hints[id] || 0) + 1;
      save();
      return state.hints[id];
    },
    hintsTotal: () => Object.values(state.hints).reduce((a, b) => a + b, 0),
    hasSecret: (name) => !!state.secrets[name],
    secretCount: () => Object.keys(state.secrets).length,
    /** Returns true only the first time a secret is found. */
    secret(name) {
      if (state.secrets[name]) return false;
      state.secrets[name] = Date.now();
      save(); emit();
      return true;
    },
    reset() {
      state = { solved: {}, hints: {}, secrets: {} };
      save(); emit();
    }
  };

  /* Discovery / system toasts */
  DD.toast = function (title, text) {
    const host = document.getElementById('toasts');
    if (!host) return;
    const el = document.createElement('div');
    el.className = 'toast';
    el.innerHTML = '<b class="mono"></b><span></span>';
    el.firstChild.textContent = title;
    el.lastChild.textContent = text || '';
    host.appendChild(el);
    requestAnimationFrame(() => el.classList.add('in'));
    setTimeout(() => {
      el.classList.remove('in');
      setTimeout(() => el.remove(), 500);
    }, 5200);
  };

  DD.reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
})();
