/* Mesa — simulador de mesa de derivativos: você é o Head Trader.
   Mercado fictício que se mexe (3 ativos correlacionados, vol estocástica, notícias com saltos),
   livro com posições e gregas agrupadas, stress, blotter, RFQs de clientes, limites de risco,
   fechamento do dia com PnL explain. Estado persistido em Store.s.desk. */
(function (global) {
  'use strict';
  const { h, esc, toast, modal } = UI;
  const TPD = 28;                          // ticks por dia (15 min, 10h–17h)
  const DT = 1 / (252 * TPD), R_ = 0.105;  // juros para precificação
  const LIM = { delta: 5e6, vega: 25000, gamma: 2e6, stress: -3e6, stop: -1.5e6 };
  const f0 = x => Q.fmt(x, 0), f2 = x => Q.fmt(x, 2);
  const money = x => (x < 0 ? '−' : '') + 'R$ ' + Q.fmt(Math.abs(x), 0);
  const sgn = (x, d) => (x > 0 ? '+' : x < 0 ? '−' : '') + Q.fmt(Math.abs(x), d == null ? 0 : d);
  const U0 = {
    ACME3: { name: 'Acme Mineração', S: 40, v: 0.34, th: 0.34, beta: 1.25, bps: 4, skew: -0.35, step: 1, svc: 0.35 },
    FERR3: { name: 'Ferrovias do Sul', S: 62, v: 0.29, th: 0.29, beta: 0.8, bps: 5, skew: -0.25, step: 2, svc: 0.3 },
    BOVX11: { name: 'ETF de índice', S: 130, v: 0.21, th: 0.21, beta: 1, bps: 2, skew: -0.6, step: 2.5, svc: 0.8, index: true }
  };
  const UIDS = Object.keys(U0);

  /* ---------------- RNG serializável ---------------- */
  function rnd(D) { let a = D.rng | 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; D.rng = a; return ((t ^ t >>> 14) >>> 0) / 4294967296; }
  function nrm(D) { let u = 0; while (u === 0) u = rnd(D); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rnd(D)); }

  /* ---------------- estado ---------------- */
  function fresh(seed, inherit) {
    const D = { v: 1, seed, rng: seed, day: 1, tick: 0, regime: 0.9, cash: 0, und: {}, exps: [], nextExp: 1, pos: {}, trades: [], news: [], rfq: null, pnlDays: [], intraday: [], stats: { days: 0, green: 0, clean: 0, rfqWon: 0, rfqTot: 0, bestDay: 0, breachesToday: 0, streak: 0 }, sel: { u: 'ACME3', e: 0 } };
    UIDS.forEach(id => { const u = U0[id]; D.und[id] = { S: u.S, v: u.v, open: u.S, prevClose: u.S, hist: [u.S] }; });
    [12, 33, 54].forEach(d => D.exps.push({ id: D.nextExp++, dte: d }));
    if (inherit) inheritBook(D);
    startDay(D);
    return D;
  }
  function inheritBook(D) {
    const e = D.exps;
    const add = (u, t, ei, mny, qty) => { const K = strikeRound(u, D.und[u].S * mny); const key = okey(u, t, e[ei].id, K); exec(D, key, qty, quote(D, key).mid, 'herdado'); };
    add('ACME3', 'P', 0, 0.95, -100000); add('ACME3', 'S', 0, 1, 30000);
    add('FERR3', 'C', 1, 1.05, 75000); add('FERR3', 'S', 0, 1, -25000);
    add('BOVX11', 'C', 2, 1, -40000); add('BOVX11', 'P', 2, 1, -40000);
    add('BOVX11', 'P', 0, 0.9, 60000);
    D.trades.forEach(t => { t.src = 'herdado'; });
  }
  const okey = (u, t, eid, K) => t === 'S' ? u + '|S' : `${u}|${t}|${eid}|${K}`;
  function parse(key) { const [u, t, eid, K] = key.split('|'); return { u, t, eid: +eid, K: +K }; }
  function strikeRound(u, x) { const st = U0[u].step; return Math.round(x / st) * st; }
  function strikes(D, u) { const st = U0[u].step, c = strikeRound(u, D.und[u].S), out = []; for (let i = -4; i <= 4; i++) out.push(Math.round((c + i * st) * 100) / 100); return out; }
  const expById = (D, id) => D.exps.find(x => x.id === id);
  const Tof = (D, ex) => Math.max(ex.dte - D.tick / TPD, 0.0001) / 252;

  function volOf(D, u, K, T) {
    const s = D.und[u], F = s.S * Math.exp(R_ * T), x = Math.log(K / F), sk = U0[u].skew / Math.sqrt(Math.max(T, 0.02) / 0.25);
    const th = U0[u].th, atm = th + (s.v - th) * Math.exp(-T / 0.3) + 0.01 * Math.sqrt(T);  // curto = vol atual; longo reverte à média
    return Math.max(0.05, atm + sk * x + 0.8 * x * x);
  }
  function quote(D, key) {
    const p = parse(key), s = D.und[p.u];
    if (p.t === 'S') { const hs = s.S * U0[p.u].bps / 20000; return { bid: Math.round((s.S - hs) * 100) / 100, ask: Math.round((s.S + hs) * 100) / 100, mid: s.S, delta: 1, gamma: 0, vega: 0, theta: 0, iv: NaN }; }
    const ex = expById(D, p.eid); if (!ex) return null;
    const T = Tof(D, ex), sig = volOf(D, p.u, p.K, T), type = p.t === 'C' ? 'call' : 'put', g = Q.bs(type, s.S, p.K, T, R_, 0, sig);
    const w = (0.8 + 12 * Math.abs(Math.log(p.K / s.S)) + (ex.dte <= 3 ? 0.6 : 0)) / 100;
    let bid = Math.round(Q.bsPrice(type, s.S, p.K, T, R_, 0, Math.max(0.02, sig - w / 2)) * 100) / 100, ask = Math.round(Q.bsPrice(type, s.S, p.K, T, R_, 0, sig + w / 2) * 100) / 100;
    if (ask <= bid) ask = bid + 0.01; if (bid < 0.01) bid = 0;
    return { bid, ask, mid: g.price, iv: sig, delta: g.delta, gamma: g.gamma, vega: g.vega, theta: g.theta, T, type };
  }
  function label(D, key) { const p = parse(key); if (p.t === 'S') return p.u + (U0[p.u].index ? ' (ETF)' : ' (ação)'); const ex = expById(D, p.eid); return `${p.u} ${p.t === 'C' ? 'Call' : 'Put'} ${Q.fmt(p.K, p.K % 1 ? 1 : 0)} · V${p.eid}${ex ? ' (' + ex.dte + 'd)' : ''}`; }
  const clock = t => { const m = 600 + t * 15; return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); };

  /* ---------------- execução e livro ---------------- */
  function exec(D, key, qty, px, src) {
    if (!qty) return;
    const p = D.pos[key] || (D.pos[key] = { qty: 0, avg: 0 });
    if (p.qty === 0 || Math.sign(p.qty) === Math.sign(qty)) p.avg = (p.avg * p.qty + px * qty) / (p.qty + qty);
    else if (Math.abs(qty) > Math.abs(p.qty)) p.avg = px;
    p.qty += qty; D.cash -= qty * px;
    if (Math.abs(p.qty) < 1e-9) delete D.pos[key];
    D.trades.unshift({ d: D.day, t: clock(D.tick), key, qty, px, src: src || 'tela' });
    if (D.trades.length > 300) D.trades.length = 300;
  }
  function book(D, mkt) {
    const rows = [];
    let tot = { val: 0, dR: 0, g1: 0, vega: 0, th: 0 }, byU = {}, byE = {};
    Object.keys(D.pos).forEach(key => {
      const p = D.pos[key], pr = parse(key), q = quote(D, key); if (!q) return;
      const S = (mkt || D.und)[pr.u].S;
      const r = { key, qty: p.qty, avg: p.avg, mid: q.mid, pnl: p.qty * (q.mid - p.avg), dSh: p.qty * q.delta, dR: p.qty * q.delta * S, g1: p.qty * q.gamma * S * S / 100, vega: p.qty * q.vega / 100, th: p.qty * q.theta / 252, u: pr.u, eid: pr.eid, t: pr.t };
      rows.push(r);
      tot.val += p.qty * q.mid; tot.dR += r.dR; tot.g1 += r.g1; tot.vega += r.vega; tot.th += r.th;
      const bu = byU[pr.u] || (byU[pr.u] = { dSh: 0, dR: 0, g1: 0, vega: 0, th: 0, pnl: 0 }); bu.dSh += r.dSh; bu.dR += r.dR; bu.g1 += r.g1; bu.vega += r.vega; bu.th += r.th; bu.pnl += r.pnl;
      if (pr.t !== 'S') { const k2 = pr.u + '|' + pr.eid; byE[k2] = (byE[k2] || 0) + r.vega; }
    });
    rows.sort((a, b) => a.u.localeCompare(b.u) || (a.t === 'S' ? -1 : b.t === 'S' ? 1 : a.eid - b.eid) || a.key.localeCompare(b.key));
    tot.pnl = D.cash + tot.val;
    return { rows, tot, byU, byE };
  }
  function revalue(D, shockI, dVolPts) {           // choque no índice (%) propagado por beta; vol em pontos
    let v = D.cash;
    Object.keys(D.pos).forEach(key => {
      const p = D.pos[key], pr = parse(key), s = D.und[pr.u], sh = shockI * U0[pr.u].beta, S2 = s.S * (1 + sh);
      if (pr.t === 'S') { v += p.qty * S2; return; }
      const ex = expById(D, pr.eid); if (!ex) return;
      const T = Tof(D, ex), sig = volOf(D, pr.u, pr.K, T) + dVolPts / 100 * (1 + (sh < 0 ? 0.3 : 0));
      v += p.qty * Q.bsPrice(pr.t === 'C' ? 'call' : 'put', S2, pr.K, T, R_, 0, Math.max(0.03, sig));
    });
    return v;
  }
  const SH = [-0.2, -0.1, -0.05, 0, 0.05, 0.1], VSH = [-5, 0, 5, 10];
  function stress(D) { const base = revalue(D, 0, 0); return VSH.map(dv => SH.map(sh => revalue(D, sh, dv) - base)); }

  /* ---------------- dinâmica do mercado ---------------- */
  const NEWS = [
    { w: 3, kind: 'earn', run(D) { const u = rnd(D) < 0.5 ? 'ACME3' : 'FERR3', up = rnd(D) < 0.45, g = (5 + 7 * rnd(D)) / 100 * (up ? 1 : -1); jump(D, u, g); D.und[u].v = Math.max(0.12, D.und[u].v - (0.03 + 0.04 * rnd(D))); return `${U0[u].name} (${u}) divulga resultado ${up ? 'acima' : 'abaixo'} do esperado: ação ${up ? 'dispara' : 'despenca'} ${Q.fmt(Math.abs(g) * 100, 1)}%; vol implícita cai depois do evento (vol crush).`; } },
    { w: 2, kind: 'crash', run(D) { const g = -(0.025 + 0.03 * rnd(D)); UIDS.forEach(u => { jump(D, u, g * U0[u].beta * (0.8 + 0.4 * rnd(D))); D.und[u].v += (U0[u].index ? 0.07 : 0.05) + 0.03 * rnd(D); }); D.regime = 1.2; return `Choque externo: bolsa desaba ${Q.fmt(-g * 100, 1)}%, vols explodem em toda a curva e o skew empina.`; } },
    { w: 2, kind: 'rally', run(D) { const g = 0.015 + 0.02 * rnd(D); UIDS.forEach(u => { jump(D, u, g * U0[u].beta); D.und[u].v = Math.max(0.1, D.und[u].v - 0.02 - 0.02 * rnd(D)); }); D.regime = 0.85; return `Dado de inflação benigno: bolsa sobe ${Q.fmt(g * 100, 1)}% e as vols recuam.`; } },
    { w: 2, kind: 'volbid', run(D) { UIDS.forEach(u => { D.und[u].v += 0.015 + 0.01 * rnd(D); }); return 'Fluxo pesado de compra de proteção (puts) por gestores: vol implícita sobe sem o spot se mexer muito.'; } },
    { w: 1, kind: 'calm', run(D) { D.regime = 0.7; return 'Mercado de lado, volume fraco: a vol realizada está rodando bem abaixo da implícita.'; } },
    { w: 2, kind: 'exdiv', run(D) { const u = rnd(D) < 0.5 ? 'ACME3' : 'FERR3'; return exDividend(D, u, Math.round(D.und[u].S * (0.01 + 0.025 * rnd(D)) * 100) / 100); } }
  ];
  function jump(D, u, g) { const s = D.und[u]; s.S = Math.max(1, s.S * (1 + g)); }
  /* Data ex: ação cai D; a B3 reduz o strike das opções listadas em D (proteção a proventos); ações em carteira recebem/pagam o provento. */
  function exDividend(D, u, div) {
    const s = D.und[u]; s.S = Math.max(1, s.S - div);
    D.adj = D.adj || []; D.adj.push({ u, div }); D.keyMap = D.keyMap || {};
    let cashFlow = 0, nAdj = 0;
    Object.keys(D.pos).forEach(k => {
      const pr = parse(k); if (pr.u !== u) return;
      if (pr.t === 'S') { cashFlow += D.pos[k].qty * div; return; }
      const nk = okey(u, pr.t, pr.eid, Math.round((pr.K - div) * 100) / 100), p = D.pos[k];
      const tgt = D.pos[nk]; if (tgt) { const tot = tgt.qty + p.qty; tgt.avg = tot ? (tgt.avg * tgt.qty + p.avg * p.qty) / tot : 0; tgt.qty = tot; } else D.pos[nk] = { qty: p.qty, avg: p.avg };
      delete D.pos[k]; nAdj++;
      Object.keys(D.keyMap).forEach(o => { if (D.keyMap[o] === k) D.keyMap[o] = nk; }); D.keyMap[k] = nk;
    });
    if (D.rfq && parse(D.rfq.key).u === u && parse(D.rfq.key).t !== 'S') { const pr = parse(D.rfq.key); D.rfq.key = okey(u, pr.t, pr.eid, Math.round((pr.K - div) * 100) / 100); }
    D.cash += cashFlow;
    return `${U0[u].name} (${u}) fica ex-dividendos de R$ ${Q.fmt(div, 2)}/ação: a ação abre R$ ${Q.fmt(div, 2)} mais barata e a B3 reduz os strikes das opções no mesmo valor${nAdj ? ` (${nAdj} série(s) do seu livro ajustada(s))` : ''}. ${cashFlow ? `Sua posição em ações ${cashFlow > 0 ? 'recebe' : 'paga (reembolso ao doador no BTC)'} ${money(Math.abs(cashFlow))} de proventos.` : ''}`;
  }
  function step(D) {
    const zI = nrm(D), sI = D.und.BOVX11.v * D.regime, rI = sI * Math.sqrt(DT) * zI;
    UIDS.forEach(u => {
      const s = D.und[u], c = U0[u]; let r;
      if (c.index) r = rI; else { const tot = s.v * D.regime, id = Math.sqrt(Math.max(0.0025, tot * tot - c.beta * c.beta * sI * sI)); r = c.beta * rI + id * Math.sqrt(DT) * nrm(D); }
      s.S = Math.max(1, s.S * Math.exp(r - 0.5 * (s.v * D.regime) ** 2 * DT));
      s.v = Math.max(0.08, s.v + 4 * (c.th - s.v) * DT + 0.15 * Math.sqrt(DT) * nrm(D) - c.svc * r);
    });
    D.regime += 0.02 * (0.9 - D.regime);
    if (rnd(D) < 0.012) { const tw = NEWS.reduce((a, n) => a + n.w, 0); let x = rnd(D) * tw, n = NEWS[0]; for (const nn of NEWS) { x -= nn.w; if (x <= 0) { n = nn; break; } } D.news.unshift({ d: D.day, t: clock(D.tick), txt: n.run(D) }); D.news.length = Math.min(D.news.length, 30); D._flash = D.news[0].txt; }
    D.tick++;
    if (!D.rfq && rnd(D) < 0.07) newRFQ(D);
    if (D.rfq && D.tick > D.rfq.until) { D.rfq.status = 'perdido'; D.stats.rfqTot++; D._rfqMsg = `RFQ expirou: o cliente fechou com outro dealer.`; D.rfq = null; }
    const b = book(D); D.intraday.push({ t: D.tick, pnl: b.tot.pnl - D.dayStart.pnl });
    checkLimits(D, b);
  }
  function checkLimits(D, b) {
    const br = [];
    if (Math.abs(b.tot.dR) > LIM.delta) br.push('delta'); if (Math.abs(b.tot.vega) > LIM.vega) br.push('vega'); if (Math.abs(b.tot.g1) > LIM.gamma) br.push('gamma');
    if (b.tot.pnl - D.dayStart.pnl < LIM.stop) br.push('stop');
    D.breaches = br; if (br.length) D.stats.breachesToday++;
    return br;
  }

  /* ---------------- clientes (RFQ) ---------------- */
  const CLIENTS = ['Fundo Atlântico', 'Tesouraria Banco Sul', 'Family office Vale Verde', 'Gestora Quantum', 'Fundo de previdência Norte', 'Hedge fund Orion'];
  function newRFQ(D) {
    const u = UIDS[Math.floor(rnd(D) * 3)], put = rnd(D) < 0.6, buys = rnd(D) < 0.65, ex = D.exps[Math.floor(rnd(D) * 3)];
    const S = D.und[u].S, K = strikeRound(u, S * (put ? 0.9 + 0.1 * rnd(D) : 1 + 0.1 * rnd(D))), qty = Math.max(10000, Math.round([20000, 50000, 100000, 200000][Math.floor(rnd(D) * 4)] * 40 / S / 10000) * 10000);
    const key = okey(u, put ? 'P' : 'C', ex.id, K), q = quote(D, key);
    D.rfq = { key, qty, buys, client: CLIENTS[Math.floor(rnd(D) * CLIENTS.length)], street: 0.4 + 0.9 * rnd(D), noise: (rnd(D) - 0.5) * 0.8, until: D.tick + 4, fair: q.iv };
  }
  function answerRFQ(D, bidV, offV) {
    const r = D.rfq; if (!r) return;
    const q = quote(D, r.key), fairPts = q.iv * 100, stBid = fairPts - r.street + r.noise, stOff = fairPts + r.street + r.noise;
    const pr = parse(r.key), S = D.und[pr.u].S, T = q.T, type = q.type;
    let msg, won = false;
    if (r.buys) { if (offV <= stOff) { const px = Q.bsPrice(type, S, pr.K, T, R_, 0, offV / 100); exec(D, r.key, -r.qty, Math.round(px * 100) / 100, 'RFQ ' + r.client); won = true; msg = `✅ ${r.client} comprou ${f0(r.qty)} de você a ${Q.fmt(offV, 2)} de vol (R$ ${f2(px)}). Edge ≈ ${money(r.qty * (px - q.mid))}. Agora hedgeie!`; } else msg = `❌ ${r.client} achou caro: o mercado estava ${Q.fmt(stBid, 1)} / ${Q.fmt(stOff, 1)}.`; }
    else { if (bidV >= stBid) { const px = Q.bsPrice(type, S, pr.K, T, R_, 0, bidV / 100); exec(D, r.key, r.qty, Math.round(px * 100) / 100, 'RFQ ' + r.client); won = true; msg = `✅ ${r.client} vendeu ${f0(r.qty)} para você a ${Q.fmt(bidV, 2)} de vol (R$ ${f2(px)}). Edge ≈ ${money(r.qty * (q.mid - px))}. Agora hedgeie!`; } else msg = `❌ ${r.client} vendeu para outro dealer: mercado ${Q.fmt(stBid, 1)} / ${Q.fmt(stOff, 1)}.`; }
    D.stats.rfqTot++; if (won) D.stats.rfqWon++;
    D.rfq = null; D._rfqMsg = msg;
    return won;
  }

  /* ---------------- dia ---------------- */
  function snapshot(D) {
    const pos = {}; Object.keys(D.pos).forEach(k => { const q = quote(D, k), pr = parse(k); if (!q) return; pos[k] = { qty: D.pos[k].qty, mid: q.mid, S: D.und[pr.u].S, iv: q.iv, d: q.delta, g: q.gamma, v: q.vega, th: q.theta }; });
    return { pnl: book(D).tot.pnl, pos, S: Object.fromEntries(UIDS.map(u => [u, D.und[u].S])), trades0: D.trades.length };
  }
  function startDay(D) { D.tick = 0; D.adj = []; D.keyMap = {}; UIDS.forEach(u => { D.und[u].open = D.und[u].S; }); D.dayStart = snapshot(D); D.intraday = [{ t: 0, pnl: 0 }]; D.stats.breachesToday = 0; D.breaches = []; }
  function explain(D) {
    const st = D.dayStart, e = { delta: 0, gamma: 0, vega: 0, theta: 0, novos: 0 };
    const adjU = u => (D.adj || []).filter(a => a.u === u).reduce((x, a) => x + a.div, 0);
    Object.keys(st.pos).forEach(k => { const p = st.pos[k], pr = parse(k), q = quote(D, (D.keyMap || {})[k] || k), dS = D.und[pr.u].S - (p.S - adjU(pr.u)); e.delta += p.qty * p.d * dS; e.gamma += 0.5 * p.qty * p.g * dS * dS; if (q && isFinite(q.iv) && isFinite(p.iv)) e.vega += p.qty * p.v * (q.iv - p.iv); e.theta += p.qty * p.th * (D.tick / TPD) / 252; });
    const newT = D.trades.slice(0, D.trades.length - st.trades0).filter(t => t.d === D.day);
    newT.forEach(t => { const q = quote(D, (D.keyMap || {})[t.key] || t.key); if (q) e.novos += t.qty * (q.mid - t.px); });
    const tot = book(D).tot.pnl - st.pnl; e.total = tot; e.resid = tot - e.delta - e.gamma - e.vega - e.theta - e.novos;
    return e;
  }
  function endDay(D) {
    const e = explain(D), pnl = e.total, br = D.stats.breachesToday;
    // liquidação dos vencimentos de hoje
    const settled = [];
    D.exps.filter(x => x.dte <= 1).forEach(ex => {
      Object.keys(D.pos).forEach(k => { const pr = parse(k); if (pr.t === 'S' || pr.eid !== ex.id) return; const S = D.und[pr.u].S, intr = pr.t === 'C' ? Math.max(S - pr.K, 0) : Math.max(pr.K - S, 0); const q = D.pos[k].qty; D.cash += q * intr; settled.push(`${label(D, k)}: ${f0(q)} × ${f2(intr)}`); delete D.pos[k]; });
    });
    D.exps = D.exps.filter(x => x.dte > 1); D.exps.forEach(x => { x.dte -= 1; });
    while (D.exps.length < 3) D.exps.push({ id: D.nextExp++, dte: (D.exps.length ? D.exps[D.exps.length - 1].dte : 0) + 21 });
    D.pnlDays.push({ d: D.day, pnl, br }); if (D.pnlDays.length > 250) D.pnlDays.shift();
    D.stats.days++; if (pnl > 0) { D.stats.green++; D.stats.streak++; } else D.stats.streak = 0; if (pnl > 0 && br === 0) D.stats.clean++; D.stats.bestDay = Math.max(D.stats.bestDay, pnl);
    UIDS.forEach(u => { const s = D.und[u]; s.prevClose = s.S; s.hist.push(s.S); if (s.hist.length > 60) s.hist.shift(); });
    const xp = 25 + (pnl > 0 ? Math.min(100, Math.round(pnl / 10000)) : 0) + (br === 0 ? 25 : 0);
    const grade = br > 6 ? 'D' : pnl > 200000 && br === 0 ? 'A' : pnl > 0 && br <= 2 ? 'B' : pnl > -300000 ? 'C' : 'D';
    const day = D.day; D.day++; startDay(D);
    return { e, pnl, br, xp, grade, settled, day };
  }

  /* ---------------- UI ---------------- */
  let D = null, timer = null, speed = 1200, running = false;
  const S = () => Store.s;
  function save() { S().desk = D; Store.save(); }

  function view(root) {
    clearInterval(timer); running = false;
    D = S().desk || null;
    if (!D) return intro(root);
    root.innerHTML = `<div class="desk">
      <div class="dk-top row"><h1 style="margin:0">Mesa — você é o Head Trader</h1><span class="spacer"></span>
        <span class="chip mono" id="dkClock"></span>
        <button class="btn sm" id="dkPlay">▶ Rodar</button>
        <select id="dkSpeed" class="dk-sel"><option value="1800">Lento</option><option value="1000" selected>Normal</option><option value="350">Rápido</option></select>
        <button class="btn sm" id="dkEnd" title="Roda até o fechamento e gera o relatório do dia">⏭ Fechar o dia</button>
        <button class="btn sm ghost" id="dkReset">Reiniciar mesa</button></div>
      <div class="dk-kpis" id="dkKpis"></div>
      <div class="dk-news" id="dkNews"></div>
      <div class="dk-grid">
        <div class="card dk-mkt"><div class="dk-h">MERCADO</div><table class="tbl dk-tbl" id="dkMkt"></table>
          <div class="row" style="margin:8px 0 4px;gap:6px"><div class="tabs" id="dkUTabs"></div><select id="dkExp" class="dk-sel"></select></div>
          <table class="tbl dk-tbl dk-chain" id="dkChain"></table><div class="muted" style="font-size:11.5px;margin-top:4px">Clique num preço para montar a boleta. Bid = você vende; ask = você compra.</div></div>
        <div class="dk-right">
          <div class="card" id="dkRfq"></div>
          <div class="card" id="dkTicket"></div>
        </div>
      </div>
      <div class="card" style="margin-top:12px"><div id="dkTabs"></div><div id="dkBook" style="margin-top:10px"></div></div>
    </div>`;
    const $ = s => root.querySelector(s);
    const tabs = Sims.tabs(['Posições', 'Gregas agrupadas', 'Stress', 'Negócios', 'PnL do dia', 'Histórico'], i => { bookTab = i; drawBook(); });
    $('#dkTabs').appendChild(tabs);
    let bookTab = 0, ticket = { key: D.sel.u + '|S', qty: 50000 };
    $('#dkPlay').onclick = () => { running = !running; $('#dkPlay').textContent = running ? '⏸ Pausar' : '▶ Rodar'; loop(); };
    $('#dkSpeed').onchange = e => { speed = +e.target.value; loop(); };
    $('#dkEnd').onclick = () => { running = false; loop(); $('#dkPlay').textContent = '▶ Rodar'; while (D.tick < TPD) step(D); closeDay(); };
    let armed = false; $('#dkReset').onclick = e => { if (!armed) { armed = true; e.target.textContent = 'Clique de novo para confirmar'; setTimeout(() => { armed = false; e.target.textContent = 'Reiniciar mesa'; }, 3000); return; } running = false; clearInterval(timer); S().desk = null; Store.save(); view(root); };
    function loop() { clearInterval(timer); if (!running) return; timer = setInterval(() => { if (!document.body.contains(root)) { clearInterval(timer); running = false; return; } step(D); if (D.tick >= TPD) { running = false; clearInterval(timer); $('#dkPlay').textContent = '▶ Rodar'; draw(); save(); closeDay(); return; } draw(); save(); }, speed); }
    function closeDay() {
      const r = endDay(D); save();
      Store.addXP(r.xp, 'mesa'); checkDeskBadges();
      const ex = r.e, row = (k, v) => `<tr><td>${k}</td><td class="mono ${v >= 0 ? 'up' : 'down'}" style="text-align:right">${money(v)}</td></tr>`;
      const good = r.pnl > 0;
      if (good) FX.confetti(r.grade === 'A' ? 200 : 90);
      modal(`<div class="bigicon">${r.grade}</div><h2>Fechamento do dia ${r.day}</h2>
        <p class="${good ? 'up' : 'down'}" style="font-size:22px;font-weight:800;margin:4px 0">${money(r.pnl)}</p>
        <table class="tbl" style="max-width:420px;margin:8px auto">${row('Delta', ex.delta)}${row('Gamma', ex.gamma)}${row('Vega', ex.vega)}${row('Theta', ex.theta)}${row('Negócios do dia (edge vs mid)', ex.novos)}${row('Resíduo (ordem superior, vanna, saltos)', ex.resid)}</table>
        <p class="muted">${r.br ? `⚠️ ${r.br} leituras com limite estourado durante o dia — o risco vai querer conversar.` : '✅ Nenhum limite estourado.'}${r.settled.length ? '<br>Vencimentos liquidados: ' + r.settled.map(esc).join('; ') : ''}</p>
        <p><span class="up">+${r.xp} XP</span> · sequência de dias no verde: ${D.stats.streak}</p>`, [{ label: 'Próximo dia', pri: true, fn: () => draw() }]);
      draw();
    }
    function kpis() {
      const b = book(D), day = b.tot.pnl - D.dayStart.pnl, st = stress(D), worst = Math.min(...st.flat());
      const bar = (v, lim, lab, fmt) => { const u = Math.min(1.5, Math.abs(v) / Math.abs(lim)); return `<div class="dk-k ${u > 1 ? 'bad' : u > 0.8 ? 'warn' : ''}"><span>${lab}</span><b>${fmt(v)}</b><i style="width:${Math.min(100, u * 100)}%"></i><em>limite ${fmt(lim).replace('−', '')}</em></div>`; };
      $('#dkKpis').innerHTML = `<div class="dk-k big"><span>PnL do dia</span><b class="${day >= 0 ? 'up' : 'down'}">${money(day)}</b><em>stop ${money(LIM.stop)}</em></div>
        <div class="dk-k big"><span>PnL acumulado</span><b class="${b.tot.pnl >= 0 ? 'up' : 'down'}">${money(b.tot.pnl)}</b><em>${D.stats.days} dias · ${D.stats.green} no verde</em></div>
        ${bar(b.tot.dR, LIM.delta, 'Delta (R$)', money)}${bar(b.tot.g1, LIM.gamma, 'Gamma 1% (R$ Δ)', money)}${bar(b.tot.vega, LIM.vega, 'Vega (R$/pt)', money)}
        <div class="dk-k"><span>Theta (R$/dia)</span><b class="${b.tot.th >= 0 ? 'up' : 'down'}">${money(b.tot.th)}</b><em>quanto o livro ganha/perde parado</em></div>
        ${bar(worst, LIM.stress, 'Pior stress', money)}`;
      $('#dkClock').textContent = `Dia ${D.day} · ${clock(D.tick)}${D.tick >= TPD ? ' (fechado)' : ''}`;
    }
    function market() {
      $('#dkMkt').innerHTML = '<tr><th>Ativo</th><th>Último</th><th>Dia</th><th>Vol ATM V1</th><th>Δ do livro</th></tr>' + UIDS.map(u => {
        const s = D.und[u], ch = s.S / s.prevClose - 1, ex = D.exps[0], iv = volOf(D, u, s.S, Tof(D, ex)), bu = book(D).byU[u];
        return `<tr class="${D.sel.u === u ? 'sel' : ''}" data-u="${u}" style="cursor:pointer"><td><b>${u}</b> <span class="muted" style="font-size:11px">${U0[u].name} (fict.)</span></td><td class="mono">${f2(s.S)}</td><td class="mono ${ch >= 0 ? 'up' : 'down'}">${sgn(ch * 100, 2)}%</td><td class="mono">${Q.fmt(iv * 100, 1)}</td><td class="mono">${bu ? money(bu.dR) : '—'}</td></tr>`;
      }).join('');
      root.querySelectorAll('#dkMkt tr[data-u]').forEach(tr => tr.onclick = () => { D.sel.u = tr.dataset.u; ticket.key = D.sel.u + '|S'; draw(); drawTicket(); });
      const ut = $('#dkUTabs'); ut.innerHTML = UIDS.map(u => `<button class="${D.sel.u === u ? 'on' : ''}" data-u="${u}">${u}</button>`).join('');
      ut.querySelectorAll('button').forEach(b => b.onclick = () => { D.sel.u = b.dataset.u; ticket.key = D.sel.u + '|S'; draw(); drawTicket(); });
      const es = $('#dkExp'); if (D.sel.e >= D.exps.length) D.sel.e = 0;
      es.innerHTML = D.exps.map((x, i) => `<option value="${i}" ${i === D.sel.e ? 'selected' : ''}>V${x.id} · ${x.dte} d.u.</option>`).join('');
      es.onchange = e => { D.sel.e = +e.target.value; draw(); };
      const u = D.sel.u, ex = D.exps[D.sel.e], ks = strikes(D, u), S0 = D.und[u].S;
      $('#dkChain').innerHTML = `<tr><th>Pos</th><th>Bid</th><th>Ask</th><th>IV</th><th class="tk">Strike</th><th>IV</th><th>Bid</th><th>Ask</th><th>Pos</th></tr>` + ks.map(K => {
        const kc = okey(u, 'C', ex.id, K), kp = okey(u, 'P', ex.id, K), c = quote(D, kc), p = quote(D, kp), pc = D.pos[kc], pp = D.pos[kp];
        const px = (k, side, v) => `<td class="dk-px ${side}" data-k="${k}" data-side="${side}">${v > 0 ? f2(v) : '—'}</td>`;
        return `<tr class="${Math.abs(K - S0) < U0[u].step / 2 + 1e-9 ? 'atm' : ''}"><td class="mono ${pc ? (pc.qty > 0 ? 'up' : 'down') : 'muted'}">${pc ? sgn(pc.qty / 1000, 0) + 'k' : ''}</td>${px(kc, 'bid', c.bid)}${px(kc, 'ask', c.ask)}<td class="muted">${Q.fmt(c.iv * 100, 1)}</td><td class="tk"><b>${Q.fmt(K, K % 1 ? 1 : 0)}</b></td><td class="muted">${Q.fmt(p.iv * 100, 1)}</td>${px(kp, 'bid', p.bid)}${px(kp, 'ask', p.ask)}<td class="mono ${pp ? (pp.qty > 0 ? 'up' : 'down') : 'muted'}">${pp ? sgn(pp.qty / 1000, 0) + 'k' : ''}</td></tr>`;
      }).join('') + `<tr><td colspan="9" class="muted" style="text-align:center;font-size:11px">CALLS à esquerda · PUTS à direita · V${ex.id} vence em ${ex.dte} d.u.${ex.dte <= 1 ? ' — <b class="amber">vence hoje no fechamento</b>' : ''}</td></tr>`;
      root.querySelectorAll('.dk-px').forEach(td => td.onclick = () => { ticket.key = td.dataset.k; ticket.qty = Math.abs(ticket.qty || 50000) * (td.dataset.side === 'ask' ? 1 : -1); drawTicket(); });
    }
    function news() {
      const n = D.news[0];
      $('#dkNews').innerHTML = n ? `<b class="amber">📰 ${n.d === D.day ? clock(D.tick) === n.t ? 'AGORA' : n.t : 'Dia ' + n.d + ' ' + n.t}</b> ${esc(n.txt)}` : '<span class="muted">📰 Sem notícias relevantes. O mercado anda com a vol normal — e com um prêmio de vol que favorece quem vende… até a próxima notícia.</span>';
      if (D._flash) { FX.pulse($('#dkNews'), 'fx-pop'); Sound.play('badge'); D._flash = null; }
    }
    function rfq() {
      const el = $('#dkRfq'), r = D.rfq;
      if (!r) { el.innerHTML = `<div class="dk-h">RFQ DE CLIENTES</div><div class="muted" style="font-size:13px">${D._rfqMsg ? esc(D._rfqMsg) : 'Aguardando pedidos de preço do sales…'}</div>`; return; }
      const q = quote(D, r.key), fair = q.iv * 100, left = r.until - D.tick;
      el.innerHTML = `<div class="dk-h">RFQ DE CLIENTES <span class="amber">· ${left} ${left === 1 ? 'turno' : 'turnos'} para responder</span></div>
        <div style="margin:4px 0 8px"><b>${esc(r.client)}</b> quer ${r.buys ? '<b class="up">COMPRAR</b>' : '<b class="down">VENDER</b>'} <b>${f0(r.qty)}</b> ${esc(label(D, r.key))}.</div>
        <div class="muted" style="font-size:12.5px">Seu modelo: vol justa <b>${Q.fmt(fair, 2)}</b> · mid R$ ${f2(q.mid)} · vega/opção ${Q.fmt(q.vega / 100, 4)} · se fechar, seu livro muda Δ em ${money((r.buys ? -1 : 1) * r.qty * q.delta * D.und[parse(r.key).u].S)} e vega em ${money((r.buys ? -1 : 1) * r.qty * q.vega / 100)}/pt</div>
        <div class="row" style="margin-top:8px;gap:6px"><span class="muted" style="font-size:12px">Cotar (vol):</span>${[0.5, 1, 1.5, 2.5].map(w => `<button class="btn sm" data-w="${w}">${Q.fmt(fair - w / 2, 1)} / ${Q.fmt(fair + w / 2, 1)}</button>`).join('')}<button class="btn sm ghost" data-w="pass">Passar</button></div>
        <div class="muted" style="font-size:11.5px;margin-top:4px">Largura menor = mais chance de ganhar o negócio, menos edge. O cliente fecha se o seu lado for melhor que o do mercado.</div>`;
      el.querySelectorAll('[data-w]').forEach(b => b.onclick = () => { if (b.dataset.w === 'pass') { D.rfq = null; D._rfqMsg = 'Você passou o RFQ.'; D.stats.rfqTot++; } else { const w = +b.dataset.w, won = answerRFQ(D, fair - w / 2, fair + w / 2); if (won) { FX.fromEl(el, 40); Sound.play('coin'); } else Sound.play('bad'); checkDeskBadges(); } save(); draw(); });
    }
    function drawTicket() {
      const el = $('#dkTicket'), pr = parse(ticket.key), q = quote(D, ticket.key);
      if (!q) { ticket.key = D.sel.u + '|S'; return drawTicket(); }
      const u = pr.u, isOpt = pr.t !== 'S', exs = D.exps, ks = strikes(D, u), qty = ticket.qty || 0;
      const px = qty > 0 ? q.ask : q.bid, S0 = D.und[u].S;
      el.innerHTML = `<div class="dk-h">BOLETA</div>
        <div class="dk-form"><label>Ativo<select id="tkU" class="dk-sel">${UIDS.map(x => `<option ${x === u ? 'selected' : ''}>${x}</option>`).join('')}</select></label>
        <label>Instrumento<select id="tkT" class="dk-sel"><option value="S" ${pr.t === 'S' ? 'selected' : ''}>Ação/ETF</option><option value="C" ${pr.t === 'C' ? 'selected' : ''}>Call</option><option value="P" ${pr.t === 'P' ? 'selected' : ''}>Put</option></select></label>
        ${isOpt ? `<label>Vencimento<select id="tkE" class="dk-sel">${exs.map(x => `<option value="${x.id}" ${x.id === pr.eid ? 'selected' : ''}>V${x.id} · ${x.dte}d</option>`).join('')}</select></label>
        <label>Strike<select id="tkK" class="dk-sel">${[...new Set(ks.concat(pr.K ? [pr.K] : []))].sort((a, b) => a - b).map(K => `<option ${K === pr.K ? 'selected' : ''}>${K}</option>`).join('')}</select></label>` : ''}
        <label>Quantidade (+ compra / − venda)<input id="tkQ" class="dk-in" type="number" step="10000" value="${qty}"></label></div>
        <div class="dk-q mono">${esc(label(D, ticket.key))} · <span class="up">${f2(q.bid)}</span> / <span class="down">${f2(q.ask)}</span>${isOpt ? ` · IV ${Q.fmt(q.iv * 100, 1)} · Δ ${Q.fmt(q.delta, 2)}` : ''}</div>
        <div class="muted" style="font-size:12.5px">Execução a mercado: ${qty > 0 ? 'compra no ask' : qty < 0 ? 'venda no bid' : '—'} ${qty ? '· total ' + money(qty * px) : ''} · muda o livro em Δ ${money(qty * q.delta * S0)}${isOpt ? `, vega ${money(qty * q.vega / 100)}/pt, Γ1% ${money(qty * q.gamma * S0 * S0 / 100)}` : ''}</div>
        <div class="row" style="margin-top:8px;gap:6px"><button class="btn pri sm" id="tkGo" ${qty ? '' : 'disabled'}>${qty >= 0 ? 'Comprar' : 'Vender'} ${f0(Math.abs(qty))}</button>
        <button class="btn sm" id="tkHedge" title="Zera o delta de ${u} negociando a ação">Hedgear delta de ${u}</button>
        <button class="btn sm ghost" id="tkHedgeAll" title="Zera o delta de todos os ativos">Hedgear tudo</button></div>`;
      const rk = () => { const t = el.querySelector('#tkT').value, uu = el.querySelector('#tkU').value; if (t === 'S') return okey(uu, 'S'); const e = el.querySelector('#tkE'), k = el.querySelector('#tkK'); const eid = e ? +e.value : D.exps[D.sel.e].id; const K = k && uu === u ? +k.value : strikeRound(uu, D.und[uu].S); return okey(uu, t, eid, K); };
      ['#tkU', '#tkT', '#tkE', '#tkK'].forEach(s => { const x = el.querySelector(s); if (x) x.onchange = () => { ticket.key = rk(); drawTicket(); }; });
      el.querySelector('#tkQ').onchange = e => { ticket.qty = Math.round(+e.target.value || 0); drawTicket(); };
      el.querySelector('#tkGo').onclick = () => { const q2 = quote(D, ticket.key); exec(D, ticket.key, ticket.qty, ticket.qty > 0 ? q2.ask : q2.bid, 'tela'); Sound.play('click'); save(); draw(); drawTicket(); };
      const hedge = uu => { const b = book(D).byU[uu]; if (!b || Math.abs(b.dSh) < 50) return false; const n = -Math.round(b.dSh / 100) * 100; if (!n) return false; const q2 = quote(D, okey(uu, 'S')); exec(D, okey(uu, 'S'), n, n > 0 ? q2.ask : q2.bid, 'hedge'); return true; };
      el.querySelector('#tkHedge').onclick = () => { if (hedge(u)) { Sound.play('click'); toast(`Delta de ${u} zerado.`); } else toast('Delta já está praticamente zerado.'); save(); draw(); };
      el.querySelector('#tkHedgeAll').onclick = () => { let n = 0; UIDS.forEach(x => { if (hedge(x)) n++; }); toast(n ? `Delta zerado em ${n} ativo(s).` : 'Deltas já zerados.'); save(); draw(); };
    }
    function drawBook() {
      const b = book(D), el = $('#dkBook');
      if (bookTab === 0) {
        el.innerHTML = b.rows.length ? `<div style="overflow-x:auto"><table class="tbl dk-tbl"><tr><th>Instrumento</th><th>Qtd</th><th>Preço médio</th><th>Mid</th><th>PnL aberto</th><th>Δ (ações)</th><th>Δ R$</th><th>Γ 1% (R$ Δ)</th><th>Vega R$/pt</th><th>Θ R$/dia</th><th></th></tr>` +
          b.rows.map(r => `<tr><td>${esc(label(D, r.key))}</td><td class="mono ${r.qty > 0 ? 'up' : 'down'}">${sgn(r.qty)}</td><td class="mono">${f2(r.avg)}</td><td class="mono">${f2(r.mid)}</td><td class="mono ${r.pnl >= 0 ? 'up' : 'down'}">${money(r.pnl)}</td><td class="mono">${sgn(r.dSh)}</td><td class="mono">${money(r.dR)}</td><td class="mono">${money(r.g1)}</td><td class="mono">${money(r.vega)}</td><td class="mono">${money(r.th)}</td><td><button class="btn sm ghost" data-close="${r.key}">zerar</button></td></tr>`).join('') +
          `<tr class="tot"><td><b>Total</b></td><td></td><td></td><td></td><td class="mono"><b>${money(b.rows.reduce((a, r) => a + r.pnl, 0))}</b></td><td></td><td class="mono"><b>${money(b.tot.dR)}</b></td><td class="mono"><b>${money(b.tot.g1)}</b></td><td class="mono"><b>${money(b.tot.vega)}</b></td><td class="mono"><b>${money(b.tot.th)}</b></td><td></td></tr></table></div>` : '<p class="muted">Livro vazio. Monte posições pela boleta (clique num preço da grade) ou responda aos RFQs de clientes.</p>';
        el.querySelectorAll('[data-close]').forEach(bt => bt.onclick = () => { const k = bt.dataset.close, p = D.pos[k]; if (!p) return; const q = quote(D, k); exec(D, k, -p.qty, p.qty > 0 ? q.bid : q.ask, 'zerar'); save(); draw(); });
      } else if (bookTab === 1) {
        const us = Object.keys(b.byU);
        el.innerHTML = `<div class="grid2" style="gap:14px"><div><div class="dk-h">POR ATIVO</div><table class="tbl dk-tbl"><tr><th>Ativo</th><th>Δ ações</th><th>Δ R$</th><th>Γ 1%</th><th>Vega/pt</th><th>Θ/dia</th><th>PnL aberto</th></tr>${us.map(u => { const x = b.byU[u]; return `<tr><td><b>${u}</b></td><td class="mono">${sgn(x.dSh)}</td><td class="mono">${money(x.dR)}</td><td class="mono">${money(x.g1)}</td><td class="mono">${money(x.vega)}</td><td class="mono">${money(x.th)}</td><td class="mono ${x.pnl >= 0 ? 'up' : 'down'}">${money(x.pnl)}</td></tr>`; }).join('')}<tr class="tot"><td><b>Total</b></td><td></td><td class="mono"><b>${money(b.tot.dR)}</b></td><td class="mono"><b>${money(b.tot.g1)}</b></td><td class="mono"><b>${money(b.tot.vega)}</b></td><td class="mono"><b>${money(b.tot.th)}</b></td><td></td></tr></table>
          <p class="muted" style="font-size:12.5px">Delta beta-ajustado (em termos do índice): <b>${money(us.reduce((a, u) => a + b.byU[u].dR * U0[u].beta, 0))}</b> — é o que um hedge com o ETF de índice neutralizaria.</p></div>
          <div><div class="dk-h">VEGA POR VENCIMENTO (R$/pt)</div><table class="tbl dk-tbl"><tr><th>Ativo</th>${D.exps.map(x => `<th>V${x.id} (${x.dte}d)</th>`).join('')}<th>Total</th></tr>${UIDS.map(u => `<tr><td><b>${u}</b></td>${D.exps.map(x => { const v = b.byE[u + '|' + x.id] || 0; return `<td class="mono ${v > 0 ? 'up' : v < 0 ? 'down' : 'muted'}">${v ? money(v) : '—'}</td>`; }).join('')}<td class="mono">${money(D.exps.reduce((a, x) => a + (b.byE[u + '|' + x.id] || 0), 0))}</td></tr>`).join('')}</table>
          <p class="muted" style="font-size:12.5px">Vega ponderada (√(63/dias)): <b>${money(Object.keys(b.byE).reduce((a, k) => { const ex = expById(D, +k.split('|')[1]); return a + b.byE[k] * Math.sqrt(63 / Math.max(1, ex ? ex.dte : 63)); }, 0))}</b>/pt — vencimentos curtos mexem mais.</p>
          <div class="dk-h" style="margin-top:8px">UTILIZAÇÃO DE LIMITES</div>${[['Delta', b.tot.dR, LIM.delta], ['Gamma 1%', b.tot.g1, LIM.gamma], ['Vega', b.tot.vega, LIM.vega]].map(([n, v, l]) => { const u2 = Math.abs(v) / l; return `<div class="dk-lim"><span>${n}</span><div><i class="${u2 > 1 ? 'bad' : u2 > 0.8 ? 'warn' : ''}" style="width:${Math.min(100, u2 * 100)}%"></i></div><b>${Q.fmt(u2 * 100, 0)}%</b></div>`; }).join('')}</div></div>`;
      } else if (bookTab === 2) {
        const st = stress(D), worst = Math.min(...st.flat());
        el.innerHTML = `<div class="dk-h">STRESS — PnL instantâneo (reavaliação completa). Linhas: choque de vol; colunas: choque no índice (ações via beta).</div><table class="tbl dk-tbl dk-stress"><tr><th>vol \\ spot</th>${SH.map(s => `<th>${sgn(s * 100, 0)}%</th>`).join('')}</tr>${VSH.map((dv, i) => `<tr><td><b>${sgn(dv, 0)} pts</b></td>${st[i].map(v => `<td class="mono ${v >= 0 ? 'up' : 'down'} ${v === worst ? 'worst' : ''}" style="background:${v < 0 ? `rgba(255,92,138,${Math.min(0.45, -v / 4e6)})` : `rgba(38,208,124,${Math.min(0.35, v / 4e6)})`}">${money(v)}</td>`).join('')}</tr>`).join('')}</table>
          <p class="muted" style="font-size:12.5px">Pior cenário: <b class="${worst < LIM.stress ? 'down' : ''}">${money(worst)}</b> (limite ${money(LIM.stress)}). Em quedas, a vol sobe 30% a mais (spot-vol). Short gamma perde nas pontas; short vega perde nas linhas de baixo.</p>`;
      } else if (bookTab === 3) {
        el.innerHTML = D.trades.length ? `<div style="max-height:320px;overflow:auto"><table class="tbl dk-tbl"><tr><th>Dia</th><th>Hora</th><th>Instrumento</th><th>Qtd</th><th>Preço</th><th>Origem</th></tr>${D.trades.slice(0, 120).map(t => `<tr><td>${t.d}</td><td class="mono">${t.t}</td><td>${esc(label(D, t.key))}</td><td class="mono ${t.qty > 0 ? 'up' : 'down'}">${sgn(t.qty)}</td><td class="mono">${f2(t.px)}</td><td class="muted">${esc(t.src)}</td></tr>`).join('')}</table></div>` : '<p class="muted">Nenhum negócio ainda.</p>';
      } else if (bookTab === 4) {
        const e = explain(D);
        el.innerHTML = `<div class="grid2" style="gap:14px"><div class="pp" id="dkPnl"></div><div><div class="dk-h">PnL EXPLAIN (até agora)</div><table class="tbl dk-tbl">${[['Delta', e.delta], ['Gamma', e.gamma], ['Vega', e.vega], ['Theta', e.theta], ['Negócios do dia', e.novos], ['Resíduo', e.resid], ['Total', e.total]].map(([k, v]) => `<tr><td>${k}</td><td class="mono ${v >= 0 ? 'up' : 'down'}" style="text-align:right">${money(v)}</td></tr>`).join('')}</table><p class="muted" style="font-size:12.5px">Posições do início do dia explicadas por gregas (Δ·δS, ½Γ·δS², vega·δσ, θ·tempo); negócios novos medidos contra o mid atual.</p></div></div>`;
        Plot.line($('#dkPnl'), { series: [{ x: D.intraday.map(p => p.t), y: D.intraday.map(p => p.pnl), label: 'PnL do dia', color: '#f5a623', fill: 'rgba(245,166,35,.12)' }], xName: 'turno', xMin: 0, xMax: TPD, xFmt: t => clock(Math.round(t)), yFmt: v => Q.fmt(v / 1000, 0) + 'k', height: 220 });
      } else {
        const ds = D.pnlDays; let acc = 0; const cum = ds.map(d => (acc += d.pnl));
        const mean = ds.length ? ds.reduce((a, d) => a + d.pnl, 0) / ds.length : 0, sd = ds.length > 1 ? Math.sqrt(ds.reduce((a, d) => a + (d.pnl - mean) ** 2, 0) / (ds.length - 1)) : 0;
        el.innerHTML = `<div class="wx-stats"><div><span>Dias</span><b>${ds.length}</b></div><div><span>No verde</span><b>${D.stats.green}</b></div><div><span>Sharpe (anualizado)</span><b>${sd > 0 ? Q.fmt(mean / sd * Math.sqrt(252), 2) : '—'}</b></div><div><span>Melhor dia</span><b class="up">${money(D.stats.bestDay)}</b></div><div><span>RFQs ganhos</span><b>${D.stats.rfqWon}/${D.stats.rfqTot}</b></div><div><span>Dias limpos (verde, sem limite)</span><b>${D.stats.clean}</b></div></div><div class="pp" id="dkHist"></div>`;
        if (ds.length) Plot.line($('#dkHist'), { series: [{ x: ds.map(d => d.d), y: cum, label: 'PnL acumulado', color: '#26d07c' }], points: ds.map((d, i) => ({ x: d.d, y: cum[i], color: d.pnl >= 0 ? '#26d07c' : '#ff5c8a' })), xName: 'dia', yFmt: v => Q.fmt(v / 1000, 0) + 'k', height: 220 });
        else $('#dkHist').innerHTML = '<p class="muted">Feche o primeiro dia para ver o histórico.</p>';
      }
    }
    function draw() { kpis(); market(); news(); rfq(); drawBook(); if (D.breaches && D.breaches.length && running) root.querySelector('.dk-kpis').classList.add('alarm'); else root.querySelector('.dk-kpis').classList.remove('alarm'); }
    draw(); drawTicket();
  }

  function intro(root) {
    root.innerHTML = `<div class="desk"><h1>Mesa — você é o Head Trader</h1>
      <p class="sub">Um mercado fictício que não para: três ativos correlacionados (duas ações e um ETF de índice), vol que muda com o spot, notícias que geram saltos, clientes pedindo preço. Você gere o livro: vê posições e gregas agrupadas, faz stress, hedgeia, cota RFQs e responde pelo PnL no fechamento.</p>
      <div class="grid g2" style="margin-top:14px">
        <div class="card"><h3>Como funciona</h3><ul style="font-size:14px">
          <li>Um dia = 28 turnos de 15 minutos (10h–17h). Rode em tempo "real" ou pule para o fechamento.</li>
          <li><b>Boleta</b>: compre no ask e venda no bid (ações/ETF, calls e puts em 3 vencimentos que rolam).</li>
          <li><b>Eventos corporativos</b>: datas ex de dividendos derrubam a ação e ajustam os strikes das opções do livro (regra B3); suas ações recebem ou pagam o provento.</li>
          <li><b>RFQs</b>: o sales traz clientes; você cota em vol. Ganhe o negócio com edge — e hedgeie o risco que entrou.</li>
          <li><b>Limites</b>: delta R$ 5 mi, gamma 1% R$ 2 mi, vega R$ 25 mil/pt, pior stress R$ −3 mi, stop diário R$ −1,5 mi.</li>
          <li><b>Fechamento</b>: PnL explain (delta, gamma, vega, theta, negócios), liquidação dos vencimentos, nota do dia e XP.</li></ul></div>
        <div class="card"><h3>Começar</h3><p class="muted" style="font-size:14px">Livro vazio para montar do zero, ou herde o livro do head anterior (vendido em puts de ACME, calendar em BOVX11, hedges desatualizados) e arrume a casa.</p>
          <div class="row" style="gap:8px;margin-top:10px"><button class="btn pri" id="dkNew1">Herdar o livro</button><button class="btn" id="dkNew0">Livro vazio</button></div></div></div></div>`;
    root.querySelector('#dkNew1').onclick = () => { S().desk = fresh(1 + Math.floor(Math.random() * 1e9), true); Store.save(true); view(root); };
    root.querySelector('#dkNew0').onclick = () => { S().desk = fresh(1 + Math.floor(Math.random() * 1e9), false); Store.save(true); view(root); };
  }
  function checkDeskBadges() { Store.checkBadges(); }

  global.Desk = { view, fresh, step, endDay, book, stress, quote, explain, exDividend, U0, LIM, TPD };
})(window);
