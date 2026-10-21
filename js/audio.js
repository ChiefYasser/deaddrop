/* Generated sound: a room hum, the recurring signal, small keys. Opt-in, quiet, no files. */
(function () {
  const DD = (window.DD = window.DD || {});
  let ctx = null, master = null, on = false, humStarted = false;
  const listeners = [];
  const PATTERN = [8, 22, 40, 14, 52, 30, 10, 44, 26, 60, 18, 36];

  function init() {
    if (ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);
  }

  function startHum() {
    if (humStarted || !ctx) return;
    humStarted = true;
    [[55, 0.05], [110.6, 0.025], [164.2, 0.008]].forEach(([f, g]) => {
      const o = ctx.createOscillator(), v = ctx.createGain();
      o.type = 'sine'; o.frequency.value = f; v.gain.value = g;
      o.connect(v); v.connect(master); o.start();
    });
    // air: low-passed noise that breathes slowly
    const len = ctx.sampleRate * 2, buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 420;
    const g = ctx.createGain(); g.gain.value = 0.018;
    const lfo = ctx.createOscillator(), lg = ctx.createGain(); lfo.frequency.value = 0.07; lg.gain.value = 0.008;
    lfo.connect(lg); lg.connect(g.gain); lfo.start();
    src.connect(lp); lp.connect(g); g.connect(master); src.start();
  }

  function blip(freq, t0, dur, gain, type) {
    const o = ctx.createOscillator(), v = ctx.createGain();
    o.type = type || 'sine'; o.frequency.value = freq;
    v.gain.setValueAtTime(0, t0);
    v.gain.linearRampToValueAtTime(gain, t0 + 0.008);
    v.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(v); v.connect(master); o.start(t0); o.stop(t0 + dur + 0.05);
  }

  const api = {
    get on() { return on; },
    set(v) {
      on = !!v;
      if (on) {
        init();
        if (!ctx) { on = false; return; }
        ctx.resume();
        startHum();
        master.gain.cancelScheduledValues(ctx.currentTime);
        master.gain.setTargetAtTime(0.9, ctx.currentTime, 1.2);
      } else if (ctx) {
        master.gain.setTargetAtTime(0, ctx.currentTime, 0.2);
      }
      listeners.forEach((fn) => fn(on));
    },
    toggle() { api.set(!on); },
    onChange(fn) { listeners.push(fn); },
    /** The signal from DD-001: the same twelve pulses, three times over. */
    signal(reps) {
      if (!on || !ctx) return;
      const t = ctx.currentTime + 0.1;
      for (let r = 0; r < (reps || 1); r++) {
        PATTERN.forEach((v, i) => blip(520 + v * 14, t + r * 2.4 + i * 0.17, 0.12, 0.05));
      }
    },
    tick() { if (on && ctx) blip(1900 + Math.random() * 300, ctx.currentTime, 0.02, 0.012, 'square'); },
    powerOn() {
      if (!on || !ctx) return;
      const t = ctx.currentTime;
      blip(62, t, 0.9, 0.35);
      blip(31, t, 1.1, 0.3);
      const o = ctx.createOscillator(), v = ctx.createGain();
      o.type = 'sine'; o.frequency.setValueAtTime(400, t); o.frequency.exponentialRampToValueAtTime(15600, t + 0.9);
      v.gain.setValueAtTime(0.006, t); v.gain.exponentialRampToValueAtTime(0.0001, t + 1.4);
      o.connect(v); v.connect(master); o.start(t); o.stop(t + 1.5);
    },
    open() { if (on && ctx) { blip(180, ctx.currentTime, 0.18, 0.08); } },
    solved() {
      if (!on || !ctx) return;
      const t = ctx.currentTime;
      [196, 293.7, 392].forEach((f, i) => blip(f, t + i * 0.16, 1.8, 0.06));
    }
  };
  DD.audio = api;
})();
