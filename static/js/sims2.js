/* Simuladores — parte 2: Delta hedge/PnL (+ jogo), Barreiras, Livro de risco, Smile, Calculadora Brasil */
(function () {
  'use strict';
  const { h, esc, toast, modal } = UI;
  const { f2, f4, pc } = Sims.fmts;
  const money = x => Q.fmt(x, 0);

  /* ================== 3. DELTA HEDGE / PnL ================== */
  // Simula um caminho diário e o hedge. pos: vetor de pernas vanilla {qty,type,K}
  function hedgeRun(P, path, hedgeEvery, custom) {
    const n = path.length - 1, dt = 1 / P.base, legs = P.legs;
    const val = (S, i) => legs.reduce((a, l) => a + l.qty * Q.bsPrice(l.type, S, l.K, Math.max(0, (n - i) * dt), P.r, P.q, P.ivol), 0);
    const gr = (S, i) => { const t = { delta: 0, gamma: 0, theta: 0 }; legs.forEach(l => { const g = Q.bs(l.type, S, l.K, Math.max(0, (n - i) * dt), P.r, P.q, P.ivol); t.delta += l.qty * g.delta; t.gamma += l.qty * g.gamma; t.theta += l.qty * g.theta; }); return t; };
    let V = val(path[0], 0), hedge = 0, cash = -V, costs = 0;
    const out = { cum: [0], unh: [0], gamma: [0], theta: [0], dmis: [0], cost: [0], fin: [0], hedgePos: [], deltas: [], daily: [] };
    let cg = 0, ct = 0, cd = 0, cc = 0, cf = 0;
    for (let i = 0; i < n; i++) {
      const S = path[i], g = gr(S, i);
      const target = custom ? custom(i, S, g, hedge) : ((i % hedgeEvery === 0) ? -g.delta : hedge);
      if (target !== hedge) { const tr = target - hedge; const c = Math.abs(tr) * S * P.cost; cash -= tr * S + c; costs += c; cc += c; hedge = target; }
      out.hedgePos.push(hedge); out.deltas.push(g.delta);
      const S1 = path[i + 1], dS = S1 - S;
      const V1 = val(S1, i + 1);
      const interest = cash * (Math.exp(P.r * dt) - 1);
      cash += interest;
      const q = hedge * S * (Math.exp(P.q * dt) - 1); cash += q; // dividendos das ações do hedge
      const pnl = (V1 - V) + hedge * dS + interest + q - (out._lastCost = 0);
      // decomposição
      const gP = 0.5 * g.gamma * dS * dS, tP = g.theta * dt, dm = (g.delta + hedge) * dS;
      cg += gP; ct += tP; cd += dm; cf += interest + q;
      V = V1;
      const tot = V + hedge * S1 + cash; // valor da carteira (começou em 0)
      out.cum.push(tot); out.daily.push(pnl);
      out.unh.push(V1 - val(path[0], 0));
      out.gamma.push(cg); out.theta.push(ct); out.dmis.push(cd); out.cost.push(-cc); out.fin.push(cf);
    }
    out.final = out.cum[n]; out.costs = costs;
    return out;
  }
  function hedgeParams(v) {
    const pos = {
      sc: [{ qty: -1, type: 'call' }], lc: [{ qty: 1, type: 'call' }], sp: [{ qty: -1, type: 'put' }], lp: [{ qty: 1, type: 'put' }],
      ss: [{ qty: -1, type: 'call' }, { qty: -1, type: 'put' }], ls: [{ qty: 1, type: 'call' }, { qty: 1, type: 'put' }]
    }[v.pos];
    return { S0: v.S, base: +v.base, r: v.r / 100, q: 0, ivol: v.ivol / 100, rvol: v.rvol / 100, mu: v.mu / 100, days: v.days, cost: v.cost / 10000, legs: pos.map(l => ({ qty: l.qty * v.qty, type: l.type, K: v.K })) };
  }
  Sims.add({
    id: 'hedge', title: 'Delta Hedge & PnL', ic: 'ΔH',
    desc: 'Venda ou compre vol, faça delta hedge e veja o PnL nascer do duelo gamma × theta. Compare vol implícita vs realizada, frequência de hedge, custos, Monte Carlo — e um jogo em que VOCÊ decide o hedge dia a dia.',
    render(el, p) {
      el.innerHTML = '';
      const ctl = Sims.controls([
        { k: 'pos', label: 'Posição', type: 'select', v: (p && p.pos) || 'sc', numeric: false, options: [['sc', 'Vendido em call'], ['lc', 'Comprado em call'], ['sp', 'Vendido em put'], ['lp', 'Comprado em put'], ['ss', 'Vendido em straddle'], ['ls', 'Comprado em straddle']] },
        { k: 'qty', label: 'Quantidade de opções', type: 'number', v: 10000, step: 1000 },
        { k: 'S', label: 'Spot inicial', min: 20, max: 200, step: 1, v: 100 },
        { k: 'K', label: 'Strike', min: 20, max: 200, step: 1, v: 100 },
        { k: 'days', label: 'Prazo (dias)', min: 5, max: 252, step: 1, v: 42 },
        { k: 'base', label: 'Base', type: 'select', v: 252, options: [[252, '252 du'], [365, '365 dc']] },
        { k: 'ivol', label: 'Vol implícita (negociada)', min: 5, max: 80, step: 0.5, v: 25, fmt: pc },
        { k: 'rvol', label: 'Vol realizada (mercado)', min: 5, max: 80, step: 0.5, v: 20, fmt: pc },
        { k: 'mu', label: 'Drift anual do spot', min: -50, max: 50, step: 1, v: 0, fmt: pc },
        { k: 'r', label: 'Juros (cont.)', min: 0, max: 15, step: 0.25, v: 10, fmt: pc },
        { k: 'every', label: 'Rebalancear a cada (dias)', type: 'select', v: 1, options: [[1, '1 dia'], [2, '2 dias'], [5, '5 dias'], [10, '10 dias'], [21, '21 dias'], [9999, 'nunca (só hedge inicial)']] },
        { k: 'cost', label: 'Custo de transação (bps)', min: 0, max: 30, step: 0.5, v: 2 },
        { k: 'seed', label: 'Semente do caminho', type: 'number', v: 42, step: 1 }
      ], () => run(), 190);
      el.appendChild(ctl);
      el.appendChild(h(`<div class="row" style="margin-top:10px"><button class="btn sm nw">Novo caminho aleatório ↻</button></div>`)).querySelector('.nw').onclick = () => { ctl.set('seed', Math.floor(Math.random() * 99999)); run(); };
      let tab = 0;
      el.appendChild(Sims.tabs(['Um caminho', 'Decomposição do PnL', 'Monte Carlo', 'Jogo: você faz o hedge'], i => { tab = i; run(); }));
      const out = h('<div></div>'); el.appendChild(out);

      function run() {
        const v = ctl.vals, P = hedgeParams(v);
        out.innerHTML = '';
        if (tab === 3) return game(P);
        if (tab === 2) return mc(P, v);
        const R = Q.rng(v.seed), path = Q.gbmPath(P.S0, P.mu, P.rvol, P.days / P.base, P.days, R);
        const res = hedgeRun(P, path, v.every);
        const g0 = P.legs.reduce((a, l) => { const g = Q.bs(l.type, P.S0, l.K, P.days / P.base, P.r, P.q, P.ivol); a.vega += l.qty * g.vega; a.price += l.qty * g.price; return a; }, { vega: 0, price: 0 });
        const theo = g0.vega * (P.rvol - P.ivol);
        const days = Array.from({ length: P.days + 1 }, (_, i) => i);
        const kp = h(`<div class="grid g4" style="margin-bottom:14px">
          <div class="card kpi"><div class="l">PnL final hedgeado</div><div class="v ${res.final >= 0 ? 'up' : 'down'}">${money(res.final)}</div></div>
          <div class="card kpi"><div class="l">PnL sem hedge</div><div class="v ${res.unh[P.days] >= 0 ? 'up' : 'down'}">${money(res.unh[P.days])}</div></div>
          <div class="card kpi"><div class="l" style="text-transform:none">APROX. vega×(σr−σi)</div><div class="v">${money(theo)}</div></div>
          <div class="card kpi"><div class="l">Valor inicial da posição</div><div class="v">${money(g0.price)}</div></div></div>`);
        out.appendChild(kp);
        const rv = realizedVol(path, P.base);
        out.appendChild(h(`<p class="muted" style="font-size:13px;margin-top:-4px">Vol realizada <b>neste caminho</b>: ${Q.fmt(rv * 100, 1)}% (o parâmetro é ${Q.fmt(P.rvol * 100, 1)}% — um caminho só é uma amostra). Custos pagos: ${money(res.costs)}. ${v.pos[0] === 's' ? 'Vendido em vol: ganha se a realizada ficar abaixo da implícita.' : 'Comprado em vol: ganha se a realizada superar a implícita.'}</p>`));
        if (tab === 0) {
          const c1 = h('<div class="card"></div>'), c2 = h('<div class="card" style="margin-top:12px"></div>'); out.appendChild(c1); out.appendChild(c2);
          Plot.line(c1, { series: [{ x: days, y: Array.from(path), label: 'Spot', color: '#4cc9f0' }], hlines: [{ y: v.K, label: 'K' }], xLabel: 'dia', xName: 'dia', height: 220, zeroLine: false });
          Plot.line(c2, { series: [{ x: days, y: res.cum, label: 'PnL hedgeado', color: '#f5a623' }, { x: days, y: res.unh, label: 'PnL sem hedge (só opções)', color: '#7d8b9b', dash: [5, 4] }], xLabel: 'dia', xName: 'dia', height: 260 });
          const c3 = h('<div class="card" style="margin-top:12px"><h3>Hedge em ações vs delta das opções</h3></div>'); out.appendChild(c3);
          Plot.line(c3.appendChild(h('<div></div>')), { series: [{ x: days.slice(0, -1), y: res.deltas.map(x => -x), label: '−Delta das opções (hedge ideal)', color: '#26d07c' }, { x: days.slice(0, -1), y: res.hedgePos, label: 'Ações que você tem', color: '#f5a623', width: 1.5 }], xLabel: 'dia', xName: 'dia', height: 220 });
        } else {
          const c = h('<div class="card"><h3>De onde veio o PnL (acumulado)</h3><p class="muted" style="font-size:13px">Com hedge diário, o PnL ≈ Σ ½Γ(ΔS)² (ganho de gamma) + Σ Θ·dt (theta) + financiamento. Delta mismatch aparece quando o hedge é espaçado. O residual vem de termos de ordem superior.</p></div>'); out.appendChild(c);
          const pd = h('<div></div>'); c.appendChild(pd);
          const resid = res.cum.map((x, i) => x - res.gamma[i] - res.theta[i] - res.dmis[i] - res.cost[i] - res.fin[i]);
          Plot.line(pd, { series: [{ x: days, y: res.gamma, label: 'Gamma ½Γ(ΔS)²', color: '#26d07c' }, { x: days, y: res.theta, label: 'Theta', color: '#ff5c8a' }, { x: days, y: res.dmis, label: 'Delta mismatch', color: '#b388ff' }, { x: days, y: res.fin, label: 'Financiamento', color: '#ffd166', width: 1.2 }, { x: days, y: res.cost, label: 'Custos', color: '#7d8b9b', width: 1.2 }, { x: days, y: resid, label: 'Residual', color: '#56636f', dash: [3, 3], width: 1 }, { x: days, y: res.cum, label: 'TOTAL', color: '#f5a623', width: 2.5 }], xLabel: 'dia', xName: 'dia', height: 320 });
          const c2 = h('<div class="card" style="margin-top:12px"><h3>PnL diário</h3></div>'); out.appendChild(c2);
          Plot.bars(c2.appendChild(h('<div></div>')), { labels: res.daily.map((_, i) => 'd' + (i + 1)), values: res.daily, yFmt: money, height: 200 });
        }
      }
      function mc(P, v) {
        const note = h('<div class="card"><p class="muted">Rodando 300 caminhos por frequência de hedge…</p></div>'); out.appendChild(note);
        setTimeout(() => {
          const freqs = [1, 2, 5, 10, 21, 9999], N = 300, T = P.days / P.base;
          const results = {};
          freqs.forEach(f => { results[f] = []; });
          for (let k = 0; k < N; k++) {
            const R = Q.rng(1000 + k), path = Q.gbmPath(P.S0, P.mu, P.rvol, T, P.days, R);
            freqs.forEach(f => results[f].push(hedgeRun(P, path, f).final));
          }
          const stats = a => { const m = a.reduce((x, y) => x + y, 0) / a.length; const sd = Math.sqrt(a.reduce((x, y) => x + (y - m) * (y - m), 0) / a.length); const s = a.slice().sort((x, y) => x - y); return { m, sd, p5: s[Math.floor(a.length * 0.05)], p95: s[Math.floor(a.length * 0.95)] }; };
          const g0 = P.legs.reduce((a, l) => a + l.qty * Q.bs(l.type, P.S0, l.K, T, P.r, P.q, P.ivol).vega, 0);
          note.innerHTML = `<h3>Distribuição do PnL final (${N} caminhos, vol realizada ${Q.fmt(P.rvol * 100, 1)}%)</h3>
            <p class="muted" style="font-size:13px">Aproximação teórica da média: vega × (σ<sub>r</sub> − σ<sub>i</sub>) ≈ <b>${money(g0 * (P.rvol - P.ivol))}</b>. Quanto mais frequente o hedge, menor a dispersão (mas maiores os custos). Sem rebalancear, você está basicamente com a opção "pelada".</p>
            <table class="tbl"><tr><th>Rebalanceamento</th><th class="n">Média</th><th class="n">Desvio-padrão</th><th class="n">Pior 5%</th><th class="n">Melhor 5%</th></tr>
            ${freqs.map(f => { const s = stats(results[f]); return `<tr><td>${f === 9999 ? 'nunca' : 'a cada ' + f + 'd'}</td><td class="n ${s.m >= 0 ? 'up' : 'down'}">${money(s.m)}</td><td class="n">${money(s.sd)}</td><td class="n">${money(s.p5)}</td><td class="n">${money(s.p95)}</td></tr>`; }).join('')}</table><div class="hh"></div>`;
          const sel = +v.every; const data = results[freqs.includes(sel) ? sel : 1];
          Plot.hist(note.querySelector('.hh'), { data, bins: 36, xFmt: money, height: 240, vlines: [{ x: 0, color: '#7d8b9b' }], xName: 'PnL', label: 'Frequência selecionada (' + (sel === 9999 ? 'nunca' : sel + 'd') + ')' });
        }, 30);
      }
      function game(P) {
        P = Object.assign({}, P, { days: Math.min(P.days, 20) });
        const seed = Math.floor(Math.random() * 1e6), R = Q.rng(seed);
        const path = Q.gbmPath(P.S0, P.mu, P.rvol, P.days / P.base, P.days, R);
        const my = [];
        let day = 0;
        const box = h(`<div class="card"><h3>Você está na mesa</h3><p class="muted">Posição: <b>${P.legs.map(l => (l.qty > 0 ? '+' : '') + Q.fmt(l.qty, 0) + ' ' + l.type + ' K=' + l.K).join(', ')}</b>, ${P.days} dias até o vencimento, negociada a ${Q.fmt(P.ivol * 100, 1)}% de vol. A cada dia, decida quantas ações segurar. O objetivo é ficar perto do resultado do hedge automático diário — sem adivinhar o mercado.</p><div class="st"></div></div>`);
        out.appendChild(box);
        const st = box.querySelector('.st');
        const dt = 1 / P.base;
        function g(i) { const S = path[i]; return P.legs.reduce((a, l) => { const gg = Q.bs(l.type, S, l.K, Math.max(0, (P.days - i) * dt), P.r, P.q, P.ivol); a.d += l.qty * gg.delta; a.g += l.qty * gg.gamma; return a; }, { d: 0, g: 0 }); }
        function step() {
          if (day >= P.days) return finish();
          const S = path[day], gg = g(day), cur = day ? my[day - 1] : 0;
          st.innerHTML = `<div class="grid g4" style="margin:10px 0">
            <div class="card kpi"><div class="l">Dia</div><div class="v">${day + 1}/${P.days}</div></div>
            <div class="card kpi"><div class="l">Spot</div><div class="v">${f2(S)} ${day ? `<span style="font-size:14px" class="${S >= path[day - 1] ? 'up' : 'down'}">${Q.fmt((S / path[day - 1] - 1) * 100, 2)}%</span>` : ''}</div></div>
            <div class="card kpi"><div class="l">Delta das opções</div><div class="v">${money(gg.d)}</div></div>
            <div class="card kpi"><div class="l">Delta líquido (com seu hedge)</div><div class="v ${Math.abs(gg.d + cur) < Math.abs(gg.d) * 0.1 + 1 ? 'up' : 'amber'}">${money(gg.d + cur)}</div></div></div>
            <p class="muted mono" style="font-size:12.5px">Gamma total: ${Q.fmt(gg.g, 2)} → um move de 1% muda o delta em ~${money(gg.g * S * 0.01)} ações. Hoje você tem ${money(cur)} ações.</p>
            <div class="row"><label class="fld" style="width:220px"><span class="lab">Ações a manter (±)</span><input type="number" value="${Math.round(cur)}" step="100"></label>
            <button class="btn pri ok">Confirmar e avançar dia</button><button class="btn neu">Neutralizar (−delta)</button><button class="btn ghost keep">Manter</button></div>`;
          const inp = st.querySelector('input');
          st.querySelector('.neu').onclick = () => { inp.value = Math.round(-gg.d); };
          st.querySelector('.keep').onclick = () => { inp.value = Math.round(cur); };
          st.querySelector('.ok').onclick = () => { my.push(+inp.value || 0); day++; step(); };
        }
        function finish() {
          const mine = hedgeRun(P, path, 1, i => my[i]);
          const auto = hedgeRun(P, path, 1);
          const none = hedgeRun(P, path, 9999, () => 0);
          const prem = Math.abs(P.legs.reduce((a, l) => a + l.qty * Q.bsPrice(l.type, P.S0, l.K, P.days / P.base, P.r, P.q, P.ivol), 0));
          const err = Math.abs(mine.final - auto.final) / prem;
          const hg = Store.s.hedgeGame; hg.plays++; if (hg.best == null || err < hg.best) hg.best = err;
          Store.useSim('hedge-game'); Store.addXP(err <= 0.25 ? 40 : err <= 0.5 ? 20 : 8, 'jogo de hedge');
          const days = Array.from({ length: P.days + 1 }, (_, i) => i);
          st.innerHTML = `<div class="grid g3" style="margin:10px 0">
            <div class="card kpi"><div class="l">Seu PnL</div><div class="v ${mine.final >= 0 ? 'up' : 'down'}">${money(mine.final)}</div></div>
            <div class="card kpi"><div class="l">Hedge automático diário</div><div class="v ${auto.final >= 0 ? 'up' : 'down'}">${money(auto.final)}</div></div>
            <div class="card kpi"><div class="l">Sem hedge</div><div class="v ${none.final >= 0 ? 'up' : 'down'}">${money(none.final)}</div></div></div>
            <p>Erro de tracking vs hedge automático: <b class="${err <= 0.25 ? 'up' : 'amber'}">${Q.fmt(err * 100, 1)}% do prêmio</b>. ${err <= 0.25 ? 'Excelente disciplina de hedge.' : 'Dica: com gamma alto (perto do strike e do vencimento), o delta muda rápido — rebalanceie mais.'}</p><div class="pp"></div><button class="btn pri again" style="margin-top:12px">Jogar de novo</button>`;
          Plot.line(st.querySelector('.pp'), { series: [{ x: days, y: mine.cum, label: 'Você', color: '#f5a623' }, { x: days, y: auto.cum, label: 'Auto diário', color: '#26d07c' }, { x: days, y: none.cum, label: 'Sem hedge', color: '#7d8b9b', dash: [5, 4] }], xName: 'dia', height: 240 });
          st.querySelector('.again').onclick = () => run();
        }
        step();
      }
      run();
    }
  });
  function realizedVol(path, base) { let s = 0, s2 = 0, n = path.length - 1; for (let i = 1; i <= n; i++) { const r = Math.log(path[i] / path[i - 1]); s += r; s2 += r * r; } return Math.sqrt(Math.max(0, (s2 - s * s / n) / (n - 1)) * base); }
  Sims.realizedVol = realizedVol; Sims.hedgeRun = hedgeRun;

  /* ================== 4. LABORATÓRIO DE BARREIRAS ================== */
  const BK = [['cuo', 'Call up-and-out'], ['cui', 'Call up-and-in'], ['cdo', 'Call down-and-out'], ['cdi', 'Call down-and-in'], ['puo', 'Put up-and-out'], ['pui', 'Put up-and-in'], ['pdo', 'Put down-and-out'], ['pdi', 'Put down-and-in']];
  Sims.add({
    id: 'barrier', title: 'Laboratório de Barreiras', ic: 'KO',
    desc: 'Knock-in/knock-out, up/down, com rebate. Preço analítico (Reiner-Rubinstein) vs Monte Carlo com monitoramento discreto, paridade in+out=vanilla e o comportamento selvagem das gregas perto da barreira.',
    render(el, p) {
      p = p || {};
      el.innerHTML = '';
      const ctl = Sims.controls([
        { k: 'kind', label: 'Tipo', type: 'select', v: p.kind || 'cuo', numeric: false, options: BK },
        { k: 'S', label: 'Spot', min: 50, max: 150, step: 0.5, v: 100, fmt: f2 },
        { k: 'K', label: 'Strike', min: 50, max: 150, step: 0.5, v: 100, fmt: f2 },
        { k: 'H', label: 'Barreira H', min: 50, max: 160, step: 0.5, v: p.kind && p.kind[1] === 'd' ? 80 : 120, fmt: f2 },
        { k: 'reb', label: 'Rebate', min: 0, max: 20, step: 0.5, v: 0, fmt: f2 },
        { k: 'days', label: 'Prazo (dias úteis)', min: 5, max: 504, step: 1, v: 126 },
        { k: 'vol', label: 'Vol', min: 5, max: 80, step: 0.5, v: 25, fmt: pc },
        { k: 'r', label: 'Juros (cont.)', min: 0, max: 15, step: 0.25, v: 10, fmt: pc },
        { k: 'q', label: 'Div. yield', min: 0, max: 8, step: 0.25, v: 0, fmt: pc }
      ], (v, k) => { if (k === 'kind') { ctl.set('H', v.kind[1] === 'd' ? Math.min(v.H, v.S * 0.85) : Math.max(v.H, v.S * 1.15)); } redraw(); });
      el.appendChild(ctl);
      const res = h('<div class="grid g4" style="margin-top:14px"></div>'); el.appendChild(res);
      let tab = 0;
      el.appendChild(Sims.tabs(['Preço vs spot', 'Delta', 'Gamma', 'Vega', 'Monte Carlo & monitoramento', 'Caminhos'], i => { tab = i; drawTab(); }));
      const tabEl = h('<div class="card"></div>'); el.appendChild(tabEl);
      function P() { const v = ctl.vals; return { kind: v.kind, S: v.S, K: v.K, H: v.H, reb: v.reb, T: v.days / 252, days: v.days, vol: v.vol / 100, r: v.r / 100, q: v.q / 100 }; }
      const price = (p, S, T, vol) => Q.barrier(p.kind, S, p.K, p.H, T == null ? p.T : T, p.r, p.q, vol == null ? p.vol : vol, p.reb);
      function redraw() {
        const p = P(), van = p.kind[0] === 'c' ? 'call' : 'put';
        const b = price(p, p.S), v = Q.bsPrice(van, p.S, p.K, p.T, p.r, p.q, p.vol);
        const twin = p.kind.slice(0, 2) + (p.kind[2] === 'i' ? 'o' : 'i');
        const tw = Q.barrier(twin, p.S, p.K, p.H, p.T, p.r, p.q, p.vol, 0);
        const b0 = Q.barrier(p.kind, p.S, p.K, p.H, p.T, p.r, p.q, p.vol, 0);
        const g = Q.fdGreeks((S, T, s) => price(p, S, T, s), p.S, p.T, p.vol);
        const bad = (p.kind[1] === 'u' && p.H <= p.S) || (p.kind[1] === 'd' && p.H >= p.S);
        res.innerHTML = `<div class="card kpi"><div class="l">Barreira</div><div class="v amber">${f4(b)}</div></div>
          <div class="card kpi"><div class="l">Vanilla equivalente</div><div class="v">${f4(v)}</div></div>
          <div class="card kpi"><div class="l">Desconto vs vanilla</div><div class="v">${Q.fmt((1 - b / v) * 100, 1)}%</div></div>
          <div class="card kpi"><div class="l">Paridade: in + out (sem rebate)</div><div class="v" style="font-size:16px">${f4(b0 + tw)} = ${f4(v)} ${Math.abs(b0 + tw - v) < 1e-6 ? '<span class="up">✓</span>' : ''}</div></div>
          <div class="card" style="grid-column:1/-1"><span class="mono" style="font-size:13px">Δ ${f4(g.delta)} · Γ ${f4(g.gamma)} · Vega/pt ${f4(g.vega / 100)} · Θ/dia ${f4(g.theta / 252)}</span> ${bad ? '<span class="pill down">spot já está além da barreira: a opção já ' + (p.kind[2] === 'i' ? 'virou vanilla' : 'foi nocauteada') + '</span>' : ''} ${g.vega < 0 ? '<span class="pill down">vega NEGATIVO: subir a vol aumenta a chance de tocar a barreira</span>' : ''}</div>`;
        drawTab();
      }
      function drawTab() {
        const p = P(), van = p.kind[0] === 'c' ? 'call' : 'put';
        tabEl.innerHTML = '';
        const lo = Math.min(p.K, p.H, p.S) * 0.7, hi = Math.max(p.K, p.H, p.S) * 1.2, xs = Plot.linspace(lo, hi, 241);
        const vl = [{ x: p.H, label: 'H', color: '#b388ff' }, { x: p.K, label: 'K' }, { x: p.S, label: 'S', color: '#ff5c8a' }];
        if (tab <= 3) {
          const key = ['price', 'delta', 'gamma', 'vega'][tab];
          const Ts = [p.T, p.T / 3, Math.max(p.T / 15, 2 / 252)];
          const fnB = (S, T) => key === 'price' ? price(p, S, T) : Q.fdGreeks((s, t, v) => price(p, s, t, v), S, T, p.vol, { hS: 0.15 })[key] * (key === 'vega' ? 0.01 : 1);
          const fnV = (S, T) => { const g = Q.bs(van, S, p.K, T, p.r, p.q, p.vol); return key === 'vega' ? g.vega / 100 : g[key]; };
          Plot.line(tabEl, { series: [...Ts.map((T, i) => ({ x: xs, y: xs.map(S => fnB(S, T)), label: `Barreira ${Math.round(T * 252)}d`, color: ['#f5a623', '#4cc9f0', '#26d07c'][i] })), { x: xs, y: xs.map(S => fnV(S, p.T)), label: `Vanilla ${p.days}d`, color: '#7d8b9b', dash: [5, 4] }], vlines: vl, xName: 'S', xLabel: 'Spot', height: 340 });
          const tips = {
            price: 'Out: o preço vai a zero (ou ao rebate) na barreira. In: na barreira, vira a vanilla.',
            delta: 'Em knock-outs "reverse" (barreira dentro do dinheiro, ex.: call up-and-out), o delta fica NEGATIVO perto da barreira e salta quando ela é tocada — o hedge é descontínuo.',
            gamma: 'Gamma enorme e de sinal trocado perto da barreira, principalmente perto do vencimento. É aqui que mesas perdem dinheiro com gap.',
            vega: 'Vega pode ser negativo para knock-outs: mais vol = mais chance de nocautear. Isso muda completamente o risco da estrutura.'
          };
          tabEl.appendChild(h(`<p class="muted" style="font-size:13px">${tips[key]}</p>`));
        } else if (tab === 4) {
          tabEl.innerHTML = '<p class="muted">Simulando…</p>';
          setTimeout(() => {
            const cont = price(p, p.S);
            const rows = [[1, 'diário'], [5, 'semanal'], [21, 'mensal']].map(([every, lab]) => {
              const steps = Math.max(1, Math.round(p.days / every));
              const mcr = Q.mcBarrier(p.kind, p.S, p.K, p.H, p.T, p.r, p.q, p.vol, p.reb, 20000, steps, 11);
              const dtm = p.T / steps, shift = Math.exp((p.kind[1] === 'u' ? 1 : -1) * 0.5826 * p.vol * Math.sqrt(dtm));
              const bg = Q.barrier(p.kind, p.S, p.K, p.H * shift, p.T, p.r, p.q, p.vol, p.reb);
              return `<tr><td>${lab} (${steps} obs.)</td><td class="n">${f4(mcr.price)} ± ${f4(1.96 * mcr.se)}</td><td class="n">${f4(bg)}</td><td class="n">${f2(p.H * shift)}</td></tr>`;
            }).join('');
            tabEl.innerHTML = `<h3>Monitoramento contínuo vs discreto</h3><p class="muted" style="font-size:13px">A fórmula fechada supõe que a barreira é observada continuamente. Contratos reais costumam observar no fechamento diário. Com menos observações, é mais difícil tocar a barreira. A correção de Broadie-Glasserman-Kou desloca a barreira por \\(e^{\\pm 0{,}5826\\,\\sigma\\sqrt{\\Delta t}}\\) e usa a fórmula contínua.</p>
              <table class="tbl"><tr><th>Monitoramento</th><th class="n">Monte Carlo (20k caminhos, IC 95%)</th><th class="n">Fórmula c/ barreira ajustada</th><th class="n">H ajustada</th></tr><tr><td>contínuo (fórmula)</td><td class="n">${f4(cont)}</td><td class="n">—</td><td class="n">${f2(p.H)}</td></tr>${rows}</table>`;
            UI.math(tabEl);
          }, 20);
        } else {
          const R = Q.rng(Math.floor(Math.random() * 1e6)), n = 14, steps = Math.min(p.days, 252), days = Array.from({ length: steps + 1 }, (_, i) => i * p.days / steps);
          const series = []; let hits = 0;
          for (let k = 0; k < n; k++) {
            const path = Array.from(Q.gbmPath(p.S, p.r - p.q, p.vol, p.T, steps, R));
            const hit = path.some(s => p.kind[1] === 'u' ? s >= p.H : s <= p.H); if (hit) hits++;
            series.push({ x: days, y: path, color: hit ? 'rgba(255,92,92,.75)' : 'rgba(76,201,240,.75)', width: 1.2 });
          }
          Plot.line(tabEl, { series, hlines: [{ y: p.H, label: 'Barreira', color: '#b388ff' }, { y: p.K, label: 'Strike' }], xName: 'dia', xLabel: 'dias', height: 320, zeroLine: false });
          tabEl.appendChild(h(`<p class="muted" style="font-size:13px">${hits} de ${n} caminhos (vermelhos) tocaram a barreira (medida neutra a risco). Clique na aba de novo para sortear outros caminhos.</p>`));
        }
      }
      redraw();
    }
  });

  /* ================== 5. LIVRO DE RISCO DA MESA ================== */
  const BOOKS = {
    'Market maker misto (IBOV)': { S: 130000, mult: 5, lim: [3e6, 150000, 150000], legs: [
      { qty: -300, type: 'call', K: 135000, days: 21 }, { qty: 250, type: 'put', K: 125000, days: 21 }, { qty: -200, type: 'put', K: 120000, days: 42 },
      { qty: 400, type: 'call', K: 130000, days: 63 }, { qty: -150, type: 'call', K: 140000, days: 126 }, { qty: 100, type: 'put', K: 115000, days: 252 }, { qty: -25, type: 'stock' }] },
    'Emissor de COE (vendido em calls longas)': { S: 100, mult: 1000, lim: [5e6, 400000, 300000], legs: [
      { qty: -500, type: 'call', K: 100, days: 252 }, { qty: 500, type: 'call', K: 130, days: 252 }, { qty: -300, type: 'call', K: 105, days: 504 }, { qty: 450, type: 'stock' }] },
    'Livro de autocall (simplificado)': { S: 100, mult: 1000, lim: [5e6, 600000, 300000], legs: [
      { qty: 800, type: 'pdi', K: 100, H: 65, days: 504 }, { qty: -600, type: 'dcall', K: 100, days: 252, cash: 8 }, { qty: -300, type: 'put', K: 90, days: 63 }, { qty: 150, type: 'stock' }] },
    'Vendido em vol curta, comprado em vol longa': { S: 50, mult: 100, lim: [5e6, 1000000, 200000], legs: [
      { qty: -2000, type: 'call', K: 50, days: 10 }, { qty: -2000, type: 'put', K: 50, days: 10 }, { qty: 1200, type: 'call', K: 50, days: 189 }, { qty: 1200, type: 'put', K: 50, days: 189 }] }
  };
  const STRESS = [
    ['Black Monday 1987 (EUA)', -20, 30], ['Circuit breaker Joesley (18/05/2017)', -9, 12], ['Covid (mar/2020)', -30, 40], ['Volmageddon (05/02/2018)', -4, 20],
    ['Rally forte', 8, -5], ['Vol crush pós-evento', 0, -8], ['Sell-off lento', -10, 5]
  ];
  Sims.add({
    id: 'book', title: 'Livro de Risco da Mesa', ic: 'RK',
    desc: 'Um livro real com várias posições e vencimentos, com superfície de vol. Veja gregas agregadas, ladder de vega por vencimento, gamma por strike, grade spot×vol, stress históricos, limites e o PnL explain do dia.',
    render(el) {
      el.innerHTML = '';
      let bookName = Object.keys(BOOKS)[0], book = JSON.parse(JSON.stringify(BOOKS[bookName]));
      const top = h(`<div class="row" style="margin-bottom:12px"><label class="fld" style="min-width:340px"><span class="lab">Livro</span><select>${Object.keys(BOOKS).map(k => `<option>${k}</option>`).join('')}</select></label></div>`);
      el.appendChild(top);
      const ctl = Sims.controls([
        { k: 'atmS', label: 'Vol ATM curta', min: 5, max: 80, step: 0.5, v: 24, fmt: pc },
        { k: 'atmL', label: 'Vol ATM longa', min: 5, max: 80, step: 0.5, v: 22, fmt: pc },
        { k: 'skew', label: 'Skew', min: -20, max: 5, step: 0.5, v: -6, fmt: v => Q.fmt(v, 1) },
        { k: 'r', label: 'Juros (cont.)', min: 0, max: 15, step: 0.25, v: 10, fmt: pc },
        { k: 'limD', label: 'Limite |delta cash|', type: 'number', v: 5000000, step: 500000 },
        { k: 'limG', label: 'Limite |gamma cash 1%|', type: 'number', v: 400000, step: 50000 },
        { k: 'limV', label: 'Limite |vega por pt|', type: 'number', v: 300000, step: 50000 }
      ], () => redraw(), 180);
      el.appendChild(ctl);
      const setLim = () => { if (book.lim) { ctl.set('limD', book.lim[0]); ctl.set('limG', book.lim[1]); ctl.set('limV', book.lim[2]); } };
      top.querySelector('select').onchange = e => { bookName = e.target.value; book = JSON.parse(JSON.stringify(BOOKS[bookName])); setLim(); redraw(); };
      setLim();
      const sum = h('<div style="margin-top:14px"></div>'); el.appendChild(sum);
      let tab = 0;
      el.appendChild(Sims.tabs(['Posições', 'Ladders', 'Spot × Vol', 'Stress', 'PnL explain'], i => { tab = i; drawTab(); }));
      const tabEl = h('<div class="card"></div>'); el.appendChild(tabEl);
      function mkt(dv, S) {
        const v = ctl.vals;
        return { S: S || book.S, S0ref: S || book.S, r: v.r / 100, q: 0, vol: v.atmS / 100, base: 252, volShift: (dv || 0) / 100, surf: Q.volSurface({ atmShort: v.atmS / 100, atmLong: v.atmL / 100, tau: 0.4, skew: v.skew / 100, curv: 0.006 }) };
      }
      const legsM = () => book.legs.map(l => Object.assign({}, l, { qty: l.qty * book.mult }));
      function agg(M, S, el2) { return bookGreeks(legsM(), M, S, el2 || 0); }
      const bookGreeks = Sims.bookGreeks, bookValue = Sims.bookValue;
      function redraw() {
        const M = mkt(0), S = book.S, g = agg(M, S), v = ctl.vals;
        const dC = g.delta * S, gC = 0.5 * g.gamma * Math.pow(S * 0.01, 2), gD = g.gamma * S * 0.01 * S, veg = g.vega / 100, th = g.theta / 252;
        const lim = (x, L) => Math.abs(x) > L ? `<span class="pill down">ESTOURO ${Q.fmt(Math.abs(x) / L * 100, 0)}%</span>` : `<span class="pill up">${Q.fmt(Math.abs(x) / L * 100, 0)}% do limite</span>`;
        sum.innerHTML = `<div class="grid g4">
          <div class="card kpi"><div class="l">Delta cash</div><div class="v ${dC >= 0 ? 'up' : 'down'}">${money(dC)}</div>${lim(dC, v.limD)}</div>
          <div class="card kpi"><div class="l">Gamma: Δdelta cash por 1%</div><div class="v ${gD >= 0 ? 'up' : 'down'}">${money(gD)}</div><span class="muted mono" style="font-size:11px">PnL ½Γ(1%)²: ${money(gC)}</span> ${lim(gD, v.limG)}</div>
          <div class="card kpi"><div class="l">Vega por pt de vol</div><div class="v ${veg >= 0 ? 'up' : 'down'}">${money(veg)}</div>${lim(veg, v.limV)}</div>
          <div class="card kpi"><div class="l">Theta por dia útil</div><div class="v ${th >= 0 ? 'up' : 'down'}">${money(th)}</div><span class="muted mono" style="font-size:11px">breakeven: move de ${Q.fmt(Math.sqrt(Math.abs(th) / Math.max(1e-9, Math.abs(0.5 * g.gamma * S * S))) * 100, 2)}%/dia</span></div></div>
          <div class="card" style="margin-top:12px"><b>Leitura:</b> ${Sims.deskRead(g, S, 252)} <span class="pill">vanna ${money(g.vanna * S / 100)} Δcash/pt</span> <span class="pill">volga ${money(g.volga / 10000)} vega/pt</span></div>`;
        drawTab();
      }
      function drawTab() {
        const M = mkt(0), S = book.S; tabEl.innerHTML = '';
        if (tab === 0) {
          tabEl.innerHTML = `<p class="muted" style="font-size:13px">Multiplicador do contrato: ${book.mult}. Quantidades em contratos. Edite e veja o risco mudar.</p><table class="tbl legs"><tr><th>Qty</th><th>Tipo</th><th>K</th><th>H</th><th>Dias</th><th class="n">Vol</th><th class="n">Δ cash</th><th class="n">Vega/pt</th><th class="n">Θ/dia</th><th></th></tr>${book.legs.map((l, i) => {
            const g = Sims.legGreeks(l, M, S, 0), q = l.qty * book.mult, T = (l.days || 0) / 252;
            const vol = l.type === 'stock' ? '' : Q.fmt(M.surf.vol(l.K, S * Math.exp(M.r * T), Math.max(T, 1 / 252)) * 100, 1) + '%';
            return `<tr data-i="${i}"><td><input type="number" data-f="qty" value="${l.qty}" style="width:80px"></td><td>${l.type}</td><td>${l.K || ''}</td><td>${l.H || ''}</td><td>${l.days || ''}</td><td class="n">${vol}</td><td class="n">${money(q * g.delta * S)}</td><td class="n">${money(q * g.vega / 100)}</td><td class="n">${money(q * g.theta / 252)}</td><td><button class="btn sm ghost del">✕</button></td></tr>`;
          }).join('')}</table>
          <div class="row" style="margin-top:10px"><select class="nt" style="width:130px"><option>call</option><option>put</option><option>stock</option></select><input class="nq" type="number" value="100" style="width:90px" title="qty"><input class="nk" type="number" value="${S}" style="width:110px" title="strike"><input class="nd" type="number" value="63" style="width:80px" title="dias"><button class="btn sm add">+ Adicionar</button><button class="btn sm hedge">Zerar delta com ação</button></div>`;
          tabEl.querySelectorAll('tr[data-i]').forEach(tr => {
            const i = +tr.dataset.i;
            tr.querySelector('input').onchange = e => { book.legs[i].qty = +e.target.value; redraw(); };
            tr.querySelector('.del').onclick = () => { book.legs.splice(i, 1); redraw(); };
          });
          tabEl.querySelector('.add').onclick = () => { const t = tabEl.querySelector('.nt').value; book.legs.push({ qty: +tabEl.querySelector('.nq').value, type: t, K: t === 'stock' ? undefined : +tabEl.querySelector('.nk').value, days: t === 'stock' ? undefined : +tabEl.querySelector('.nd').value }); redraw(); };
          tabEl.querySelector('.hedge').onclick = () => { const g = agg(M, S); book.legs.push({ qty: -g.delta / book.mult, type: 'stock' }); toast('Hedge adicionado: ' + money(-g.delta) + ' ações'); redraw(); };
        } else if (tab === 1) {
          const buckets = [[0, 21, '≤1M'], [22, 63, '1-3M'], [64, 126, '3-6M'], [127, 252, '6-12M'], [253, 9999, '>1A']];
          const vegaB = buckets.map(b => book.legs.filter(l => l.days >= b[0] && l.days <= b[1]).reduce((a, l) => a + l.qty * book.mult * Sims.legGreeks(l, M, S, 0).vega / 100, 0));
          const wvB = buckets.map((b, i) => vegaB[i] * Math.sqrt(63 / Math.max(10, (b[0] + Math.min(b[1], 504)) / 2)));
          const strikes = [...new Set(book.legs.filter(l => l.K).map(l => l.K))].sort((a, b) => a - b);
          const gamK = strikes.map(K => book.legs.filter(l => l.K === K).reduce((a, l) => a + l.qty * book.mult * Sims.legGreeks(l, M, S, 0).gamma * S * 0.01 * S, 0));
          tabEl.innerHTML = `<div class="grid g2"><div><h3>Vega por vencimento (por pt)</h3><div class="a"></div></div><div><h3>Vega ponderada (×√(3M/T))</h3><div class="b"></div></div></div><h3>Gamma por strike (Δ cash por 1%)</h3><div class="c"></div><h3>Gamma do livro vs spot (Δ cash por 1%)</h3><div class="d"></div>
          <p class="muted" style="font-size:13px">A vega ponderada reconhece que a vol curta se mexe mais que a longa: 1 pt de vega em 1 mês não é o mesmo risco que 1 pt em 1 ano. Mesas controlam os dois.</p>`;
          Plot.bars(tabEl.querySelector('.a'), { labels: buckets.map(b => b[2]), values: vegaB, yFmt: money });
          Plot.bars(tabEl.querySelector('.b'), { labels: buckets.map(b => b[2]), values: wvB, yFmt: money });
          Plot.bars(tabEl.querySelector('.c'), { labels: strikes.map(k => Q.fmt(k, 0)), values: gamK, yFmt: money });
          const xs = Plot.linspace(S * 0.8, S * 1.2, 61);
          Plot.line(tabEl.querySelector('.d'), { series: [{ x: xs, y: xs.map(s => agg(mkt(0, s), s).gamma * s * 0.01 * s), label: 'Gamma (Δcash/1%)', color: '#26d07c' }, { x: xs, y: xs.map(s => agg(mkt(0, s), s).delta * s), label: 'Delta cash', color: '#f5a623' }], vlines: [{ x: S, label: 'spot', color: '#ff5c8a' }], xName: 'S', height: 260 });
        } else if (tab === 2) {
          const shocks = [-20, -10, -5, -2, 0, 2, 5, 10, 20], vsh = [-10, -5, -2, 0, 2, 5, 10];
          const base = bookValue(legsM(), M, S, 0);
          const hor = h('<div></div>'); tabEl.appendChild(hor);
          const c = Sims.controls([{ k: 'd', label: 'Horizonte (dias)', min: 0, max: 20, v: 1 }], () => draw()); hor.appendChild(c);
          const t = h('<div></div>'); tabEl.appendChild(t);
          function draw() {
            const all = []; vsh.forEach(dv => shocks.forEach(sh => { const s2 = S * (1 + sh / 100); all.push(bookValue(legsM(), mkt(dv, s2), s2, c.vals.d) - base); }));
            const mx = Math.max(...all.map(Math.abs)) || 1; let k = 0;
            t.innerHTML = `<table class="tbl heat" style="margin-top:10px"><tr><th>vol \\ spot</th>${shocks.map(s => `<th>${s > 0 ? '+' : ''}${s}%</th>`).join('')}</tr>${vsh.map(dv => `<tr><th>${dv > 0 ? '+' : ''}${dv} pts</th>${shocks.map(() => { const x = all[k++], a = Math.min(1, Math.abs(x) / mx); return `<td style="background:${x >= 0 ? `rgba(38,208,124,${0.08 + a * 0.55})` : `rgba(255,92,92,${0.08 + a * 0.55})`}">${money(x)}</td>`; }).join('')}</tr>`).join('')}</table><p class="muted" style="font-size:13px">Full revaluation com sticky-moneyness (a superfície anda com o spot). Veja a assimetria: onde o livro sangra mais?</p>`;
          }
          draw();
        } else if (tab === 3) {
          const base = bookValue(legsM(), M, S, 0);
          const rows = STRESS.map(([n, sp, dv]) => { const s2 = S * (1 + sp / 100); const pnl = bookValue(legsM(), mkt(dv, s2), s2, 1) - base; const g = agg(M, S); const pred = g.delta * (s2 - S) + 0.5 * g.gamma * (s2 - S) ** 2 + g.vega * dv / 100; return `<tr><td>${n}</td><td class="n">${sp > 0 ? '+' : ''}${sp}%</td><td class="n">${dv > 0 ? '+' : ''}${dv}</td><td class="n ${pnl >= 0 ? 'up' : 'down'}">${money(pnl)}</td><td class="n muted">${money(pred)}</td></tr>`; }).join('');
          tabEl.innerHTML = `<h3>Cenários de stress (choque instantâneo, 1 dia)</h3><table class="tbl"><tr><th>Cenário</th><th class="n">Spot</th><th class="n">Vol (pts)</th><th class="n">PnL full reval</th><th class="n">Aprox. Δ+Γ+Vega</th></tr>${rows}</table><p class="muted" style="font-size:13px">A diferença entre full reval e a aproximação pelas gregas mostra o risco de ordem superior (volga, vanna, gamma que muda com o spot, barreiras). Em choques grandes, as gregas mentem.</p>`;
        } else {
          const c = Sims.controls([
            { k: 'dS', label: 'Move do spot (%)', min: -10, max: 10, step: 0.1, v: -1.5, fmt: v => Q.fmt(v, 1) + '%' },
            { k: 'dV', label: 'Move da vol (pts)', min: -8, max: 8, step: 0.1, v: 1.2, fmt: v => Q.fmt(v, 1) },
            { k: 'dt', label: 'Dias úteis passados', min: 0, max: 5, step: 1, v: 1 }
          ], () => draw()); tabEl.appendChild(c);
          const t = h('<div style="margin-top:12px"></div>'); tabEl.appendChild(t);
          function draw() {
            const v = c.vals, S1 = S * (1 + v.dS / 100), dS = S1 - S, dv = v.dV / 100;
            const g = agg(M, S);
            const actual = bookValue(legsM(), mkt(v.dV, S1), S1, v.dt) - bookValue(legsM(), M, S, 0);
            const parts = [['Delta: Δ·dS', g.delta * dS], ['Gamma: ½Γ·dS²', 0.5 * g.gamma * dS * dS], ['Vega: 𝒱·dσ', g.vega * dv], ['Theta: Θ·dt', g.theta * v.dt / 252], ['Vanna: ∂Δ/∂σ·dS·dσ', g.vanna * dS * dv], ['Volga: ½·∂𝒱/∂σ·dσ²', 0.5 * g.volga * dv * dv]];
            const expl = parts.reduce((a, p) => a + p[1], 0);
            t.innerHTML = `<table class="tbl"><tr><th>Componente</th><th class="n">PnL</th></tr>${parts.map(p => `<tr><td>${p[0]}</td><td class="n ${p[1] >= 0 ? 'up' : 'down'}">${money(p[1])}</td></tr>`).join('')}
              <tr style="font-weight:700"><td>Total explicado</td><td class="n">${money(expl)}</td></tr><tr style="font-weight:700"><td>PnL real (full reval)</td><td class="n ${actual >= 0 ? 'up' : 'down'}">${money(actual)}</td></tr>
              <tr><td>Não explicado (unexplained)</td><td class="n amber">${money(actual - expl)} (${Q.fmt(Math.abs(actual - expl) / Math.max(1, Math.abs(actual)) * 100, 1)}%)</td></tr></table>
              <p class="muted" style="font-size:13px">O PnL explain é a primeira coisa que o risco e o head da mesa olham de manhã. Unexplained grande = algum risco não mapeado (barreira, skew que mudou de forma, dividendos, erro de booking).</p>`;
            Plot.bars(t.appendChild(h('<div></div>')), { labels: parts.map(p => p[0].split(':')[0]).concat(['Unexpl.']), values: parts.map(p => p[1]).concat([actual - expl]), yFmt: money, height: 200 });
          }
          draw();
        }
      }
      redraw();
    }
  });

  /* ================== 6. SMILE & SUPERFÍCIE ================== */
  Sims.add({
    id: 'smile', title: 'Smile & Superfície de Vol', ic: 'σK',
    desc: 'Monte uma superfície (nível, skew, curvatura, estrutura a termo), veja o smile por vencimento, a densidade implícita (Breeden-Litzenberger) e o que acontece com vol e delta em sticky strike vs sticky delta.',
    render(el) {
      el.innerHTML = '';
      const ctl = Sims.controls([
        { k: 'atmS', label: 'Vol ATM curta', min: 5, max: 80, step: 0.5, v: 22, fmt: pc },
        { k: 'atmL', label: 'Vol ATM longa', min: 5, max: 80, step: 0.5, v: 20, fmt: pc },
        { k: 'tau', label: 'Velocidade da term structure (anos)', min: 0.05, max: 2, step: 0.05, v: 0.5, fmt: v => Q.fmt(v, 2) },
        { k: 'skew', label: 'Skew', min: -25, max: 10, step: 0.5, v: -8, fmt: v => Q.fmt(v, 1) },
        { k: 'curv', label: 'Curvatura (smile)', min: 0, max: 10, step: 0.25, v: 1.5, fmt: v => Q.fmt(v, 2) },
        { k: 'dS', label: 'Move do spot (p/ sticky)', min: -15, max: 15, step: 0.5, v: -5, fmt: v => Q.fmt(v, 1) + '%' }
      ], () => draw());
      el.appendChild(ctl);
      let tab = 0; el.appendChild(Sims.tabs(['Smile por vencimento', 'Estrutura a termo', 'Densidade implícita', 'Sticky strike × sticky delta'], i => { tab = i; draw(); }));
      const out = h('<div class="card"></div>'); el.appendChild(out);
      function surf() { const v = ctl.vals; return Q.volSurface({ atmShort: v.atmS / 100, atmLong: v.atmL / 100, tau: v.tau, skew: v.skew / 100, curv: v.curv / 100 }); }
      function draw() {
        const sf = surf(), S = 100, r = 0.05; out.innerHTML = '';
        const Ts = [[1 / 12, '1M'], [0.25, '3M'], [0.5, '6M'], [1, '1A'], [2, '2A']];
        if (tab === 0) {
          const Ks = Plot.linspace(60, 140, 161);
          Plot.line(out, { series: Ts.map(([T, lab], i) => ({ x: Ks, y: Ks.map(K => sf.vol(K, S * Math.exp(r * T), T) * 100), label: lab, color: ['#ff5c8a', '#f5a623', '#ffd166', '#4cc9f0', '#b388ff'][i] })), xLabel: 'Strike (spot = 100)', xName: 'K', yFmt: v => Q.fmt(v, 1) + '%', height: 330, zeroLine: false, vlines: [{ x: 100, label: 'spot' }] });
          out.appendChild(h(`<p class="muted" style="font-size:13px">Em equity, o skew é negativo: puts OTM (strikes baixos) têm vol maior — o mercado paga por proteção contra crash, e a vol tende a subir quando o spot cai. Vencimentos curtos têm smile mais "inclinado" em strike.</p>`));
          const t = Ts.map(([T, lab]) => { const F = S * Math.exp(r * T); const k25 = (d) => { let K = F; for (let i = 0; i < 40; i++) { const g = Q.bs(d > 0 ? 'call' : 'put', S, K, T, r, 0, sf.vol(K, F, T)); K *= Math.exp((Math.abs(g.delta) - 0.25) * (d > 0 ? 1 : -1) * 0.5); } return K; }; const Kc = k25(1), Kp = k25(-1); const vc = sf.vol(Kc, F, T), vp = sf.vol(Kp, F, T), va = sf.vol(F, F, T); return `<tr><td>${lab}</td><td class="n">${Q.fmt(va * 100, 2)}%</td><td class="n">${Q.fmt((vc - vp) * 100, 2)}</td><td class="n">${Q.fmt(((vc + vp) / 2 - va) * 100, 2)}</td><td class="n">${Q.fmt(Kp, 1)} / ${Q.fmt(Kc, 1)}</td></tr>`; }).join('');
          out.appendChild(h(`<table class="tbl"><tr><th>Vencimento</th><th class="n">ATM</th><th class="n">RR 25Δ (call−put)</th><th class="n">BF 25Δ</th><th class="n">K put / call 25Δ</th></tr>${t}</table>`));
        } else if (tab === 1) {
          const Tx = Plot.linspace(0.02, 2, 100);
          const fwd = Tx.map((T, i) => { if (i === 0) return NaN; const T0 = Tx[i - 1], v0 = sf.atm(T0), v1 = sf.atm(T); return Math.sqrt(Math.max(0, (v1 * v1 * T - v0 * v0 * T0) / (T - T0))) * 100; });
          Plot.line(out, { series: [{ x: Tx, y: Tx.map(T => sf.atm(T) * 100), label: 'Vol ATM (spot)', color: '#f5a623' }, { x: Tx, y: fwd, label: 'Vol forward instantânea', color: '#4cc9f0', dash: [5, 4] }], xLabel: 'Vencimento (anos)', xName: 'T', yFmt: v => Q.fmt(v, 1) + '%', height: 300, zeroLine: false });
          out.appendChild(h(`<p class="muted" style="font-size:13px">Variância total σ²T precisa crescer com T (senão há arbitragem de calendário). A vol forward entre T₁ e T₂ é \\(\\sqrt{(\\sigma_2^2T_2-\\sigma_1^2T_1)/(T_2-T_1)}\\). Estrutura invertida (curta > longa) é típica de estresse.</p>`)); UI.math(out);
        } else if (tab === 2) {
          const T = 0.25, F = S * Math.exp(r * T), Ks = Plot.linspace(55, 150, 191), hK = 0.25;
          const C = K => Q.bsPrice('call', S, K, T, r, 0, sf.vol(K, F, T));
          const dens = Ks.map(K => Math.exp(r * T) * (C(K + hK) - 2 * C(K) + C(K - hK)) / (hK * hK));
          const flat = Ks.map(K => Math.exp(r * T) * (Q.bsPrice('call', S, K + hK, T, r, 0, sf.atm(T)) - 2 * Q.bsPrice('call', S, K, T, r, 0, sf.atm(T)) + Q.bsPrice('call', S, K - hK, T, r, 0, sf.atm(T))) / (hK * hK));
          Plot.line(out, { series: [{ x: Ks, y: dens, label: 'Densidade implícita (com smile)', color: '#f5a623' }, { x: Ks, y: flat, label: 'Lognormal (vol flat ATM)', color: '#7d8b9b', dash: [5, 4] }], xLabel: 'Spot no vencimento (3M)', xName: 'S_T', height: 300, yFmt: v => Q.fmt(v, 3) });
          const neg = dens.some(d => d < -1e-4);
          out.appendChild(h(`<p class="muted" style="font-size:13px">Breeden-Litzenberger: \\(q(K)=e^{rT}\\,\\partial^2C/\\partial K^2\\) — o preço de uma borboleta apertada. O skew negativo engorda a cauda esquerda. ${neg ? '<b class="down">Densidade negativa detectada: essa superfície tem arbitragem de borboleta!</b>' : ''}</p>`)); UI.math(out);
        } else {
          const v = ctl.vals, T = 0.25, S1 = S * (1 + v.dS / 100), dS = S1 - S, Ks = Plot.linspace(70, 130, 121);
          const F0 = S * Math.exp(r * T), old = K => sf.vol(K, F0, T);
          const sd = K => old(K - dS), slv = K => old(K + dS);
          Plot.line(out, { series: [{ x: Ks, y: Ks.map(K => old(K) * 100), label: 'Antes = sticky strike (não muda por strike)', color: '#f5a623' }, { x: Ks, y: Ks.map(K => sd(K) * 100), label: 'Sticky delta (smile anda com o spot)', color: '#4cc9f0' }, { x: Ks, y: Ks.map(K => slv(K) * 100), label: 'Sticky local vol (anda ao contrário)', color: '#ff5c8a', dash: [6, 4] }], vlines: [{ x: S, label: 'S₀' }, { x: S1, label: 'S₁', color: '#ff5c8a' }], xName: 'K', yFmt: x => Q.fmt(x, 1) + '%', height: 300, zeroLine: false });
          const K = 100, g = Q.bs('call', S, K, T, r, 0, old(K)), slope = (old(K + 0.5) - old(K - 0.5)) / 1;
          const rows = [['Sticky strike', old(K), 0], ['Sticky delta', sd(K), -slope], ['Sticky local vol', slv(K), slope]];
          out.appendChild(h(`<table class="tbl"><tr><th>Call K=100, 3M</th><th class="n">Vol do strike 100 após o move</th><th class="n" style="text-transform:none">∂σ/∂S (por R$1)</th><th class="n" style="text-transform:none">Shadow delta = Δ + 𝒱·∂σ/∂S</th></tr>${rows.map(([n, vv, d]) => `<tr><td>${n}</td><td class="n">${Q.fmt(vv * 100, 2)}%</td><td class="n">${Q.fmt(d * 100, 3)} pt</td><td class="n">${f4(g.delta + g.vega * d)}</td></tr>`).join('')}</table>
          <p class="muted" style="font-size:13px">Delta BS (vol fixa) = ${f4(g.delta)}. Com skew negativo: em <b>sticky delta</b> a vol de um strike fixo sobe quando o spot sobe (∂σ/∂S &gt; 0) e o delta verdadeiro da call é <b>maior</b>; em <b>sticky local vol</b> ela cai (∂σ/∂S &lt; 0) e o delta é <b>menor</b>. Empiricamente, índices de ações ficam entre sticky strike e sticky local vol — por isso mesas de índice costumam usar um delta menor que o BS para calls (e mais negativo para puts).</p>`));
          UI.math(out);
        }
      }
      draw();
    }
  });

  /* ================== 7. CALCULADORA BRASIL ================== */
  Sims.add({
    id: 'br', title: 'Calculadora Brasil (DI, termo, cupom)', ic: 'DI',
    desc: 'Taxa DI ↔ PU, DV01 de DI1, conversão 252/contínua/360, preço a termo de ação e dólar com cupom cambial, e PnL de posição tomada/dada em DI.',
    render(el) {
      el.innerHTML = '';
      const ctl = Sims.controls([
        { k: 'taxa', label: 'Taxa DI (a.a., exp 252)', min: 2, max: 20, step: 0.01, v: 10.5, fmt: v => Q.fmt(v, 2) + '%' },
        { k: 'du', label: 'Dias úteis até o vencimento', min: 1, max: 2520, step: 1, v: 252 },
        { k: 'dc', label: 'Dias corridos', min: 1, max: 3650, step: 1, v: 365 },
        { k: 'ctr', label: 'Contratos DI1 (+ tomado / − dado)', type: 'number', v: 100, step: 10 },
        { k: 'dtaxa', label: 'Move da taxa (bps)', min: -200, max: 200, step: 1, v: 25 },
        { k: 'S', label: 'Spot ação / dólar', type: 'number', v: 5.2, step: 0.01 },
        { k: 'cupom', label: 'Cupom cambial (a.a. linear 360)', min: -2, max: 10, step: 0.05, v: 5, fmt: v => Q.fmt(v, 2) + '%' },
        { k: 'div', label: 'Dividendos até o venc. (R$)', type: 'number', v: 0, step: 0.1 }
      ], () => draw(), 200);
      el.appendChild(ctl);
      const out = h('<div class="grid g2" style="margin-top:14px"></div>'); el.appendChild(out);
      function draw() {
        const v = ctl.vals, t = v.taxa / 100, du = v.du;
        const pu = Q.BR.puDI(t, du), dv = Q.BR.dv01DI(t, du), fator = Q.BR.fator(t, du);
        const rc = Math.log(1 + t), lin360 = (fator - 1) * 360 / v.dc, exp365 = Math.pow(fator, 365 / v.dc) - 1;
        const pu2 = Q.BR.puDI(t + v.dtaxa / 10000, du);
        // tomado em taxa = vendido em PU: ganha quando a taxa sobe
        const pnl = -(pu2 - pu) * v.ctr;
        const fwdAcao = v.S * fator - v.div;
        const fwdDol = v.S * fator / (1 + v.cupom / 100 * v.dc / 360);
        out.innerHTML = `<div class="card"><h3>DI1 futuro</h3><table class="tbl">
          <tr><td>PU = 100.000 / (1+taxa)^(du/252)</td><td class="n">${Q.fmt(pu, 2)}</td></tr>
          <tr><td>Fator de juros no período</td><td class="n">${Q.fmt(fator, 6)}</td></tr>
          <tr><td>DV01 por contrato (R$ por 1bp)</td><td class="n">${Q.fmt(dv, 2)}</td></tr>
          <tr><td>DV01 da posição</td><td class="n">${Q.fmt(dv * Math.abs(v.ctr), 0)}</td></tr>
          <tr><td>PnL com move de ${v.dtaxa} bps (${v.ctr >= 0 ? 'tomado' : 'dado'})</td><td class="n ${pnl >= 0 ? 'up' : 'down'}">R$ ${Q.fmt(pnl, 0)}</td></tr></table>
          <p class="muted" style="font-size:12.5px">"Tomado" em taxa = vendido em PU → ganha quando a taxa sobe. "Dado" = comprado em PU.</p></div>
          <div class="card"><h3>Conversões de taxa</h3><table class="tbl">
          <tr><td>Exponencial 252 (DI)</td><td class="n">${Q.fmt(t * 100, 4)}%</td></tr>
          <tr><td>Contínua (usar no Black-Scholes)</td><td class="n">${Q.fmt(rc * 100, 4)}%</td></tr>
          <tr><td>Linear 360 equivalente</td><td class="n">${Q.fmt(lin360 * 100, 4)}%</td></tr>
          <tr><td>Exponencial 365 corridos</td><td class="n">${Q.fmt(exp365 * 100, 4)}%</td></tr></table></div>
          <div class="card"><h3>Termo de ação</h3><p class="mono" style="font-size:13px">F = S·(1+taxa)^(du/252) − dividendos (capitalizados)</p><div class="kpi"><div class="v amber">${Q.fmt(fwdAcao, 4)}</div><div class="l">preço a termo</div></div></div>
          <div class="card"><h3>Dólar futuro (paridade coberta)</h3><p class="mono" style="font-size:13px">F = S·(1+DI)^(du/252) / (1+cupom·dc/360)</p><div class="kpi"><div class="v amber">${Q.fmt(fwdDol, 4)}</div><div class="l">forward (pontos: ${Q.fmt((fwdDol - v.S) * 1000, 1)} por US$1.000)</div></div></div>`;
      }
      draw();
    }
  });
})();
