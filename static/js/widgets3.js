/* Widgets v5: gráficos da mesa (candles, vol realizada × implícita, IV rank, cone de vol),
   bid/offer (conversor e custo de execução), carry do portfólio e fronteira eficiente. */
(function () {
  'use strict';
  const { h } = UI;
  const W = Sims.widgets;
  const f2 = x => Q.fmt(x, 2), pc = (x, d) => Q.fmt(x * 100, d == null ? 1 : d) + '%';
  const card = (el, title) => { const b = h(`<div class="card wx" style="margin:16px 0"><div class="mono muted" style="font-size:12px;margin-bottom:8px">${title}</div></div>`); el.appendChild(b); return b; };
  const stats = items => `<div class="wx-stats">${items.map(([k, v, cls]) => `<div><span>${k}</span><b class="${cls || ''}">${v}</b></div>`).join('')}</div>`;
  const css = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();

  /* ---------- Mercado simulado: GARCH(1,1) + saltos, OHLC, volume e vol implícita ---------- */
  function market(seed, n) {
    const R = Q.rng(seed || 1), out = { o: [], h: [], l: [], c: [], v: [], iv: [], ret: [] };
    const om = 0.000004, al = 0.08, be = 0.9;            // variância diária de longo prazo = om/(1-al-be) ≈ 0.0002 (≈ 22% a.a.)
    let v = om / (1 - al - be), S = 50, ivPrem = 0.02;
    for (let i = 0; i < n; i++) {
      let z = R.normal(); if (R() < 0.004) z -= 2 + 2 * R();  // saltos para baixo raros
      const r = Math.sqrt(v) * z, o = S * Math.exp(0.15 * Math.sqrt(v) * R.normal());
      const c = S * Math.exp(r);
      let hi = Math.max(o, c), lo = Math.min(o, c), x = o;
      for (let k = 0; k < 6; k++) { x = x * Math.exp(Math.sqrt(v / 6) * R.normal()); hi = Math.max(hi, x); lo = Math.min(lo, x); }
      out.o.push(o); out.c.push(c); out.h.push(hi); out.l.push(lo); out.ret.push(Math.log(c / S));
      out.v.push(Math.round(1e6 * (0.6 + 0.8 * R() + 1.5 * Math.abs(z))));
      v = om + al * r * r + be * v;
      ivPrem = 0.9 * ivPrem + 0.1 * (0.03 + 0.01 * R.normal());
      out.iv.push(Math.max(0.05, Math.sqrt(252 * v) + ivPrem + 0.004 * R.normal()));
      S = c;
    }
    return out;
  }
  function rv(ret, i, w) { if (i + 1 < w) return NaN; let s = 0; for (let k = i - w + 1; k <= i; k++) s += ret[k] * ret[k]; return Math.sqrt(252 * s / w); }
  Sims.market = market; Sims.rv = rv;

  function candleChart(box, m, from, maOn) {
    box.innerHTML = '';
    const wrap = h('<div style="position:relative"></div>'), cv = document.createElement('canvas'), tip = h('<div class="plot-tip"></div>');
    wrap.append(cv, tip); box.appendChild(wrap);
    const Wd = Math.max(300, box.clientWidth || 700), Ht = 300, dpr = window.devicePixelRatio || 1;
    cv.width = Wd * dpr; cv.height = Ht * dpr; cv.style.width = Wd + 'px'; cv.style.height = Ht + 'px';
    const ctx = cv.getContext('2d'); ctx.scale(dpr, dpr);
    const N = m.c.length - from, padL = 52, padR = 10, top = 10, pH = 200, vTop = 222, vH = 60;
    let lo = Infinity, hi = -Infinity, vmax = 0;
    for (let i = from; i < m.c.length; i++) { lo = Math.min(lo, m.l[i]); hi = Math.max(hi, m.h[i]); vmax = Math.max(vmax, m.v[i]); }
    const pad = (hi - lo) * 0.05; lo -= pad; hi += pad;
    const cw = (Wd - padL - padR) / N, X = i => padL + (i - from + 0.5) * cw, Y = p => top + (hi - p) / (hi - lo) * pH;
    ctx.font = '11px ' + (css('--mono') || 'monospace'); ctx.fillStyle = css('--muted') || '#7d8b9b'; ctx.strokeStyle = css('--grid') || '#1a2430'; ctx.lineWidth = 1;
    Plot.ticks(lo, hi, 5).forEach(t => { const y = Y(t); ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(Wd - padR, y); ctx.stroke(); ctx.fillText(Q.fmt(t, 2), 4, y + 4); });
    const up = css('--c3') || '#26d07c', dn = css('--c4') || '#ff5c8a';
    for (let i = from; i < m.c.length; i++) {
      const x = X(i), col = m.c[i] >= m.o[i] ? up : dn;
      ctx.strokeStyle = col; ctx.beginPath(); ctx.moveTo(x, Y(m.h[i])); ctx.lineTo(x, Y(m.l[i])); ctx.stroke();
      const y1 = Y(Math.max(m.o[i], m.c[i])), y2 = Y(Math.min(m.o[i], m.c[i]));
      ctx.fillStyle = col; ctx.fillRect(x - Math.max(1, cw * 0.35), y1, Math.max(2, cw * 0.7), Math.max(1, y2 - y1));
      ctx.globalAlpha = 0.35; ctx.fillRect(x - Math.max(1, cw * 0.35), vTop + vH - m.v[i] / vmax * vH, Math.max(2, cw * 0.7), m.v[i] / vmax * vH); ctx.globalAlpha = 1;
    }
    const ma = (w, col) => { ctx.strokeStyle = col; ctx.lineWidth = 1.5; ctx.beginPath(); let st = false; for (let i = from; i < m.c.length; i++) { if (i + 1 < w) continue; let s = 0; for (let k = i - w + 1; k <= i; k++) s += m.c[k]; const y = Y(s / w); if (!st) { ctx.moveTo(X(i), y); st = true; } else ctx.lineTo(X(i), y); } ctx.stroke(); ctx.lineWidth = 1; };
    ctx.save(); ctx.beginPath(); ctx.rect(padL, top, Wd - padL - padR, pH); ctx.clip();
    if (maOn) { ma(20, css('--c1') || '#f5a623'); ma(50, css('--c5') || '#b388ff'); }
    ctx.restore();
    ctx.fillStyle = css('--muted') || '#7d8b9b'; ctx.fillText('volume', 4, vTop + 12);
    if (maOn) { ctx.fillStyle = css('--c1'); ctx.fillText('MM20', Wd - 90, 20); ctx.fillStyle = css('--c5'); ctx.fillText('MM50', Wd - 48, 20); }
    cv.onmousemove = e => {
      const r = cv.getBoundingClientRect(), i = from + Math.floor((e.clientX - r.left - padL) / cw);
      if (i < from || i >= m.c.length) { tip.style.display = 'none'; return; }
      tip.style.display = 'block'; tip.style.left = Math.min(Wd - 170, e.clientX - r.left + 12) + 'px'; tip.style.top = '8px';
      tip.innerHTML = `dia ${i - from + 1}<br>A ${f2(m.o[i])} · M ${f2(m.h[i])}<br>m ${f2(m.l[i])} · F ${f2(m.c[i])}<br>var ${pc(m.c[i] / m.c[i - 1] - 1, 2)} · IV ${pc(m.iv[i])}`;
    };
    cv.onmouseleave = () => { tip.style.display = 'none'; };
  }

  W.candles = function (el) {
    const box = card(el, 'Mercado simulado (ação fictícia): candles diários, médias móveis, volume, vol realizada × implícita e IV rank');
    let seed = 11;
    const ctl = Sims.controls([
      { k: 'w', label: 'Janela da vol realizada', type: 'select', v: 21, options: [[10, '10 dias'], [21, '21 dias'], [63, '63 dias']] },
      { k: 'ma', label: 'Médias móveis', type: 'select', v: 1, options: [[1, 'Mostrar MM20/MM50'], [0, 'Esconder']] }
    ], draw, 180);
    const btn = h('<button class="btn sm" style="margin:6px 0">↻ Novo mercado</button>');
    const out = h('<div></div>'), cc = h('<div></div>'), pp = h('<div class="pp" style="margin-top:6px"></div>');
    box.append(ctl, btn, out, cc, pp);
    btn.onclick = () => { seed = 1 + Math.floor(Math.random() * 1e6); draw(ctl.vals); };
    function draw(v) {
      const n = 252 + 150, m = market(seed, n), from = n - 150, last = n - 1, w = +v.w;
      const ivs = m.iv.slice(n - 252), ivNow = m.iv[last], mn = Math.min(...ivs), mx = Math.max(...ivs);
      const rank = (ivNow - mn) / (mx - mn), pctl = ivs.filter(x => x < ivNow).length / ivs.length, rvNow = rv(m.ret, last, w);
      out.innerHTML = stats([['Último', f2(m.c[last])], ['Variação no dia', pc(m.c[last] / m.c[last - 1] - 1, 2), m.c[last] >= m.c[last - 1] ? 'up' : 'down'], ['Vol realizada ' + w + 'd', pc(rvNow)], ['Vol implícita (ATM 1m)', pc(ivNow), 'amber'], ['IV − RV', Q.fmt((ivNow - rvNow) * 100, 1) + ' pts', ivNow > rvNow ? 'up' : 'down'], ['IV rank (1 ano)', pc(rank, 0)], ['IV percentil (1 ano)', pc(pctl, 0)]]);
      candleChart(cc, m, from, +v.ma === 1);
      const xs = [], yr = [], yi = [];
      for (let i = from; i < n; i++) { xs.push(i - from + 1); yr.push(rv(m.ret, i, w) * 100); yi.push(m.iv[i] * 100); }
      Plot.line(pp, { series: [{ x: xs, y: yi, label: 'Vol implícita', color: '#f5a623' }, { x: xs, y: yr, label: 'Vol realizada ' + w + 'd', color: '#4cc9f0' }], xName: 'dia', yFmt: x => Q.fmt(x, 1) + '%', height: 190 });
    }
    draw(ctl.vals);
  };

  W.volcone = function (el) {
    const box = card(el, 'Cone de volatilidade: distribuição histórica da vol realizada por janela × vol implícita de hoje por prazo');
    let seed = 5;
    const btn = h('<button class="btn sm" style="margin:0 0 6px">↻ Novo mercado</button>'), out = h('<div></div>'), pp = h('<div class="pp"></div>');
    box.append(btn, out, pp);
    btn.onclick = () => { seed = 1 + Math.floor(Math.random() * 1e6); draw(); };
    function draw() {
      const n = 756, m = market(seed, n), wins = [10, 21, 42, 63, 126, 252];
      const q = (arr, p) => { const a = arr.filter(isFinite).sort((x, y) => x - y); return a[Math.min(a.length - 1, Math.floor(p * (a.length - 1)))]; };
      const cone = wins.map(w => { const a = []; for (let i = w; i < n; i++) a.push(rv(m.ret, i, w)); return { w, min: q(a, 0), p25: q(a, 0.25), med: q(a, 0.5), p75: q(a, 0.75), max: q(a, 1) }; });
      const ivNow = m.iv[n - 1], rvLong = rv(m.ret, n - 1, 252);
      const ivTS = wins.map(w => ivNow + (rvLong + 0.02 - ivNow) * (1 - Math.exp(-w / 90)));   // estrutura a termo: reverte para a média longa + prêmio
      out.innerHTML = stats(wins.map((w, i) => { const c = cone[i], x = ivTS[i], lab = x > c.p75 ? 'cara (> 75%)' : x < c.p25 ? 'barata (< 25%)' : 'entre os quartis'; return [w + 'd: IV ' + pc(x, 0) + ' · mediana RV ' + pc(c.med, 0), lab, x > c.p75 ? 'down' : x < c.p25 ? 'up' : '']; }));
      const ser = (k, lab, col, dash) => ({ x: wins, y: cone.map(c => c[k] * 100), label: lab, color: col, dash });
      Plot.line(pp, { series: [ser('max', 'máx', '#ff5c8a', [4, 4]), ser('p75', '75%', '#7d8b9b'), ser('med', 'mediana', '#4cc9f0'), ser('p25', '25%', '#7d8b9b'), ser('min', 'mín', '#26d07c', [4, 4]), { x: wins, y: ivTS.map(x => x * 100), label: 'IV hoje por prazo', color: '#f5a623' }], points: wins.map((w, i) => ({ x: w, y: ivTS[i] * 100, color: '#f5a623' })), xName: 'janela / prazo (dias úteis)', yFmt: x => Q.fmt(x, 0) + '%', height: 240 });
    }
    draw();
  };

  /* ---------- Bid/offer: conversor preço × vol e custo de execução ---------- */
  W.bidoffer = function (el) {
    const box = card(el, 'Do spread em vol ao spread em R$: quanto custa cruzar (call, S = 100, r = 10%)');
    const out = h('<div></div>'), pp = h('<div class="pp"></div>');
    const ctl = Sims.controls([
      { k: 'K', label: 'Strike', min: 70, max: 130, step: 1, v: 100 },
      { k: 'd', label: 'Prazo', min: 5, max: 504, step: 1, v: 63, fmt: v => v + ' d.u.' },
      { k: 's', label: 'Vol mid', min: 0.1, max: 0.8, step: 0.005, v: 0.3, fmt: v => pc(v, 1) },
      { k: 'w', label: 'Largura bid/offer (pts de vol)', min: 0.2, max: 5, step: 0.1, v: 1, fmt: v => Q.fmt(v, 1) + ' pt' },
      { k: 'q', label: 'Quantidade de opções', min: 1000, max: 200000, step: 1000, v: 50000, fmt: v => Q.fmt(v, 0) },
      { k: 'sb', label: 'Spread da ação (bps)', min: 1, max: 30, step: 1, v: 5, fmt: v => v + ' bps' }
    ], draw, 170);
    box.append(ctl, out, pp);
    function draw(v) {
      const S = 100, r = 0.1, T = v.d / 252, g = Q.bs('call', S, v.K, T, r, 0, v.s), vpt = g.vega / 100;
      const bid = Q.bsPrice('call', S, v.K, T, r, 0, v.s - v.w / 200), ask = Q.bsPrice('call', S, v.K, T, r, 0, v.s + v.w / 200);
      const half = (ask - bid) / 2 * v.q, hedge = Math.abs(g.delta) * v.q * S * v.sb / 10000 / 2;
      out.innerHTML = stats([['Bid / ask (R$)', f2(bid) + ' / ' + f2(ask)], ['Mid', Q.fmt(g.price, 3)], ['Spread em R$ ≈ vega × largura', Q.fmt(ask - bid, 3) + ' ≈ ' + Q.fmt(vpt * v.w, 3)], ['Spread % do mid', pc((ask - bid) / g.price, 1), (ask - bid) / g.price > 0.1 ? 'down' : ''], ['Custo de cruzar (meio spread × qtd)', 'R$ ' + Q.fmt(half, 0)], ['Custo do hedge de delta (meio spread)', 'R$ ' + Q.fmt(hedge, 0)], ['Total ida, em pts de vol', Q.fmt((half + hedge) / (vpt * v.q), 2) + ' pt', 'amber']]) +
        '<p class="muted" style="font-size:13px;margin:6px 0 0">Com a mesma largura em vol, o spread em R$ é maior onde a vega é maior (ATM, prazos longos); em opções OTM o spread em R$ é pequeno, mas em % do prêmio é enorme. Seu "edge" no trade precisa pagar ida + volta + hedge.</p>';
      const Ks = Plot.linspace(70, 130, 61);
      Plot.line(pp, { series: [{ x: Ks, y: Ks.map(K => { const b = Q.bsPrice('call', S, K, T, r, 0, v.s - v.w / 200), a = Q.bsPrice('call', S, K, T, r, 0, v.s + v.w / 200); return a - b; }), label: 'Spread em R$', color: '#4cc9f0' }, { x: Ks, y: Ks.map(K => { const b = Q.bsPrice('call', S, K, T, r, 0, v.s - v.w / 200), a = Q.bsPrice('call', S, K, T, r, 0, v.s + v.w / 200), m = Q.bsPrice('call', S, K, T, r, 0, v.s); return m > 0.005 ? Math.min(1, (a - b) / m) : NaN; }), label: 'Spread / mid (fração)', color: '#ff5c8a' }], vlines: v.K === S ? [{ x: S, label: 'K = spot' }] : [{ x: v.K, label: 'K' }, { x: S, label: 'spot', color: '#7d8b9b' }], xName: 'strike', yFmt: x => Q.fmt(x, 3), height: 210 });
    }
    draw(ctl.vals);
  };

  /* ---------- Carry do portfólio ---------- */
  W.carry = function (el) {
    const box = card(el, 'Quanto o seu livro rende parado? Carry anual por fonte (R$ mil)');
    const out = h('<div></div>'), pp = h('<div class="pp"></div>');
    const ctl = Sims.controls([
      { k: 'cdi', label: 'CDI (a.a.)', min: 0.05, max: 0.16, step: 0.0025, v: 0.12, fmt: v => pc(v, 2) },
      { k: 'cash', label: 'Caixa livre (R$ mi)', min: 0, max: 50, step: 1, v: 10 },
      { k: 'inv', label: '% do caixa aplicado a CDI', min: 0, max: 1, step: 0.05, v: 0.5, fmt: v => pc(v, 0) },
      { k: 'mg', label: 'Margem exigida (R$ mi)', min: 0, max: 50, step: 1, v: 15 },
      { k: 'mgc', label: '% da margem em dinheiro', min: 0, max: 1, step: 0.05, v: 0.6, fmt: v => pc(v, 0) },
      { k: 'stk', label: 'Ações em carteira (R$ mi)', min: 0, max: 100, step: 1, v: 30 },
      { k: 'lend', label: '% doado no BTC', min: 0, max: 1, step: 0.05, v: 0, fmt: v => pc(v, 0) },
      { k: 'fee', label: 'Taxa média de doação', min: 0, max: 0.1, step: 0.0025, v: 0.01, fmt: v => pc(v, 2) },
      { k: 'sh', label: 'Posição vendida (R$ mi)', min: 0, max: 50, step: 1, v: 8 },
      { k: 'bor', label: 'Taxa média de aluguel paga', min: 0, max: 0.2, step: 0.0025, v: 0.02, fmt: v => pc(v, 2) }
    ], draw, 170);
    box.append(ctl, out, pp);
    function draw(v) {
      const k = 1000;
      const a = v.cash * v.inv * v.cdi * k, lost = v.cash * (1 - v.inv) * v.cdi * k;
      const mgT = v.mg * (1 - v.mgc) * v.cdi * k, mgLost = v.mg * v.mgc * v.cdi * k;
      const lend = v.stk * v.lend * v.fee * k, lendLost = v.stk * (1 - v.lend) * v.fee * k;
      const bor = -v.sh * v.bor * k;
      const total = a + mgT + lend + bor, pot = total + lost + mgLost + lendLost;
      out.innerHTML = stats([['Carry atual (R$ mil/ano)', Q.fmt(total, 0), total >= 0 ? 'up' : 'down'], ['Carry possível (tudo remunerado)', Q.fmt(pot, 0), 'amber'], ['Dinheiro deixado na mesa', Q.fmt(pot - total, 0), pot - total > 1 ? 'down' : 'up'], ['Retorno sobre a margem', v.mg > 0 ? pc(total / (v.mg * k), 1) : '—']]) +
        '<p class="muted" style="font-size:13px;margin:6px 0 0">Suposições didáticas: caixa não aplicado e margem em dinheiro não rendem; margem em títulos públicos (LFT) rende ~CDI (antes do deságio); ações doadas rendem a taxa média do BTC. Ajuste e veja onde está o vazamento.</p>';
      Plot.bars(pp, { labels: ['Caixa a CDI', 'Caixa parado*', 'Margem em LFT', 'Margem $*', 'BTC recebido', 'Não doado*', 'BTC pago'], values: [a, lost, mgT, mgLost, lend, lendLost, bor], colors: ['#26d07c', '#56636f', '#26d07c', '#56636f', '#4cc9f0', '#56636f', '#ff5c8a'], yFmt: x => Q.fmt(x, 0), height: 220 });
      const ghost = pp.querySelector('.plot-legend'); if (ghost) ghost.innerHTML = `<span class="muted">* Barras cinzas = quanto renderia se estivesse remunerado (oportunidade perdida): caixa parado R$ ${Q.fmt(lost, 0)} mil · margem em dinheiro R$ ${Q.fmt(mgLost, 0)} mil · ações não doadas R$ ${Q.fmt(lendLost, 0)} mil</span>`;
    }
    draw(ctl.vals);
  };

  /* ---------- Fronteira eficiente (dois ativos + ativo livre de risco) ---------- */
  W.frontier = function (el) {
    const box = card(el, 'Markowitz com dois ativos: fronteira, carteira de mínima variância e carteira tangente (máximo Sharpe)');
    const out = h('<div></div>'), pp = h('<div class="pp"></div>');
    const ctl = Sims.controls([
      { k: 'm1', label: 'Retorno esperado A', min: 0, max: 0.3, step: 0.005, v: 0.16, fmt: v => pc(v, 1) },
      { k: 's1', label: 'Vol A', min: 0.05, max: 0.6, step: 0.01, v: 0.3, fmt: v => pc(v, 0) },
      { k: 'm2', label: 'Retorno esperado B', min: 0, max: 0.3, step: 0.005, v: 0.1, fmt: v => pc(v, 1) },
      { k: 's2', label: 'Vol B', min: 0.05, max: 0.6, step: 0.01, v: 0.15, fmt: v => pc(v, 0) },
      { k: 'rho', label: 'Correlação ρ', min: -1, max: 1, step: 0.05, v: 0.2, fmt: v => Q.fmt(v, 2) },
      { k: 'rf', label: 'Livre de risco', min: 0, max: 0.15, step: 0.005, v: 0.05, fmt: v => pc(v, 1) }
    ], draw, 160);
    box.append(ctl, out, pp);
    function draw(v) {
      const { m1, s1, m2, s2, rho, rf } = v, cov = rho * s1 * s2;
      const port = w => ({ m: w * m1 + (1 - w) * m2, s: Math.sqrt(Math.max(0, w * w * s1 * s1 + (1 - w) * (1 - w) * s2 * s2 + 2 * w * (1 - w) * cov)) });
      const den = s1 * s1 + s2 * s2 - 2 * cov, wmv = den > 1e-12 ? (s2 * s2 - cov) / den : 0.5;
      const e1 = m1 - rf, e2 = m2 - rf, tden = e1 * s2 * s2 + e2 * s1 * s1 - (e1 + e2) * cov;
      const wt = Math.abs(tden) > 1e-12 ? (e1 * s2 * s2 - e2 * cov) / tden : 0.5;
      const pm = port(wmv), pt = port(wt), sh = (pt.m - rf) / pt.s;
      out.innerHTML = stats([['Mín. variância: peso em A', pc(wmv, 0)], ['Vol mínima', pc(pm.s, 1)], ['Tangente: peso em A', pc(wt, 0), 'amber'], ['Tangente: retorno / vol', pc(pt.m, 1) + ' / ' + pc(pt.s, 1)], ['Sharpe máximo', Q.fmt(sh, 2), 'up'], ['Kelly (tangente, f = (μ−r)/σ²)', Q.fmt((pt.m - rf) / (pt.s * pt.s), 2) + '×']]);
      const ws = Plot.linspace(-0.5, 1.5, 161), fr = ws.map(port);
      const cml = Plot.linspace(0, Math.max(0.6, pt.s * 1.6), 50);
      Plot.line(pp, { series: [{ x: fr.map(p => p.s * 100), y: fr.map(p => p.m * 100), label: 'Fronteira (−50% a 150% em A)', color: '#4cc9f0' }, { x: cml.map(s => s * 100), y: cml.map(s => (rf + sh * s) * 100), label: 'Linha de mercado de capitais', color: '#f5a623', dash: [5, 4] }], points: [{ x: s1 * 100, y: m1 * 100, color: '#b388ff', label: 'A' }, { x: s2 * 100, y: m2 * 100, color: '#b388ff', label: 'B' }, { x: pm.s * 100, y: pm.m * 100, color: '#26d07c', label: 'mín. var.' }, { x: pt.s * 100, y: pt.m * 100, color: '#ff5c8a', label: 'tangente' }], xName: 'vol (%)', xMin: 0, yFmt: x => Q.fmt(x, 1) + '%', height: 250 });
    }
    draw(ctl.vals);
  };
})();
