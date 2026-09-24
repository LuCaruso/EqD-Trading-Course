/* Simuladores — parte 1: infraestrutura, Laboratório Black-Scholes, Construtor de Estruturas, widgets de lição */
(function (global) {
  'use strict';
  const { h, esc, math } = UI;
  const Sims = { list: [], byId: {}, widgets: {} };
  Sims.add = function (s) { this.list.push(s); this.byId[s.id] = s; };

  /* -------- controles -------- */
  // fields: [{k,label,type:'range'|'select'|'number'|'text',min,max,step,v,fmt,options:[[val,label]]}]
  Sims.controls = function (fields, onChange, cols) {
    const el = h(`<div class="ctl" ${cols ? `style="grid-template-columns:repeat(auto-fill,minmax(${cols}px,1fr))"` : ''}></div>`);
    const vals = {};
    fields.forEach(f => {
      vals[f.k] = f.v;
      let inner;
      if (f.type === 'select') inner = `<select>${f.options.map(o => `<option value="${o[0]}" ${String(o[0]) === String(f.v) ? 'selected' : ''}>${o[1]}</option>`).join('')}</select>`;
      else if (f.type === 'number' || f.type === 'text') inner = `<input type="${f.type}" value="${f.v}" ${f.step ? `step="${f.step}"` : ''}>`;
      else inner = `<input type="range" min="${f.min}" max="${f.max}" step="${f.step || 1}" value="${f.v}">`;
      const fe = h(`<label class="fld" ${f.title ? `title="${esc(f.title)}"` : ''}><span class="lab"><span>${f.label}</span><b></b></span>${inner}</label>`);
      const inp = fe.querySelector('input,select'), out = fe.querySelector('b');
      const show = () => { out.textContent = (f.type === 'select' || f.type === 'number' || f.type === 'text') ? '' : (f.fmt ? f.fmt(vals[f.k]) : vals[f.k]); };
      const conv = raw => {
        if (f.type === 'text' || f.numeric === false) return raw;
        if (f.type === 'select') return (raw !== '' && !isNaN(+raw)) ? +raw : raw;
        return +raw;
      };
      const handler = () => { vals[f.k] = conv(inp.value); show(); onChange(vals, f.k); };
      if (f.type === 'select') inp.addEventListener('change', handler); else inp.addEventListener('input', handler);
      show();
      fe._set = v => { inp.value = v; vals[f.k] = conv(String(v)); show(); };
      fe.dataset.k = f.k;
      el.appendChild(fe);
    });
    el.vals = vals;
    el.set = (k, v) => { const fe = el.querySelector(`[data-k="${k}"]`); if (fe) fe._set(v); };
    return el;
  };
  Sims.tabs = function (names, onTab) {
    const el = h(`<div class="tabs">${names.map((n, i) => `<button class="${i === 0 ? 'on' : ''}" data-i="${i}">${n}</button>`).join('')}</div>`);
    el.querySelectorAll('button').forEach(b => b.onclick = () => { el.querySelectorAll('button').forEach(x => x.classList.remove('on')); b.classList.add('on'); onTab(+b.dataset.i); });
    return el;
  };
  const f2 = x => Q.fmt(x, 2), f4 = x => Q.fmt(x, 4), pc = x => Q.fmt(x, 1) + '%';
  Sims.fmts = { f2, f4, pc };

  /* ============ Pricing genérico de "pernas" (usado por estruturas, livro e widgets) ============
     leg: {qty, type:'call'|'put'|'stock'|'dcall'|'dput'|barrier kind (cuo,cdi...), K, H, rebate, days, vol?}
     mkt: {S, r, q, vol, base, surf? (Q.volSurface), volShift} */
  function legVol(leg, mkt, T) {
    if (leg.vol) return leg.vol + (mkt.volShift || 0);
    if (mkt.surf) { const F = mkt.S0ref ? mkt.S0ref * Math.exp((mkt.r - mkt.q) * T) : mkt.S * Math.exp((mkt.r - mkt.q) * T); return Math.max(0.01, mkt.surf.vol(leg.K, F, Math.max(T, 1 / 252)) + (mkt.volShift || 0)); }
    return Math.max(0.005, mkt.vol + (mkt.volShift || 0));
  }
  function legPrice(leg, mkt, S, elapsedDays) {
    const T = Math.max(0, (leg.days - (elapsedDays || 0)) / mkt.base);
    const r = mkt.r, q = mkt.q;
    if (leg.type === 'stock') return S;
    if (leg.type === 'fut') return S * Math.exp((r - q) * T) - (leg.K || 0);
    const v = legVol(leg, mkt, T);
    if (leg.type === 'call' || leg.type === 'put') return Q.bsPrice(leg.type, S, leg.K, T, r, q, v);
    if (leg.type === 'dcall' || leg.type === 'dput') return Q.digital('cash', leg.type === 'dcall' ? 'call' : 'put', S, leg.K, T, r, q, v, leg.cash || 1);
    return Q.barrier(leg.type, S, leg.K, leg.H, T, r, q, v, leg.rebate || 0);
  }
  function legGreeks(leg, mkt, S, elapsedDays) {
    const T = Math.max(0, (leg.days - (elapsedDays || 0)) / mkt.base);
    if (leg.type === 'stock') return { price: S, delta: 1, gamma: 0, vega: 0, theta: 0, vanna: 0, volga: 0 };
    if ((leg.type === 'call' || leg.type === 'put') && T > 0) {
      const g = Q.bs(leg.type, S, leg.K, T, mkt.r, mkt.q, legVol(leg, mkt, T));
      return g;
    }
    const f = (s, tt, dv) => legPrice(leg, Object.assign({}, mkt, { volShift: (mkt.volShift || 0) + dv }), s, leg.days - tt * mkt.base);
    const p0 = f(S, T, 0), hS = S * 0.004;
    const pu = f(S + hS, T, 0), pd = f(S - hS, T, 0);
    const vu = f(S, T, 0.005), vd = f(S, T, -0.005);
    const dt = Math.min(1 / mkt.base, T);
    const th = T > dt ? (f(S, T - dt, 0) - p0) / dt : 0;
    const vanna = ((f(S + hS, T, 0.005) - f(S - hS, T, 0.005)) - (f(S + hS, T, -0.005) - f(S - hS, T, -0.005))) / (2 * hS * 0.01);
    return { price: p0, delta: (pu - pd) / (2 * hS), gamma: (pu - 2 * p0 + pd) / (hS * hS), vega: (vu - vd) / 0.01, theta: th, vanna, volga: (vu - 2 * p0 + vd) / (0.005 * 0.005) };
  }
  function bookValue(legs, mkt, S, el) { return legs.reduce((a, l) => a + l.qty * legPrice(l, mkt, S, el), 0); }
  function bookGreeks(legs, mkt, S, el) {
    const t = { price: 0, delta: 0, gamma: 0, vega: 0, theta: 0, vanna: 0, volga: 0 };
    legs.forEach(l => { const g = legGreeks(l, mkt, S, el); for (const k in t) t[k] += l.qty * (g[k] || 0); });
    return t;
  }
  Sims.legPrice = legPrice; Sims.legGreeks = legGreeks; Sims.bookValue = bookValue; Sims.bookGreeks = bookGreeks;

  // descrição "de mesa" das gregas agregadas
  Sims.deskRead = function (g, S, base) {
    const out = [];
    const dCash = g.delta * S;
    if (Math.abs(g.delta) > 0.02) out.push(`<span class="pill ${g.delta > 0 ? 'up' : 'down'}">${g.delta > 0 ? 'comprado' : 'vendido'} em delta (${Q.fmt(g.delta, 2)} ações ≈ ${Q.fmt(dCash, 0)} de exposição)</span>`);
    else out.push('<span class="pill">delta-neutro</span>');
    if (Math.abs(g.gamma * S * S * 0.0001) > 1e-6) out.push(`<span class="pill ${g.gamma > 0 ? 'up' : 'down'}">${g.gamma > 0 ? 'long gamma' : 'short gamma'}</span>`);
    if (Math.abs(g.vega) > 1e-6) out.push(`<span class="pill ${g.vega > 0 ? 'up' : 'down'}">${g.vega > 0 ? 'comprado em vol (long vega)' : 'vendido em vol (short vega)'}</span>`);
    if (Math.abs(g.theta) > 1e-6) out.push(`<span class="pill ${g.theta > 0 ? 'up' : 'down'}">${g.theta > 0 ? 'recebendo theta' : 'pagando theta'} (${Q.fmt(g.theta / base, 2)}/dia)</span>`);
    return out.join(' ');
  };

  /* ================== 1. LABORATÓRIO BLACK-SCHOLES ================== */
  Sims.add({
    id: 'bs', title: 'Laboratório Black-Scholes', ic: 'BS',
    desc: 'Mexa em spot, strike, prazo, vol e juros e veja preço, d1/d2 e todas as gregas (em unidades de mesa). Curvas vs spot e vs tempo, árvore binomial e calculadora de vol implícita.',
    render(el, p) {
      p = p || {};
      el.innerHTML = '';
      const out = h(`<div></div>`);
      const ctl = Sims.controls([
        { k: 'type', label: 'Tipo', type: 'select', v: p.type || 'call', options: [['call', 'Call'], ['put', 'Put']], numeric: false },
        { k: 'S', label: 'Spot (S)', min: 50, max: 150, step: 0.5, v: p.S || 100, fmt: f2 },
        { k: 'K', label: 'Strike (K)', min: 50, max: 150, step: 0.5, v: p.K || 100, fmt: f2 },
        { k: 'days', label: 'Prazo (dias)', min: 1, max: 504, step: 1, v: p.days || 63 },
        { k: 'base', label: 'Convenção', type: 'select', v: p.base || 252, options: [[252, 'Brasil: dias úteis/252'], [365, 'US: dias corridos/365']] },
        { k: 'vol', label: 'Vol (σ)', min: 1, max: 100, step: 0.5, v: p.vol || 25, fmt: pc },
        { k: 'r', label: 'Juros', min: 0, max: 20, step: 0.05, v: p.r != null ? p.r : 10.5, fmt: pc, title: 'No Brasil: taxa DI (exponencial 252). Convertida para contínua: ln(1+taxa).' },
        { k: 'q', label: 'Div. yield (q)', min: 0, max: 10, step: 0.1, v: p.q || 0, fmt: pc }
      ], redraw);
      el.appendChild(ctl);
      const res = h(`<div class="grid g2" style="margin-top:14px"></div>`); el.appendChild(res);
      let tab = 0;
      el.appendChild(Sims.tabs(['Preço vs spot', 'Gregas vs spot', 'Gregas vs tempo', 'Árvore binomial', 'Vol implícita'], i => { tab = i; drawTab(); }));
      const tabEl = h(`<div></div>`); el.appendChild(tabEl);
      let greekSel = 'delta';

      function params() {
        const v = ctl.vals;
        const rc = v.base == 252 ? Math.log(1 + v.r / 100) : v.r / 100;
        return { type: v.type, S: v.S, K: v.K, T: v.days / v.base, r: rc, q: v.q / 100, vol: v.vol / 100, base: +v.base, days: v.days, rRaw: v.r };
      }
      function redraw() { drawRes(); drawTab(); }
      function drawRes() {
        const P = params(), g = Q.bs(P.type, P.S, P.K, P.T, P.r, P.q, P.vol);
        const intr = Math.max(P.type === 'call' ? P.S - P.K : P.K - P.S, 0);
        res.innerHTML = `
        <div class="card"><h3>Preço</h3>
          <div class="kpi"><div class="v amber">${f4(g.price)}</div><div class="l">prêmio por opção · ${Q.fmt(g.price / P.S * 100, 2)}% do spot</div></div>
          <table class="tbl" style="margin-top:12px">
          <tr><td>Valor intrínseco</td><td class="n">${f4(intr)}</td></tr>
          <tr><td>Valor extrínseco (tempo)</td><td class="n">${f4(g.price - intr)}</td></tr>
          <tr><td>T (anos)</td><td class="n">${Q.fmt(P.T, 4)}</td></tr>
          <tr><td>r contínua</td><td class="n">${Q.fmt(P.r * 100, 3)}%</td></tr>
          <tr><td>Forward F = S·e^{(r−q)T}</td><td class="n">${f4(P.S * Math.exp((P.r - P.q) * P.T))}</td></tr>
          <tr><td>d1 / d2</td><td class="n">${f4(g.d1)} / ${f4(g.d2)}</td></tr>
          <tr><td>N(d1) / N(d2)</td><td class="n">${f4(g.nd1)} / ${f4(g.nd2)}</td></tr>
          <tr><td>Prob. (neutra a risco) de exercício</td><td class="n">${Q.fmt((P.type === 'call' ? g.nd2 : 1 - g.nd2) * 100, 1)}%</td></tr>
          </table></div>
        <div class="card"><h3>Gregas (por opção)</h3>
          <table class="tbl gtable">
          <tr><th>Grega</th><th class="n">Valor</th><th>Leitura de mesa</th></tr>
          <tr><td>Delta Δ</td><td class="n">${f4(g.delta)}</td><td class="muted">R$1 no spot → ${f4(g.delta)} no prêmio</td></tr>
          <tr><td>Gamma Γ</td><td class="n">${f4(g.gamma)}</td><td class="muted">spot +1% → Δ muda ${f4(g.gamma * P.S * 0.01)}</td></tr>
          <tr><td>Gamma cash (1%)</td><td class="n">${f4(0.5 * g.gamma * Math.pow(P.S * 0.01, 2))}</td><td class="muted">PnL de ½Γ(ΔS)² num move de 1%</td></tr>
          <tr><td>Vega</td><td class="n">${f4(g.vega / 100)}</td><td class="muted">por 1 ponto de vol</td></tr>
          <tr><td>Theta</td><td class="n">${f4(g.theta / P.base)}</td><td class="muted">por dia ${P.base == 252 ? 'útil' : 'corrido'}</td></tr>
          <tr><td>Rho</td><td class="n">${f4(g.rho / 100)}</td><td class="muted">por +1% de juros</td></tr>
          <tr><td>Vanna</td><td class="n">${f4(g.vanna / 100)}</td><td class="muted">Δ muda isso por +1 vol</td></tr>
          <tr><td>Volga</td><td class="n">${f4(g.volga / 10000)}</td><td class="muted">vega (por pt) muda isso por +1 vol</td></tr>
          <tr><td>Charm</td><td class="n">${f4(g.charm / P.base)}</td><td class="muted">Δ muda isso por dia que passa</td></tr>
          </table></div>`;
      }
      function drawTab() {
        const P = params(); tabEl.innerHTML = '';
        const xs = Plot.linspace(P.K * 0.6, P.K * 1.4, 161);
        if (tab === 0) {
          const d = h(`<div class="card"></div>`); tabEl.appendChild(d);
          const Ts = [P.T, P.T / 2, P.T / 6];
          Plot.line(d, {
            series: [
              { x: xs, y: xs.map(s => P.type === 'call' ? Math.max(s - P.K, 0) : Math.max(P.K - s, 0)), label: 'Payoff no vencimento', color: '#7d8b9b', dash: [5, 4] },
              ...Ts.map((T, i) => ({ x: xs, y: xs.map(s => Q.bsPrice(P.type, s, P.K, T, P.r, P.q, P.vol)), label: `${Math.round(T * P.base)} dias`, color: ['#f5a623', '#4cc9f0', '#26d07c'][i] }))
            ], vlines: [{ x: P.S, label: 'S', color: '#ff5c8a' }, { x: P.K, label: 'K' }], xLabel: 'Spot', xName: 'S', height: 320
          });
          d.appendChild(h(`<p class="muted" style="font-size:13px">A distância entre a curva e o payoff é o <b>valor tempo</b>. Repare como ela é máxima no strike (ATM) e some conforme o vencimento se aproxima — a curvatura (gamma) se concentra perto do strike.</p>`));
        } else if (tab === 1) {
          const d = h(`<div class="card"></div>`); tabEl.appendChild(d);
          const sel = Sims.controls([{ k: 'g', label: 'Grega', type: 'select', v: greekSel, numeric: false, options: [['price', 'Preço'], ['delta', 'Delta'], ['gamma', 'Gamma'], ['vega', 'Vega (por pt)'], ['theta', 'Theta (por dia)'], ['vanna', 'Vanna'], ['volga', 'Volga'], ['charm', 'Charm (por dia)'], ['rho', 'Rho (por 1%)']] }], v => { greekSel = v.g; drawTab(); });
          d.appendChild(sel);
          const pd = h('<div style="margin-top:10px"></div>'); d.appendChild(pd);
          const sc = { vega: 1 / 100, theta: 1 / P.base, vanna: 1 / 100, volga: 1 / 10000, charm: 1 / P.base, rho: 1 / 100 };
          const Ts = [P.T * 2, P.T, P.T / 3, P.T / 10];
          Plot.line(pd, { series: Ts.map((T, i) => ({ x: xs, y: xs.map(s => Q.bs(P.type, s, P.K, T, P.r, P.q, P.vol)[greekSel] * (sc[greekSel] || 1)), label: `${Math.max(1, Math.round(T * P.base))} dias`, color: ['#b388ff', '#f5a623', '#4cc9f0', '#26d07c'][i] })), vlines: [{ x: P.K, label: 'K' }, { x: P.S, label: 'S', color: '#ff5c8a' }], xLabel: 'Spot', xName: 'S', height: 320 });
        } else if (tab === 2) {
          const d = h(`<div class="card"></div>`); tabEl.appendChild(d);
          const sel = Sims.controls([{ k: 'g', label: 'Grega', type: 'select', v: greekSel, numeric: false, options: [['price', 'Preço'], ['delta', 'Delta'], ['gamma', 'Gamma'], ['vega', 'Vega (por pt)'], ['theta', 'Theta (por dia)'], ['charm', 'Charm (por dia)']] }], v => { greekSel = v.g; drawTab(); });
          d.appendChild(sel); const pd = h('<div style="margin-top:10px"></div>'); d.appendChild(pd);
          const sc = { vega: 1 / 100, theta: 1 / P.base, charm: 1 / P.base };
          const days = Plot.linspace(Math.max(P.days, 5), 1, 120);
          const Ks = [[P.S * 0.9, 'ITM (K=' + f2(P.S * 0.9) + ')'], [P.S, 'ATM'], [P.S * 1.1, 'OTM (K=' + f2(P.S * 1.1) + ')']];
          if (P.type === 'put') Ks.reverse();
          Plot.line(pd, { series: Ks.map(([K, lab], i) => ({ x: days.map(x => -x), y: days.map(dd => Q.bs(P.type, P.S, K, dd / P.base, P.r, P.q, P.vol)[greekSel] * (sc[greekSel] || 1)), label: P.type === 'call' ? lab : lab.replace('ITM', 'X').replace('OTM', 'ITM').replace('X', 'OTM'), color: ['#26d07c', '#f5a623', '#4cc9f0'][i] })), xLabel: 'dias até o vencimento (→ vencimento)', xFmt: v => Q.fmt(-v, 0), xName: 'dias', height: 320 });
          d.appendChild(h(`<p class="muted" style="font-size:13px">Com o vencimento chegando, gamma e theta da opção ATM explodem, enquanto ITM/OTM morrem. É por isso que a última semana é a mais "nervosa" para quem está vendido em opções ATM.</p>`));
        } else if (tab === 3) {
          const d = h(`<div class="card"></div>`); tabEl.appendChild(d);
          const c2 = Sims.controls([{ k: 'N', label: 'Passos', min: 1, max: 6, v: 3 }, { k: 'am', label: 'Exercício', type: 'select', v: 0, options: [[0, 'Europeia'], [1, 'Americana']] }], () => draw());
          d.appendChild(c2); const tv = h('<div class="tree" style="margin-top:12px"></div>'); d.appendChild(tv);
          const conv = h('<div style="margin-top:14px"></div>'); d.appendChild(conv);
          function draw() {
            const N = c2.vals.N, am = !!+c2.vals.am;
            const b = Q.binomial(P.type, P.S, P.K, P.T, P.r, P.q, P.vol, N, am, true);
            const W = 120 * (N + 1) + 40, H = 64 * (N + 1) + 20;
            let svg = `<svg width="${W}" height="${H}">`;
            const pos = (i, j) => [30 + i * 120, H / 2 + (i / 2 - j) * 60];
            for (let i = 0; i < N; i++) for (let j = 0; j <= i; j++) { const [x, y] = pos(i, j), [x1, y1] = pos(i + 1, j + 1), [x2, y2] = pos(i + 1, j); svg += `<line x1="${x}" y1="${y}" x2="${x1}" y2="${y1}" stroke="#2a3a4b"/><line x1="${x}" y1="${y}" x2="${x2}" y2="${y2}" stroke="#2a3a4b"/>`; }
            for (let i = 0; i <= N; i++) for (let j = 0; j <= i; j++) {
              const [x, y] = pos(i, j), s = P.S * Math.pow(b.u, j) * Math.pow(b.d, i - j), ex = b.exTree[i][j];
              svg += `<rect x="${x - 4}" y="${y - 20}" width="92" height="36" rx="5" fill="${ex ? '#3a2410' : '#121a24'}" stroke="${ex ? '#f5a623' : '#2a3a4b'}"/><text x="${x + 2}" y="${y - 6}">S ${f2(s)}</text><text x="${x + 2}" y="${y + 9}" style="fill:#f5a623">V ${f2(b.tree[i][j])}</text>`;
            }
            svg += '</svg>';
            tv.innerHTML = `<div class="mono muted" style="font-size:12.5px;margin-bottom:6px">u = ${f4(b.u)} · d = ${f4(b.d)} · p* (neutra a risco) = ${f4(b.p)} · Δt = ${Q.fmt(b.dt, 4)} anos · preço = <b class="amber">${f4(b.price)}</b> · BS = ${f4(Q.bsPrice(P.type, P.S, P.K, P.T, P.r, P.q, P.vol))}${am ? ' · <span class="amber">nós laranja = exercício antecipado ótimo</span>' : ''}</div>` + svg;
            const Ns = [], vs = []; for (let n = 1; n <= 150; n++) { Ns.push(n); vs.push(Q.binomial(P.type, P.S, P.K, P.T, P.r, P.q, P.vol, n, am).price); }
            const bsP = Q.bsPrice(P.type, P.S, P.K, P.T, P.r, P.q, P.vol);
            Plot.line(conv, { series: [{ x: Ns, y: vs, label: 'Binomial CRR', color: '#4cc9f0', width: 1.5 }, { x: [1, 150], y: [bsP, bsP], label: 'Black-Scholes (europeia)', color: '#f5a623', dash: [5, 4] }], xLabel: 'número de passos', xName: 'N', height: 240, zeroLine: false });
          }
          draw();
        } else if (tab === 4) {
          const d = h(`<div class="card"><h3>Calculadora de vol implícita</h3><p class="muted">Dado o prêmio de mercado, qual σ faz o Black-Scholes bater esse preço? Usa os demais parâmetros acima.</p></div>`); tabEl.appendChild(d);
          const g = Q.bs(P.type, P.S, P.K, P.T, P.r, P.q, P.vol);
          const c3 = Sims.controls([{ k: 'px', label: 'Prêmio de mercado', type: 'number', v: +g.price.toFixed(4), step: 0.01 }], () => calc());
          d.appendChild(c3); const o = h('<div class="term" style="margin-top:12px"></div>'); d.appendChild(o);
          function calc() {
            const iv = Q.impliedVol(P.type, c3.vals.px, P.S, P.K, P.T, P.r, P.q);
            o.textContent = isFinite(iv) ? `Vol implícita = ${Q.fmt(iv * 100, 3)}%\nVega (por pt) nesse ponto = ${f4(Q.bs(P.type, P.S, P.K, P.T, P.r, P.q, iv).vega / 100)}\nRegra de bolso: Δprêmio ≈ vega × Δvol → ${f4(c3.vals.px - g.price)} de diferença ≈ ${Q.fmt((c3.vals.px - g.price) / (g.vega / 100), 2)} pts de vol` : 'Preço fora dos limites de não-arbitragem (abaixo do intrínseco descontado ou acima do máximo).';
          }
          calc();
        }
      }
      redraw();
    }
  });

  /* ================== 2. CONSTRUTOR DE ESTRUTURAS ================== */
  const TYPES = [['call', 'Call'], ['put', 'Put'], ['stock', 'Ação/Spot'], ['dcall', 'Digital call'], ['dput', 'Digital put'], ['cuo', 'Call up-and-out'], ['cui', 'Call up-and-in'], ['cdo', 'Call down-and-out'], ['cdi', 'Call down-and-in'], ['puo', 'Put up-and-out'], ['pui', 'Put up-and-in'], ['pdo', 'Put down-and-out'], ['pdi', 'Put down-and-in']];
  const isBarrier = t => /^[cp][ud][io]$/.test(t);
  const PRESETS = {
    'Long call': [{ qty: 1, type: 'call', K: 100, days: 63 }],
    'Long put': [{ qty: 1, type: 'put', K: 100, days: 63 }],
    'Covered call (lançamento coberto)': [{ qty: 1, type: 'stock' }, { qty: -1, type: 'call', K: 105, days: 63 }],
    'Put protetora': [{ qty: 1, type: 'stock' }, { qty: 1, type: 'put', K: 95, days: 63 }],
    'Trava de alta com call (bull call spread)': [{ qty: 1, type: 'call', K: 100, days: 63 }, { qty: -1, type: 'call', K: 110, days: 63 }],
    'Trava de baixa com put (bear put spread)': [{ qty: 1, type: 'put', K: 100, days: 63 }, { qty: -1, type: 'put', K: 90, days: 63 }],
    'Long straddle': [{ qty: 1, type: 'call', K: 100, days: 63 }, { qty: 1, type: 'put', K: 100, days: 63 }],
    'Short strangle': [{ qty: -1, type: 'call', K: 110, days: 63 }, { qty: -1, type: 'put', K: 90, days: 63 }],
    'Long butterfly': [{ qty: 1, type: 'call', K: 90, days: 63 }, { qty: -2, type: 'call', K: 100, days: 63 }, { qty: 1, type: 'call', K: 110, days: 63 }],
    'Short iron condor': [{ qty: 1, type: 'put', K: 85, days: 63 }, { qty: -1, type: 'put', K: 92, days: 63 }, { qty: -1, type: 'call', K: 108, days: 63 }, { qty: 1, type: 'call', K: 115, days: 63 }],
    'Risk reversal (long call 25d / short put 25d)': [{ qty: 1, type: 'call', K: 108, days: 63 }, { qty: -1, type: 'put', K: 92, days: 63 }],
    'Collar (ação + put − call)': [{ qty: 1, type: 'stock' }, { qty: 1, type: 'put', K: 92, days: 63 }, { qty: -1, type: 'call', K: 110, days: 63 }],
    'Fence (ação + put spread − call)': [{ qty: 1, type: 'stock' }, { qty: 1, type: 'put', K: 95, days: 63 }, { qty: -1, type: 'put', K: 85, days: 63 }, { qty: -1, type: 'call', K: 110, days: 63 }],
    'Seagull (call spread − put)': [{ qty: 1, type: 'call', K: 102, days: 63 }, { qty: -1, type: 'call', K: 115, days: 63 }, { qty: -1, type: 'put', K: 90, days: 63 }],
    'Call ratio spread 1x2': [{ qty: 1, type: 'call', K: 100, days: 63 }, { qty: -2, type: 'call', K: 110, days: 63 }],
    'Calendar (vende curta, compra longa)': [{ qty: -1, type: 'call', K: 100, days: 21 }, { qty: 1, type: 'call', K: 100, days: 126 }],
    'Box (4 pontas)': [{ qty: 1, type: 'call', K: 95, days: 126 }, { qty: -1, type: 'put', K: 95, days: 126 }, { qty: -1, type: 'call', K: 105, days: 126 }, { qty: 1, type: 'put', K: 105, days: 126 }],
    'Digital via call spread apertado': [{ qty: 10, type: 'call', K: 99.95, days: 63 }, { qty: -10, type: 'call', K: 100.05, days: 63 }],
    'Call up-and-out ("tubarão")': [{ qty: 1, type: 'cuo', K: 100, H: 120, days: 126 }],
    'Put down-and-in (a do autocall)': [{ qty: 1, type: 'pdi', K: 100, H: 70, days: 252 }],
    'COE capital protegido (zero + call spread)': [{ qty: 1, type: 'call', K: 100, days: 252 }, { qty: -1, type: 'call', K: 125, days: 252 }]
  };
  Sims.PRESETS = PRESETS;

  Sims.add({
    id: 'struct', title: 'Construtor de Estruturas', ic: 'ST',
    desc: 'Monte qualquer estrutura (vanilla, digitais e barreiras), veja payoff, PnL hoje e no horizonte, gregas vs spot e a "leitura de mesa" da posição: comprado/vendido em vol, gamma, theta.',
    render(el, p) {
      p = p || {};
      el.innerHTML = '';
      let legs = JSON.parse(JSON.stringify(PRESETS[p.preset] || PRESETS['Long straddle']));
      const top = h(`<div class="row" style="margin-bottom:12px"><label class="fld" style="min-width:320px"><span class="lab">Preset</span><select>${Object.keys(PRESETS).map(k => `<option ${k === (p.preset || 'Long straddle') ? 'selected' : ''}>${k}</option>`).join('')}</select></label></div>`);
      top.querySelector('select').onchange = e => { legs = JSON.parse(JSON.stringify(PRESETS[e.target.value])); drawLegs(); redraw(); };
      el.appendChild(top);
      const ctl = Sims.controls([
        { k: 'S', label: 'Spot', min: 50, max: 150, step: 0.5, v: 100, fmt: f2 },
        { k: 'vol', label: 'Vol ATM', min: 5, max: 80, step: 0.5, v: 25, fmt: pc },
        { k: 'skew', label: 'Skew (vol/ln-moneyness)', min: -20, max: 5, step: 0.5, v: 0, fmt: v => Q.fmt(v, 1), title: 'Negativo = puts mais caras (skew típico de equity). 0 = vol flat.' },
        { k: 'r', label: 'Juros (cont.)', min: 0, max: 15, step: 0.1, v: 10, fmt: pc },
        { k: 'q', label: 'Div. yield', min: 0, max: 8, step: 0.1, v: 0, fmt: pc },
        { k: 'base', label: 'Base', type: 'select', v: 252, options: [[252, '252 du'], [365, '365 dc']] },
        { k: 'hor', label: 'Horizonte (dias à frente)', min: 0, max: 252, step: 1, v: 21 },
        { k: 'dvol', label: 'Choque de vol no horizonte', min: -15, max: 15, step: 0.5, v: 0, fmt: v => (v > 0 ? '+' : '') + Q.fmt(v, 1) + ' pts' }
      ], redraw);
      el.appendChild(ctl);
      const legBox = h(`<div class="card" style="margin-top:14px"><h3>Pernas</h3><div class="lt"></div><div class="row" style="margin-top:8px"><button class="btn sm add">+ Adicionar perna</button><span class="muted" style="font-size:12.5px">qty positiva = comprado; negativa = vendido. Barreiras usam H e rebate.</span></div></div>`);
      el.appendChild(legBox);
      legBox.querySelector('.add').onclick = () => { legs.push({ qty: 1, type: 'call', K: 100, days: 63 }); drawLegs(); redraw(); };
      const read = h(`<div class="card" style="margin-top:14px"></div>`); el.appendChild(read);
      let tab = 0, gsel = 'delta';
      el.appendChild(Sims.tabs(['PnL vs spot', 'Gregas vs spot', 'Cenários'], i => { tab = i; drawTab(); }));
      const tabEl = h('<div class="card"></div>'); el.appendChild(tabEl);

      function mkt(volShift) {
        const v = ctl.vals;
        const surf = v.skew !== 0 ? Q.volSurface({ atmShort: v.vol / 100, atmLong: v.vol / 100, skew: v.skew / 100 * 1, curv: 0.005 }) : null;
        return { S: v.S, S0ref: v.S, r: v.r / 100, q: v.q / 100, vol: v.vol / 100, base: +v.base, surf, volShift: (volShift || 0) / 100 };
      }
      function drawLegs() {
        const t = legBox.querySelector('.lt');
        t.innerHTML = `<table class="tbl legs"><tr><th>Qty</th><th>Tipo</th><th>Strike</th><th>Barreira H</th><th>Rebate</th><th>Dias</th><th></th></tr>${legs.map((l, i) => `<tr data-i="${i}">
          <td><input type="number" step="1" data-f="qty" value="${l.qty}" style="width:70px"></td>
          <td><select data-f="type">${TYPES.map(o => `<option value="${o[0]}" ${o[0] === l.type ? 'selected' : ''}>${o[1]}</option>`).join('')}</select></td>
          <td><input type="number" step="0.5" data-f="K" value="${l.K == null ? '' : l.K}" ${l.type === 'stock' ? 'disabled' : ''} style="width:80px"></td>
          <td><input type="number" step="0.5" data-f="H" value="${l.H == null ? '' : l.H}" ${isBarrier(l.type) ? '' : 'disabled'} style="width:80px"></td>
          <td><input type="number" step="0.5" data-f="rebate" value="${l.rebate || 0}" ${isBarrier(l.type) ? '' : 'disabled'} style="width:70px"></td>
          <td><input type="number" step="1" data-f="days" value="${l.days == null ? '' : l.days}" ${l.type === 'stock' ? 'disabled' : ''} style="width:70px"></td>
          <td><button class="btn sm ghost del">✕</button></td></tr>`).join('')}</table>`;
        t.querySelectorAll('tr[data-i]').forEach(tr => {
          const i = +tr.dataset.i;
          tr.querySelectorAll('[data-f]').forEach(inp => inp.addEventListener('change', () => {
            const f = inp.dataset.f; legs[i][f] = f === 'type' ? inp.value : +inp.value;
            if (f === 'type') { if (isBarrier(inp.value) && !legs[i].H) legs[i].H = inp.value[1] === 'u' ? 120 : 80; if (inp.value !== 'stock') { legs[i].K = legs[i].K || 100; legs[i].days = legs[i].days || 63; } drawLegs(); }
            redraw();
          }));
          tr.querySelector('.del').onclick = () => { legs.splice(i, 1); drawLegs(); redraw(); };
        });
      }
      function minExpiry() { const d = legs.filter(l => l.type !== 'stock').map(l => l.days); return d.length ? Math.min(...d) : 63; }
      function redraw() {
        const M = mkt(0), S = M.S;
        const g = bookGreeks(legs, M, S, 0);
        const rows = legs.map(l => { const gg = legGreeks(l, M, S, 0); return `<tr><td>${l.qty > 0 ? '+' : ''}${l.qty} ${TYPES.find(t => t[0] === l.type)[1]}${l.type !== 'stock' ? ' K=' + l.K : ''}${isBarrier(l.type) ? ' H=' + l.H : ''}${l.type !== 'stock' ? ' · ' + l.days + 'd' : ''}</td><td class="n">${f4(gg.price)}</td><td class="n">${f4(l.qty * gg.delta)}</td><td class="n">${f4(l.qty * gg.gamma)}</td><td class="n">${f4(l.qty * gg.vega / 100)}</td><td class="n">${f4(l.qty * gg.theta / M.base)}</td></tr>`; }).join('');
        read.innerHTML = `<h3>Leitura de mesa</h3><div>${Sims.deskRead(g, S, M.base)}</div>
          <table class="tbl" style="margin-top:12px"><tr><th>Perna</th><th class="n">Preço unit.</th><th class="n">Δ</th><th class="n">Γ</th><th class="n">Vega/pt</th><th class="n">Θ/dia</th></tr>${rows}
          <tr style="font-weight:700"><td>TOTAL (custo da estrutura: ${f4(g.price)} ${g.price >= 0 ? '— você paga' : '— você recebe'})</td><td class="n">${f4(g.price)}</td><td class="n">${f4(g.delta)}</td><td class="n">${f4(g.gamma)}</td><td class="n">${f4(g.vega / 100)}</td><td class="n">${f4(g.theta / M.base)}</td></tr></table>`;
        ctl.querySelector('[data-k="hor"] input').max = Math.max(0, minExpiry());
        drawTab();
      }
      function drawTab() {
        const M = mkt(0), S0 = M.S, v = ctl.vals, hor = Math.min(v.hor, minExpiry());
        const cost = bookValue(legs, M, S0, 0);
        const Ks = legs.filter(l => l.K).map(l => l.K).concat(legs.filter(l => l.H).map(l => l.H));
        const lo = Math.min(S0, ...Ks) * 0.75, hi = Math.max(S0, ...Ks) * 1.25;
        const xs = Plot.linspace(lo, hi, 181);
        tabEl.innerHTML = '';
        const vl = [{ x: S0, label: 'spot', color: '#ff5c8a' }].concat(legs.filter(l => isBarrier(l.type)).map(l => ({ x: l.H, label: 'H', color: '#b388ff' })));
        if (tab === 0) {
          const Mh = mkt(v.dvol), exp = minExpiry();
          Plot.line(tabEl, {
            series: [
              { x: xs, y: xs.map(s => bookValue(legs, M, s, exp) - cost), label: `No 1º vencimento (${exp}d)`, color: '#7d8b9b', dash: [5, 4] },
              { x: xs, y: xs.map(s => bookValue(legs, M, s, 0) - cost), label: 'Hoje (MtM)', color: '#f5a623' },
              { x: xs, y: xs.map(s => bookValue(legs, Mh, s, hor) - cost), label: `Em ${hor}d${v.dvol ? ' com vol ' + (v.dvol > 0 ? '+' : '') + v.dvol : ''}`, color: '#4cc9f0' }
            ], vlines: vl, xLabel: 'Spot', xName: 'S', yLabel: 'PnL', height: 340
          });
        } else if (tab === 1) {
          const sel = Sims.controls([{ k: 'g', label: 'Grega', type: 'select', v: gsel, numeric: false, options: [['delta', 'Delta'], ['gamma', 'Gamma'], ['vega', 'Vega (por pt)'], ['theta', 'Theta (por dia)'], ['vanna', 'Vanna'], ['volga', 'Volga']] }], vv => { gsel = vv.g; drawTab(); });
          tabEl.appendChild(sel); const pd = h('<div style="margin-top:10px"></div>'); tabEl.appendChild(pd);
          const sc = { vega: 0.01, theta: 1 / M.base, vanna: 0.01, volga: 0.0001 }[gsel] || 1;
          const xs2 = Plot.linspace(lo, hi, 121);
          Plot.line(pd, { series: [{ x: xs2, y: xs2.map(s => bookGreeks(legs, M, s, 0)[gsel] * sc), label: 'Hoje', color: '#f5a623' }, { x: xs2, y: xs2.map(s => bookGreeks(legs, M, s, hor)[gsel] * sc), label: `Em ${hor}d`, color: '#4cc9f0' }], vlines: vl, xLabel: 'Spot', xName: 'S', height: 320 });
        } else {
          const shocks = [-20, -10, -5, -2, 0, 2, 5, 10, 20], vsh = [-10, -5, 0, 5, 10];
          let html = `<p class="muted" style="font-size:13px">PnL por reprecificação completa (full reval) após ${hor} dias: linhas = choque de vol (pts), colunas = choque de spot.</p><table class="tbl heat"><tr><th>vol \\ spot</th>${shocks.map(s => `<th>${s > 0 ? '+' : ''}${s}%</th>`).join('')}</tr>`;
          const all = [];
          vsh.forEach(dv => { const Mv = mkt(dv); shocks.forEach(s => all.push(bookValue(legs, Mv, S0 * (1 + s / 100), hor) - cost)); });
          const mx = Math.max(...all.map(Math.abs)) || 1; let k = 0;
          vsh.forEach(dv => { html += `<tr><th>${dv > 0 ? '+' : ''}${dv}</th>` + shocks.map(() => { const x = all[k++]; const a = Math.min(1, Math.abs(x) / mx); return `<td style="background:${x >= 0 ? `rgba(38,208,124,${0.1 + a * 0.5})` : `rgba(255,92,92,${0.1 + a * 0.5})`}">${Q.fmt(x, 2)}</td>`; }).join('') + '</tr>'; });
          tabEl.innerHTML = html + '</table>';
        }
      }
      drawLegs(); redraw();
    }
  });

  /* ================== Widgets embutidos nas lições ================== */
  // <div class="w" data-w="payoff" data-a='{"preset":"Long straddle"}'></div>  ou  {"legs":[...]}
  Sims.widgets.payoff = function (el, a) {
    const legs = a.legs || PRESETS[a.preset];
    const M = { S: a.S || 100, r: a.r != null ? a.r : 0.1, q: 0, vol: a.vol || 0.25, base: 252 };
    const cost = bookValue(legs, M, M.S, 0), exp = Math.min(...legs.filter(l => l.type !== 'stock').map(l => l.days));
    const Ks = legs.filter(l => l.K).map(l => l.K); const lo = Math.min(M.S, ...Ks) * 0.75, hi = Math.max(M.S, ...Ks) * 1.25;
    const xs = Plot.linspace(lo, hi, 161);
    const box = h(`<div class="card" style="margin:16px 0"><div class="mono muted" style="font-size:12px;margin-bottom:6px">${esc(a.title || a.preset || 'Payoff')} · custo ${Q.fmt(cost, 2)}</div><div class="pp"></div></div>`);
    el.appendChild(box);
    Plot.line(box.querySelector('.pp'), { series: [{ x: xs, y: xs.map(s => bookValue(legs, M, s, exp) - cost), label: 'Vencimento', color: '#7d8b9b', dash: [5, 4] }, { x: xs, y: xs.map(s => bookValue(legs, M, s, 0) - cost), label: 'Hoje', color: '#f5a623' }], vlines: [{ x: M.S, label: 'spot', color: '#ff5c8a' }], xName: 'S', height: 230 });
    if (a.link !== false) box.appendChild(h(`<a class="btn sm" style="margin-top:8px" href="#/sim/struct?preset=${encodeURIComponent(a.preset || '')}">Abrir no Construtor de Estruturas →</a>`));
  };
  Sims.widgets.greek = function (el, a) {
    const g = a.g || 'gamma', type = a.type || 'call', K = 100, r = 0.1, v = a.vol || 0.25, base = 252;
    const sc = { vega: 0.01, theta: 1 / base, charm: 1 / base, vanna: 0.01, volga: 0.0001 }[g] || 1;
    const days = a.days || [126, 42, 10];
    const xs = Plot.linspace(70, 130, 161);
    const box = h(`<div class="card" style="margin:16px 0"><div class="mono muted" style="font-size:12px;margin-bottom:6px">${esc(a.title || g + ' de uma ' + type + ' K=100, vol ' + v * 100 + '%')}</div><div class="pp"></div></div>`);
    el.appendChild(box);
    Plot.line(box.querySelector('.pp'), { series: days.map((d, i) => ({ x: xs, y: xs.map(s => Q.bs(type, s, K, d / base, r, 0, v)[g] * sc), label: d + ' dias', color: ['#b388ff', '#f5a623', '#4cc9f0', '#26d07c'][i] })), vlines: [{ x: K, label: 'K' }], xName: 'S', height: 230 });
    box.appendChild(h(`<a class="btn sm" style="margin-top:8px" href="#/sim/bs">Explorar no Laboratório BS →</a>`));
  };
  Sims.widgets.barrier = function (el, a) {
    const kind = a.kind || 'cuo', K = a.K || 100, H = a.H || 120, T = (a.days || 126) / 252, r = 0.1, v = 0.25;
    const xs = Plot.linspace(Math.min(K, H) * 0.7, Math.max(K, H) * 1.15, 181);
    const box = h(`<div class="card" style="margin:16px 0"><div class="mono muted" style="font-size:12px;margin-bottom:6px">${esc(a.title || kind.toUpperCase() + ' K=' + K + ' H=' + H)}</div><div class="pp"></div></div>`);
    el.appendChild(box);
    const van = kind[0] === 'c' ? 'call' : 'put';
    Plot.line(box.querySelector('.pp'), { series: [{ x: xs, y: xs.map(s => Q.bsPrice(van, s, K, T, r, 0, v)), label: 'Vanilla', color: '#7d8b9b', dash: [5, 4] }, { x: xs, y: xs.map(s => Q.barrier(kind, s, K, H, T, r, 0, v, 0)), label: 'Barreira', color: '#f5a623' }], vlines: [{ x: H, label: 'H', color: '#b388ff' }, { x: K, label: 'K' }], xName: 'S', height: 230 });
    box.appendChild(h(`<a class="btn sm" style="margin-top:8px" href="#/sim/barrier?kind=${kind}">Abrir no Laboratório de Barreiras →</a>`));
  };
  Sims.mountWidgets = function (root) {
    root.querySelectorAll('.w[data-w]').forEach(w => {
      let a = {}; try { a = JSON.parse(w.dataset.a || '{}'); } catch (e) { }
      const fn = Sims.widgets[w.dataset.w]; if (fn) { try { fn(w, a); } catch (e) { console.error(e); w.textContent = 'Erro no widget'; } }
    });
  };

  global.Sims = Sims;
})(window);
