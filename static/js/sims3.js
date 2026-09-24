/* Simulador 8 — "Tela de opções": livro de ofertas, grade de opções, times & trades e open interest,
   com cotações que se mexem e um jogo de leitura de tela ("Caça na tela"). Dados 100% simulados. */
(function () {
  'use strict';
  const { h, esc, toast } = UI;
  const f2 = x => Q.fmt(x, 2), f3 = x => Q.fmt(x, 3);
  const MONTH_C = 'ABCDEFGHIJKL', MONTH_P = 'MNOPQRSTUVWX';

  function newMarket(seed) {
    const R = Q.rng(seed);
    const S0 = Math.round((30 + 20 * R()) * 100) / 100;
    const m = new Date().getMonth();
    return {
      R, S: S0, r: 0.105, t: 0, flowPuts: R() < 0.5 ? 'buy' : 'sell',
      exps: [{ du: 21, atm: 0.3 + 0.08 * R(), letter: (m + 1) % 12 }, { du: 42, atm: 0.28 + 0.06 * R(), letter: (m + 2) % 12 }],
      skew: -(0.25 + 0.25 * R()), curv: 0.4 + 0.6 * R(),
      trades: [], anomaly: null, oi: {}, vol: {}, sizes: {}
    };
  }
  const strikesOf = M => { const c = Math.round(M.S); const ks = []; for (let k = c - 6; k <= c + 6; k++) ks.push(k); return ks; };
  const volOf = (M, e, K) => { const F = M.S * Math.exp(M.r * e.du / 252), x = Math.log(K / F); return Math.max(0.08, e.atm + M.skew * x + M.curv * x * x); };
  const tick = x => Math.max(0, Math.round(x * 100) / 100);
  const code = (M, e, type, K) => 'ACME' + (type === 'call' ? MONTH_C : MONTH_P)[e.letter] + K;

  function quote(M, ei, type, K) {
    const e = M.exps[ei], T = e.du / 252, s = volOf(M, e, K), g = Q.bs(type, M.S, K, T, M.r, 0, s);
    const mny = Math.abs(Math.log(K / M.S));
    const w = (0.6 + 6 * mny * mny * 100 / 4 + (ei ? 0.3 : 0)) / 100;              // largura em vol cresce fora do dinheiro
    let bid = tick(Q.bsPrice(type, M.S, K, T, M.r, 0, s - w / 2)), ask = tick(Q.bsPrice(type, M.S, K, T, M.r, 0, s + w / 2));
    if (ask <= bid) ask = tick(bid + 0.01);
    if (bid < 0.02) bid = 0;
    const key = ei + type + K;
    if (M.anomaly && M.anomaly.key === key) { if (M.anomaly.kind === 'intrinsic') { ask = tick(Math.max(0.01, M.S - K * Math.exp(-M.r * T) - 0.12)); bid = tick(ask - 0.03); } if (M.anomaly.kind === 'fly') { bid = tick(bid + M.anomaly.bump); ask = tick(bid + 0.03); } }
    if (!M.sizes[key]) M.sizes[key] = [100 * (1 + Math.floor(M.R() * 20)), 100 * (1 + Math.floor(M.R() * 20))];
    const mid = bid > 0 ? (bid + ask) / 2 : ask / 2;
    const ivm = bid > 0 ? Q.impliedVol(type, mid, M.S, K, T, M.r, 0) : NaN;
    return { key, type, K, ei, bid, ask, mid, iv: ivm, delta: g.delta, vega: g.vega, size: M.sizes[key], code: code(M, e, type, K) };
  }
  function ensureOI(M) {
    strikesOf(M).forEach(K => [0, 1].forEach(ei => ['call', 'put'].forEach(type => {
      const key = ei + type + K; if (M.oi[key] != null) return;
      const d = (K - M.S) / M.S, round = K % 5 === 0 ? 2.2 : 1;
      const base = type === 'put' ? Math.exp(-Math.pow((d + 0.06) / 0.08, 2)) : Math.exp(-Math.pow((d - 0.04) / 0.08, 2));
      M.oi[key] = Math.round((2000 + 60000 * base * round * (ei ? 0.6 : 1) * (0.5 + M.R())) / 100) * 100;
      M.vol[key] = Math.round(M.oi[key] * (0.05 + 0.2 * M.R()) / 100) * 100;
    })));
  }
  function addTrade(M) {
    const ks = strikesOf(M), ei = M.R() < 0.75 ? 0 : 1, type = M.R() < 0.55 ? 'put' : 'call';
    const K = ks[Math.min(ks.length - 1, Math.max(0, Math.round(ks.length / 2 + (type === 'put' ? -2 : 2) + 2.5 * M.R.normal())))];
    const q = quote(M, ei, type, K); if (!(q.bid > 0)) return;
    const buy = type === 'put' ? (M.flowPuts === 'buy' ? M.R() < 0.8 : M.R() < 0.2) : M.R() < 0.5;
    const qty = 100 * (1 + Math.floor(M.R() * (M.R() < 0.1 ? 200 : 30)));
    const now = new Date(); now.setSeconds(now.getSeconds() + M.t);
    M.trades.unshift({ time: now.toTimeString().slice(0, 8), code: q.code, type, K, ei, px: buy ? q.ask : q.bid, qty, side: buy ? 'C' : 'V' });
    M.trades = M.trades.slice(0, 14);
    M.vol[q.key] = (M.vol[q.key] || 0) + qty;
  }
  function step(M) {
    M.t += 1;
    const z = M.R.normal();
    M.S = Math.round(M.S * Math.exp(0.0015 * z) * 100) / 100;
    M.exps.forEach(e => { e.atm = Math.max(0.12, e.atm + 0.0008 * M.R.normal() - 0.0006 * z); });
    ensureOI(M);
    const n = 1 + Math.floor(M.R() * 2); for (let i = 0; i < n; i++) addTrade(M);
  }

  const QTYPES = ['ivmid', 'spreadvol', 'oi', 'arb', 'flow', 'mid', 'fwd', 'arb'];

  Sims.add({
    id: 'tela', title: 'Tela de Opções (leitura de tela)', ic: 'TELA',
    desc: 'Uma tela de mesa simulada: livro de ofertas do ativo, grade de opções com bid/ask, vol implícita, delta, volume e open interest, e times & trades. Jogue o "Caça na tela": perguntas de leitura de tela com XP.',
    render(el) {
      el.innerHTML = '';
      let seed = 1 + Math.floor(Math.random() * 1e6), M = newMarket(seed), ei = 0, paused = false, prev = {}, question = null, score = { ok: 0, tot: 0, streak: 0 };
      ensureOI(M); for (let i = 0; i < 12; i++) addTrade(M);
      const root = h(`<div class="tela">
        <div class="row tela-top"><div class="tela-tk"><b>ACME3</b> <span class="muted">(ação fictícia · dados simulados)</span></div><div id="tHdr" class="mono"></div><span class="spacer"></span>
          <select id="tExp" style="width:auto"><option value="0">Venc. 1 (21 d.u.)</option><option value="1">Venc. 2 (42 d.u.)</option></select>
          <button class="btn sm" id="tPause">⏸ Pausar</button><button class="btn sm" id="tNew">↻ Nova tela</button></div>
        <div class="tela-grid"><div class="tela-chain"><table class="tbl tchain"><thead></thead><tbody></tbody></table>
          <div class="muted" style="font-size:12px;margin-top:4px">IV = vol implícita do mid · Δ do modelo · Vol = contratos negociados hoje · OI = contratos em aberto · linha destacada = ATM · fundo = dentro do dinheiro · códigos ilustrativos</div></div>
          <div class="tela-side"><div class="card tight"><div class="mono muted" style="font-size:11px">LIVRO DE OFERTAS — ACME3</div><table class="tbl tbook"></table></div>
          <div class="card tight"><div class="mono muted" style="font-size:11px">TIMES &amp; TRADES — OPÇÕES</div><table class="tbl ttt"></table></div></div></div>
        <div class="card tela-game"><div class="row"><b class="amber">🎯 Caça na tela</b><span class="muted" id="tScore" style="font-size:13px"></span><span class="spacer"></span><button class="btn pri sm" id="tAsk">Nova pergunta</button></div><div id="tQ" class="muted" style="margin-top:8px">Clique em "Nova pergunta". A tela congela enquanto você responde.</div></div>
      </div>`);
      el.appendChild(root);
      const $ = s => root.querySelector(s);
      const cell = (key, field, val, txt) => { const k = key + field, p = prev[k]; prev[k] = val; const cls = p == null || val == null || p === val ? '' : val > p ? 'fl-up' : 'fl-dn'; return `<td class="${cls}">${txt}</td>`; };
      function draw() {
        const e = M.exps[ei], T = e.du / 252, ks = strikesOf(M), atmK = ks.reduce((a, b) => Math.abs(b - M.S) < Math.abs(a - M.S) ? b : a);
        const last = M.S, open = M.S0 || (M.S0 = M.S);
        $('#tHdr').innerHTML = `último <b>${f2(last)}</b> <span class="${last >= open ? 'up' : 'down'}">${last >= open ? '▲' : '▼'} ${Q.fmt((last / open - 1) * 100, 2)}%</span> · bid ${f2(last - 0.01)} / ask ${f2(last + 0.01)} · vencimento ${ei + 1}: ${e.du} d.u. · juros ${Q.fmt(M.r * 100, 1)}%`;
        $('.tchain thead').innerHTML = `<tr><th colspan="6" class="tc-h">CALLS</th><th></th><th colspan="6" class="tc-h">PUTS</th></tr><tr><th>OI</th><th>Vol</th><th>Δ</th><th>IV</th><th>Bid</th><th>Ask</th><th class="tk">Strike</th><th>Bid</th><th>Ask</th><th>IV</th><th>Δ</th><th>Vol</th><th>OI</th></tr>`;
        $('.tchain tbody').innerHTML = ks.map(K => {
          const c = quote(M, ei, 'call', K), p = quote(M, ei, 'put', K);
          const ivt = x => isFinite(x) ? Q.fmt(x * 100, 1) : '—', bt = x => x > 0 ? f2(x) : '—';
          return `<tr data-k="${K}" class="${K === atmK ? 'atm' : ''}">
            <td class="${K < M.S ? 'itm' : ''} dim">${Q.fmt(M.oi[c.key], 0)}</td><td class="${K < M.S ? 'itm' : ''} dim">${Q.fmt(M.vol[c.key], 0)}</td><td class="${K < M.S ? 'itm' : ''}">${Q.fmt(c.delta, 2)}</td><td class="${K < M.S ? 'itm' : ''}">${ivt(c.iv)}</td>
            ${cell(c.key, 'b', c.bid, bt(c.bid)).replace('<td class="', `<td title="${c.code} · ${c.size[0]} × ${c.size[1]}" class="bid ${K < M.S ? 'itm ' : ''}`)}${cell(c.key, 'a', c.ask, f2(c.ask)).replace('<td class="', `<td title="${c.code}" class="ask ${K < M.S ? 'itm ' : ''}`)}
            <td class="tk"><b>${K}</b></td>
            ${cell(p.key, 'b', p.bid, bt(p.bid)).replace('<td class="', `<td title="${p.code} · ${p.size[0]} × ${p.size[1]}" class="bid ${K > M.S ? 'itm ' : ''}`)}${cell(p.key, 'a', p.ask, f2(p.ask)).replace('<td class="', `<td title="${p.code}" class="ask ${K > M.S ? 'itm ' : ''}`)}
            <td class="${K > M.S ? 'itm' : ''}">${ivt(p.iv)}</td><td class="${K > M.S ? 'itm' : ''}">${Q.fmt(p.delta, 2)}</td><td class="${K > M.S ? 'itm' : ''} dim">${Q.fmt(M.vol[p.key], 0)}</td><td class="${K > M.S ? 'itm' : ''} dim">${Q.fmt(M.oi[p.key], 0)}</td></tr>`;
        }).join('');
        const R = Q.rng(M.t * 7 + 3), lv = [];
        for (let i = 0; i < 5; i++) lv.push([100 * (1 + Math.floor(R() * 90)), f2(last - 0.01 * (i + 1)), f2(last + 0.01 * (i + 1)), 100 * (1 + Math.floor(R() * 90))]);
        $('.tbook').innerHTML = '<tr><th>Qtd</th><th>Compra</th><th>Venda</th><th>Qtd</th></tr>' + lv.map(l => `<tr><td class="dim">${Q.fmt(l[0], 0)}</td><td class="up">${l[1]}</td><td class="down">${l[2]}</td><td class="dim">${Q.fmt(l[3], 0)}</td></tr>`).join('');
        $('.ttt').innerHTML = '<tr><th>Hora</th><th>Série</th><th>Preço</th><th>Qtd</th><th>Agr.</th></tr>' + M.trades.slice(0, 12).map(t => `<tr title="${t.type === 'call' ? 'Call' : 'Put'} strike ${t.K}, vencimento ${t.ei + 1}"><td class="dim">${t.time}</td><td>${t.code}</td><td>${f2(t.px)}</td><td>${Q.fmt(t.qty, 0)}</td><td class="${t.side === 'C' ? 'up' : 'down'}">${t.side === 'C' ? 'compra' : 'venda'}</td></tr>`).join('') + '<tr><td colspan="5" class="dim" style="text-align:left;font-size:11px">Letra do mês: A–L = calls, M–X = puts. "compra" = comprador agrediu o ask.</td></tr>';
        root.querySelectorAll('.tchain tbody tr').forEach(tr => tr.onclick = () => { if (question && question.click) answer(+tr.dataset.k); });
        root.classList.toggle('clickmode', !!(question && question.click));
      }
      const timer = setInterval(() => { if (!document.body.contains(root)) { clearInterval(timer); return; } if (!paused && !question) { step(M); draw(); } }, 1500);
      $('#tPause').onclick = () => { paused = !paused; $('#tPause').textContent = paused ? '▶ Continuar' : '⏸ Pausar'; };
      $('#tNew').onclick = () => { seed = 1 + Math.floor(Math.random() * 1e6); M = newMarket(seed); prev = {}; ensureOI(M); for (let i = 0; i < 12; i++) addTrade(M); question = null; $('#tQ').innerHTML = 'Tela nova. Clique em "Nova pergunta".'; draw(); };
      $('#tExp').onchange = e => { ei = +e.target.value; prev = {}; draw(); };
      $('#tAsk').onclick = ask;
      const upd = () => { $('#tScore').textContent = ` · acertos ${score.ok}/${score.tot} · sequência ${score.streak}`; };
      function ask() {
        M.anomaly = null;
        const type = QTYPES[Math.floor(Math.random() * QTYPES.length)], ks = strikesOf(M), e = M.exps[ei], T = e.du / 252;
        const pickK = (lo, hi) => ks[lo + Math.floor(Math.random() * (hi - lo + 1))];
        let qd;
        if (type === 'ivmid') { const K = pickK(3, 9), tp = Math.random() < 0.5 ? 'call' : 'put', qq = quote(M, ei, tp, K); qd = { text: `Qual a <b>vol implícita do mid</b> da <b>${tp.toUpperCase()} ${K}</b> (vencimento ${ei + 1})? Calcule a partir de bid/ask (ou leia a coluna IV). Em %.`, ans: qq.iv * 100, tol: 0.6, unit: '%', exp: `Mid = (${f2(qq.bid)} + ${f2(qq.ask)})/2 = ${f3(qq.mid)} ⇒ IV ≈ ${Q.fmt(qq.iv * 100, 2)}%.` }; }
        else if (type === 'spreadvol') { const K = pickK(2, 10), tp = Math.random() < 0.5 ? 'call' : 'put', qq = quote(M, ei, tp, K), ivb = Q.impliedVol(tp, qq.bid, M.S, K, T, M.r, 0), iva = Q.impliedVol(tp, qq.ask, M.S, K, T, M.r, 0); if (!isFinite(ivb) || !isFinite(iva)) return ask(); qd = { text: `Qual a <b>largura do bid/offer em pontos de vol</b> da <b>${tp.toUpperCase()} ${K}</b> (vencimento ${ei + 1})? Dica: (ask − bid) ÷ vega por ponto (vega/pt ≈ ${Q.fmt(qq.vega / 100, 4)}).`, ans: (iva - ivb) * 100, tol: 0.35, unit: 'pts', exp: `IV(ask) − IV(bid) = ${Q.fmt(iva * 100, 2)} − ${Q.fmt(ivb * 100, 2)} = ${Q.fmt((iva - ivb) * 100, 2)} pts (≈ ${Q.fmt(qq.ask - qq.bid, 2)}/${Q.fmt(qq.vega / 100, 4)}).` }; }
        else if (type === 'oi') { const tp = Math.random() < 0.6 ? 'put' : 'call'; let best = ks[0]; ks.forEach(K => { if (M.oi[ei + tp + K] > M.oi[ei + tp + best]) best = K; }); qd = { click: true, text: `Clique na linha do strike com <b>maior open interest de ${tp.toUpperCase()}S</b> no vencimento ${ei + 1}. (É onde está o posicionamento — e um candidato a "ímã" perto do vencimento.)`, ans: best, exp: `Maior OI de ${tp}s: strike ${best} (${Q.fmt(M.oi[ei + tp + best], 0)} contratos).` }; }
        else if (type === 'arb') {
          const kind = Math.random() < 0.5 ? 'intrinsic' : 'fly';
          if (kind === 'intrinsic') { const K = pickK(1, 4); M.anomaly = { kind, key: ei + 'call' + K }; qd = { click: true, text: 'Há uma <b>arbitragem</b> na grade de CALLS deste vencimento. Clique no strike onde ela está. (Confira preços contra o valor intrínseco S − K·e<sup>−rT</sup>.)', ans: K, exp: `Call ${K}: ask ${f2(quote(M, ei, 'call', K).ask)} abaixo do intrínseco descontado ${f2(M.S - K * Math.exp(-M.r * T))}. Compra a call, vende a ação, e fica com a diferença garantida.` }; }
          else { const K = pickK(4, 8), c1 = quote(M, ei, 'call', K - 1), c3 = quote(M, ei, 'call', K + 1), c2 = quote(M, ei, 'call', K); const bump = Math.max(0.05, (c1.ask + c3.ask) / 2 - c2.bid + 0.06); M.anomaly = { kind, key: ei + 'call' + K, bump }; qd = { click: true, text: 'Há uma <b>arbitragem de borboleta</b> nas CALLS deste vencimento. Clique no strike do "miolo" que está caro demais.', ans: K, exp: `Compre a call ${K - 1} e a ${K + 1} nos asks e venda 2 da ${K} no bid: ${f2(c1.ask)} + ${f2(c3.ask)} − 2 × ${f2(quote(M, ei, 'call', K).bid)} < 0 — você recebe para montar uma borboleta, que nunca paga negativo.` }; }
        }
        else if (type === 'flow') { const puts = M.trades.filter(t => t.type === 'put'); const nb = puts.filter(t => t.side === 'C').length, ns = puts.length - nb; if (puts.length < 4 || nb === ns) return ask(); qd = { mcq: ['Compradores de put (agrediram o ask)', 'Vendedores de put (bateram no bid)'], text: `Olhando o <b>times &amp; trades</b>, o fluxo dominante nas PUTS é de:`, ans: nb > ns ? 0 : 1, exp: `${nb} negócios de put na compra (no ask) × ${ns} na venda (no bid). ${nb > ns ? 'Alguém está comprando proteção — tende a empinar o skew.' : 'Alguém está vendendo puts (vendendo vol/skew).'}` }; }
        else if (type === 'mid') { const K = pickK(3, 9), tp = Math.random() < 0.5 ? 'call' : 'put', qq = quote(M, ei, tp, K); if (!(qq.bid > 0)) return ask(); qd = { text: `Qual o <b>preço mid</b> da <b>${tp.toUpperCase()} ${K}</b> (vencimento ${ei + 1})? (Não confunda com o último negócio.)`, ans: qq.mid, tol: 0.006, unit: 'R$', exp: `(${f2(qq.bid)} + ${f2(qq.ask)})/2 = ${f3(qq.mid)}.` }; }
        else { const K = ks.reduce((a, b) => Math.abs(b - M.S) < Math.abs(a - M.S) ? b : a), c = quote(M, ei, 'call', K), p = quote(M, ei, 'put', K); const Fi = K + (c.mid - p.mid) * Math.exp(M.r * T); qd = { text: `Pela <b>paridade put-call</b> no strike ${K} (mids), qual o <b>forward implícito</b> do vencimento ${ei + 1}? F = K + (c − p)·e<sup>rT</sup>, T = ${e.du}/252, r = ${Q.fmt(M.r * 100, 1)}%.`, ans: Fi, tol: 0.06, unit: 'R$', exp: `F = ${K} + (${f3(c.mid)} − ${f3(p.mid)})·e^{${Q.fmt(M.r * T, 4)}} = ${f2(Fi)} (teórico: S·e^{rT} = ${f2(M.S * Math.exp(M.r * T))}).` }; }
        question = qd; draw();
        let inp = '';
        if (qd.mcq) inp = `<div class="row" style="margin-top:8px">${qd.mcq.map((o, i) => `<button class="btn sm" data-o="${i}">${o}</button>`).join('')}</div>`;
        else if (!qd.click) inp = `<div class="row" style="margin-top:8px"><input class="num" id="tIn" placeholder="sua resposta${qd.unit ? ' (' + qd.unit + ')' : ''}" style="width:180px"><button class="btn pri sm" id="tGo">Responder</button><button class="btn ghost sm" id="tSkip">Pular</button></div>`;
        else inp = `<div class="row" style="margin-top:8px"><span class="muted">👉 clique numa linha da grade</span><button class="btn ghost sm" id="tSkip">Pular</button></div>`;
        $('#tQ').innerHTML = `<div>${qd.text}</div>${inp}`;
        if (qd.mcq) root.querySelectorAll('[data-o]').forEach(b => b.onclick = () => answer(+b.dataset.o));
        const go = $('#tGo'); if (go) { go.onclick = () => answer(Q.parseNum($('#tIn').value)); $('#tIn').onkeydown = e => { if (e.key === 'Enter') go.click(); }; $('#tIn').focus(); }
        const sk = $('#tSkip'); if (sk) sk.onclick = () => { question = null; M.anomaly = null; $('#tQ').innerHTML = `<span class="muted">Pulou. Resposta: ${qd.exp}</span>`; draw(); };
      }
      function answer(v) {
        const qd = question; if (!qd) return;
        const ok = qd.click || qd.mcq ? v === qd.ans : (isFinite(v) && Math.abs(v - qd.ans) <= qd.tol);
        score.tot++; if (ok) { score.ok++; score.streak++; } else score.streak = 0;
        Store.recordAttempt('tela', 'tela', 'leitura-de-tela', ok);
        if (ok) { const xp = 10 + Math.min(20, 2 * score.streak); Store.s.counters.tela = (Store.s.counters.tela || 0) + 1; Store.addXP(xp, 'tela'); Store.checkBadges(); FX.floatFromEl($('#tQ'), '+' + xp + ' XP'); FX.fromEl($('#tQ'), 30); Sound.play('ok'); }
        else { FX.shake($('#tQ')); Sound.play('bad'); }
        $('#tQ').innerHTML = `<div class="${ok ? 'up' : 'down'}"><b>${ok ? 'Certo!' : 'Não foi dessa vez.'}</b></div><div class="muted" style="margin-top:4px">${qd.exp}</div>`;
        question = null; M.anomaly = null; upd(); draw();
      }
      upd(); draw();
    }
  });
})();
