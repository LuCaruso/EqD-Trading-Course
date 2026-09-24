/* Widgets v7: árvore binomial visual (europeia × americana, fronteira de exercício, convergência),
   planilha de delta hedge dia a dia (PnL por componente) e calculadora de eventos corporativos. */
(function () {
  'use strict';
  const { h } = UI;
  const W = Sims.widgets;
  const f2 = x => Q.fmt(x, 2), f4 = x => Q.fmt(x, 4), pc = (x, d) => Q.fmt(x * 100, d == null ? 1 : d) + '%';
  const card = (el, title) => { const b = h(`<div class="card wx" style="margin:16px 0"><div class="mono muted" style="font-size:12px;margin-bottom:8px">${title}</div></div>`); el.appendChild(b); return b; };
  const stats = items => `<div class="wx-stats">${items.map(([k, v, cls]) => `<div><span>${k}</span><b class="${cls || ''}">${v}</b></div>`).join('')}</div>`;

  /* ---------- 1. Árvore binomial visual ---------- */
  W.treeviz = function (el, a) {
    const box = card(el, 'Árvore binomial CRR: construa, precifique de trás para frente e veja onde a americana é exercida');
    const out = h('<div></div>'), svgBox = h('<div class="tree-box"></div>'), row = h('<div class="grid2" style="gap:12px;margin-top:10px"><div class="pp"></div><div class="pp"></div></div>');
    const ctl = Sims.controls([
      { k: 'type', label: 'Tipo', type: 'select', v: a.type || 'put', options: [['put', 'Put'], ['call', 'Call']] },
      { k: 'S', label: 'Spot S', min: 50, max: 150, step: 1, v: 100 },
      { k: 'K', label: 'Strike K', min: 50, max: 150, step: 1, v: 100 },
      { k: 'sig', label: 'Vol σ', min: 0.05, max: 0.8, step: 0.01, v: 0.3, fmt: v => pc(v, 0) },
      { k: 'r', label: 'Juros r (contínuo)', min: 0, max: 0.2, step: 0.005, v: 0.12, fmt: v => pc(v, 1) },
      { k: 'T', label: 'Prazo (anos)', min: 0.1, max: 2, step: 0.05, v: 1, fmt: v => Q.fmt(v, 2) },
      { k: 'N', label: 'Passos N', min: 1, max: 7, step: 1, v: 4 }
    ], draw, 150);
    box.append(ctl, out, svgBox, row);
    function draw(v) {
      const { type, S, K, sig, r, T, N } = v;
      const am = Q.binomial(type, S, K, T, r, 0, sig, N, true, true), eu = Q.binomial(type, S, K, T, r, 0, sig, N, false, true);
      const bs = Q.bsPrice(type, S, K, T, r, 0, sig);
      const amBig = Q.binomial(type, S, K, T, r, 0, sig, 400, true).price, euBig = Q.binomial(type, S, K, T, r, 0, sig, 400, false).price;
      out.innerHTML = stats([['u / d', Q.fmt(am.u, 4) + ' / ' + Q.fmt(am.d, 4)], ['p* (neutra a risco)', Q.fmt(am.p, 4)], ['Europeia (N=' + N + ')', f4(eu.price)], ['Americana (N=' + N + ')', f4(am.price), 'amber'], ['Prêmio de exercício antecipado', f4(am.price - eu.price), am.price - eu.price > 1e-6 ? 'up' : ''], ['Black-Scholes (europeia)', f4(bs)], ['Americana com N=400', f4(amBig)]]);
      // SVG da árvore
      const Wd = Math.max(520, svgBox.clientWidth || 800), colW = (Wd - 90) / Math.max(1, N), Ht = Math.max(220, 64 * (N + 1)), cy = Ht / 2, rowH = Math.min(62, (Ht - 50) / Math.max(1, N));
      let lines = '', nodes = '';
      for (let i = 0; i <= N; i++) for (let j = 0; j <= i; j++) {
        const x = 45 + i * colW, y = cy - (j - i / 2) * rowH;
        if (i < N) { const xn = 45 + (i + 1) * colW; lines += `<line x1="${x}" y1="${y}" x2="${xn}" y2="${cy - (j + 1 - (i + 1) / 2) * rowH}" class="tl"/><line x1="${x}" y1="${y}" x2="${xn}" y2="${cy - (j - (i + 1) / 2) * rowH}" class="tl"/>`; }
        const Sij = S * Math.pow(am.u, j) * Math.pow(am.d, i - j), Va = am.tree[i][j], Ve = eu.tree[i][j], ex = am.exTree[i][j] && i < N;
        nodes += `<g class="tn ${ex ? 'exn' : ''} ${i === N ? 'leaf' : ''}"><rect x="${x - 40}" y="${y - 21}" width="80" height="42" rx="8"/><text x="${x}" y="${y - 6}" class="ts">S ${f2(Sij)}</text><text x="${x}" y="${y + 9}" class="tv">A ${f2(Va)}</text><text x="${x}" y="${y + 19}" class="te">E ${f2(Ve)}</text></g>`;
      }
      svgBox.innerHTML = `<svg viewBox="0 0 ${Wd} ${Ht}" width="100%" height="${Ht}" class="tree-svg">${lines}${nodes}</svg><div class="muted" style="font-size:12px">Cada nó: S = preço do ativo · A = valor da americana · E = valor da europeia. <span class="amber">Nós em destaque</span> = exercício antecipado ótimo (payoff imediato &gt; valor de continuar). Última coluna = payoff no vencimento.</div>`;
      // convergência
      const ns = [], ye = [], ya = [];
      for (let n = 1; n <= 80; n++) { ns.push(n); ye.push(Q.binomial(type, S, K, T, r, 0, sig, n, false).price); ya.push(Q.binomial(type, S, K, T, r, 0, sig, n, true).price); }
      Plot.line(row.children[0], { series: [{ x: ns, y: ye, label: 'Europeia (árvore)', color: '#4cc9f0' }, { x: ns, y: ya, label: 'Americana (árvore)', color: '#f5a623' }], hlines: [{ y: bs, label: 'BS', color: '#26d07c' }], xName: 'passos N', yFmt: f4, height: 210 });
      // fronteira de exercício (put americana)
      if (type === 'put') {
        const M = 200, big = Q.binomial('put', S, K, T, r, 0, sig, M, true, true), ts = [], bd = [];
        for (let i = 0; i < M; i += 2) { let best = NaN; for (let j = 0; j <= i; j++) if (big.exTree[i][j]) { const s = S * Math.pow(big.u, j) * Math.pow(big.d, i - j); if (!(best >= s)) best = s; } ts.push(i / M * T); bd.push(best); }
        Plot.line(row.children[1], { series: [{ x: ts, y: bd, label: 'Fronteira S*(t): abaixo dela, exerça', color: '#ff5c8a' }], hlines: [{ y: K, label: 'K', color: '#7d8b9b' }, { y: S, label: 'spot', color: '#4cc9f0' }], xName: 'tempo (anos)', yFmt: f2, height: 210 });
      } else {
        row.children[1].innerHTML = `<div class="muted" style="padding:20px;font-size:13px">Sem dividendos, a <b>call americana nunca é exercida antes</b> — repare que A = E em todos os nós e que as duas curvas de convergência coincidem. Troque para <b>Put</b> para ver a fronteira de exercício.</div>`;
      }
    }
    draw(ctl.vals);
  };

  /* ---------- 2. Planilha de delta hedge dia a dia ---------- */
  W.hedgeledger = function (el) {
    const box = card(el, 'Planilha de delta hedge: você vendeu 1.000 calls ATM e hedgeia todo fim de dia (S0 = 100, r = 10%)');
    let seed = 3;
    const out = h('<div></div>'), btn = h('<button class="btn sm" style="margin:4px 0 8px">↻ Novo caminho</button>'), tbl = h('<div class="ledger"></div>'), pp = h('<div class="pp" style="margin-top:8px"></div>');
    const ctl = Sims.controls([
      { k: 'si', label: 'Vol implícita (vendida e usada no hedge)', min: 0.1, max: 0.6, step: 0.01, v: 0.3, fmt: v => pc(v, 0) },
      { k: 'sr', label: 'Vol realizada do caminho', min: 0.05, max: 0.8, step: 0.01, v: 0.25, fmt: v => pc(v, 0) },
      { k: 'd', label: 'Prazo', type: 'select', v: 21, options: [[10, '10 d.u.'], [21, '21 d.u.'], [42, '42 d.u.']] },
      { k: 'side', label: 'Posição', type: 'select', v: -1, options: [[-1, 'Vendido 1.000 calls'], [1, 'Comprado 1.000 calls']] }
    ], draw, 170);
    box.append(ctl, btn, out, tbl, pp);
    btn.onclick = () => { seed = 1 + Math.floor(Math.random() * 1e6); draw(ctl.vals); };
    function draw(v) {
      const S0 = 100, K = 100, r = 0.1, n = +v.d, dt = 1 / 252, q = 1000 * +v.side, si = v.si, sr = v.sr, R = Q.rng(seed);
      let S = S0, T = n / 252, g0 = Q.bs('call', S, K, T, r, 0, si);
      let V = g0.price, delta = g0.delta, sh = -q * delta, cash = -q * V - sh * S, cum = 0;
      const rows = [], xs = [0], ys = [0], ya = [0];
      let acc = 0;
      for (let t = 1; t <= n; t++) {
        const z = R.normal(), S1 = S * Math.exp((r - 0.5 * sr * sr) * dt + sr * Math.sqrt(dt) * z), T1 = (n - t) / 252;
        const g1 = T1 > 1e-9 ? Q.bs('call', S1, K, T1, r, 0, si) : { price: Math.max(S1 - K, 0), delta: S1 > K ? 1 : 0, gamma: 0 };
        const pOpt = q * (g1.price - V), pHed = sh * (S1 - S), pCar = cash * (Math.exp(r * dt) - 1), pnl = pOpt + pHed + pCar;
        const gt = q * 0.5 * g0.gamma * S * S * (Math.pow(S1 / S - 1, 2) - si * si * dt);
        cash = cash * Math.exp(r * dt);
        const newSh = t < n ? -q * g1.delta : 0, trade = newSh - sh;
        cash -= trade * S1;
        cum += pnl; acc += gt;
        rows.push({ t, S: S1, ret: S1 / S - 1, delta: g1.delta, sh: newSh, trade, pOpt, pHed, pCar, pnl, gt, cum });
        xs.push(t); ys.push(cum); ya.push(acc);
        S = S1; V = g1.price; sh = newSh; g0 = g1;
      }
      const rvReal = Math.sqrt(252 / n * rows.reduce((s, x) => s + Math.pow(Math.log(1 + x.ret), 2), 0));
      const vega0 = Q.bs('call', S0, K, n / 252, r, 0, si).vega;
      const approx = q * vega0 * (rvReal - si);   // q·𝒱·(σr − σi)
      out.innerHTML = stats([['Prêmio inicial', 'R$ ' + Q.fmt(Math.abs(q) * Q.bsPrice('call', S0, K, n / 252, r, 0, si), 0)], ['Vol realizada do caminho', pc(rvReal, 1)], ['PnL final do hedge', 'R$ ' + Q.fmt(cum, 0), cum >= 0 ? 'up' : 'down'], ['≈ q·𝒱·(σ_real − σ_impl)', 'R$ ' + Q.fmt(approx, 0)], ['Soma de ½ΓS²[(δS/S)² − σ²δt]', 'R$ ' + Q.fmt(acc, 0)]]) +
        `<p class="muted" style="font-size:13px;margin:6px 0 0">${q < 0 ? 'Vendido em opções = short gamma: cada dia de movimento grande (|δS/S| &gt; σ√δt ≈ ' + pc(si / Math.sqrt(252), 2) + ') custa dinheiro; cada dia calmo rende theta.' : 'Comprado em opções = long gamma: dias de movimento grande pagam; dias calmos custam theta.'} A coluna "≈ Γ-Θ" é a aproximação do dia; a diferença para o PnL real vem de gamma que muda no caminho e de termos de ordem maior.</p>`;
      const m = x => `<td class="mono ${x > 0.5 ? 'up' : x < -0.5 ? 'down' : ''}">${Q.fmt(x, 0)}</td>`;
      tbl.innerHTML = `<div style="max-height:300px;overflow:auto"><table class="tbl dk-tbl"><tr><th>Dia</th><th>S</th><th>δS/S</th><th>Δ call</th><th>Ações (hedge)</th><th>Negociado</th><th>PnL opções</th><th>PnL ações</th><th>Juros do caixa</th><th>PnL do dia</th><th>≈ Γ-Θ</th><th>Acumulado</th></tr>` +
        `<tr class="muted"><td>0</td><td class="mono">${f2(S0)}</td><td></td><td class="mono">${Q.fmt(Q.bs('call', S0, K, n / 252, r, 0, si).delta, 3)}</td><td class="mono">${Q.fmt(-q * Q.bs('call', S0, K, n / 252, r, 0, si).delta, 0)}</td><td class="mono">${Q.fmt(-q * Q.bs('call', S0, K, n / 252, r, 0, si).delta, 0)}</td><td colspan="6" style="text-align:left">${q < 0 ? 'recebe o prêmio e compra Δ×1.000 ações' : 'paga o prêmio e vende Δ×1.000 ações'}</td></tr>` +
        rows.map(x => `<tr><td>${x.t}</td><td class="mono">${f2(x.S)}</td><td class="mono ${x.ret >= 0 ? 'up' : 'down'}">${pc(x.ret, 2)}</td><td class="mono">${Q.fmt(x.delta, 3)}</td><td class="mono">${Q.fmt(x.sh, 0)}</td><td class="mono">${Q.fmt(x.trade, 0)}</td>${m(x.pOpt)}${m(x.pHed)}${m(x.pCar)}${m(x.pnl)}${m(x.gt)}${m(x.cum)}</tr>`).join('') + '</table></div>';
      Plot.line(pp, { series: [{ x: xs, y: ys, label: 'PnL acumulado (real)', color: '#f5a623' }, { x: xs, y: ya, label: 'Σ ½ΓS²[(δS/S)² − σ²δt]', color: '#4cc9f0', dash: [5, 4] }], hlines: [{ y: approx, label: 'q·𝒱·(σr − σi)', color: '#26d07c' }], xName: 'dia', yFmt: x => Q.fmt(x, 0), height: 220 });
    }
    draw(ctl.vals);
  };

  /* ---------- 3. Calculadora de eventos corporativos ---------- */
  W.corpevent = function (el) {
    const box = card(el, 'O que acontece com a ação e com a opção listada no evento (regra simplificada de ajuste da B3)');
    const out = h('<div></div>');
    const ctl = Sims.controls([
      { k: 'ev', label: 'Evento', type: 'select', v: 'div', options: [['div', 'Dividendo (R$/ação)'], ['jcp', 'JCP bruto (R$/ação, IR 15% hipotético)'], ['split', 'Desdobramento (1 → N)'], ['inplit', 'Grupamento (N → 1)'], ['bonus', 'Bonificação (% em ações)']] },
      { k: 'S', label: 'Preço da ação na data com', type: 'number', v: 40, step: 0.01 },
      { k: 'K', label: 'Strike da opção', type: 'number', v: 38, step: 0.01 },
      { k: 'q', label: 'Quantidade de opções', type: 'number', v: 10000, step: 100 },
      { k: 'x', label: 'Valor do evento (R$, N ou %)', type: 'number', v: 1, step: 0.01 }
    ], draw, 170);
    box.append(ctl, out);
    function draw(v) {
      const S = +v.S, K = +v.K, qn = +v.q, x = +v.x;
      let Sx, Kx, qx, what;
      if (v.ev === 'div') { Sx = S - x; Kx = K - x; qx = qn; what = `A ação fica "ex" e abre, em teoria, R$ ${f2(x)} mais barata. A B3 reduz o strike no mesmo valor por ação.`; }
      else if (v.ev === 'jcp') { const liq = x * 0.85; Sx = S - x; Kx = K - liq; qx = qn; what = `No JCP o ajuste de strike usa o valor líquido do imposto (${f2(liq)} com IR de 15% neste exemplo — confira a alíquota vigente); a ação tende a cair pelo valor bruto.`; }
      else if (v.ev === 'split') { const f = Math.max(1, x); Sx = S / f; Kx = K / f; qx = qn * f; what = `Cada ação vira ${Q.fmt(f, 0)}. Fator de ajuste = ${Q.fmt(f, 0)}: strike ÷ fator, quantidade × fator.`; }
      else if (v.ev === 'inplit') { const f = 1 / Math.max(1, x); Sx = S / f; Kx = K / f; qx = qn * f; what = `${Q.fmt(x, 0)} ações viram 1. Fator de ajuste = 1/${Q.fmt(x, 0)}: strike ÷ fator (sobe), quantidade × fator (cai).`; }
      else { const f = 1 + x / 100; Sx = S / f; Kx = K / f; qx = qn * f; what = `Bonificação de ${Q.fmt(x, 1)}%: fator ${Q.fmt(f, 4)}; o preço teórico ex = S ÷ fator; strike ÷ fator; quantidade × fator.`; }
      Kx = Math.round(Kx * 100) / 100;
      const intr0 = qn * Math.max(S - K, 0), intr1 = qx * Math.max(Sx - Kx, 0);
      out.innerHTML = stats([['Ação: com → ex (teórico)', f2(S) + ' → ' + f2(Sx)], ['Strike: antes → ajustado', f2(K) + ' → ' + f2(Kx), 'amber'], ['Quantidade: antes → depois', Q.fmt(qn, 0) + ' → ' + Q.fmt(qx, 0)], ['Valor intrínseco da posição (call)', 'R$ ' + Q.fmt(intr0, 0) + ' → R$ ' + Q.fmt(intr1, 0), Math.abs(intr1 - intr0) < 1 + 0.01 * intr0 ? 'up' : 'down']]) +
        `<p class="muted" style="font-size:13px;margin:6px 0 0">${what} Resultado: o dono da opção fica (quase) neutro ao evento — ${v.ev === 'jcp' ? 'no JCP, a diferença entre bruto e líquido fica com quem tem a opção/ação conforme a regra de ajuste.' : 'o valor intrínseco não muda (a menos do arredondamento do strike em 2 casas).'} Sem esse ajuste (como nas opções listadas dos EUA para dividendos ordinários), a call perderia e a put ganharia na data ex.</p>`;
    }
    draw(ctl.vals);
  };
})();
