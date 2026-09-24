/* FX — efeitos visuais e sonoros: confetti, partículas, +XP flutuante, shake,
   celebração de nível, sons sintetizados (WebAudio), contadores animados,
   ticker de mercado e gráfico "ao vivo". Tudo offline. */
(function (global) {
  'use strict';
  const COLORS = ['#f5a623', '#ffd166', '#26d07c', '#4cc9f0', '#ff5c8a', '#b388ff'];
  const reduce = () => { const st = global.Store && Store.s && Store.s.settings; return !!st && st.fx === false; };

  /* ---------------- canvas de partículas ---------------- */
  let cv, ctx, parts = [], running = false;
  function ensure() {
    if (cv) return;
    cv = document.createElement('canvas'); cv.id = 'fxcanvas';
    document.body.appendChild(cv); ctx = cv.getContext('2d');
    const rs = () => { const d = window.devicePixelRatio || 1; cv.width = innerWidth * d; cv.height = innerHeight * d; cv.style.width = innerWidth + 'px'; cv.style.height = innerHeight + 'px'; ctx.setTransform(d, 0, 0, d, 0, 0); };
    rs(); addEventListener('resize', rs);
  }
  function loop() {
    running = true;
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    parts = parts.filter(p => p.life > 0);
    for (const p of parts) {
      p.vx *= p.drag; p.vy = p.vy * p.drag + p.g; p.x += p.vx; p.y += p.vy; p.rot += p.vr; p.life--;
      const a = Math.min(1, p.life / 30);
      ctx.save(); ctx.globalAlpha = a; ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.fillStyle = p.c;
      if (p.shape === 'rect') ctx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2);
      else if (p.shape === 'star') { star(ctx, p.s); ctx.fill(); }
      else { ctx.beginPath(); ctx.arc(0, 0, p.s / 2, 0, 6.283); ctx.fill(); }
      ctx.restore();
    }
    if (parts.length) requestAnimationFrame(loop); else { running = false; ctx.clearRect(0, 0, innerWidth, innerHeight); }
  }
  function star(c, s) { c.beginPath(); for (let i = 0; i < 10; i++) { const r = i % 2 ? s * 0.22 : s * 0.55, a = i * Math.PI / 5; c.lineTo(Math.cos(a) * r, Math.sin(a) * r); } c.closePath(); }
  function spawn(p) { ensure(); parts.push(p); if (!running) requestAnimationFrame(loop); }

  function burst(x, y, n, opt) {
    if (reduce()) return;
    opt = opt || {};
    for (let i = 0; i < (n || 40); i++) {
      const a = Math.random() * Math.PI * 2, sp = (opt.speed || 7) * (0.3 + Math.random());
      spawn({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - (opt.up || 2), g: opt.g == null ? 0.18 : opt.g, drag: 0.97, s: 5 + Math.random() * 7, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.4, life: 60 + Math.random() * 50, c: (opt.colors || COLORS)[Math.floor(Math.random() * (opt.colors || COLORS).length)], shape: opt.shape || (Math.random() < 0.5 ? 'rect' : Math.random() < 0.5 ? 'star' : 'dot') });
    }
  }
  function confetti(n) {
    if (reduce()) return;
    for (let i = 0; i < (n || 160); i++) {
      spawn({ x: Math.random() * innerWidth, y: -20 - Math.random() * innerHeight * 0.4, vx: (Math.random() - 0.5) * 3, vy: 2 + Math.random() * 4, g: 0.06, drag: 0.995, s: 7 + Math.random() * 7, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.3, life: 200 + Math.random() * 120, c: COLORS[Math.floor(Math.random() * COLORS.length)], shape: Math.random() < 0.7 ? 'rect' : 'star' });
    }
  }
  function fromEl(el, n, opt) { if (!el) return; const r = el.getBoundingClientRect(); burst(r.left + r.width / 2, r.top + r.height / 2, n, opt); }

  function floatText(x, y, html, cls) {
    const d = document.createElement('div'); d.className = 'fx-float ' + (cls || ''); d.innerHTML = html;
    d.style.left = x + 'px'; d.style.top = y + 'px';
    document.body.appendChild(d); setTimeout(() => d.remove(), 1600);
  }
  function floatFromEl(el, html, cls) { if (!el) return floatText(innerWidth / 2, innerHeight / 2, html, cls); const r = el.getBoundingClientRect(); floatText(r.left + r.width / 2, r.top, html, cls); }
  function shake(el) { if (!el) return; el.classList.remove('fx-shake'); void el.offsetWidth; el.classList.add('fx-shake'); }
  function pulse(el, cls) { if (!el) return; cls = cls || 'fx-pulse'; el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); }
  function flash(color) {
    if (reduce()) return;
    const d = document.createElement('div'); d.className = 'fx-flash'; d.style.background = color || 'rgba(38,208,124,.12)';
    document.body.appendChild(d); setTimeout(() => d.remove(), 500);
  }

  function countUp(el, from, to, ms, fmt) {
    if (!el) return; fmt = fmt || (v => Q.fmt(v, 0));
    const t0 = performance.now(); ms = ms || 700;
    const step = t => { const k = Math.min(1, (t - t0) / ms), e = 1 - Math.pow(1 - k, 3); el.textContent = fmt(from + (to - from) * e); if (k < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  }

  /* ---------------- celebração em tela cheia ---------------- */
  function celebrate(title, sub, big, opt) {
    opt = opt || {};
    const d = document.createElement('div'); d.className = 'fx-celebrate';
    d.innerHTML = `<div class="rays"></div><div class="inner"><div class="big">${big || ''}</div><div class="t">${title}</div><div class="s">${sub || ''}</div><button class="btn pri">${opt.btn || 'Continuar'}</button></div>`;
    document.body.appendChild(d);
    const close = () => { d.classList.add('out'); setTimeout(() => d.remove(), 350); if (opt.onClose) opt.onClose(); };
    d.querySelector('button').onclick = close; d.onclick = e => { if (e.target === d) close(); };
    confetti(opt.n || 220); Sound.play(opt.sound || 'level');
    if (opt.auto) setTimeout(close, opt.auto);
    return d;
  }

  /* ---------------- sons (WebAudio, sintetizados) ---------------- */
  const Sound = (function () {
    let ac = null;
    const on = () => !(global.Store && Store.s && Store.s.settings && Store.s.settings.sound === false);
    function ctxA() { if (!ac) { try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { ac = null; } } if (ac && ac.state === 'suspended') ac.resume(); return ac; }
    function tone(freq, t0, dur, type, vol, glideTo) {
      const a = ctxA(); if (!a) return;
      const o = a.createOscillator(), g = a.createGain();
      o.type = type || 'sine'; o.frequency.setValueAtTime(freq, a.currentTime + t0);
      if (glideTo) o.frequency.exponentialRampToValueAtTime(glideTo, a.currentTime + t0 + dur);
      g.gain.setValueAtTime(0.0001, a.currentTime + t0);
      g.gain.exponentialRampToValueAtTime(vol || 0.12, a.currentTime + t0 + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + t0 + dur);
      o.connect(g); g.connect(a.destination); o.start(a.currentTime + t0); o.stop(a.currentTime + t0 + dur + 0.05);
    }
    const lib = {
      ok: c => { const b = 660 * Math.pow(2, Math.min(c || 0, 12) / 12); tone(b, 0, 0.12, 'triangle', 0.13); tone(b * 1.5, 0.07, 0.18, 'triangle', 0.11); },
      bad: () => { tone(180, 0, 0.22, 'sawtooth', 0.05, 110); },
      click: () => tone(1200, 0, 0.03, 'square', 0.02),
      coin: () => { tone(988, 0, 0.08, 'square', 0.05); tone(1319, 0.07, 0.22, 'square', 0.05); },
      crit: () => { [880, 1109, 1319, 1760].forEach((f, i) => tone(f, i * 0.05, 0.16, 'triangle', 0.09)); },
      level: () => { [523, 659, 784, 1047, 1319, 1568].forEach((f, i) => tone(f, i * 0.09, 0.35, 'triangle', 0.1)); tone(262, 0, 0.9, 'sine', 0.08); },
      badge: () => { [1319, 1568, 2093].forEach((f, i) => tone(f, i * 0.08, 0.3, 'sine', 0.08)); },
      chest: () => { [392, 523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.06, 0.25, 'square', 0.04)); },
      tick: () => tone(2000, 0, 0.015, 'square', 0.015),
      whoosh: () => tone(300, 0, 0.25, 'sine', 0.04, 900)
    };
    return { play: (n, arg) => { if (!on()) return; try { lib[n] && lib[n](arg); } catch (e) { } } };
  })();

  /* ---------------- ticker de mercado (simulado) ---------------- */
  const TICKS = [['IBOV', 131000, 0.2], ['PETR4', 38.5, 0.3], ['VALE3', 62.1, 0.28], ['BOVA11', 126.4, 0.2], ['ITUB4', 35.2, 0.24], ['DI1F27', 14.2, 0.08, 'rate'], ['USDBRL', 5.35, 0.14], ['SPX', 5800, 0.16], ['NDX', 20500, 0.2], ['VIX', 16.5, 0.9, 'vix'], ['AAPL', 225, 0.25], ['NVDA', 120, 0.5], ['TSLA', 240, 0.6]];
  function startTicker(el) {
    if (!el) return;
    const st = TICKS.map(t => ({ s: t[0], p: t[1], p0: t[1], v: t[2], k: t[3] }));
    const fmtP = x => x.p >= 1000 ? Q.fmt(x.p, 0) : Q.fmt(x.p, 2);
    const render = () => st.map(x => { const ch = x.p / x.p0 - 1; return `<span class="tk ${ch >= 0 ? 'up' : 'down'}" data-s="${x.s}"><b>${x.s}</b> ${fmtP(x)} <i>${ch >= 0 ? '▲' : '▼'} ${Q.fmt(ch * 100, 2)}%</i></span>`; }).join('');
    el.innerHTML = `<div class="tk-track"><div class="tk-row">${render()}</div><div class="tk-row">${render()}</div></div>`;
    setInterval(() => {
      if (document.hidden) return;
      const x = st[Math.floor(Math.random() * st.length)];
      const dt = 1 / (252 * 390), z = (Math.random() + Math.random() + Math.random() - 1.5) * 1.4;
      x.p *= Math.exp(x.v * Math.sqrt(dt * 30) * z - (x.k === 'vix' ? (x.p - x.p0) / x.p0 * 0.02 : 0));
      el.querySelectorAll(`[data-s="${x.s}"]`).forEach(n => {
        const ch = x.p / x.p0 - 1; n.className = 'tk ' + (ch >= 0 ? 'up' : 'down') + (z >= 0 ? ' fup' : ' fdown');
        n.innerHTML = `<b>${x.s}</b> ${fmtP(x)} <i>${ch >= 0 ? '▲' : '▼'} ${Q.fmt(ch * 100, 2)}%</i>`;
      });
    }, 450);
  }

  /* ---------------- gráfico "ao vivo" (hero do painel) ---------------- */
  function liveChart(el) {
    if (!el) return;
    const c = document.createElement('canvas'); el.appendChild(c);
    const g = c.getContext('2d'); let W, H, data = [], v = 100;
    const rs = () => { const d = devicePixelRatio || 1; W = el.clientWidth; H = el.clientHeight; c.width = W * d; c.height = H * d; c.style.width = W + 'px'; c.style.height = H + 'px'; g.setTransform(d, 0, 0, d, 0, 0); };
    rs(); addEventListener('resize', rs);
    for (let i = 0; i < 160; i++) { v *= Math.exp(0.012 * (Math.random() - 0.49)); data.push(v); }
    let alive = true;
    const obs = new MutationObserver(() => { if (!document.body.contains(el)) { alive = false; obs.disconnect(); } });
    obs.observe(document.body, { childList: true, subtree: true });
    let last = 0;
    function frame(t) {
      if (!alive) return;
      if (t - last > 120) { last = t; v *= Math.exp(0.012 * (Math.random() - 0.495)); data.push(v); if (data.length > 160) data.shift(); }
      const mn = Math.min(...data), mx = Math.max(...data);
      g.clearRect(0, 0, W, H);
      const X = i => i / (data.length - 1) * W, Y = y => H - 8 - (y - mn) / (mx - mn || 1) * (H - 16);
      const up = data[data.length - 1] >= data[0];
      const col = up ? '38,208,124' : '255,92,92';
      const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, `rgba(${col},.28)`); gr.addColorStop(1, `rgba(${col},0)`);
      g.beginPath(); data.forEach((y, i) => i ? g.lineTo(X(i), Y(y)) : g.moveTo(X(i), Y(y))); g.lineTo(W, H); g.lineTo(0, H); g.closePath(); g.fillStyle = gr; g.fill();
      g.beginPath(); data.forEach((y, i) => i ? g.lineTo(X(i), Y(y)) : g.moveTo(X(i), Y(y))); g.strokeStyle = `rgba(${col},.9)`; g.lineWidth = 2; g.stroke();
      const lx = X(data.length - 1), ly = Y(data[data.length - 1]);
      g.beginPath(); g.arc(lx - 2, ly, 4 + Math.sin(t / 180) * 1.5, 0, 6.283); g.fillStyle = `rgb(${col})`; g.fill();
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  global.FX = { burst, confetti, fromEl, floatText, floatFromEl, shake, pulse, flash, countUp, celebrate, startTicker, liveChart };
  global.Sound = Sound;
})(window);
