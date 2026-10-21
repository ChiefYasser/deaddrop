/* Case data, evidence renderers and puzzle definitions. All fiction. */
(function () {
  const DD = (window.DD = window.DD || {});
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const caesar = (t, n) => t.replace(/[A-Z]/g, (c) => String.fromCharCode(((c.charCodeAt(0) - 65 + n) % 26 + 26) % 26 + 65));
  const rd = (n) => `<span class="redact" style="--w:${n}ch"><span class="sr">[redacted]</span></span>`;
  DD.esc = esc;
  DD.caesar = caesar;

  /* ---------- shared SVG helpers ---------- */
  const WAVE = [8, 22, 40, 14, 52, 30, 10, 44, 26, 60, 18, 36];
  DD.waveBars = function (w, h, reps, opts) {
    opts = opts || {};
    const per = WAVE.length, total = per * reps, step = w / total, mid = h / 2;
    let out = '';
    for (let i = 0; i < total; i++) {
      const v = (WAVE[i % per] / 60) * (h * 0.44) + 2;
      out += `<line x1="${(i * step + step / 2).toFixed(1)}" y1="${(mid - v).toFixed(1)}" x2="${(i * step + step / 2).toFixed(1)}" y2="${(mid + v).toFixed(1)}"/>`;
    }
    return `<g stroke="currentColor" stroke-width="${opts.sw || 1.4}" stroke-linecap="round">${out}</g>`;
  };

  /* ---------- listing thumbnails: one distinct identity per case ---------- */
  DD.art = {
    wave: () => `<svg viewBox="0 0 240 140" aria-hidden="true">${DD.waveBars(220, 140, 3)}<g transform="translate(10 0)"><path d="M0 128h72M80 128h72M160 128h60" stroke="currentColor" stroke-opacity=".5" fill="none"/></g></svg>`,
    room: () => `<svg viewBox="0 0 240 140" aria-hidden="true" fill="none" stroke="currentColor"><path d="M30 20h180v100H30z" stroke-opacity=".5"/><path d="M30 20l40 24h100l40-24M70 44v56h100V44M30 120l40-20h100l40 20" stroke-opacity=".8"/><rect x="108" y="64" width="24" height="36" stroke-opacity=".4"/><path d="M120 100v8M116 108h8" /><circle cx="120" cy="58" r="1.8" fill="currentColor"/></svg>`,
    clock: () => `<svg viewBox="0 0 240 140" aria-hidden="true" fill="none" stroke="currentColor">${Array.from({ length: 40 }, (_, i) => { const x = 10 + i * 5.75; const gap = i >= 18 && i <= 24; return gap ? `<line x1="${x}" y1="58" x2="${x}" y2="82" stroke="#B64B4B" stroke-opacity=".7" stroke-dasharray="2 3"/>` : `<line x1="${x}" y1="${i % 5 === 0 ? 46 : 56}" x2="${x}" y2="${i % 5 === 0 ? 94 : 84}" stroke-opacity="${i % 5 === 0 ? 0.9 : 0.5}"/>`; }).join('')}<path d="M10 108h220" stroke-opacity=".3"/></svg>`,
    redact: () => `<svg viewBox="0 0 240 140" aria-hidden="true" fill="currentColor">${[[14, 22, 180], [14, 38, 210, 1], [14, 54, 140], [14, 70, 196, 1], [14, 86, 90], [14, 102, 170, 1], [14, 118, 120]].map(([x, y, w, r]) => r ? `<rect x="${x}" y="${y}" width="${w}" height="9" opacity=".92"/>` : `<rect x="${x}" y="${y}" width="${w}" height="3" opacity=".35"/>`).join('')}<circle cx="212" cy="26" r="6" fill="none" stroke="currentColor"/></svg>`,
    server: () => `<svg viewBox="0 0 240 140" aria-hidden="true" fill="none" stroke="currentColor"><g stroke-opacity=".7">${[18, 48, 78].map((y) => `<rect x="20" y="${y}" width="96" height="24"/><circle cx="32" cy="${y + 12}" r="2" fill="currentColor"/><path d="M48 ${y + 12}h56" stroke-opacity=".4"/>`).join('')}</g><circle cx="32" cy="90" r="2" fill="#0c0f0d" stroke="currentColor"/><path d="M116 60C150 60 150 96 184 96M184 96h40" stroke-dasharray="2 5"/><circle cx="224" cy="96" r="3" fill="currentColor"/></svg>`,
    identity: () => `<svg viewBox="0 0 240 140" aria-hidden="true" fill="none" stroke="currentColor"><g stroke-opacity=".75">${[16, 26, 36, 46, 56].map((r, i) => `<path d="M${120 - r} 72a${r} ${r} 0 0 1 ${r * 2} 0" stroke-opacity="${1 - i * 0.14}"/>`).join('')}<path d="M104 72v18a16 16 0 0 0 16 16M92 72v22a28 28 0 0 0 28 28" /></g><path d="M150 40l30 60" stroke="#080A09" stroke-width="10"/></svg>`
  };

  /* ---------- evidence helpers ---------- */
  const kv = (rows) => `<dl class="kv mono">${rows.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${v}</dd></div>`).join('')}</dl>`;
  const note = (t) => `<p class="annot mono"><i aria-hidden="true"></i>${t}</p>`;

  /* =========================================================
     FRAME RENDERER for DD-002
     ========================================================= */
  function frameSVG(f, id) {
    const candleH = f.candle * 0.75;
    const cy = 132;
    const win = (0.08 + f.light * 0.3).toFixed(2);
    const chairsX = [88, 212, 64, 236].slice(0, f.chairs);
    const chairs = chairsX.map((x) => `<g stroke="currentColor" stroke-opacity=".55" fill="none"><rect x="${x - 7}" y="116" width="14" height="4" /><path d="M${x - 6} 120v14M${x + 6} 120v14M${x - 7} 116v-14h14v14"/></g>`).join('');
    const ang = (f.clock / 60) * 2 * Math.PI - Math.PI / 2;
    const door = f.ajar
      ? `<path d="M268 60h28v90h-28z" fill="#050606" stroke="currentColor" stroke-opacity=".5"/><path d="M268 60l-16 8v90l16-8z" fill="rgba(243,244,239,.07)" stroke="currentColor" stroke-opacity=".6"/>`
      : `<rect x="268" y="60" width="28" height="90" fill="rgba(243,244,239,.04)" stroke="currentColor" stroke-opacity=".5"/><circle cx="274" cy="108" r="1.6" fill="currentColor" fill-opacity=".7"/>`;
    return `<svg viewBox="0 0 320 200" role="img" aria-label="Surveillance still ${esc(id)}. Candle, table and chairs in a sealed room." class="still">
      <rect width="320" height="200" fill="#0b0e0c"/>
      <path d="M0 150h320v50H0z" fill="rgba(243,244,239,.04)"/>
      <rect x="110" y="26" width="64" height="52" fill="rgba(243,244,239,${win})" stroke="currentColor" stroke-opacity=".5"/><path d="M142 26v52M110 52h64" stroke="currentColor" stroke-opacity=".35"/>
      <circle cx="56" cy="46" r="13" fill="none" stroke="currentColor" stroke-opacity=".6"/><path d="M56 46l${(9 * Math.cos(ang)).toFixed(1)} ${(9 * Math.sin(ang)).toFixed(1)}" stroke="currentColor" stroke-width="1.4"/><path d="M56 46v-6" stroke="currentColor" stroke-opacity=".7"/>
      ${door}
      <rect x="120" y="136" width="60" height="5" fill="rgba(243,244,239,.5)"/><path d="M126 141v14M174 141v14" stroke="currentColor" stroke-opacity=".5"/>
      <rect x="146" y="${(cy + 4 - candleH).toFixed(1)}" width="8" height="${candleH.toFixed(1)}" fill="#E7E3D1" fill-opacity=".9" data-candle="${f.candle}"/>
      <ellipse cx="150" cy="${(cy - candleH - 1).toFixed(1)}" rx="2.2" ry="4" fill="#F3F4EF" fill-opacity=".9"/>
      ${chairs}
      <g stroke="currentColor" stroke-opacity=".05">${Array.from({ length: 20 }, (_, i) => `<path d="M0 ${i * 10}h320"/>`).join('')}</g>
      <text x="10" y="16" class="mono" font-size="9" fill="currentColor" fill-opacity=".8">CAM-07 · ${esc(id)}</text>
      <text x="310" y="192" text-anchor="end" class="mono" font-size="9" fill="currentColor" fill-opacity=".7">██:██:██</text>
    </svg>`;
  }

  /* =========================================================
     DD-001 THE SILENT FREQUENCY
     ========================================================= */
  const PLAIN1 = 'THE SIGNAL DOES NOT COME FROM RELAY STATION SEVEN. IT IS ANSWERING IT.';
  const CIPHER1 = caesar(PLAIN1, 3);

  /* =========================================================
     DD-002 THE EMPTY ROOM  — frames, listed in TRUE order
     ========================================================= */
  const FRAMES = [
    { id: 'F-C', candle: 38, chairs: 0, light: 0.6, clock: 7, ajar: false },
    { id: 'F-A', candle: 30, chairs: 1, light: 1.0, clock: 41, ajar: false },
    { id: 'F-E', candle: 21, chairs: 2, light: 0.2, clock: 22, ajar: false },
    { id: 'F-B', candle: 12, chairs: 3, light: 0.8, clock: 3, ajar: false },
    { id: 'F-D', candle: 4, chairs: 4, light: 0.45, clock: 55, ajar: true }
  ];

  /* =========================================================
     DD-003 THE MISSING HOUR — log rows
     ========================================================= */
  const LOGS = [
    { sys: 'BADGE-RDR', seq: 8819, t: '01:58:44', ev: 'DOOR_LOCK  state=ok' },
    { sys: 'BADGE-RDR', seq: 8820, t: '01:59:58', ev: 'BADGE_READ id=C3 granted' },
    { sys: 'BADGE-RDR', seq: 8821, t: '03:00:01', ev: 'DOOR_LOCK  state=ok' },
    { sys: 'BADGE-RDR', seq: 8822, t: '03:00:40', ev: 'BADGE_READ id=C3 denied' },
    { sys: 'NET-GW', seq: 4410, t: '01:59:52', ev: 'LINK_UP eth0' },
    { sys: 'NET-GW', seq: 4411, t: '01:59:59', ev: 'PKT_BURST n=212' },
    { sys: 'NET-GW', seq: 4412, t: '03:00:00', ev: 'PKT_BURST n=209' },
    { sys: 'NET-GW', seq: 4413, t: '03:00:07', ev: 'PKT_BURST n=211' },
    { sys: 'UPS-01', seq: 771, t: '01:59:57', ev: 'LOAD 41% BATT 100%' },
    { sys: 'UPS-01', seq: 772, t: '03:00:02', ev: 'LOAD 41% BATT 100%' },
    { sys: 'UPS-01', seq: 773, t: '03:00:32', ev: 'LOAD 41% BATT 100%' },
    { sys: 'CCTV-HUB', seq: 9100, t: '01:59:55', ev: 'HEARTBEAT ok' },
    { sys: 'CCTV-HUB', seq: 9160, t: '03:00:03', ev: 'HEARTBEAT ok' },
    { sys: 'CCTV-HUB', seq: 9161, t: '03:01:03', ev: 'HEARTBEAT ok' }
  ];
  const secs = (t) => { const [h, m, s] = t.split(':').map(Number); return h * 3600 + m * 60 + s; };
  LOGS.forEach((r, i) => {
    r.key = r.sys + '#' + r.seq;
    const p = LOGS[i - 1];
    if (p && p.sys === r.sys) { r.dseq = r.seq - p.seq; r.dt = secs(r.t) - secs(p.t); }
    // Anomaly: the counter did not skip, yet the clock leapt by well over a minute.
    r.anomaly = !!(r.dseq === 1 && r.dt > 600);
  });

  /* =========================================================
     THE CASES
     ========================================================= */
  DD.FRAGMENTS = { 'DD-001': 'THE', 'DD-002': 'NINTH', 'DD-003': 'DROP' };

  DD.cases = [
    {
      id: 'DD-001', title: 'The Silent Frequency', cls: 'SIGNALS', status: 'OPEN', difficulty: 1, minutes: 25, evidence: 5, opened: '2024-03-14',
      tagline: 'A carrier wave with no voice, repeating a sequence no one sent.',
      desc: 'An unexplained radio transmission containing a recurring sequence.',
      keywords: 'radio cipher caesar tone relay transmission signal decode',
      art: 'wave', playable: true,
      meta: [['FORMAT', 'RX-4 CAPTURE / .TXT'], ['SIZE', '41.2 SEC'], ['CUSTODIAN', 'R. HALLOWAY (FICTIONAL)'], ['INTEGRITY', 'VERIFIED']],
      overview: 'At 03:12 a night receiver locked onto a carrier at 4.625 MHz. There was no voice, no music, only a pulse train lasting forty-one seconds. It returned twice more before dawn, identical to the sample. The operator wrote the pulses down as letters. Nobody has been able to say what it is saying.',
      objective: 'Work out what the transmission says, then identify which relay station it concerns.',
      timeline: [['03:12:04', 'Carrier detected on an unassigned frequency.'], ['03:12:41', 'Carrier drops. Pulse train transcribed.'], ['03:41:10', 'Second capture. Identical to the first.'], ['04:10:22', 'Third capture. Operator notes a constant three-letter prefix.'], ['04:31:00', 'Station manager orders the log sealed.']],
      artifacts: [
        { id: 'A-01', kind: 'TRANSCRIPT', title: 'Operator transcript, Receiver 4', span: 7, html: () => `<div class="lines mono"><p><span>03:12:04</span> CARRIER DETECTED · 4.625 MHZ · NO VOICE</p><p><span>03:12:05</span> PULSE TRAIN BEGINS</p><p class="cipher"><span>03:12:05</span> ${esc(CIPHER1)}</p><p><span>03:12:41</span> CARRIER DROPPED</p></div>${note('Spacing between words survived transmission. Punctuation too.')}` },
        { id: 'A-02', kind: 'WAVEFORM', title: 'Capture, first 41.2 seconds', span: 5, html: () => `<svg class="wave-art" viewBox="0 0 400 120" preserveAspectRatio="none" role="img" aria-label="Waveform showing the same pattern three times">${DD.waveBars(396, 120, 3)}<path d="M132 6v108M264 6v108" stroke="currentColor" stroke-opacity=".35" stroke-dasharray="3 4"/></svg><p class="annot mono"><i aria-hidden="true"></i>Pattern repeats ×3. Variation under 0.01%. That is not how noise behaves.</p>` },
        { id: 'A-03', kind: 'MARGIN NOTES', title: 'Handwritten, operator’s copy', span: 6, tone: 'paper', html: () => `<div class="hand"><p>Same start every time: <b>${esc(caesar('THE', 3))}</b>. Three letters, same place.</p><p>It’s not numbers. The word gaps are intact, so it’s <u>letters</u>, shifted. Like a child’s code wheel.</p><p>Same offset for the whole message, I checked the ends.</p><p class="small">— what short word starts most sentences?</p></div>` },
        { id: 'A-04', kind: 'SYSTEM LOG', title: 'Receiver 4 capture index', span: 6, html: () => `<table class="mini mono"><thead><tr><th>#</th><th>START</th><th>FREQ</th><th>SNR</th><th>LEN</th></tr></thead><tbody><tr><td>01</td><td>03:12:04</td><td>4.625</td><td>31 dB</td><td>41.2s</td></tr><tr><td>02</td><td>03:41:10</td><td>4.625</td><td>31 dB</td><td>41.2s</td></tr><tr><td>03</td><td>04:10:22</td><td>4.625</td><td>31 dB</td><td>41.2s</td></tr></tbody></table>${note('Three captures. Same length. Same signal strength. Someone is being very consistent.')}` },
        { id: 'A-05', kind: 'FIELD MEMO', title: 'Decommission notice, Relay Station Seven', span: 12, sealed: true, tone: 'paper', html: () => `<div class="doc"><div class="doc-head mono"><span>NOTICE OF DECOMMISSION</span><span class="stamp">RECOVERED</span></div><p>Relay Station Seven was taken out of service and its transmitters disconnected. The antenna array was left standing. No one has been assigned to it since.</p><p>Final outbound message, never acknowledged: <i>“Are you receiving?”</i></p><p class="frag mono">RECOVERED FRAGMENT: <b>THE</b></p></div>` }
      ],
      puzzle: { type: 'cipher', cipher: CIPHER1, plain: PLAIN1, prompt: 'Decode the intercept. Which relay station is the signal responding to?', label: 'STATION', placeholder: 'Name or number…', accept: /\b(seven|7|vii)\b/i, near: /\b(six|6|eight|8|five|5)\b/i },
      hints: ['Read the margin notes. Which three-letter word most often starts an English sentence?', 'The prefix repeats every time. If it stands for THE, count how many steps W is from T.', 'Every letter is moved forward by the same amount. Shift each letter back by three.'],
      conclusion: 'The signal does not originate from Relay Station Seven. It is a reply to it. The station sent one message before it was shut down: a question that no one answered. Fifteen years later, something finally did.',
      next: 'DD-002'
    },
    {
      id: 'DD-002', title: 'The Empty Room', cls: 'SURVEILLANCE', status: 'OPEN', difficulty: 2, minutes: 35, evidence: 5, opened: '2024-06-02',
      tagline: 'A sealed room, a single camera, and five frames that disagree.',
      desc: 'A surveillance recording showing a room that appears different in every frame.',
      keywords: 'camera frames room candle chairs sequence timeline video',
      art: 'room', playable: true,
      meta: [['FORMAT', 'CAM-07 / STILLS'], ['SIZE', '5 FRAMES'], ['CUSTODIAN', 'UNASSIGNED'], ['INTEGRITY', 'TIMESTAMPS CORRUPT']],
      overview: 'Camera 07 watched a locked room for forty minutes. The footage survived; the timestamps did not. Five stills were pulled and shuffled by a failing disk. In every one the room looks different: a different count of chairs, a different light at the window. Which came first?',
      objective: 'Put the five frames back into the order they were recorded.',
      timeline: [['22:00', 'Room inspected, empty. Door sealed from outside.'], ['22:01', 'Candle lit by the inspector. Recording begins.'], ['22:41', 'Recording ends. Disk fault begins to scramble the index.'], ['07:30', 'Seal found broken. Door ajar.']],
      artifacts: [
        { id: 'B-01', kind: 'TRANSCRIPT', title: 'Inspector’s dictated log', span: 6, html: () => `<div class="lines mono"><p><span>22:00</span> Room 4 empty. One table. One candle, new, full length.</p><p><span>22:01</span> Candle lit. Recording started. Door sealed.</p><p><span>22:01</span> Windows are frosted; light outside varies with traffic. Ignore it.</p><p><span>22:02</span> The wall clock is broken. Stopped and restarted by itself. Ignore it too.</p></div>${note('The candle is not replaceable and cannot be relit once out.')}` },
        { id: 'B-02', kind: 'STILL', title: 'Frame F-A, enlarged', span: 6, html: () => `<div class="still-wrap">${frameSVG(FRAMES[1], 'F-A')}<span class="callout mono" style="left:44%;top:56%">WAX LEVEL</span><span class="callout mono" style="left:10%;top:12%">CLOCK: UNRELIABLE</span><span class="callout mono" style="left:30%;top:6%">WINDOW: TRAFFIC</span></div>` },
        { id: 'B-03', kind: 'REDACTED REPORT', title: 'Seal inspection report', span: 6, tone: 'paper', html: () => `<div class="doc"><div class="doc-head mono"><span>SEAL REPORT / RM 4</span><span class="stamp">PARTIAL</span></div><p>Seal on door found ${rd(9)} at 07:30. No tool marks. No forced entry. The seal was broken from ${rd(10)}.</p><p>Furniture count at 22:00: <b>1 table</b>. Furniture count at 07:30: <b>1 table, 4 chairs</b>. Nobody entered between.</p></div>` },
        { id: 'B-04', kind: 'FILE METADATA', title: 'Container header, CAM-07', span: 6, html: () => `${kv([['Camera', 'CAM-07'], ['Frames', '5 (sampled)'], ['Duration', '██ min'], ['Created', '██-██-████ ██:██'], ['Index', 'CORRUPT / SHUFFLED'], ['Note', 'Object states are the only reliable order'] ])}${note('When the clock lies, look for something that can only go one way.')}` },
        { id: 'B-05', kind: 'RECOVERED', title: 'Frame 6, from backup', span: 12, sealed: true, html: () => `<div class="still-wrap wide">${frameSVG({ candle: 0, chairs: 4, light: 0.1, clock: 30, ajar: true }, 'F-06')}</div><p class="frag mono">RECOVERED FRAGMENT: <b>NINTH</b></p>` }
      ],
      puzzle: { type: 'sequence', frames: FRAMES, initial: FRAMES.map((f) => f.id).sort(), prompt: 'Order the frames from earliest to latest.' },
      hints: ['The clock is broken and the window follows the traffic. Neither tells you the time. What does the inspector say can’t be reversed?', 'The candle was lit at the start and never replaced. Candles only get shorter.', 'Tallest candle first, shortest last. The furniture is a different question.'],
      conclusion: 'The candle burned down steadily, so time in the room was unbroken, yet a chair appeared with every passing minute. The room was not changing. It was being furnished, one seat at a time, by something that never crossed the door. By the last frame, the table was set for four and the seal was already open: from the inside.',
      next: 'DD-003'
    },
    {
      id: 'DD-003', title: 'The Missing Hour', cls: 'RECORDS', status: 'OPEN', difficulty: 3, minutes: 45, evidence: 5, opened: '2024-09-19',
      tagline: 'Four systems logged the same night. Only one remembers the hour.',
      desc: 'Logs from several systems that disagree about the same event.',
      keywords: 'logs timestamp clock anomaly records counter badge network ups cctv',
      art: 'clock', playable: true,
      meta: [['FORMAT', 'MULTI-SYSTEM LOG EXTRACT'], ['SIZE', '14 ENTRIES'], ['CUSTODIAN', 'FACILITIES (FICTIONAL)'], ['INTEGRITY', 'CONFLICTING']],
      overview: 'A facility lost an hour. Not the power, not the network, not the cameras: an hour. At 01:59 the clocks read one thing, and a moment later they read three o’clock. Four systems kept their own logs. Three of them agree that nothing happened in between. One does not.',
      objective: 'Flag every log entry that shows the clock jumping ahead without a single record going missing.',
      timeline: [['01:58', 'Last normal door event.'], ['01:59:59', 'All clocks read 01:59.'], ['03:00:00', 'All clocks read 03:00.'], ['03:14', 'Night staff notice the building “feels late”.']],
      artifacts: [
        { id: 'C-01', kind: 'TECH MEMO', title: 'How the counters work', span: 6, tone: 'paper', html: () => `<div class="doc"><div class="doc-head mono"><span>MAINT. NOTE 22</span><span class="stamp">INTERNAL</span></div><p>Every log writes a running sequence number. The number goes up by <b>one</b> for each record. If a record is deleted, the number <b>skips</b>.</p><p>Clocks, by contrast, can be set, reset or drift. The sequence number cannot be set by anyone ${rd(12)}.</p></div>` },
        { id: 'C-02', kind: 'SPEC SHEET', title: 'CCTV hub heartbeat', span: 6, html: () => `${kv([['Device', 'CCTV-HUB'], ['Heartbeat', 'one record every 60 s'], ['Counter', '+1 per record'], ['Clock source', 'own oscillator']])}${note('A hub that is running writes sixty records an hour. No more, no fewer.')}` },
        { id: 'C-03', kind: 'SYSTEM LOG', title: 'Interleaved extract, all four systems', span: 12, html: () => `<p class="annot mono"><i aria-hidden="true"></i>The extract is on the investigation bench below. Open it there to flag entries.</p>` },
        { id: 'C-04', kind: 'READOUT', title: 'UPS battery', span: 12, html: () => `${kv([['Battery', '100% throughout'], ['Mains', 'no interruption'], ['Load', '41% before and after']])}${note('No outage. Whatever happened, it was not a loss of power.')}` },
        { id: 'C-05', kind: 'RECOVERED', title: 'Handwritten note found in rack 2', span: 12, sealed: true, tone: 'paper', html: () => `<div class="hand"><p>Three machines say the hour didn’t happen. One counted it, minute by minute.</p><p>So the hour happened. Just not to us.</p></div><p class="frag mono">RECOVERED FRAGMENT: <b>DROP</b></p>` }
      ],
      puzzle: { type: 'flag', rows: LOGS, prompt: 'Flag every entry where the counter shows no gap, yet the clock leapt forward by about an hour.' },
      hints: ['Compare the sequence number with the time. When records are deleted, the counter skips.', 'Look at each system on its own. A big jump in time is only suspicious if the counter did not jump with it. The Δ columns on the bench are now shown.', 'The CCTV hub is your control: sixty heartbeats explain its jump. Find the entries whose counter moved by one while the clock moved by about an hour.'],
      conclusion: 'Three systems recorded no break in their counters, so no records were lost, yet each clock leapt sixty minutes. The hour was not deleted; it was never written. Only the camera hub counted every minute of it. Whatever happened that night, the building lived through the hour and its own machines, three of them, were not allowed to see.',
      next: null
    },
    {
      id: 'DD-004', title: 'Project Lantern', cls: 'RESEARCH', status: 'RESTRICTED', difficulty: 2, minutes: 40, evidence: 4, opened: '2025-01-27',
      tagline: 'Fourteen pages written. Nine survive. None agree on what it does.',
      desc: 'An incomplete research document with redacted sections.',
      keywords: 'research redacted document lantern light project',
      art: 'redact', playable: false,
      meta: [['FORMAT', 'WORKING PAPER'], ['SIZE', '9 OF 14 PAGES'], ['CUSTODIAN', 'WITHHELD'], ['INTEGRITY', 'PARTIAL']],
      overview: 'A research paper with no author and no institution. The apparatus is described in detail; its purpose is not. Pages four through eight are gone. Page nine ends mid-sentence.',
      teaserTitle: 'Page 9 of 14, final surviving page',
      teaser: () => `<div class="doc"><div class="doc-head mono"><span>PROJECT LANTERN / WP-9</span><span class="stamp">PARTIAL</span></div><p>The apparatus does not respond to light, but to its ${rd(6)}. In every trial the room remained dark until the operator ${rd(14)}.</p><p>Do not misuse the name. Say it to the machine, in the dark, and the archive will keep a light for whoever is listening. If you are reading this, then</p></div>`,
      lockedNote: 'This case is still being assembled. Its evidence has not been cleared for release.'
    },
    {
      id: 'DD-005', title: 'The Last Connection', cls: 'NETWORK', status: 'RESTRICTED', difficulty: 3, minutes: 50, evidence: 6, opened: '2025-05-08',
      tagline: 'A powered-down server kept talking for eleven more hours.',
      desc: 'A disconnected server that appears to have transmitted data afterward.',
      keywords: 'server network packets offline transmission',
      art: 'server', playable: false,
      meta: [['FORMAT', 'NETWORK CAPTURE'], ['SIZE', '11 H / 4.2 GB'], ['CUSTODIAN', 'WITHHELD'], ['INTEGRITY', 'UNVERIFIABLE']],
      overview: 'NODE-5 was powered down at 06:00 and its cable unplugged. The upstream switch logged outbound packets from its address until 17:00. The packets are well-formed. They are addressed to nobody.',
      teaserTitle: 'Switch port history',
      teaser: () => `<div class="lines mono"><p><span>05:59:58</span> NODE-5 port 12 LINK UP</p><p><span>06:00:00</span> NODE-5 port 12 LINK DOWN <b class="warn">[cable removed]</b></p><p><span>06:00:07</span> src=NODE-5 dst=${'░'.repeat(8)} len=412</p><p><span>06:00:07</span> src=NODE-5 dst=${'░'.repeat(8)} len=412</p><p class="dim">… 6,181 more …</p></div>`,
      lockedNote: 'This case is sealed. Its owners have not given a reason.'
    },
    {
      id: 'DD-006', title: 'Subject Unknown', cls: 'IDENTITY', status: 'RESTRICTED', difficulty: 2, minutes: 30, evidence: 5, opened: '2025-09-30',
      tagline: 'An identity that fits no one, and photographs that fit no year.',
      desc: 'An incomplete identity record with contradictory evidence.',
      keywords: 'identity person record photograph fingerprint contradictory',
      art: 'identity', playable: false,
      meta: [['FORMAT', 'IDENTITY DOSSIER'], ['SIZE', '5 EXHIBITS'], ['CUSTODIAN', 'WITHHELD'], ['INTEGRITY', 'CONTRADICTORY']],
      overview: 'A fingerprint belongs to a person recorded as deceased long ago. A photograph of the same person is dated in a year that has not happened. The file names nobody. It is certain only that someone was here.',
      teaserTitle: 'Exhibit 2, photograph metadata',
      teaser: () => `${kv([['Subject', rd(10)], ['Photo date', '2031-██-██'], ['Print match', 'DECEASED · 1998'], ['Confidence', '99.4%']])}`,
      lockedNote: 'This case is not yet cleared. Check back when the archive has more to say.'
    }
  ];

  DD.byId = (id) => DD.cases.find((c) => c.id.toLowerCase() === String(id).toLowerCase());
  DD.frameSVG = frameSVG;
})();
