/* Sheet — motor de mini planilha (fórmulas estilo Excel pt-BR)
   Referências A1, intervalos A1:B3, operadores + - * / ^ % e comparações,
   separador de argumentos ";" (vírgula entre dígitos = decimal),
   funções matemáticas e financeiras (Black-Scholes, DI, Black-76...). */
(function (global) {
  'use strict';
  const COLS = 'ABCDEFGHIJ';
  class SErr { constructor(code) { this.code = code; } }
  const err = c => { throw new SErr(c); };

  function colIdx(c) { return COLS.indexOf(c); }
  function refParts(ref) { const m = /^([A-J])(\d{1,3})$/.exec(ref); if (!m) return null; return { c: colIdx(m[1]), r: +m[2] }; }
  function refName(c, r) { return COLS[c] + r; }

  /* ---------- tokenizer ---------- */
  function tokenize(src) {
    const t = []; let i = 0;
    const isD = ch => ch >= '0' && ch <= '9';
    while (i < src.length) {
      const ch = src[i];
      if (ch === ' ' || ch === '\t') { i++; continue; }
      if (isD(ch) || (ch === '.' && isD(src[i + 1]))) {
        let j = i, s = '';
        while (j < src.length && isD(src[j])) s += src[j++];
        if ((src[j] === ',' || src[j] === '.') && isD(src[j + 1])) { s += '.'; j++; while (j < src.length && isD(src[j])) s += src[j++]; }
        if ((src[j] === 'e' || src[j] === 'E') && (isD(src[j + 1]) || ((src[j + 1] === '-' || src[j + 1] === '+') && isD(src[j + 2])))) { s += 'e'; j++; if (src[j] === '-' || src[j] === '+') s += src[j++]; while (j < src.length && isD(src[j])) s += src[j++]; }
        t.push({ k: 'num', v: parseFloat(s) }); i = j; continue;
      }
      if (/[A-Za-z_À-ú]/.test(ch)) {
        let j = i, s = '';
        while (j < src.length && /[A-Za-z0-9_À-ú.]/.test(src[j])) s += src[j++];
        const up = s.toUpperCase();
        if (/^[A-J]\d{1,3}$/.test(up)) {
          if (src[j] === ':') { let k = j + 1, s2 = ''; while (k < src.length && /[A-Za-z0-9]/.test(src[k])) s2 += src[k++]; if (/^[A-J]\d{1,3}$/i.test(s2)) { t.push({ k: 'range', a: up, b: s2.toUpperCase() }); i = k; continue; } }
          t.push({ k: 'ref', v: up }); i = j; continue;
        }
        t.push({ k: 'id', v: up }); i = j; continue;
      }
      if (ch === '"') { let j = i + 1, s = ''; while (j < src.length && src[j] !== '"') s += src[j++]; t.push({ k: 'str', v: s }); i = j + 1; continue; }
      const two = src.substr(i, 2);
      if (two === '<=' || two === '>=' || two === '<>') { t.push({ k: 'op', v: two }); i += 2; continue; }
      if ('+-*/^%()<>=;,'.includes(ch)) { t.push({ k: ch === ',' ? 'op' : 'op', v: ch === ',' ? ';' : ch }); i++; continue; }
      err('#SINTAXE');
    }
    return t;
  }

  /* ---------- parser (AST) ---------- */
  function parse(src) {
    const t = tokenize(src); let p = 0;
    const peek = () => t[p], next = () => t[p++];
    const isOp = v => t[p] && t[p].k === 'op' && t[p].v === v;
    function cmp() { let a = add(); while (t[p] && t[p].k === 'op' && ['<', '>', '<=', '>=', '=', '<>'].includes(t[p].v)) { const o = next().v; a = { k: 'bin', o, a, b: add() }; } return a; }
    function add() { let a = mul(); while (isOp('+') || isOp('-')) { const o = next().v; a = { k: 'bin', o, a, b: mul() }; } return a; }
    function mul() { let a = pow(); while (isOp('*') || isOp('/')) { const o = next().v; a = { k: 'bin', o, a, b: pow() }; } return a; }
    function pow() { let a = un(); while (isOp('^')) { next(); a = { k: 'bin', o: '^', a, b: un() }; } return a; }
    function un() { if (isOp('-')) { next(); return { k: 'neg', a: un() }; } if (isOp('+')) { next(); return un(); } return post(); }
    function post() { let a = prim(); while (isOp('%')) { next(); a = { k: 'bin', o: '/', a, b: { k: 'num', v: 100 } }; } return a; }
    function prim() {
      const x = next(); if (!x) err('#SINTAXE');
      if (x.k === 'num') return { k: 'num', v: x.v };
      if (x.k === 'str') return { k: 'str', v: x.v };
      if (x.k === 'ref') return { k: 'ref', v: x.v };
      if (x.k === 'range') return { k: 'range', a: x.a, b: x.b };
      if (x.k === 'id') {
        if (isOp('(')) {
          next(); const args = [];
          if (!isOp(')')) { args.push(cmp()); while (isOp(';')) { next(); args.push(cmp()); } }
          if (!isOp(')')) err('#SINTAXE'); next();
          return { k: 'fn', n: x.v, args };
        }
        if (x.v === 'PI') return { k: 'num', v: Math.PI };
        if (x.v === 'E') return { k: 'num', v: Math.E };
        if (x.v === 'VERDADEIRO' || x.v === 'TRUE') return { k: 'num', v: 1 };
        if (x.v === 'FALSO' || x.v === 'FALSE') return { k: 'num', v: 0 };
        err('#NOME?');
      }
      if (x.k === 'op' && x.v === '(') { const a = cmp(); if (!isOp(')')) err('#SINTAXE'); next(); return a; }
      err('#SINTAXE');
    }
    const ast = cmp(); if (p < t.length) err('#SINTAXE');
    return ast;
  }

  /* ---------- funções ---------- */
  const flat = args => args.flat(Infinity).filter(v => typeof v === 'number' && isFinite(v));
  const nums = a => { if (Array.isArray(a)) err('#VALOR!'); if (typeof a !== 'number' || !isFinite(a)) err('#VALOR!'); return a; };
  const N = x => nums(x);
  const bsA = (a, typ) => { const [S, K, T, r, v, q] = a.map((x, i) => i === 5 && x == null ? 0 : N(x)); return Q.bs(typ, S, K, T, r, q || 0, v); };
  const FN = {
    SOMA: a => flat(a).reduce((s, x) => s + x, 0), SUM: a => FN.SOMA(a),
    MEDIA: a => { const f = flat(a); if (!f.length) err('#DIV/0!'); return FN.SOMA(f) / f.length; }, AVERAGE: a => FN.MEDIA(a),
    MIN: a => Math.min(...flat(a)), MAX: a => Math.max(...flat(a)),
    CONT: a => flat(a).length, COUNT: a => flat(a).length,
    DESVPAD: a => { const f = flat(a), m = FN.MEDIA(f); if (f.length < 2) err('#DIV/0!'); return Math.sqrt(f.reduce((s, x) => s + (x - m) ** 2, 0) / (f.length - 1)); }, STDEV: a => FN.DESVPAD(a),
    ABS: a => Math.abs(N(a[0])), RAIZ: a => { const x = N(a[0]); if (x < 0) err('#NÚM!'); return Math.sqrt(x); }, SQRT: a => FN.RAIZ(a),
    EXP: a => Math.exp(N(a[0])), LN: a => { const x = N(a[0]); if (x <= 0) err('#NÚM!'); return Math.log(x); },
    LOG: a => Math.log10(N(a[0])), LOG10: a => Math.log10(N(a[0])),
    POTENCIA: a => Math.pow(N(a[0]), N(a[1])), POWER: a => FN.POTENCIA(a),
    ARRED: a => { const d = a[1] == null ? 0 : N(a[1]), m = Math.pow(10, d); return Math.round(N(a[0]) * m) / m; }, ROUND: a => FN.ARRED(a),
    SE: a => (N(a[0]) ? a[1] : (a[2] == null ? 0 : a[2])), IF: a => FN.SE(a),
    NORM: a => Q.cdf(N(a[0])), 'DIST.NORMP.N': a => Q.cdf(N(a[0])), NORMSDIST: a => Q.cdf(N(a[0])),
    NPDF: a => Q.pdf(N(a[0])), NORMINV: a => Q.invCdf(N(a[0])), 'INV.NORMP.N': a => Q.invCdf(N(a[0])),
    BS_CALL: a => bsA(a, 'call').price, BS_PUT: a => bsA(a, 'put').price,
    BS_D1: a => bsA(a, 'call').d1, BS_D2: a => bsA(a, 'call').d2,
    BS_DELTA_C: a => bsA(a, 'call').delta, BS_DELTA_P: a => bsA(a, 'put').delta,
    BS_GAMMA: a => bsA(a, 'call').gamma, BS_VEGA: a => bsA(a, 'call').vega / 100,
    BS_THETA_C: a => bsA(a, 'call').theta, BS_THETA_P: a => bsA(a, 'put').theta,
    IV_CALL: a => { const [px, S, K, T, r, q] = a.map((x, i) => i === 5 && x == null ? 0 : N(x)); const v = Q.impliedVol('call', px, S, K, T, r, q || 0); if (!isFinite(v)) err('#NÚM!'); return v; },
    IV_PUT: a => { const [px, S, K, T, r, q] = a.map((x, i) => i === 5 && x == null ? 0 : N(x)); const v = Q.impliedVol('put', px, S, K, T, r, q || 0); if (!isFinite(v)) err('#NÚM!'); return v; },
    B76_CALL: a => Q.black76('call', N(a[0]), N(a[1]), N(a[2]), N(a[3]), N(a[4])).price,
    B76_PUT: a => Q.black76('put', N(a[0]), N(a[1]), N(a[2]), N(a[3]), N(a[4])).price,
    DIGITAL_C: a => Q.digital('cash', 'call', N(a[0]), N(a[1]), N(a[2]), N(a[3]), a[5] == null ? 0 : N(a[5]), N(a[4]), 1),
    PU_DI: a => Q.BR.puDI(N(a[0]), N(a[1])), FATOR: a => Q.BR.fator(N(a[0]), N(a[1])), CONTINUA: a => Math.log(1 + N(a[0])),
    TAXA_PU: a => Q.BR.taxaFromPU(N(a[0]), N(a[1]))
  };
  const FN_HELP = [
    ['SOMA / MEDIA / MIN / MAX / DESVPAD', 'estatísticas de números ou intervalos (A1:A10)'],
    ['RAIZ, EXP, LN, LOG, POTENCIA, ABS, ARRED(x;casas)', 'matemática'],
    ['NORM(x) · NPDF(x) · NORMINV(p)', 'N(x) acumulada, densidade n(x), inversa'],
    ['BS_CALL(S;K;T;r;vol;q) · BS_PUT(...)', 'Black-Scholes (r e q contínuas, T em anos, vol 0,25)'],
    ['BS_D1 · BS_D2 · BS_DELTA_C · BS_DELTA_P · BS_GAMMA · BS_VEGA · BS_THETA_C · BS_THETA_P', 'mesmos argumentos; vega por 1 ponto, theta por ano'],
    ['IV_CALL(preço;S;K;T;r;q) · IV_PUT(...)', 'vol implícita'],
    ['B76_CALL(F;K;T;r;vol) · B76_PUT(...)', 'Black-76 (sobre futuro/forward)'],
    ['DIGITAL_C(S;K;T;r;vol;q)', 'digital cash-or-nothing que paga 1'],
    ['PU_DI(taxa;du) · FATOR(taxa;du) · CONTINUA(taxa) · TAXA_PU(pu;du)', 'juros brasileiros (exp. 252)'],
    ['SE(cond;a;b), comparações > < = <>', 'condicional']
  ];

  /* ---------- avaliação ---------- */
  function evaluate(cells) {
    const vals = {}, visiting = {}, cache = {};
    function astOf(ref) {
      if (cache[ref] !== undefined) return cache[ref];
      const raw = cells[ref];
      if (raw == null || raw === '') return (cache[ref] = { k: 'empty' });
      const s = String(raw).trim();
      if (s[0] === '=') { try { return (cache[ref] = parse(s.slice(1))); } catch (e) { return (cache[ref] = { k: 'err', v: e instanceof SErr ? e.code : '#ERRO' }); } }
      const n = Q.parseNum(s.replace(/%$/, ''));
      if (isFinite(n) && /^[-+]?[\d.,]+(e[-+]?\d+)?%?$/i.test(s)) return (cache[ref] = { k: 'num', v: /%$/.test(s) ? n / 100 : n });
      return (cache[ref] = { k: 'str', v: s });
    }
    function cellVal(ref) {
      if (vals[ref] !== undefined) { if (vals[ref] instanceof SErr) throw vals[ref]; return vals[ref]; }
      if (!refParts(ref)) err('#REF!');
      if (visiting[ref]) err('#CIRC');
      visiting[ref] = true;
      let v;
      try { v = ev(astOf(ref), true); } catch (e) { v = e instanceof SErr ? e : new SErr('#ERRO'); }
      visiting[ref] = false; vals[ref] = v;
      if (v instanceof SErr) throw v;
      return v;
    }
    function ev(n, top) {
      switch (n.k) {
        case 'empty': return top ? '' : 0;
        case 'num': return n.v;
        case 'str': return n.v;
        case 'err': err(n.v); break;
        case 'ref': { const v = cellVal(n.v); return v === '' ? 0 : v; }
        case 'range': {
          const a = refParts(n.a), b = refParts(n.b); if (!a || !b) err('#REF!');
          const out = [];
          for (let r = Math.min(a.r, b.r); r <= Math.max(a.r, b.r); r++) for (let c = Math.min(a.c, b.c); c <= Math.max(a.c, b.c); c++) { const v = cellVal(refName(c, r)); if (typeof v === 'number') out.push(v); }
          return out;
        }
        case 'neg': return -N(ev(n.a));
        case 'bin': {
          const a = ev(n.a), b = ev(n.b);
          if (['<', '>', '<=', '>=', '=', '<>'].includes(n.o)) { const A = typeof a === 'number' ? a : String(a), B = typeof b === 'number' ? b : String(b); return ({ '<': A < B, '>': A > B, '<=': A <= B, '>=': A >= B, '=': A === B, '<>': A !== B }[n.o]) ? 1 : 0; }
          const x = N(a), y = N(b);
          switch (n.o) { case '+': return x + y; case '-': return x - y; case '*': return x * y; case '/': if (y === 0) err('#DIV/0!'); return x / y; case '^': { const r = Math.pow(x, y); if (!isFinite(r)) err('#NÚM!'); return r; } }
          break;
        }
        case 'fn': {
          const f = FN[n.n]; if (!f) err('#NOME?');
          const args = n.args.map(a => ev(a));
          const r = f(args); if (typeof r === 'number' && !isFinite(r)) err('#NÚM!');
          return r;
        }
      }
      err('#ERRO');
    }
    const out = {};
    Object.keys(cells).forEach(ref => { try { out[ref] = cellVal(ref); } catch (e) { out[ref] = e instanceof SErr ? e : new SErr('#ERRO'); } });
    return out;
  }

  function display(v) {
    if (v instanceof SErr) return { t: v.code, err: true };
    if (typeof v === 'number') {
      const a = Math.abs(v);
      const d = a === 0 ? 0 : a >= 1e6 ? 0 : a >= 1000 ? 2 : a >= 1 ? 4 : 6;
      let s = v.toLocaleString('pt-BR', { maximumFractionDigits: d });
      if (a > 0 && a < 1e-6) s = v.toExponential(3).replace('.', ',');
      return { t: s, num: true };
    }
    return { t: v == null ? '' : String(v) };
  }

  global.Sheet = { COLS, evaluate, display, parse, refParts, refName, FN, FN_HELP };
})(window);
