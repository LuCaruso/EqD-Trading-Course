/* =========================================================================
   Q — biblioteca quantitativa do EqD Trading Academy
   Black-Scholes(-Merton), gregas, vol implícita, binomial CRR, barreiras
   (Reiner-Rubinstein / Haug), digitais, Black-76, Monte Carlo, helpers de
   juros brasileiros (DI, 252 du).  Convenção: taxas contínuas anuais,
   T em anos, sigma anual (0.25 = 25%).
   ========================================================================= */
(function (global) {
  'use strict';
  const SQ2PI = Math.sqrt(2 * Math.PI);

  function pdf(x) { return Math.exp(-0.5 * x * x) / SQ2PI; }

  // N(x) — algoritmo de Hart (1968), precisão ~1e-14 (versão de G. West)
  function cdf(x) {
    const XAbs = Math.abs(x);
    let c;
    if (XAbs > 37) c = 0;
    else {
      const e = Math.exp(-XAbs * XAbs / 2);
      if (XAbs < 7.07106781186547) {
        let b = 3.52624965998911e-02 * XAbs + 0.700383064443688;
        b = b * XAbs + 6.37396220353165; b = b * XAbs + 33.912866078383;
        b = b * XAbs + 112.079291497871; b = b * XAbs + 221.213596169931;
        b = b * XAbs + 220.206867912376;
        c = e * b;
        b = 8.83883476483184e-02 * XAbs + 1.75566716318264;
        b = b * XAbs + 16.064177579207; b = b * XAbs + 86.7807322029461;
        b = b * XAbs + 296.564248779674; b = b * XAbs + 637.333633378831;
        b = b * XAbs + 793.826512519948; b = b * XAbs + 440.413735824752;
        c = c / b;
      } else {
        let b = XAbs + 0.65; b = XAbs + 4 / b; b = XAbs + 3 / b; b = XAbs + 2 / b; b = XAbs + 1 / b;
        c = e / b / 2.506628274631;
      }
    }
    return x > 0 ? 1 - c : c;
  }

  // inversa de N (Acklam) — para quantis
  function invCdf(p) {
    const a = [-3.969683028665376e+01, 2.209460984245205e+02, -2.759285104469687e+02, 1.383577518672690e+02, -3.066479806614716e+01, 2.506628277459239e+00];
    const b = [-5.447609879822406e+01, 1.615858368580409e+02, -1.556989798598866e+02, 6.680131188771972e+01, -1.328068155288572e+01];
    const c = [-7.784894002430293e-03, -3.223964580411365e-01, -2.400758277161838e+00, -2.549732539343734e+00, 4.374664141464968e+00, 2.938163982698783e+00];
    const d = [7.784695709041462e-03, 3.224671290700398e-01, 2.445134137142996e+00, 3.754408661907416e+00];
    const pl = 0.02425;
    let q, r;
    if (p < pl) { q = Math.sqrt(-2 * Math.log(p)); return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1); }
    if (p > 1 - pl) { q = Math.sqrt(-2 * Math.log(1 - p)); return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1); }
    q = p - 0.5; r = q * q;
    return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
  }

  /* ---------------- Black-Scholes-Merton ----------------
     type: 'call' | 'put'.  q = dividend yield (ou r_f para FX).
     Retorna preço e gregas em unidades "cruas":
       delta, gamma (por 1 unidade de S), vega (por 1.00 de vol → divida por 100 p/ 1 vol pt),
       theta (por ano → /365 ou /252), rho (por 1.00 de r), vanna (dDelta/dσ), volga (dVega/dσ),
       charm (dDelta/dt por ano, sinal de passagem do tempo). */
  function bs(type, S, K, T, r, q, sigma) {
    q = q || 0;
    const isCall = type === 'call' || type === 'c' || type === 'C';
    if (T <= 1e-10 || sigma <= 1e-10) {
      const F = S * Math.exp((r - q) * Math.max(T, 0)), df = Math.exp(-r * Math.max(T, 0));
      const intr = isCall ? Math.max(F - K, 0) * df : Math.max(K - F, 0) * df;
      const itm = isCall ? F > K : F < K;
      return { price: intr, delta: itm ? (isCall ? 1 : -1) * Math.exp(-q * Math.max(T, 0)) : 0, gamma: 0, vega: 0, theta: 0, rho: 0, vanna: 0, volga: 0, charm: 0, d1: NaN, d2: NaN, nd1: itm ? 1 : 0, nd2: itm ? 1 : 0 };
    }
    const sq = Math.sqrt(T), vs = sigma * sq;
    const d1 = (Math.log(S / K) + (r - q + 0.5 * sigma * sigma) * T) / vs;
    const d2 = d1 - vs;
    const dq = Math.exp(-q * T), dr = Math.exp(-r * T);
    const n1 = pdf(d1);
    let price, delta, theta, rho, charm;
    const gamma = dq * n1 / (S * vs);
    const vega = S * dq * n1 * sq;
    if (isCall) {
      price = S * dq * cdf(d1) - K * dr * cdf(d2);
      delta = dq * cdf(d1);
      theta = -S * dq * n1 * sigma / (2 * sq) - r * K * dr * cdf(d2) + q * S * dq * cdf(d1);
      rho = K * T * dr * cdf(d2);
      charm = q * dq * cdf(d1) - dq * n1 * (2 * (r - q) * T - d2 * vs) / (2 * T * vs);
    } else {
      price = K * dr * cdf(-d2) - S * dq * cdf(-d1);
      delta = -dq * cdf(-d1);
      theta = -S * dq * n1 * sigma / (2 * sq) + r * K * dr * cdf(-d2) - q * S * dq * cdf(-d1);
      rho = -K * T * dr * cdf(-d2);
      charm = -q * dq * cdf(-d1) - dq * n1 * (2 * (r - q) * T - d2 * vs) / (2 * T * vs);
    }
    const vanna = -dq * n1 * d2 / sigma;
    const volga = vega * d1 * d2 / sigma;
    return { price, delta, gamma, vega, theta, rho, vanna, volga, charm, d1, d2, nd1: cdf(d1), nd2: cdf(d2) };
  }
  const bsPrice = (type, S, K, T, r, q, s) => bs(type, S, K, T, r, q, s).price;

  function impliedVol(type, price, S, K, T, r, q) {
    q = q || 0;
    const lo0 = bsPrice(type, S, K, T, r, q, 1e-4), hi0 = bsPrice(type, S, K, T, r, q, 5);
    if (price <= lo0 + 1e-12 || price >= hi0) return NaN;
    let lo = 1e-4, hi = 5, s = 0.3;
    for (let i = 0; i < 100; i++) {
      const g = bs(type, S, K, T, r, q, s);
      const diff = g.price - price;
      if (Math.abs(diff) < 1e-10) return s;
      if (diff > 0) hi = s; else lo = s;
      let ns = g.vega > 1e-8 ? s - diff / g.vega : NaN;
      if (!(ns > lo && ns < hi)) ns = 0.5 * (lo + hi);
      s = ns;
    }
    return s;
  }

  // Black-76 (opções sobre futuro / forward)
  function black76(type, F, K, T, r, sigma) {
    const g = bs(type, F, K, T, r, r, sigma); // q = r ⇒ S e^{-qT} = F e^{-rT}
    return g;
  }

  // Digitais
  function digital(kind, type, S, K, T, r, q, sigma, cash) {
    cash = cash == null ? 1 : cash;
    const isCall = type === 'call';
    if (T <= 1e-10) {
      const itm = isCall ? S > K : S < K;
      return itm ? (kind === 'cash' ? cash : S) : 0;
    }
    const vs = sigma * Math.sqrt(T);
    const d1 = (Math.log(S / K) + (r - q + 0.5 * sigma * sigma) * T) / vs, d2 = d1 - vs;
    if (kind === 'cash') return cash * Math.exp(-r * T) * cdf(isCall ? d2 : -d2);
    return S * Math.exp(-q * T) * cdf(isCall ? d1 : -d1);
  }

  /* ---------------- Binomial CRR ---------------- */
  function binomial(type, S, K, T, r, q, sigma, N, american, keepTree) {
    q = q || 0; N = Math.max(1, Math.round(N));
    const dt = T / N, u = Math.exp(sigma * Math.sqrt(dt)), d = 1 / u;
    const p = (Math.exp((r - q) * dt) - d) / (u - d), disc = Math.exp(-r * dt);
    const isCall = type === 'call';
    const pay = s => isCall ? Math.max(s - K, 0) : Math.max(K - s, 0);
    let V = new Array(N + 1);
    for (let j = 0; j <= N; j++) V[j] = pay(S * Math.pow(u, j) * Math.pow(d, N - j));
    const tree = keepTree ? [V.slice()] : null;
    const exTree = keepTree ? [V.map(() => false)] : null;
    for (let i = N - 1; i >= 0; i--) {
      const nv = new Array(i + 1), ex = new Array(i + 1);
      for (let j = 0; j <= i; j++) {
        let cont = disc * (p * V[j + 1] + (1 - p) * V[j]);
        ex[j] = false;
        if (american) { const e = pay(S * Math.pow(u, j) * Math.pow(d, i - j)); if (e > cont + 1e-12) { cont = e; ex[j] = true; } }
        nv[j] = cont;
      }
      V = nv;
      if (keepTree) { tree.unshift(V.slice()); exTree.unshift(ex); }
    }
    return { price: V[0], u, d, p, dt, tree, exTree };
  }

  /* ---------------- Barreiras (Haug, "Complete Guide", Reiner-Rubinstein) ----------------
     kind: 'cdi','cui','pdi','pui' (knock-in), 'cdo','cuo','pdo','puo' (knock-out).
     Monitoramento contínuo. rebate: in → pago no vencimento se nunca tocou; out → pago ao tocar. */
  function barrier(kind, S, X, H, T, r, q, sigma, rebate) {
    rebate = rebate || 0; q = q || 0;
    const isCall = kind[0] === 'c', down = kind[1] === 'd', isIn = kind[2] === 'i';
    // já cruzou a barreira?
    const crossed = down ? S <= H : S >= H;
    if (crossed) {
      if (isIn) return bsPrice(isCall ? 'call' : 'put', S, X, T, r, q, sigma);
      return rebate; // out: nocauteada, rebate imediato
    }
    if (T <= 1e-10) {
      const pay = isCall ? Math.max(S - X, 0) : Math.max(X - S, 0);
      return isIn ? rebate : pay;
    }
    const b = r - q, v = sigma, sT = v * Math.sqrt(T);
    const mu = (b - v * v / 2) / (v * v);
    const lam = Math.sqrt(mu * mu + 2 * r / (v * v));
    const x1 = Math.log(S / X) / sT + (1 + mu) * sT;
    const x2 = Math.log(S / H) / sT + (1 + mu) * sT;
    const y1 = Math.log(H * H / (S * X)) / sT + (1 + mu) * sT;
    const y2 = Math.log(H / S) / sT + (1 + mu) * sT;
    const z = Math.log(H / S) / sT + lam * sT;
    const eta = down ? 1 : -1, phi = isCall ? 1 : -1;
    const ebr = Math.exp((b - r) * T), er = Math.exp(-r * T), HS = H / S;
    const A = phi * S * ebr * cdf(phi * x1) - phi * X * er * cdf(phi * x1 - phi * sT);
    const B = phi * S * ebr * cdf(phi * x2) - phi * X * er * cdf(phi * x2 - phi * sT);
    const C = phi * S * ebr * Math.pow(HS, 2 * (mu + 1)) * cdf(eta * y1) - phi * X * er * Math.pow(HS, 2 * mu) * cdf(eta * y1 - eta * sT);
    const D = phi * S * ebr * Math.pow(HS, 2 * (mu + 1)) * cdf(eta * y2) - phi * X * er * Math.pow(HS, 2 * mu) * cdf(eta * y2 - eta * sT);
    const E = rebate * er * (cdf(eta * x2 - eta * sT) - Math.pow(HS, 2 * mu) * cdf(eta * y2 - eta * sT));
    const F = rebate * (Math.pow(HS, mu + lam) * cdf(eta * z) + Math.pow(HS, mu - lam) * cdf(eta * z - 2 * eta * lam * sT));
    const XgtH = X > H;
    switch (kind) {
      case 'cdi': return XgtH ? C + E : A - B + D + E;
      case 'cui': return XgtH ? A + E : B - C + D + E;
      case 'pdi': return XgtH ? B - C + D + E : A + E;
      case 'pui': return XgtH ? A - B + D + E : C + E;
      case 'cdo': return XgtH ? A - C + F : B - D + F;
      case 'cuo': return XgtH ? F : A - B + C - D + F;
      case 'pdo': return XgtH ? A - B + C - D + F : F;
      case 'puo': return XgtH ? B - D + F : A - C + F;
    }
    return NaN;
  }

  // Gregas por diferenças finitas para qualquer pricer f(S, T, sigma)
  function fdGreeks(f, S, T, sigma, opts) {
    opts = opts || {};
    const hS = opts.hS || S * 0.005, hv = 0.005, ht = Math.min(1 / 365, T / 2);
    const p0 = f(S, T, sigma), pu = f(S + hS, T, sigma), pd = f(S - hS, T, sigma);
    const delta = (pu - pd) / (2 * hS), gamma = (pu - 2 * p0 + pd) / (hS * hS);
    const vega = (f(S, T, sigma + hv) - f(S, T, sigma - hv)) / (2 * hv);
    const theta = T > 2 * ht ? (f(S, T - ht, sigma) - p0) / ht : 0; // por ano
    return { price: p0, delta, gamma, vega, theta };
  }

  /* ---------------- Aleatoriedade / Monte Carlo ---------------- */
  function rng(seed) {
    let a = (seed >>> 0) || 1;
    const uni = function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      let t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
    let spare = null;
    uni.normal = function () {
      if (spare !== null) { const s = spare; spare = null; return s; }
      let u, v, s;
      do { u = uni() * 2 - 1; v = uni() * 2 - 1; s = u * u + v * v; } while (s >= 1 || s === 0);
      const m = Math.sqrt(-2 * Math.log(s) / s);
      spare = v * m; return u * m;
    };
    return uni;
  }

  function gbmPath(S0, mu, sigma, T, steps, R) {
    const dt = T / steps, out = new Float64Array(steps + 1);
    out[0] = S0;
    const drift = (mu - 0.5 * sigma * sigma) * dt, vol = sigma * Math.sqrt(dt);
    for (let i = 1; i <= steps; i++) out[i] = out[i - 1] * Math.exp(drift + vol * R.normal());
    return out;
  }

  function mcBarrier(kind, S, X, H, T, r, q, sigma, rebate, nPaths, steps, seed) {
    const R = rng(seed || 7); rebate = rebate || 0;
    const isCall = kind[0] === 'c', down = kind[1] === 'd', isIn = kind[2] === 'i';
    const dt = T / steps, drift = (r - q - 0.5 * sigma * sigma) * dt, vol = sigma * Math.sqrt(dt);
    let sum = 0, sum2 = 0; const disc = Math.exp(-r * T);
    for (let p = 0; p < nPaths; p++) {
      let s = S, hit = down ? s <= H : s >= H, hitStep = hit ? 0 : -1;
      for (let i = 1; i <= steps; i++) {
        s *= Math.exp(drift + vol * R.normal());
        if (!hit && (down ? s <= H : s >= H)) { hit = true; hitStep = i; }
      }
      const pay = isCall ? Math.max(s - X, 0) : Math.max(X - s, 0);
      let v;
      if (isIn) v = hit ? pay * disc : rebate * disc;
      else v = hit ? rebate * Math.exp(-r * hitStep * dt) : pay * disc;
      sum += v; sum2 += v * v;
    }
    const m = sum / nPaths, se = Math.sqrt(Math.max(sum2 / nPaths - m * m, 0) / nPaths);
    return { price: m, se };
  }

  /* ---------------- Juros brasileiros ---------------- */
  const BR = {
    // taxa exponencial 252 (ex.: 0.1075) → contínua
    toCont: taxa => Math.log(1 + taxa),
    fromCont: rc => Math.exp(rc) - 1,
    fator: (taxa, du) => Math.pow(1 + taxa, du / 252),
    puDI: (taxa, du) => 100000 / Math.pow(1 + taxa, du / 252),
    taxaFromPU: (pu, du) => Math.pow(100000 / pu, 252 / du) - 1,
    // DV01 de um DI1 (variação do PU por 1bp), sinal positivo
    dv01DI: (taxa, du) => (100000 / Math.pow(1 + taxa, du / 252)) - (100000 / Math.pow(1 + taxa + 0.0001, du / 252))
  };

  /* ---------------- Superfície de vol simples ----------------
     σ(K,T) = atm(T) + skew·x + curv·x², x = ln(K/F)/√T
     atm(T) = atmLong + (atmShort − atmLong)·e^{−T/τ} */
  function volSurface(p) {
    const P = Object.assign({ atmShort: 0.25, atmLong: 0.22, tau: 0.5, skew: -0.04, curv: 0.01, floor: 0.02 }, p || {});
    const atm = T => P.atmLong + (P.atmShort - P.atmLong) * Math.exp(-T / P.tau);
    return {
      params: P, atm,
      vol: (K, F, T) => { const x = Math.log(K / F) / Math.sqrt(Math.max(T, 1e-4)); return Math.max(P.floor, atm(T) + P.skew * x + P.curv * x * x); }
    };
  }

  /* ---------------- Utilidades de formato / parsing ---------------- */
  function fmt(x, dec, opts) {
    if (x == null || !isFinite(x)) return '—';
    dec = dec == null ? 2 : dec;
    return x.toLocaleString('pt-BR', { minimumFractionDigits: dec, maximumFractionDigits: dec, ...(opts || {}) });
  }
  function pct(x, dec) { return fmt(x * 100, dec == null ? 2 : dec) + '%'; }
  function parseNum(str) {
    if (str == null) return NaN;
    let s = String(str).trim().replace(/\s/g, '').replace(/[R$US%]/g, '');
    if (!s) return NaN;
    let mult = 1;
    if (/[kK]$/.test(s)) { mult = 1e3; s = s.slice(0, -1); }
    else if (/(mm|MM|M)$/.test(s)) { mult = 1e6; s = s.replace(/(mm|MM|M)$/, ''); }
    const lastDot = s.lastIndexOf('.'), lastCom = s.lastIndexOf(',');
    if (lastDot >= 0 && lastCom >= 0) {
      if (lastCom > lastDot) s = s.replace(/\./g, '').replace(',', '.');
      else s = s.replace(/,/g, '');
    } else if (lastCom >= 0) {
      s = (s.match(/,/g).length > 1) ? s.replace(/,/g, '') : s.replace(',', '.');
    } else if ((s.match(/\./g) || []).length > 1) {
      s = s.replace(/\./g, '');
    }
    const v = Number(s);
    return isFinite(v) ? v * mult : NaN;
  }

  // Interpretações possíveis (ex.: "1.500" pode ser 1,5 ou 1500 em pt-BR)
  function parseNumCandidates(str) {
    const out = [], a = parseNum(str);
    if (isFinite(a)) out.push(a);
    const t = String(str == null ? '' : str).trim().replace(/\s/g, '').replace(/[R$US%]/g, '');
    if (/^-?\d{1,3}(\.\d{3})+$/.test(t)) { const b = Number(t.replace(/\./g, '')); if (isFinite(b) && b !== a) out.push(b); }
    return out;
  }

  global.Q = { parseNumCandidates, pdf, cdf, invCdf, bs, bsPrice, impliedVol, black76, digital, binomial, barrier, fdGreeks, rng, gbmPath, mcBarrier, BR, volSurface, fmt, pct, parseNum };
})(typeof window !== 'undefined' ? window : globalThis);
