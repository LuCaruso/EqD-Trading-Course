/* Plot — mini biblioteca de gráficos em canvas (offline), com crosshair e tooltip.
   Plot.line(container, {series:[{x,y,label,color,dash,width,fill}], xLabel, yLabel,
     vlines:[{x,label,color}], hlines:[{y,label,color}], points:[{x,y,color,label}],
     xFmt, yFmt, yMin, yMax, xMin, xMax, height, zeroLine})
   Plot.bars(container, {labels, values, colors, yFmt, height})
   Plot.hist(container, {data, bins, color, xFmt, height, vlines}) */
(function (global) {
  'use strict';
  const css = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
  const PALETTE = () => [css('--c1') || '#f5a623', css('--c2') || '#4cc9f0', css('--c3') || '#26d07c', css('--c4') || '#ff5c8a', css('--c5') || '#b388ff', css('--c6') || '#ffd166'];

  function niceStep(range, target) {
    const raw = range / Math.max(1, target), mag = Math.pow(10, Math.floor(Math.log10(raw)));
    const n = raw / mag;
    return (n < 1.5 ? 1 : n < 3 ? 2 : n < 7 ? 5 : 10) * mag;
  }
  function ticks(min, max, target) {
    if (!(max > min)) { max = min + 1; }
    const st = niceStep(max - min, target), out = [];
    for (let v = Math.ceil(min / st) * st; v <= max + st * 1e-9; v += st) out.push(Math.abs(v) < st * 1e-9 ? 0 : v);
    return out;
  }
  const defFmt = v => {
    const a = Math.abs(v);
    if (a >= 1e6) return (v / 1e6).toLocaleString('pt-BR', { maximumFractionDigits: 2 }) + 'M';
    if (a >= 1e4) return (v / 1e3).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + 'k';
    if (a >= 100) return v.toLocaleString('pt-BR', { maximumFractionDigits: 0 });
    if (a >= 1) return v.toLocaleString('pt-BR', { maximumFractionDigits: 2 });
    return v.toLocaleString('pt-BR', { maximumFractionDigits: 4 });
  };

  function setup(container, height) {
    container.innerHTML = '';
    container.classList.add('plot');
    const wrap = document.createElement('div'); wrap.className = 'plot-wrap';
    const cv = document.createElement('canvas'); const tip = document.createElement('div'); tip.className = 'plot-tip';
    wrap.appendChild(cv); wrap.appendChild(tip); container.appendChild(wrap);
    const legend = document.createElement('div'); legend.className = 'plot-legend'; container.appendChild(legend);
    const W = Math.max(260, container.clientWidth || 600), H = height || 280, dpr = window.devicePixelRatio || 1;
    cv.width = W * dpr; cv.height = H * dpr; cv.style.width = W + 'px'; cv.style.height = H + 'px';
    const ctx = cv.getContext('2d'); ctx.scale(dpr, dpr);
    return { cv, ctx, tip, legend, W, H, wrap };
  }

  function line(container, o) {
    const S = setup(container, o.height);
    const { ctx, W, H } = S;
    const pal = PALETTE();
    const series = (o.series || []).filter(s => s && s.x && s.x.length);
    series.forEach((s, i) => { s.color = s.color || pal[i % pal.length]; });
    let xmin = Infinity, xmax = -Infinity, ymin = Infinity, ymax = -Infinity;
    series.forEach(s => { for (let i = 0; i < s.x.length; i++) { const x = s.x[i], y = s.y[i]; if (!isFinite(y) || !isFinite(x)) continue; if (x < xmin) xmin = x; if (x > xmax) xmax = x; if (y < ymin) ymin = y; if (y > ymax) ymax = y; } });
    (o.points || []).forEach(p => { if (p.y < ymin) ymin = p.y; if (p.y > ymax) ymax = p.y; });
    if (o.zeroLine !== false && ymin > 0 && ymin < (ymax - ymin) * 0.25) ymin = 0;
    if (o.xMin != null) xmin = o.xMin; if (o.xMax != null) xmax = o.xMax;
    if (o.yMin != null) ymin = o.yMin; if (o.yMax != null) ymax = o.yMax;
    if (!isFinite(ymin)) { ymin = 0; ymax = 1; }
    if (ymax - ymin < 1e-12) { const c = ymin; ymin = c - (Math.abs(c) * 0.1 || 1); ymax = c + (Math.abs(c) * 0.1 || 1); }
    const pad = (ymax - ymin) * 0.08; if (o.yMin == null) ymin -= pad; if (o.yMax == null) ymax += pad;
    const xf = o.xFmt || defFmt, yf = o.yFmt || defFmt, ytf = o.yTickFmt || (Math.max(Math.abs(ymin), Math.abs(ymax)) >= 1e4 ? defFmt : yf);
    const L = 58, R = 14, T = 12, B = o.xLabel ? 40 : 26;
    const pw = W - L - R, ph = H - T - B;
    const X = x => L + (x - xmin) / (xmax - xmin) * pw, Y = y => T + (1 - (y - ymin) / (ymax - ymin)) * ph;
    const grid = css('--grid') || '#1f2833', axis = css('--muted') || '#7d8a99';
    ctx.font = '11px ' + (css('--mono') || 'monospace');
    ctx.fillStyle = axis; ctx.strokeStyle = grid; ctx.lineWidth = 1;
    ticks(ymin, ymax, 5).forEach(v => { const y = Math.round(Y(v)) + 0.5; ctx.beginPath(); ctx.moveTo(L, y); ctx.lineTo(W - R, y); ctx.stroke(); ctx.textAlign = 'right'; ctx.textBaseline = 'middle'; ctx.fillText(ytf(v), L - 6, y); });
    ticks(xmin, xmax, Math.max(3, Math.floor(pw / 80))).forEach(v => { const x = Math.round(X(v)) + 0.5; ctx.beginPath(); ctx.moveTo(x, T); ctx.lineTo(x, T + ph); ctx.stroke(); ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.fillText(xf(v), x, T + ph + 5); });
    if (ymin < 0 && ymax > 0) { ctx.strokeStyle = axis; ctx.beginPath(); ctx.moveTo(L, Y(0) + 0.5); ctx.lineTo(W - R, Y(0) + 0.5); ctx.stroke(); }
    if (o.xLabel) { ctx.textAlign = 'center'; ctx.fillStyle = axis; ctx.fillText(o.xLabel, L + pw / 2, H - 13); }
    if (o.yLabel) { ctx.save(); ctx.translate(11, T + ph / 2); ctx.rotate(-Math.PI / 2); ctx.textAlign = 'center'; ctx.fillText(o.yLabel, 0, 0); ctx.restore(); }
    ctx.save(); ctx.beginPath(); ctx.rect(L, T, pw, ph); ctx.clip();
    (o.bands || []).forEach(b => { ctx.fillStyle = b.color || 'rgba(255,255,255,0.05)'; ctx.fillRect(X(b.x0), T, X(b.x1) - X(b.x0), ph); });
    (o.vlines || []).forEach(v => { ctx.strokeStyle = v.color || axis; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(X(v.x), T); ctx.lineTo(X(v.x), T + ph); ctx.stroke(); ctx.setLineDash([]); if (v.label) { ctx.fillStyle = v.color || axis; ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText(v.label, X(v.x) + 4, T + 2); } });
    (o.hlines || []).forEach(v => { ctx.strokeStyle = v.color || axis; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(L, Y(v.y)); ctx.lineTo(W - R, Y(v.y)); ctx.stroke(); ctx.setLineDash([]); if (v.label) { ctx.fillStyle = v.color || axis; ctx.textAlign = 'right'; ctx.textBaseline = 'bottom'; ctx.fillText(v.label, W - R - 4, Y(v.y) - 2); } });
    series.forEach(s => {
      if (s.fill) {
        ctx.fillStyle = s.fill; ctx.beginPath(); let started = false;
        for (let i = 0; i < s.x.length; i++) { if (!isFinite(s.y[i])) continue; const px = X(s.x[i]), py = Y(s.y[i]); if (!started) { ctx.moveTo(px, Y(Math.max(ymin, Math.min(0, ymax)))); ctx.lineTo(px, py); started = true; } else ctx.lineTo(px, py); }
        ctx.lineTo(X(s.x[s.x.length - 1]), Y(Math.max(ymin, Math.min(0, ymax)))); ctx.closePath(); ctx.fill();
      }
      ctx.strokeStyle = s.color; ctx.lineWidth = s.width || 2; ctx.setLineDash(s.dash || []);
      ctx.beginPath(); let pen = false;
      for (let i = 0; i < s.x.length; i++) { const y = s.y[i]; if (!isFinite(y)) { pen = false; continue; } const px = X(s.x[i]), py = Y(y); if (!pen) { ctx.moveTo(px, py); pen = true; } else ctx.lineTo(px, py); }
      ctx.stroke(); ctx.setLineDash([]);
    });
    (o.points || []).forEach(p => { ctx.fillStyle = p.color || pal[0]; ctx.beginPath(); ctx.arc(X(p.x), Y(p.y), p.r || 4, 0, 2 * Math.PI); ctx.fill(); if (p.label) { ctx.fillStyle = axis; ctx.textAlign = 'left'; ctx.textBaseline = 'bottom'; ctx.fillText(p.label, X(p.x) + 6, Y(p.y) - 4); } });
    ctx.restore();
    // legenda
    S.legend.innerHTML = series.filter(s => s.label).map(s => `<span><i style="background:${s.color}"></i>${s.label}</span>`).join('');
    // crosshair
    const base = ctx.getImageData(0, 0, S.cv.width, S.cv.height);
    S.cv.onmousemove = e => {
      const rect = S.cv.getBoundingClientRect(), mx = e.clientX - rect.left;
      if (mx < L || mx > W - R) { S.tip.style.display = 'none'; ctx.putImageData(base, 0, 0); return; }
      const xv = xmin + (mx - L) / pw * (xmax - xmin);
      ctx.putImageData(base, 0, 0);
      ctx.strokeStyle = axis; ctx.setLineDash([2, 3]); ctx.beginPath(); ctx.moveTo(mx, T); ctx.lineTo(mx, T + ph); ctx.stroke(); ctx.setLineDash([]);
      let html = `<b>${o.xName || 'x'}: ${xf(xv)}</b>`;
      series.forEach(s => {
        let lo = 0, hi = s.x.length - 1; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (s.x[m] < xv) lo = m; else hi = m; }
        const i = Math.abs(s.x[lo] - xv) < Math.abs(s.x[hi] - xv) ? lo : hi; const y = s.y[i];
        if (!isFinite(y)) return;
        ctx.fillStyle = s.color; ctx.beginPath(); ctx.arc(X(s.x[i]), Y(y), 3.5, 0, 2 * Math.PI); ctx.fill();
        html += `<br><i style="background:${s.color}"></i>${s.label || ''} ${yf(y)}`;
      });
      S.tip.innerHTML = html; S.tip.style.display = 'block';
      const tw = S.tip.offsetWidth; S.tip.style.left = (mx + 12 + tw > W ? mx - tw - 12 : mx + 12) + 'px'; S.tip.style.top = (T + 6) + 'px';
    };
    S.cv.onmouseleave = () => { S.tip.style.display = 'none'; ctx.putImageData(base, 0, 0); };
    return S;
  }

  function bars(container, o) {
    const S = setup(container, o.height || 220); const { ctx, W, H } = S;
    const vals = o.values, n = vals.length; const pal = PALETTE();
    let ymin = Math.min(0, ...vals), ymax = Math.max(0, ...vals); if (ymax === ymin) ymax = ymin + 1;
    ymax += (ymax - ymin) * 0.08; if (ymin < 0) ymin -= (ymax - ymin) * 0.08;
    const L = 52, R = 10, T = 10, B = 36, pw = W - L - R, ph = H - T - B;
    const Y = y => T + (1 - (y - ymin) / (ymax - ymin)) * ph, yf = o.yFmt || defFmt, ytf = o.yTickFmt || (Math.max(Math.abs(ymin), Math.abs(ymax)) >= 1e4 ? defFmt : yf);
    const grid = css('--grid'), axis = css('--muted');
    ctx.font = '11px ' + (css('--mono') || 'monospace'); ctx.strokeStyle = grid;
    ticks(ymin, ymax, 4).forEach(v => { const y = Math.round(Y(v)) + .5; ctx.beginPath(); ctx.moveTo(L, y); ctx.lineTo(W - R, y); ctx.stroke(); ctx.fillStyle = axis; ctx.textAlign = 'right'; ctx.textBaseline = 'middle'; ctx.fillText(ytf(v), L - 5, y); });
    const bw = pw / n;
    vals.forEach((v, i) => {
      const c = (o.colors && o.colors[i]) || (v >= 0 ? (css('--up') || pal[2]) : (css('--down') || pal[3]));
      ctx.fillStyle = c; const y0 = Y(0), y1 = Y(v);
      ctx.fillRect(L + i * bw + bw * 0.15, Math.min(y0, y1), bw * 0.7, Math.max(1, Math.abs(y1 - y0)));
      ctx.fillStyle = axis; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      const lab = o.labels[i] || ''; if (n <= 16 || i % Math.ceil(n / 16) === 0) ctx.fillText(lab, L + i * bw + bw / 2, T + ph + 6);
    });
    S.cv.onmousemove = e => {
      const r = S.cv.getBoundingClientRect(), mx = e.clientX - r.left, i = Math.floor((mx - L) / bw);
      if (i < 0 || i >= n) { S.tip.style.display = 'none'; return; }
      S.tip.innerHTML = `<b>${o.labels[i]}</b><br>${yf(vals[i])}`; S.tip.style.display = 'block'; S.tip.style.left = Math.min(mx + 10, W - 120) + 'px'; S.tip.style.top = '8px';
    };
    S.cv.onmouseleave = () => { S.tip.style.display = 'none'; };
    return S;
  }

  function hist(container, o) {
    const d = o.data.filter(isFinite); if (!d.length) { container.innerHTML = ''; return; }
    const nb = o.bins || 40; let mn = Math.min(...d), mx = Math.max(...d); if (mx === mn) { mx = mn + 1; }
    const w = (mx - mn) / nb, counts = new Array(nb).fill(0);
    d.forEach(v => { counts[Math.min(nb - 1, Math.floor((v - mn) / w))]++; });
    const xs = [], ys = [];
    counts.forEach((c, i) => { xs.push(mn + i * w, mn + (i + 1) * w); ys.push(c / d.length, c / d.length); });
    return line(container, { series: [{ x: xs, y: ys, color: o.color, fill: o.fill || 'rgba(76,201,240,0.18)', label: o.label }], xFmt: o.xFmt, yFmt: v => (v * 100).toFixed(1) + '%', height: o.height, vlines: o.vlines, xLabel: o.xLabel, xName: o.xName || 'PnL', yMin: 0 });
  }

  function linspace(a, b, n) { const out = []; for (let i = 0; i < n; i++) out.push(a + (b - a) * i / (n - 1)); return out; }

  global.Plot = { line, bars, hist, linspace, ticks };
})(window);
