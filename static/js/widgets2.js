/* Widgets interativos das lições baseadas nos livros (v4):
   riskneutral (medida P × Q), leland (custos × frequência de hedge), gammavega (gamma × vega por prazo),
   jumpsmile (smile gerado por saltos de Merton), mcconv (convergência de Monte Carlo), fdstab (estabilidade do esquema explícito). */
(function () {
  'use strict';
  const { h } = UI;
  const W = Sims.widgets;
  const f2 = x => Q.fmt(x, 2), pc = (x, d) => Q.fmt(x * 100, d == null ? 1 : d) + '%';
  const card = (el, title, extra) => { const b = h(`<div class="card wx" style="margin:16px 0"><div class="mono muted" style="font-size:12px;margin-bottom:8px">${title}</div>${extra || ''}</div>`); el.appendChild(b); return b; };
  const stats = items => `<div class="wx-stats">${items.map(([k, v, cls]) => `<div><span>${k}</span><b class="${cls || ''}">${v}</b></div>`).join('')}</div>`;

  /* ---------- 1. Medida real (P) × neutra a risco (Q) ---------- */
  W.riskneutral = function (el) {
    const box = card(el, 'Mesmo ativo, dois mundos: distribuição de S<sub>T</sub> sob P (drift μ) e sob Q (drift r) · call K=100, S=100, T=1');
    const out = h('<div></div>'), pp = h('<div class="pp"></div>');
    const ctl = Sims.controls([
      { k: 'mu', label: 'Drift real μ', min: -0.1, max: 0.4, step: 0.01, v: 0.2, fmt: v => pc(v, 0) },
      { k: 'sig', label: 'Vol σ', min: 0.1, max: 0.6, step: 0.01, v: 0.3, fmt: v => pc(v, 0) },
      { k: 'r', label: 'Juros r', min: 0, max: 0.15, step: 0.005, v: 0.1, fmt: v => pc(v, 1) }
    ], draw, 170);
    box.append(ctl, out, pp);
    function dens(x, m, s) { if (x <= 0) return 0; const z = (Math.log(x / 100) - (m - s * s / 2)) / s; return Math.exp(-z * z / 2) / (x * s * Math.sqrt(2 * Math.PI)); }
    function draw(v) {
      const { mu, sig, r } = v, S = 100, K = 100, T = 1;
      const bs = Q.bs('call', S, K, T, r, 0, sig);
      const d1P = (Math.log(S / K) + (mu + sig * sig / 2) * T) / sig, d2P = d1P - sig;
      const eP = Math.exp(-r * T) * (S * Math.exp(mu * T) * Q.cdf(d1P) - K * Q.cdf(d2P));
      out.innerHTML = stats([['Preço BS (média sob Q, descontada)', f2(bs.price), 'amber'], ['Média sob P, descontada a r', f2(eP), mu > r ? 'up' : 'down'], ['Prob. real de exercício N(d₂ᴾ)', pc(Q.cdf(d2P))], ['Prob. neutra a risco N(d₂)', pc(bs.nd2)]]) +
        `<p class="muted" style="font-size:13px;margin:6px 0 0">Mexa em μ: a distribuição real (azul) se desloca, mas o <b>preço</b> não muda — ele só depende de σ e r, porque a opção é replicada com ação + caixa. Descontar a média real a r dá um número errado (${mu > r ? 'caro demais' : mu < r ? 'barato demais' : 'coincide só quando μ = r'}).</p>`;
      const xs = Plot.linspace(20, 260, 241);
      Plot.line(pp, { series: [{ x: xs, y: xs.map(x => dens(x, mu, sig)), label: 'Sob P (real, μ)', color: '#4cc9f0', fill: 'rgba(76,201,240,.12)' }, { x: xs, y: xs.map(x => dens(x, r, sig)), label: 'Sob Q (neutra a risco, r)', color: '#f5a623' }], vlines: [{ x: K, label: 'K' }], xName: 'S_T', yFmt: v => Q.fmt(v * 100, 2) + '%', height: 230 });
    }
    draw(ctl.vals);
  };

  /* ---------- 2. Leland: custo de transação × frequência de hedge ---------- */
  W.leland = function (el) {
    const box = card(el, 'Modelo de Leland: vol de compra (σ̌) e de venda (σ̂) conforme o intervalo de rebalanceamento');
    const out = h('<div></div>'), pp = h('<div class="pp"></div>'), pp2 = h('<div class="pp" style="margin-top:8px"></div>');
    const ctl = Sims.controls([
      { k: 'sig', label: 'Vol σ', min: 0.1, max: 0.6, step: 0.01, v: 0.25, fmt: v => pc(v, 0) },
      { k: 'k', label: 'Custo κ (bps do financeiro)', min: 1, max: 50, step: 1, v: 10, fmt: v => v + ' bps' },
      { k: 'n', label: 'Rebalancear a cada', min: 1, max: 21, step: 1, v: 1, fmt: v => v + ' d.u.' },
      { k: 'T', label: 'Prazo da opção', min: 21, max: 252, step: 21, v: 63, fmt: v => v + ' d.u.' }
    ], draw, 170);
    box.append(ctl, out, pp, pp2);
    const lel = (sig, k, n) => { const dt = n / 252, add = 2 * k * sig * Math.sqrt(2 / (Math.PI * dt)); return { lo: sig * sig - add > 0 ? Math.sqrt(sig * sig - add) : NaN, hi: Math.sqrt(sig * sig + add), Le: add / (sig * sig) }; };
    function draw(v) {
      const k = v.k / 10000, L = lel(v.sig, k, v.n), N = v.T / v.n, err = Math.sqrt(Math.PI / 4) / Math.sqrt(N);
      out.innerHTML = stats([['σ̌ (bid — quem compra a opção)', isFinite(L.lo) ? pc(L.lo, 2) : 'indefinida', 'down'], ['σ̂ (offer — quem vende)', pc(L.hi, 2), 'up'], ['Spread de vol', isFinite(L.lo) ? Q.fmt((L.hi - L.lo) * 100, 2) + ' pts' : '—'], ['Número de Leland', Q.fmt(L.Le, 3), L.Le >= 1 ? 'down' : ''], ['Erro de hedge (desvio / prêmio ATM)', pc(err, 1) + ' ≈ ' + Q.fmt(err * v.sig * 100, 2) + ' pts']]) +
        (L.Le >= 1 ? '<p class="down" style="font-size:13px;margin:6px 0 0">Número de Leland ≥ 1: o custo de rebalancear tão frequentemente supera o próprio gamma — a vol de compra deixa de existir. Na prática: rebalanceie menos ou por banda.</p>' : '<p class="muted" style="font-size:13px;margin:6px 0 0">O trade-off da mesa (gráfico de baixo, tudo em pontos de vol): rebalancear mais vezes reduz o ruído do hedge (∝ √δt), mas alarga o spread de vol causado pelos custos (∝ 1/√δt). O ótimo fica perto de onde as curvas se cruzam.</p>');
      const ns = Array.from({ length: 21 }, (_, i) => i + 1);
      Plot.line(pp, { series: [{ x: ns, y: ns.map(n => lel(v.sig, k, n).hi * 100), label: 'σ̂ (venda)', color: '#ff5c8a' }, { x: ns, y: ns.map(() => v.sig * 100), label: 'σ (BS)', color: '#7d8b9b', dash: [5, 4] }, { x: ns, y: ns.map(n => lel(v.sig, k, n).lo * 100), label: 'σ̌ (compra)', color: '#26d07c' }], vlines: [{ x: v.n, label: 'você' }], xName: 'dias entre rebalanceamentos', yFmt: x => Q.fmt(x, 1) + '%', height: 200 });
      Plot.line(pp2, { series: [{ x: ns, y: ns.map(n => (lel(v.sig, k, n).hi - (lel(v.sig, k, n).lo || 0)) * 100), label: 'Spread de vol (pts)', color: '#f5a623' }, { x: ns, y: ns.map(n => Math.sqrt(Math.PI / 4) / Math.sqrt(v.T / n) * v.sig * 100), label: 'Ruído do hedge (pts de vol equivalentes)', color: '#4cc9f0' }], vlines: [{ x: v.n, label: '' }], xName: 'dias entre rebalanceamentos', yFmt: x => Q.fmt(x, 2) + ' pts', height: 180 });
    }
    draw(ctl.vals);
  };

  /* ---------- 3. Gamma × vega por prazo e o calendar ---------- */
  W.gammavega = function (el) {
    const box = card(el, 'Opções ATM (S = K = 100): gamma mora no curto, vega mora no longo');
    const out = h('<div></div>'), row = h('<div class="grid2" style="gap:12px"><div class="pp"></div><div class="pp"></div></div>');
    const ctl = Sims.controls([
      { k: 'sig', label: 'Vol σ', min: 0.1, max: 0.6, step: 0.01, v: 0.3, fmt: v => pc(v, 0) },
      { k: 'd1', label: 'Perna curta (vendida)', min: 5, max: 63, step: 1, v: 21, fmt: v => v + ' d.u.' },
      { k: 'd2', label: 'Perna longa (comprada)', min: 84, max: 504, step: 21, v: 252, fmt: v => v + ' d.u.' },
      { k: 'q', label: 'Qtd. da perna longa', min: 0.25, max: 2, step: 0.05, v: 1, fmt: v => Q.fmt(v, 2) + '×' }
    ], draw, 160);
    box.append(ctl, out, row);
    function draw(v) {
      const S = 100, r = 0.1, g = d => Q.bs('call', S, S, d / 252, r, 0, v.sig);
      const a = g(v.d1), b = g(v.d2);
      const G = -a.gamma + v.q * b.gamma, Vg = (-a.vega + v.q * b.vega) / 100, Th = (-a.theta + v.q * b.theta) / 252;
      const sg = x => (x > 0 ? '+' : '') + Q.fmt(x, 4);
      out.innerHTML = `<table class="tbl" style="margin:8px 0"><tr><th></th><th>Γ</th><th>Vega (R$/pt)</th><th>Θ (R$/dia)</th></tr>
        <tr><td>Vende 1 call ${v.d1}d</td><td>${sg(-a.gamma)}</td><td>${sg(-a.vega / 100)}</td><td>${sg(-a.theta / 252)}</td></tr>
        <tr><td>Compra ${Q.fmt(v.q, 2)} call ${v.d2}d</td><td>${sg(v.q * b.gamma)}</td><td>${sg(v.q * b.vega / 100)}</td><td>${sg(v.q * b.theta / 252)}</td></tr>
        <tr><td><b>Calendar</b></td><td class="${G >= 0 ? 'up' : 'down'}"><b>${sg(G)}</b></td><td class="${Vg >= 0 ? 'up' : 'down'}"><b>${sg(Vg)}</b></td><td class="${Th >= 0 ? 'up' : 'down'}"><b>${sg(Th)}</b></td></tr></table>
        <p class="muted" style="font-size:13px;margin:0">${G < 0 && Vg > 0 ? '<b class="amber">Comprado em vega, vendido em gamma</b>: ganha se a vol implícita longa subir ou se o mercado ficar parado (theta); perde com movimentos fortes no curto prazo.' : G > 0 && Vg < 0 ? '<b class="amber">Comprado em gamma, vendido em vega</b>: ganha com movimento realizado já; perde se a vol implícita longa subir.' : 'Ajuste as quantidades: a mesa costuma escolher a razão para zerar uma das gregas (ex.: vega-neutro para operar só gamma).'}</p>`;
      const ds = Plot.linspace(5, 504, 120);
      Plot.line(row.children[0], { series: [{ x: ds, y: ds.map(d => g(d).gamma), label: 'Gamma ATM', color: '#b388ff' }], vlines: [{ x: v.d1, label: 'curta' }, { x: v.d2, label: 'longa' }], xName: 'dias úteis', yFmt: x => Q.fmt(x, 4), height: 190 });
      Plot.line(row.children[1], { series: [{ x: ds, y: ds.map(d => g(d).vega / 100), label: 'Vega ATM (R$/pt)', color: '#4cc9f0' }], vlines: [{ x: v.d1, label: 'curta' }, { x: v.d2, label: 'longa' }], xName: 'dias úteis', yFmt: x => Q.fmt(x, 3), height: 190 });
    }
    draw(ctl.vals);
  };

  /* ---------- 4. Smile gerado por saltos (Merton, 1976) ---------- */
  function merton(type, S, K, T, r, sig, lam, muJ, dJ) {
    const k = Math.exp(muJ + dJ * dJ / 2) - 1, lp = lam * (1 + k);
    let sum = 0, w = Math.exp(-lp * T);
    for (let n = 0; n < 60; n++) {
      if (n > 0) w *= lp * T / n;
      const sn = Math.sqrt(sig * sig + n * dJ * dJ / T), rn = r - lam * k + n * Math.log(1 + k) / T;
      sum += w * Q.bs(type, S, K, T, rn, 0, sn).price; // Hull §26.1: cada termo é um BS com r_n e σ_n
      if (n > lp * T + 10 && w < 1e-12) break;
    }
    return sum;
  }
  Sims.merton = merton;
  W.jumpsmile = function (el) {
    const box = card(el, 'Vol implícita de um mundo com saltos (Merton): skew forte no curto que se achata no longo');
    const out = h('<div></div>'), pp = h('<div class="pp"></div>');
    const ctl = Sims.controls([
      { k: 'sig', label: 'Vol da difusão σ', min: 0.05, max: 0.4, step: 0.01, v: 0.15, fmt: v => pc(v, 0) },
      { k: 'lam', label: 'Saltos por ano λ', min: 0, max: 3, step: 0.05, v: 0.5, fmt: v => Q.fmt(v, 2) },
      { k: 'mu', label: 'Salto médio (log)', min: -0.3, max: 0.1, step: 0.01, v: -0.1, fmt: v => pc(v, 0) },
      { k: 'dj', label: 'Vol do salto δ', min: 0, max: 0.3, step: 0.01, v: 0.1, fmt: v => pc(v, 0) }
    ], draw, 160);
    box.append(ctl, out, pp);
    function draw(v) {
      const S = 100, r = 0.03, Ks = Plot.linspace(70, 130, 49), mats = [[21, '1 mês', '#ff5c8a'], [63, '3 meses', '#f5a623'], [252, '1 ano', '#4cc9f0']];
      const series = mats.map(([d, lab, col]) => {
        const T = d / 252;
        return { x: Ks, y: Ks.map(K => { const type = K >= S ? 'call' : 'put'; const p = merton(type, S, K, T, r, v.sig, v.lam, v.mu, v.dj); const iv = Q.impliedVol(type, p, S, K, T, r, 0); return isFinite(iv) ? iv * 100 : NaN; }), label: lab, color: col };
      });
      const skew = s => { const i90 = 16, i110 = 32; return s.y[i90] - s.y[i110]; };
      out.innerHTML = stats(mats.map((m, i) => ['Skew 90−110 ' + m[1], isFinite(skew(series[i])) ? Q.fmt(skew(series[i]), 2) + ' pts' : '—'])) + '<p class="muted" style="font-size:13px;margin:6px 0 0">Saltos negativos (salto médio &lt; 0) inclinam o smile para baixo; o efeito é enorme em vencimentos curtos e se dilui com o prazo (o salto vira "só mais variância" no longo prazo). Zere λ para voltar ao Black-Scholes (smile plano).</p>';
      Plot.line(pp, { series, vlines: [{ x: S, label: 'spot' }], xName: 'strike', yFmt: x => Q.fmt(x, 1) + '%', height: 240 });
    }
    draw(ctl.vals);
  };

  /* ---------- 5. Convergência de Monte Carlo ---------- */
  W.mcconv = function (el) {
    const box = card(el, 'Monte Carlo de uma call ATM (S = K = 100, T = 1, r = 5%): o erro cai com 1/√N');
    const out = h('<div></div>'), pp = h('<div class="pp"></div>');
    const ctl = Sims.controls([
      { k: 'lg', label: 'Caminhos (10^x)', min: 2, max: 5, step: 0.25, v: 4, fmt: v => Q.fmt(Math.round(10 ** v), 0) },
      { k: 'sig', label: 'Vol σ', min: 0.1, max: 0.6, step: 0.01, v: 0.25, fmt: v => pc(v, 0) },
      { k: 'anti', label: 'Redução de variância', type: 'select', v: 0, options: [[0, 'Nenhuma'], [1, 'Antitética (Z e −Z)'], [2, 'Variável de controle (ativo)']] },
      { k: 'seed', label: 'Semente', type: 'number', v: 7, step: 1 }
    ], draw, 170);
    box.append(ctl, out, pp);
    function draw(v) {
      const N = Math.round(10 ** v.lg), S = 100, K = 100, T = 1, r = 0.05, sg = v.sig, R = Q.rng((v.seed | 0) || 1);
      const bs = Q.bsPrice('call', S, K, T, r, 0, sg), df = Math.exp(-r * T), fwd = S * Math.exp(r * T);
      const drift = (r - sg * sg / 2) * T, vol = sg * Math.sqrt(T);
      let sum = 0, sum2 = 0; const xs = [], ys = [], lo = [], hi = [];
      let next = 10;
      const beta = Q.cdf((Math.log(S / K) + (r + sg * sg / 2) * T) / vol); // coeficiente da variável de controle (≈ delta)
      for (let i = 1; i <= N; i++) {
        const z = R.normal();
        let x;
        const pay = zz => Math.max(S * Math.exp(drift + vol * zz) - K, 0);
        if (+v.anti === 1) x = 0.5 * (pay(z) + pay(-z));
        else if (+v.anti === 2) { const st = S * Math.exp(drift + vol * z); x = Math.max(st - K, 0) - beta * (st - fwd); }
        else x = pay(z);
        x *= df; sum += x; sum2 += x * x;
        if (i >= next || i === N) {
          const m = sum / i, sd = Math.sqrt(Math.max(sum2 / i - m * m, 0)), se = sd / Math.sqrt(i);
          xs.push(Math.log10(i)); ys.push(m); lo.push(m - 2 * se); hi.push(m + 2 * se);
          next = Math.ceil(i * 1.15);
        }
      }
      const m = sum / N, sd = Math.sqrt(Math.max(sum2 / N - m * m, 0)), se = sd / Math.sqrt(N);
      out.innerHTML = stats([['Estimativa MC', f2(m), 'amber'], ['Black-Scholes', f2(bs)], ['Erro padrão', Q.fmt(se, 4)], ['Erro real', Q.fmt(m - bs, 4), Math.abs(m - bs) <= 2 * se ? 'up' : 'down'], ['Caminhos p/ erro de 0,01', Q.fmt(Math.ceil((sd / 0.01) ** 2), 0)]]);
      Plot.line(pp, { series: [{ x: xs, y: hi, label: '+2 EP', color: '#7d8b9b', dash: [4, 4] }, { x: xs, y: ys, label: 'Estimativa', color: '#f5a623' }, { x: xs, y: lo, label: '−2 EP', color: '#7d8b9b', dash: [4, 4] }], hlines: [{ y: bs, label: 'BS', color: '#26d07c' }], xName: 'caminhos', xFmt: x => Q.fmt(10 ** x, 0), yFmt: f2, height: 240 });
    }
    draw(ctl.vals);
  };

  /* ---------- 6. Diferenças finitas explícitas: estabilidade ---------- */
  W.fdstab = function (el) {
    const box = card(el, 'Esquema explícito para uma call europeia (K = 100, T = 1, r = 5%, S<sub>max</sub> = 300)');
    const out = h('<div></div>'), pp = h('<div class="pp"></div>');
    const ctl = Sims.controls([
      { k: 'ns', label: 'Passos no ativo', min: 20, max: 120, step: 5, v: 60, fmt: v => v },
      { k: 'm', label: 'Passos no tempo', min: 20, max: 1200, step: 10, v: 300, fmt: v => v },
      { k: 'sig', label: 'Vol σ', min: 0.1, max: 0.6, step: 0.01, v: 0.25, fmt: v => pc(v, 0) }
    ], draw, 170);
    box.append(ctl, out, pp);
    function draw(v) {
      const K = 100, T = 1, r = 0.05, Smax = 300, NS = v.ns, M = v.m, sg = v.sig, dt = T / M, dS = Smax / NS;
      let V = new Float64Array(NS + 1); for (let i = 0; i <= NS; i++) V[i] = Math.max(i * dS - K, 0);
      let blown = false;
      for (let k = 1; k <= M; k++) {
        const W2 = new Float64Array(NS + 1), tau = k * dt;
        for (let i = 1; i < NS; i++) {
          const a = 0.5 * dt * (sg * sg * i * i - r * i), b = 1 - dt * (sg * sg * i * i + r), c = 0.5 * dt * (sg * sg * i * i + r * i);
          W2[i] = a * V[i - 1] + b * V[i] + c * V[i + 1];
        }
        W2[0] = 0; W2[NS] = Smax - K * Math.exp(-r * tau); V = W2;
        if (!isFinite(V[Math.floor(NS / 2)]) || Math.abs(V[Math.floor(NS / 2)]) > 1e12) { blown = true; break; }
      }
      const iK = Math.round(K / dS), px = V[iK], bs = Q.bsPrice('call', K, K, T, r, 0, sg);
      const Mmin = Math.ceil(sg * sg * NS * NS * T);
      const stable = M >= Mmin;
      out.innerHTML = stats([['Passos no tempo mínimos (estabilidade)', Q.fmt(Mmin, 0), stable ? 'up' : 'down'], ['Status', stable ? 'estável' : 'INSTÁVEL', stable ? 'up' : 'down'], ['Preço em S = 100', blown ? 'explodiu' : f2(px)], ['Black-Scholes', f2(bs)]]) +
        `<p class="muted" style="font-size:13px;margin:6px 0 0">Regra do esquema explícito: δt ≤ δS² / (σ² S<sub>max</sub>²), ou seja, M ≥ σ²·N<sub>S</sub>²·T. Dobrar a malha no ativo exige 4× mais passos no tempo — é por isso que o mercado usa esquemas implícitos (Crank-Nicolson) na produção.</p>`;
      const xs = [], ys = [], yb = [];
      for (let i = 0; i <= NS; i++) { const s = i * dS; if (s > 220) break; xs.push(s); ys.push(Math.max(-60, Math.min(160, V[i]))); yb.push(Q.bsPrice('call', Math.max(s, 1e-6), K, T, r, 0, sg)); }
      Plot.line(pp, { series: [{ x: xs, y: yb, label: 'Black-Scholes', color: '#26d07c', dash: [5, 4] }, { x: xs, y: ys, label: 'Diferenças finitas', color: stable ? '#f5a623' : '#ff5c8a' }], vlines: [{ x: K, label: 'K' }], xName: 'S', yMin: -60, yMax: 160, yFmt: f2, height: 240 });
    }
    draw(ctl.vals);
  };
})();
