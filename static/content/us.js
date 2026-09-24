/* ============ MÓDULO US ============ */
(function () {
const R_ = window.REF;

/* ---------------- US1 — Estrutura do mercado ---------------- */
Course.unit('us', {
  id: 'us1', title: 'Estrutura do mercado americano de opções',
  desc: 'OCC, bolsas e NBBO; SPX vs SPY; weeklies e 0DTE; convenções (act/365, SOFR, dividendos discretos, borrow); opções americanas e exercício antecipado; futuros de índice e Black-76.',
  sims: ['bs'], exam: { n: 10, minutes: 20 },
  lessons: [
  {
    id: 'us1-1', title: 'Listed options nos EUA: OCC, SPX, SPY, weeklies e 0DTE', tag: 'us-mercado',
    goal: 'Conhecer a infraestrutura e os principais contratos do mercado listado americano.',
    body: String.raw`
<p>O mercado americano de opções listadas é o maior do mundo. Estrutura:</p>
<ul><li><b>OCC</b> (Options Clearing Corporation): a contraparte central de <i>todas</i> as opções listadas de ações, ETFs e índices, independentemente da bolsa.</li>
<li><b>Várias bolsas</b> (Cboe, Nasdaq, NYSE, MIAX…) listam os mesmos contratos. O melhor preço consolidado é o <b>NBBO</b> (National Best Bid and Offer), divulgado via <b>OPRA</b>.</li>
<li>Multiplicador padrão: <b>100</b>. Preço cotado por ação: uma call a 2,35 custa US$ 235.</li>
<li>Vencimento mensal padrão: <b>3ª sexta-feira</b>. Há weeklies e, no SPX, vencimentos todos os dias úteis.</li></ul>
<h3>SPX vs SPY</h3>
<table><tr><th></th><th>SPX (índice S&amp;P 500)</th><th>SPY (ETF)</th></tr>
<tr><td>Estilo</td><td>Europeia</td><td>Americana</td></tr>
<tr><td>Liquidação</td><td>Financeira (cash)</td><td>Física (entrega de cotas)</td></tr>
<tr><td>Tamanho</td><td>~10× o SPY por contrato</td><td>100 cotas</td></tr>
<tr><td>Fixing</td><td>mensais "AM" (preço de abertura, SOQ); SPXW "PM" (fechamento)</td><td>fechamento</td></tr>
<tr><td>Dividendos</td><td>no forward</td><td>ETF paga trimestral → risco de exercício antecipado de calls</td></tr>
<tr><td>Tributação (EUA)</td><td>Section 1256 (60/40)</td><td>regra comum</td></tr></table>
<h3>0DTE</h3>
<p>Opções com zero dias até o vencimento (<i>zero days to expiry</i>) do SPX viraram uma fatia enorme do volume. São quase "pura gamma": theta e gamma gigantes no dia, vega praticamente irrelevante. Dealers que ficam short gamma em 0DTE podem amplificar movimentos intradiários ao hedgear — tema recorrente de debate sobre microestrutura (Unidade 5).</p>
<h3>Mercado OTC</h3>
<p>Ao lado do listado, bancos negociam opções de balcão (OTC) sob contratos ISDA: prazos longos, exóticas, nocionais grandes. <b>FLEX options</b> permitem customizar strike/vencimento em bolsa com clearing da OCC.</p>`,
    desk: String.raw`"SPX dailies", "0DTE", "AM-settled", "the opening print (SOQ)". "Size in SPX, hedge in ES". "NBBO", "lit vs dark". "Pin at the big strike" em vencimentos com grande open interest.`,
    refs: [R_.hull(9, 'Mechanics of options markets'), R_.hull('9.8', 'The options clearing corporation'), R_.hull('16.1', 'Options on stock indices')],
    ex: [
      { t: 'mcq', q: 'Qual a principal diferença de liquidação entre SPX e SPY?', o: ['SPX é físico; SPY é financeiro', 'SPX é financeiro (europeu); SPY é físico (americano)', 'Ambos físicos', 'Ambos financeiros'], a: 1, e: 'SPX: cash-settled, europeu. SPY: entrega de cotas, americano.' },
      { tag: 'us-mercado', gen: R => { const p = R.f(0.5, 25, 2), n = R.int(1, 200); const a = p * 100 * n; return { q: `Você compra ${n} contratos de call de uma ação americana a US$ ${Q.fmt(p, 2)}. Quanto paga de prêmio total (multiplicador 100)?`, a, tol: 0.0001, unit: 'US$', dec: 2, e: `${n} × ${Q.fmt(p, 2)} × 100 = ${Q.fmt(a, 2)}.` }; } },
      { t: 'mcq', q: 'Em uma opção 0DTE ATM, qual grega é praticamente irrelevante?', o: ['Gamma', 'Theta', 'Vega', 'Delta'], a: 2, e: 'Vega ∝ √T → quase zero; gamma e theta dominam.' },
      { t: 'mcq', q: 'Quem é a contraparte central das opções listadas nos EUA?', o: ['Cboe', 'SEC', 'OCC', 'DTCC'], a: 2, e: 'A OCC compensa todas as opções listadas.' },
      { t: 'tf', q: 'Os vencimentos mensais padrão do SPX são "AM-settled", liquidados com base nos preços de abertura (SOQ) do dia do vencimento.', a: true, e: 'Diferente das SPXW (PM, fechamento).' }
    ],
    cards: [['OCC', 'Clearing central de todas as opções listadas nos EUA.'], ['NBBO', 'Melhor bid/offer consolidado entre as bolsas.'], ['SPX vs SPY', 'SPX: europeia, cash, AM/PM. SPY: americana, física.'], ['0DTE', 'Opção que vence no próprio dia: gamma/theta enormes.']]
  },
  {
    id: 'us1-2', title: 'Convenções US: act/365, SOFR, dividendos discretos e borrow', tag: 'us-conv',
    goal: 'Montar o forward correto de uma ação americana e entender o "implied forward" das opções.',
    body: String.raw`
<p>As convenções americanas diferem das brasileiras:</p>
<ul><li><b>Tempo</b>: vol anualizada em <b>dias corridos</b> (act/365). Muitas mesas usam "tempo de negociação" com pesos menores para fins de semana e feriados, e pesos maiores em datas de eventos.</li>
<li><b>Juros</b>: curva de <b>SOFR</b> (overnight, act/360) para desconto e financiamento. Taxas de 2–5% tornam rho bem menos relevante que no Brasil.</li>
<li><b>Dividendos discretos</b>: ações pagam trimestralmente, e não há ajuste de strike por dividendos ordinários. O forward é</li></ul>
\[ F = \big(S - \textstyle\sum_i D_i e^{-r t_i}\big)\,e^{rT}. \]
<ul><li><b>Borrow (aluguel)</b>: para vender ação a descoberto (necessário no hedge de puts compradas/calls vendidas) paga-se uma taxa de aluguel \(b\). Ela entra como um dividendo extra: \(F = S e^{(r - q - b)T}\). Ações "hard-to-borrow" têm forward muito abaixo do spot — e as puts parecem "caras" se você esquecer do borrow.</li></ul>
<h3>Implied forward e paridade</h3>
<p>Na prática, dividendos futuros são incertos. As mesas extraem o forward das próprias opções pela paridade: \(F = K + e^{rT}(C - P)\) no strike mais líquido. A diferença entre esse forward e \(Se^{rT}\) é o "carry implícito" (dividendos + borrow). Erros aqui aparecem como um falso "skew" entre calls e puts.</p>`,
    desk: String.raw`"What's the implied borrow?" "The name is hard-to-borrow, puts look rich because of the borrow." "Div risk" em opções longas: se a empresa cortar o dividendo, calls sobem, puts caem.`,
    refs: [R_.hull('6.1', 'Day count and quotation conventions'), R_.hull('5.5', 'Known income'), R_.hull('14.12', 'Dividends'), R_.wil(8, 'Simple generalizations (dividends, repo)'), R_.wil(64, 'Advanced dividend modeling')],
    ex: [
      { tag: 'us-conv', gen: R => { const S = R.f(80, 300, 2), D = R.f(0.5, 2, 2), r = R.f(0.03, 0.05, 3), t1 = R.pick([0.1, 0.2]), T = R.pick([0.5, 0.75]); const a = (S - D * Math.exp(-r * t1)) * Math.exp(r * T); return { q: `S = ${Q.fmt(S, 2)}, um dividendo de ${Q.fmt(D, 2)} em ${t1} ano, r = ${F.p(r, 1)} contínua, T = ${T}. Forward?`, a, tol: 0.0003, dec: 3, e: `(S − D·e^{−r·t1})·e^{rT} = (${Q.fmt(S, 2)} − ${Q.fmt(D * Math.exp(-r * t1), 4)})·${Q.fmt(Math.exp(r * T), 5)} = ${Q.fmt(a, 3)}.` }; } },
      { tag: 'us-conv', gen: R => { const K = R.step(90, 110, 5), C = R.f(3, 9, 2), P = R.f(3, 9, 2), r = 0.04, T = 0.5; const a = K + Math.exp(r * T) * (C - P); return { q: `No strike ${K}, call = ${Q.fmt(C, 2)} e put = ${Q.fmt(P, 2)} (europeias), r = 4%, T = 0,5. Qual o forward implícito?`, a, tol: 0.0003, dec: 3, e: `F = K + e^{rT}(C − P) = ${K} + ${Q.fmt(Math.exp(r * T), 5)}×${Q.fmt(C - P, 2)} = ${Q.fmt(a, 3)}.` }; } },
      { tag: 'us-conv', gen: R => { const S = 50, r = 0.045, b = R.f(0.02, 0.4, 3), T = 0.5; const a = S * Math.exp((r - b) * T); return { q: `Ação hard-to-borrow: S = 50, r = 4,5%, borrow de ${F.p(b, 1)} a.a., sem dividendos, T = 0,5. Forward?`, a, tol: 0.0005, dec: 3, e: `S·e^{(r−b)T} = ${Q.fmt(a, 3)}.` }; } },
      { t: 'mcq', q: 'Esquecer um borrow alto ao precificar puts de uma ação hard-to-borrow faz as puts parecerem:', o: ['Baratas', 'Caras (IV da put acima da call)', 'Corretas', 'Sem valor'], a: 1, e: 'O forward real é menor; com o forward errado, a put precisa de IV maior para bater o preço.' }
    ],
    cards: [['Forward com dividendos discretos', '(S − Σ D·e^{−r t_i})·e^{rT}'], ['Implied forward', 'F = K + e^{rT}(C − P)'], ['Borrow', 'Custo de aluguel; entra como dividendo extra no forward.']]
  },
  {
    id: 'us1-3', title: 'Opções americanas e exercício antecipado', tag: 'us-amer',
    goal: 'Saber quando o exercício antecipado é ótimo e como precificar americanas.',
    body: String.raw`
<p>Ações e ETFs nos EUA têm opções <b>americanas</b>. Regras práticas:</p>
<ul><li><b>Calls</b>: só pode valer exercer <b>imediatamente antes de uma data ex-dividendo</b>. Critério (Hull): no último ex-div antes do vencimento, exercer é ótimo apenas se \(D > K\big[1 - e^{-r(T - t_{ex})}\big]\) — o dividendo supera os juros sobre o strike até o vencimento — e, na prática, se o dividendo superar o <b>valor extrínseco da put</b> correspondente (o que você abre mão ao exercer).</li>
<li><b>Puts</b>: podem valer exercer quando deep ITM, para receber \(K\) antes e ganhar juros. Com juros de 4–5% isso acontece em puts bem ITM.</li></ul>
<h3>Precificação</h3>
<p>Binomial/trinomial (CRR com dividendos discretos), diferenças finitas (Wilmott) ou aproximações (Barone-Adesi-Whaley, Bjerksund-Stensland). O <b>prêmio de exercício antecipado</b> = americana − europeia.</p>
<h3>Consequências de mesa</h3>
<ul><li><b>Dividend play</b>: na véspera do ex-div, quem está vendido em calls ITM pode ser exercido (assignment). Se não prestar atenção, a mesa perde o dividendo sobre as ações que achava que tinha.</li>
<li>Assignment é aleatório entre os vendidos (a OCC aloca).</li>
<li>Vol implícita de americanas: invertida com modelo americano, não BS — senão aparece "skew" artificial em puts ITM.</li></ul>`,
    desk: String.raw`"Early exercise ahead of the ex-date", "dividend risk on short ITM calls", "got assigned on the puts". "Exercise-by-exception": a OCC exerce automaticamente opções ITM por pelo menos US$ 0,01 no vencimento.`,
    refs: [R_.hull('10.5', 'Calls on a non-dividend-paying stock (early exercise)'), R_.hull('20.3', 'Binomial model for a dividend-paying stock'), R_.wil(9, 'Early exercise and American options'), R_.mfd(7, 'American options'), R_.ek(8, 'The American put option'), R_.cqf(3, 'opções americanas e métodos numéricos')],
    sims: ['bs'],
    ex: [
      { tag: 'us-amer', gen: R => { const K = R.step(80, 150, 5), r = R.f(0.03, 0.055, 3), days = R.int(5, 60), D = R.f(0.1, 1.5, 2); const thr = K * (1 - Math.exp(-r * days / 365)); const a = D > thr ? 1 : 0; return { q: `Call americana K = ${K}, ex-dividendo amanhã (D = ${Q.fmt(D, 2)}), vencimento ${days} dias depois do ex, r = ${F.p(r, 2)}. Pelo critério D > K[1 − e^{−r(T−t)}], o exercício antecipado <i>pode</i> ser ótimo? (1 = sim, 0 = não)`, a, tolAbs: 0.01, dec: 0, e: `K[1 − e^{−r·${days}/365}] = ${Q.fmt(thr, 3)}. D = ${Q.fmt(D, 2)} ${D > thr ? '>' : '≤'} ${Q.fmt(thr, 3)} ⇒ ${a ? 'pode ser ótimo (condição necessária; confira o valor extrínseco da put)' : 'nunca é ótimo exercer'}.` }; } },
      { tag: 'us-amer', gen: R => { const S = 100, K = R.pick([110, 120]), T = 1, r = R.pick([0.05, 0.08]), s = 0.25; const am = Q.binomial('put', S, K, T, r, 0, s, 400, true).price, eu = Q.bsPrice('put', S, K, T, r, 0, s); const a = am - eu; return { q: `Prêmio de exercício antecipado de uma put: S = 100, K = ${K}, T = 1, r = ${F.p(r, 0)}, σ = 25%. (americana − europeia; use binomial ~400 passos)`, a, tol: 0.03, tolAbs: 0.004, dec: 4, e: `Americana ≈ ${Q.fmt(am, 4)}, europeia = ${Q.fmt(eu, 4)}: prêmio ≈ ${Q.fmt(a, 4)}.` }; } },
      { t: 'mcq', q: 'Uma call americana sobre ação que não paga dividendos:', o: ['Vale mais que a europeia', 'Vale igual à europeia', 'Vale menos', 'Depende da vol'], a: 1, e: 'Nunca é ótimo exercer antes.' },
      { t: 'mcq', q: 'Você está vendido em calls deep ITM de uma ação com dividendo alto amanhã (ex-date). O risco é:', o: ['Nenhum', 'Ser exercido hoje e perder o dividendo que o hedge em ações daria', 'Vega', 'Rho'], a: 1, e: 'Os titulares exercem para capturar o dividendo.' }
    ],
    cards: [['Exercício antecipado de call', 'Só antes de ex-div, e se D > K(1 − e^{−r(T−t)}) (condição necessária).'], ['Put americana', 'Deep ITM pode valer exercer (juros sobre K).'], ['Assignment', 'Alocação aleatória do exercício entre os vendidos (OCC).']]
  },
  {
    id: 'us1-4', title: 'Futuros de índice (ES) e o modelo de Black', tag: 'us-fut',
    goal: 'Usar futuros como hedge de delta e precificar opções sobre futuros com Black-76.',
    body: String.raw`
<p>O <b>E-mini S&amp;P 500 (ES)</b> vale US$ 50 × índice; o Micro (MES) US$ 5 ×. É o instrumento padrão de hedge de delta de livros de SPX: líquido quase 24h e barato. Vencimentos trimestrais (mar/jun/set/dez), com rolagem na semana anterior.</p>
<p>Quantos ES hedgeiam um delta? \(N = \dfrac{\Delta_{\$}}{50\times F}\), onde \(\Delta_\$\) é o delta cash em dólares.</p>
<h3>Black-76</h3>
<p>Para opções sobre futuro (ou quando o forward é o objeto natural), o modelo de Black:</p>
\[ c = e^{-rT}\big[F N(d_1) - K N(d_2)\big], \quad d_1 = \frac{\ln(F/K) + \tfrac12\sigma^2T}{\sigma\sqrt T}. \]
<p>Precificar SPX em cima do forward implícito (em vez de spot + dividendos estimados) é o padrão: o forward já contém juros, dividendos e borrow. Delta "no forward" (\(\partial c/\partial F = e^{-rT}N(d_1)\)) é o número de futuros equivalentes (ajustado pelo tamanho do contrato).</p>
<h3>Base e roll</h3>
<p>A base ES − SPX reflete juros menos dividendos até o vencimento. Mudanças na expectativa de dividendos ou no custo de financiamento (repo) movem a base — um risco chamado de "carry" ou "financing" na mesa.</p>`,
    desk: String.raw`"Hedge in ES", "roll week", "the basis is rich/cheap". "Delta in futures equivalents". "Delta off the forward".`,
    refs: [R_.hull('17.8', 'Black\'s model for valuing futures options'), R_.hull('3.5', 'Stock index futures')],
    ex: [
      { tag: 'us-fut', gen: R => { const D = R.int(5, 200) * 1e6 * R.sign(), F = R.step(4500, 6500, 25); const a = -D / (50 * F); return { q: `Seu livro tem delta cash de US$ ${Q.fmt(D, 0)}. Com ES a ${Q.fmt(F, 0)} (US$ 50 × índice), quantos contratos negociar para zerar? (+ comprar, − vender)`, a, tol: 0.01, tolAbs: 0.6, unit: 'contratos', dec: 1, e: `−Δ$/(50·F) = ${Q.fmt(-D, 0)}/(${Q.fmt(50 * F, 0)}) = ${Q.fmt(a, 1)}.` }; } },
      { tag: 'us-fut', gen: R => { const F0 = R.step(4800, 6200, 25), K = F0 + R.step(-200, 200, 50), T = R.pick([0.08, 0.25]), r = 0.045, s = R.f(0.12, 0.25, 2); const a = Q.black76('put', F0, K, T, r, s).price; return { q: `Put sobre futuro (Black-76): F = ${F0}, K = ${K}, T = ${T}, r = 4,5%, σ = ${F.p(s, 0)}. Preço (pontos)?`, a, tol: 0.005, tolAbs: 0.05, dec: 2, e: `e^{−rT}[K·N(−d2) − F·N(−d1)] = ${Q.fmt(a, 2)}.` }; } },
      { t: 'mcq', q: 'Por que mesas preferem precificar SPX a partir do forward implícito?', o: ['Porque é obrigatório', 'Porque o forward já incorpora juros, dividendos e borrow de forma consistente com os preços de mercado', 'Porque ignora a vol', 'Porque o spot não existe'], a: 1, e: 'Evita erros de estimativa de dividendos/financiamento.' }
    ],
    cards: [['ES / MES', 'US$ 50 / US$ 5 × S&P 500.'], ['Hedge com ES', 'N = Δ$ / (50·F)'], ['Black-76', 'c = e^{−rT}[F N(d1) − K N(d2)]']]
  }
  ]
});

/* ---------------- US2 — Superfície de vol ---------------- */
Course.unit('us', {
  id: 'us2', title: 'A superfície de volatilidade',
  desc: 'Skew e smile, cotação em RR/BF, parametrização (SVI), estrutura a termo e vol de eventos, dinâmica sticky strike/delta/local vol, shadow delta, e a intuição de vol local e estocástica.',
  sims: ['smile'], exam: { n: 10, minutes: 20 },
  lessons: [
  {
    id: 'us2-1', title: 'Skew e smile: por que existem e como são cotados', tag: 'skew',
    goal: 'Explicar a forma do smile de equity e ler cotações de ATM, risk reversal e butterfly.',
    body: String.raw`
<p>Desde o crash de 1987, as opções de índices de ações têm <b>skew negativo</b>: IV maior para strikes baixos. Explicações (todas contribuem):</p>
<ul><li><b>Correlação spot-vol negativa</b>: quando o mercado cai, a vol sobe (efeito alavancagem, pânico). Um modelo com isso gera caudas esquerdas gordas.</li>
<li><b>Saltos para baixo</b> (crashes) são mais prováveis que para cima.</li>
<li><b>Oferta e demanda</b>: investidores compram puts para proteção (demanda estrutural) e vendem calls (overwriting): puts caras, calls baratas.</li></ul>
<p>Ações individuais têm skew menos íngreme e às vezes smile (calls OTM também caras em papéis especulativos, biotechs, "meme stocks").</p>
<h3>Medidas padrão (por delta)</h3>
\[ \text{ATM},\quad RR_{25} = \sigma_{25C} - \sigma_{25P},\quad BF_{25} = \tfrac{\sigma_{25C} + \sigma_{25P}}{2} - \sigma_{ATM}. \]
<p>RR mede a <b>inclinação</b> (negativo em equity); BF mede a <b>curvatura</b> (preço das caudas). Em equity também se usa skew por moneyness: "90–110 skew" = \(\sigma_{90\%} - \sigma_{110\%}\), ou a inclinação por 10% de strike.</p>
<h3>Parametrização: SVI</h3>
<p>Mesas ajustam o smile de cada vencimento com uma função suave e sem arbitragem. A mais popular é a SVI (Gatheral), em variância total \(w = \sigma^2 T\) e log-moneyness \(k = \ln(K/F)\):</p>
\[ w(k) = a + b\big[\rho(k-m) + \sqrt{(k-m)^2 + s^2}\big]. \]
<p>\(\rho\) controla a inclinação, \(b\) as asas, \(s\) a curvatura no centro. Restrições evitam arbitragem de borboleta (densidade negativa) e de calendário (variância total decrescente).</p>`,
    desk: String.raw`"25-delta risk reversal at −6", "fly at 1.2", "skew steepened", "put skew bid". "Smile flattening into the rally".`,
    refs: [R_.hull(19, 'Volatility smiles'), R_.hull('19.3', 'Equity options'), R_.wil(49, 'Overview of volatility modeling'), R_.wil('50.4', 'Volatility smiles and skews'), R_.der(22, 'volatility smiles and surfaces'), R_.cqf(3, 'vol implícita e smile')],
    sims: ['smile'],
    ex: [
      { tag: 'skew', gen: R => { const atm = R.f(14, 22, 1), p = atm + R.f(3, 8, 1), c = atm - R.f(1, 3, 1); const rr = c - p, bf = (c + p) / 2 - atm; return { q: `ATM = ${Q.fmt(atm, 1)}, 25Δ put = ${Q.fmt(p, 1)}, 25Δ call = ${Q.fmt(c, 1)}. Qual o butterfly 25Δ?`, a: bf, tolAbs: 0.05, dec: 2, e: `BF = (${Q.fmt(c, 1)} + ${Q.fmt(p, 1)})/2 − ${Q.fmt(atm, 1)} = ${Q.fmt(bf, 2)} (RR = ${Q.fmt(rr, 1)}).` }; } },
      { tag: 'skew', gen: R => { const atm = R.f(15, 25, 1), rr = -R.f(2, 8, 1), bf = R.f(0.3, 2, 1); const a = atm + bf - rr / 2; return { q: `ATM = ${Q.fmt(atm, 1)}, RR25 = ${Q.fmt(rr, 1)}, BF25 = ${Q.fmt(bf, 1)}. Qual a vol da put 25Δ?`, a, tolAbs: 0.05, dec: 2, e: `σP = ATM + BF − RR/2 = ${Q.fmt(atm, 1)} + ${Q.fmt(bf, 1)} − (${Q.fmt(rr / 2, 2)}) = ${Q.fmt(a, 2)}.` }; } },
      { t: 'mcq', q: 'Em índices de ações, o RR 25Δ (call − put) é tipicamente:', o: ['Positivo', 'Negativo', 'Zero', 'Aleatório'], a: 1, e: 'Puts mais caras: skew negativo.' },
      { t: 'mcq', q: 'No SVI, qual parâmetro controla principalmente a inclinação do smile?', o: ['a', 'b', 'ρ', 'm'], a: 2, e: 'ρ é a "correlação" que inclina o smile.' }
    ],
    cards: [['RR 25Δ', 'σ(25Δ call) − σ(25Δ put): inclinação.'], ['BF 25Δ', 'média das asas − ATM: curvatura.'], ['SVI', 'w(k) = a + b[ρ(k−m) + √((k−m)² + s²)]']]
  },
  {
    id: 'us2-2', title: 'Estrutura a termo e vol de eventos', tag: 'termo',
    goal: 'Ler a estrutura a termo, extrair o move implícito de um evento e entender o "weighting" do tempo.',
    body: String.raw`
<p>A <b>estrutura a termo</b> é a vol ATM por vencimento. Em mercados calmos, é crescente (contango): vol curta baixa, longa mais alta (reversão à média + prêmio). Em estresse, inverte (backwardation): a vol curta dispara.</p>
<h3>Vol de eventos (earnings, FOMC, CPI)</h3>
<p>Variância é aditiva no tempo. Se um vencimento contém um evento com move de desvio \(e\) (em %), e o "resto" tem vol diária base \(\sigma_b\):</p>
\[ \sigma_T^2\,T = \sigma_b^2\,(T - \delta t) + e^2. \]
<p>Com dois vencimentos (um antes e um depois do evento), mesas extraem o move implícito do evento. Aproximação rápida: o straddle do vencimento logo após o balanço ≈ 0,8 × move esperado × S.</p>
<p>Exemplo: vencimento de 7 dias corridos com IV 60%, vol base 30%. \(0{,}6^2\cdot\tfrac{7}{365} = 0{,}3^2\cdot\tfrac{6}{365} + e^2\) ⇒ \(e^2 = 0{,}006904 - 0{,}001479 = 0{,}005425\) ⇒ \(e \approx 7{,}4\%\) de desvio no dia do evento.</p>
<h3>Tempo de variância ("vol time")</h3>
<p>Fins de semana e feriados têm menos variância que dias úteis; dias de evento, mais. Mesas usam um relógio de variância com pesos (ex.: sábado/domingo com 0,1–0,3 de peso). Isso muda o theta: vender opções na sexta "ganha" o fim de semana só se o seu relógio der peso a ele.</p>`,
    desk: String.raw`"The earnings straddle implies a 7% move." "Term structure inverted." "Event vol", "ex-event vol", "vol time / weighted days". "Theta over the weekend".`,
    refs: [R_.hull('19.5', 'The volatility term structure and volatility surfaces'), R_.hull('19.8', 'When a single large jump is anticipated'), R_.hull('22.6', 'Using GARCH(1,1) to forecast future volatility'), R_.cqf(2, 'ARCH/GARCH e previsão de vol')],
    sims: ['smile'],
    ex: [
      { tag: 'termo', gen: R => { const d = R.pick([5, 7, 10, 14]), iv = R.f(0.4, 0.9, 2), b = R.f(0.2, 0.35, 2); const T = d / 365, v = iv * iv * T - b * b * (T - 1 / 365); const a = Math.sqrt(v) * 100; return { q: `Vencimento em ${d} dias corridos com IV ${F.p(iv, 0)} contém o balanço. Vol base (sem evento) ${F.p(b, 0)}. Qual o move implícito (desvio) do dia do evento, em %? (dias corridos/365; o dia do evento substitui 1 dia normal)`, a, tol: 0.01, unit: '%', dec: 2, e: `e² = σT²·T − σb²·(T − 1/365) = ${Q.fmt(iv * iv * T, 6)} − ${Q.fmt(b * b * (T - 1 / 365), 6)} = ${Q.fmt(v, 6)} ⇒ e = ${Q.fmt(a, 2)}%.` }; } },
      { tag: 'termo', gen: R => { const S = R.f(50, 400, 0), mv = R.f(0.03, 0.12, 3); const a = 0.8 * S * mv; return { q: `Uma ação a ${S}: o mercado precifica um move (desvio) de ${F.p(mv, 1)} no balanço, e esse é o grosso da vol até o vencimento semanal. Straddle ATM aproximado?`, a, tol: 0.01, dec: 2, e: `≈ 0,8 × S × move = 0,8 × ${S} × ${Q.fmt(mv, 3)} = ${Q.fmt(a, 2)}.` }; } },
      { t: 'mcq', q: 'Estrutura a termo invertida (vol curta > vol longa) é típica de:', o: ['Mercado calmo', 'Estresse/crise', 'Juros altos', 'Mercado sem dividendos'], a: 1, e: 'Choques elevam a vol de curto prazo.' },
      { t: 'mcq', q: 'Depois que o evento passa, a IV do vencimento curto normalmente:', o: ['Sobe', 'Cai forte (vol crush)', 'Não muda', 'Vai a zero'], a: 1, e: 'A variância do evento sai do vencimento.' }
    ],
    cards: [['Variância aditiva', 'σT²·T = σb²·(T − δt) + e²'], ['Vol crush', 'Queda da IV após o evento sair do vencimento.'], ['Vol time', 'Relógio de variância com pesos para fins de semana/eventos.']]
  },
  {
    id: 'us2-3', title: 'Dinâmica do smile: sticky strike, sticky delta e shadow delta', tag: 'dinamica',
    goal: 'Saber como a superfície se move com o spot e qual delta usar.',
    body: String.raw`
<p>O smile não diz como ele próprio se move quando o spot anda. Três regimes clássicos (Derman), para um skew linear \(\sigma(K) = \sigma_0 - \beta(K - S_0)\):</p>
<table><tr><th>Regime</th><th>Vol de um strike fixo quando S sobe</th><th>Vol ATM quando S sobe</th></tr>
<tr><td>Sticky strike</td><td>não muda</td><td>cai (\(-\beta\,\delta S\))</td></tr>
<tr><td>Sticky delta / moneyness</td><td>sobe (\(+\beta\,\delta S\)): o smile "anda" com o spot</td><td>não muda</td></tr>
<tr><td>Sticky local vol (implied tree)</td><td>cai (\(-\beta\,\delta S\))</td><td>cai 2× (\(-2\beta\,\delta S\))</td></tr></table>
<p>Empiricamente, em índices de ações, em movimentos normais a vol ATM cai quando o mercado sobe (e sobe quando cai) — mais perto de sticky strike/local vol do que de sticky delta. Em choques, a vol ATM reage mais.</p>
<h3>Shadow delta (delta ajustado ao skew)</h3>
<p>Se a vol muda com o spot, o delta verdadeiro inclui o efeito vega:</p>
\[ \Delta_{\text{shadow}} = \Delta_{BS} + \mathcal{V}\,\frac{\partial\sigma}{\partial S}. \]
<p>Com skew negativo e vol de strike fixo caindo quando o spot sobe (\(\partial\sigma/\partial S<0\)), o delta de uma call é <b>menor</b> que o de BS; o de uma put, mais negativo. Hedgear com o delta de BS deixa um delta residual sistemático. Mesas de índice normalmente usam algum delta ajustado.</p>
<p>Use a aba "Sticky strike × sticky delta" do simulador de Smile para ver os números.</p>`,
    desk: String.raw`"Are you running sticky strike or sticky delta?" "Skew-adjusted delta", "shadow delta", "minimum variance delta". "Vol is realizing the skew" = a vol ATM está andando com o spot como o skew prevê.`,
    deep: String.raw`<p>O <b>minimum variance delta</b> (Hull-White, 2017) estima empiricamente \(\partial\sigma/\partial S\) por regressão: \(\Delta_{MV} = \Delta_{BS} + \frac{\mathcal{V}}{S\sqrt T}(a + b\,\Delta_{BS} + c\,\Delta_{BS}^2)\). Para S&amp;P, reduz significativamente a variância do hedge em relação ao delta BS.</p>`,
    refs: [R_.hull('19.6', 'Greek letters (the smile and delta)'), R_.wil(50, 'Deterministic volatility surfaces'), R_.wil('12.8', 'How does implied volatility behave?')],
    sims: ['smile'],
    ex: [
      { tag: 'dinamica', gen: R => { const d = R.f(0.4, 0.6, 2), V = R.f(0.2, 0.4, 2), slope = -R.f(0.1, 0.4, 2); const a = d + V * slope; return { q: `Call com Δ_BS = ${Q.fmt(d, 2)} e vega = ${Q.fmt(V, 2)} (prêmio por 1 ponto de vol). No regime de mercado, a vol dessa opção muda ${Q.fmt(slope, 2)} ponto para cada +1 de spot. Qual o shadow delta?`, a, tolAbs: 0.0005, dec: 4, e: `Δ_shadow = Δ_BS + 𝒱·∂σ/∂S = ${Q.fmt(d, 2)} + ${Q.fmt(V, 2)} × (${Q.fmt(slope, 2)}) = ${Q.fmt(a, 4)}. (vega por ponto × pontos por unidade de spot = prêmio por unidade de spot)` }; } },
      { t: 'mcq', q: 'Sob sticky strike e skew negativo, quando o spot sobe, a vol ATM:', o: ['Sobe', 'Cai', 'Não muda', 'Vai a zero'], a: 1, e: 'O novo ATM é um strike mais alto, com vol menor no smile fixo.' },
      { t: 'mcq', q: 'Com skew negativo, hedgear uma call comprada com o delta de BS (em vez do shadow delta) deixa você:', o: ['Sub-hedgeado', 'Sobre-hedgeado (vendeu ações demais)', 'Perfeito', 'Sem delta'], a: 1, e: 'O delta verdadeiro é menor que o BS; vendendo Δ_BS você vendeu demais.' },
      { t: 'mcq', q: 'Qual regime implica que a vol ATM se move o dobro da inclinação do skew?', o: ['Sticky strike', 'Sticky delta', 'Sticky local vol / implied tree', 'Nenhum'], a: 2, e: 'Na aproximação linear de Derman, a ATM se move 2β por unidade de spot.' }
    ],
    cards: [['Sticky strike', 'Vol por strike fixa; ATM cai quando S sobe (skew negativo).'], ['Sticky delta', 'Vol por moneyness fixa; ATM constante.'], ['Shadow delta', 'Δ_BS + 𝒱·∂σ/∂S']]
  },
  {
    id: 'us2-4', title: 'Vol local e vol estocástica: a intuição', tag: 'modelos',
    goal: 'Entender o que Dupire e Heston resolvem, e por que a escolha do modelo importa para exóticas.',
    body: String.raw`
<h3>Vol local (Dupire, 1994)</h3>
<p>Existe uma única função \(\sigma_{loc}(S,t)\) tal que o modelo \(dS/S = (r-q)dt + \sigma_{loc}(S,t)dW\) reproduz <b>exatamente</b> todos os preços de vanillas da superfície:</p>
\[ \sigma_{loc}^2(K,T) = \frac{\partial_T C + (r-q)K\partial_K C + qC}{\tfrac12 K^2\,\partial_{KK}C}. \]
<p>Regra prática: perto do ATM, a inclinação da vol local em strike é ~<b>2×</b> a inclinação da vol implícita. Vol local calibra perfeito hoje, mas prevê um smile futuro "achatado" (forward skew fraco) — ruim para produtos que dependem do smile futuro (cliquets, forward-starts).</p>
<h3>Vol estocástica (Heston, 1993)</h3>
\[ dS/S = \mu dt + \sqrt{v}\,dW_1, \qquad dv = \kappa(\theta - v)dt + \xi\sqrt v\,dW_2, \qquad dW_1dW_2 = \rho\,dt. \]
<p>\(\rho<0\) gera o skew; \(\xi\) (vol da vol) gera a curvatura; \(\kappa, \theta\) a estrutura a termo. Preserva o formato do smile no futuro (forward skew realista), mas não calibra perfeitamente os vencimentos curtos (precisa de saltos) — daí modelos <b>SLV</b> (stochastic local vol) que misturam os dois, padrão em mesas de exóticas.</p>
<h3>Por que importa</h3>
<table><tr><th>Produto</th><th>Sensível a</th><th>Modelo inadequado</th></tr>
<tr><td>Vanillas</td><td>smile de hoje</td><td>qualquer um calibrado serve</td></tr>
<tr><td>Barreiras / DIP de autocall</td><td>skew e sua dinâmica</td><td>BS flat (erra muito)</td></tr>
<tr><td>Cliquets / forward-start</td><td>forward skew</td><td>vol local (subestima)</td></tr>
<tr><td>Opções sobre variância / VIX</td><td>vol da vol</td><td>vol local (vol da vol "errada")</td></tr></table>`,
    desk: String.raw`"LV vs SLV price difference" = reserva de modelo. "Forward skew", "vol of vol". "The barrier is priced off local vol with a mixing fraction".`,
    deep: String.raw`<p>Derivação de Dupire: a densidade neutra a risco \(q(K,T) = e^{rT}\partial_{KK}C\) satisfaz a equação de Fokker-Planck do processo; reescrevendo-a em termos de \(C\) e integrando duas vezes em \(K\) obtém-se a fórmula. Gyöngy (1986) mostra que \(\sigma_{loc}^2(K,T) = \mathbb{E}^{\mathbb{Q}}[\sigma_t^2 \mid S_T = K]\): a vol local é a expectativa condicional da variância instantânea de qualquer modelo que reproduza as mesmas vanillas.</p>`,
    refs: [R_.hull('26.2', 'Stochastic volatility models'), R_.hull('26.3', 'The IVF model'), R_.wil(50, 'Deterministic volatility surfaces'), R_.wil(51, 'Stochastic volatility'), R_.der(23, 'stochastic volatility')],
    ex: [
      { t: 'mcq', q: 'Qual modelo reproduz exatamente todos os preços de vanillas de hoje por construção?', o: ['Black-Scholes', 'Vol local (Dupire)', 'Heston puro', 'Binomial CRR com vol flat'], a: 1, e: 'Dupire calibra a superfície inteira.' },
      { t: 'mcq', q: 'No Heston, o skew negativo de equity vem principalmente de:', o: ['κ grande', 'ρ negativo entre spot e variância', 'θ alto', 'r alto'], a: 1, e: 'Correlação spot-vol negativa inclina o smile.' },
      { t: 'mcq', q: 'Para precificar um cliquet (depende do smile futuro), qual modelo tende a subestimar o risco?', o: ['Vol estocástica', 'Vol local', 'SLV', 'Nenhum'], a: 1, e: 'Vol local achata o forward skew.' },
      { tag: 'modelos', gen: R => { const s = -R.f(0.1, 0.5, 2); const a = 2 * s; return { q: `A vol implícita perto do ATM cai ${Q.fmt(-s, 2)} ponto por 1% de strike. Pela regra prática, qual a inclinação da vol local (pontos por 1%)?`, a, tolAbs: 0.005, dec: 2, e: `≈ 2 × inclinação implícita = ${Q.fmt(a, 2)}.` }; } }
    ],
    cards: [['Dupire', 'Vol local única que reproduz todas as vanillas.'], ['Heston', 'Variância com reversão à média, vol da vol ξ, correlação ρ.'], ['Regra do 2', 'Inclinação da vol local ≈ 2× a da implícita (perto do ATM).'], ['SLV', 'Mistura vol local e estocástica; padrão para exóticas.']]
  }
  ]
});

/* ---------------- US3 — Vol trading avançado ---------------- */
Course.unit('us', {
  id: 'us3', title: 'Vol trading avançado: variance swaps, VIX e dispersão',
  desc: 'Variance e vol swaps (replicação pelo log-contract), VIX e seus futuros, dispersão e correlação implícita, e o prêmio de risco de vol.',
  sims: ['hedge', 'smile'], exam: { n: 10, minutes: 20 },
  lessons: [
  {
    id: 'us3-1', title: 'Variance swaps', tag: 'varswap',
    goal: 'Entender o payoff, a replicação e o risco de um variance swap — e por que o strike fica acima da vol ATM.',
    body: String.raw`
<p>Um <b>variance swap</b> paga a diferença entre a variância realizada e um strike fixado hoje:</p>
\[ \text{Payoff} = N_{var}\,\big(\sigma_{real}^2 - K_{var}\big), \qquad \sigma_{real}^2 = \frac{252}{n}\sum_{i=1}^n \ln^2\!\frac{S_i}{S_{i-1}}\times 100^2. \]
<p>É exposição <b>pura</b> à vol realizada, sem delta hedge e sem path dependence de gamma (é o que um straddle delta-hedgeado <i>queria</i> ser).</p>
<h3>Vega notional</h3>
<p>Convenção: cota-se em vol (\(K_{vol} = \sqrt{K_{var}}\)) e o tamanho em <b>vega notional</b>: \(N_{vega} = N_{var}\times 2K_{vol}\). Um var swap com vega notional de US$ 100k e strike 20 ganha ~US$ 100k por ponto de vol realizada acima de 20 (para moves pequenos). Mas é convexo: realizar 30 paga \(N_{var}(900 - 400)\), mais que 10 × 100k.</p>
<h3>Replicação</h3>
<p>Uma carteira de opções ponderada por \(1/K^2\) + delta hedge contínuo replica a variância (log contract):</p>
\[ K_{var} = \frac{2e^{rT}}{T}\left[\int_0^{F}\frac{P(K)}{K^2}dK + \int_F^\infty \frac{C(K)}{K^2}dK\right]. \]
<p>Consequência: o strike depende de <b>todo o smile</b>, com peso maior nas puts baixas. Com skew negativo, \(K_{vol}\) fica acima da vol ATM (tipicamente 1–3 pontos em índices). Por isso o VIX (que é essa fórmula) negocia acima da ATM do S&amp;P.</p>
<h3>Risco</h3>
<ul><li>Vendido em var swap = vendido em cauda: um crash gera perda quadrática. Em 2008 e 2020, vendedores perderam muito; por isso existem <b>caps</b> (tipicamente 2,5× o strike em vol).</li>
<li><b>Vol swap</b> paga \(\sigma_{real} - K_{vol}\): linear em vol, sem convexidade. Seu strike é menor que o do var swap (ajuste de convexidade ∝ vol da vol).</li></ul>`,
    desk: String.raw`"Sell 100k vega of 1y var at 21." "Var-vol spread." "Capped var." "Gamma swap" (variância ponderada pelo spot). "Realized var came in at 18."`,
    deep: String.raw`<p>Pelo lema de Itô, \(d\ln S = \frac{dS}{S} - \frac12\sigma^2dt\), logo \(\frac{1}{T}\int_0^T\sigma^2dt = \frac{2}{T}\left[\int_0^T \frac{dS}{S} - \ln\frac{S_T}{S_0}\right]\). O primeiro termo é um delta hedge (1/S ações); o segundo é um "log contract", replicável estaticamente por opções com peso \(1/K^2\) (fórmula de Carr-Madan). Daí a replicação do var swap, independente de modelo (sob difusão sem saltos).</p>`,
    refs: [R_.hull('25.15', 'Volatility and variance swaps'), R_.wil('8.10', 'The log contract'), R_.hull(27, 'Martingales and measures')],
    ex: [
      { tag: 'varswap', gen: R => { const Nv = R.int(5, 50) * 10000, K = R.f(15, 25, 1), sr = R.f(10, 40, 1); const Nvar = Nv / (2 * K); const a = Nvar * (sr * sr - K * K); return { q: `Var swap com vega notional US$ ${Q.fmt(Nv, 0)}, strike ${Q.fmt(K, 1)} (vol). Vol realizada: ${Q.fmt(sr, 1)}. Payoff?`, a, tol: 0.001, tolAbs: 1, unit: 'US$', dec: 0, e: `N_var = N_vega/(2K) = ${Q.fmt(Nvar, 2)}. Payoff = ${Q.fmt(Nvar, 2)} × (${Q.fmt(sr, 1)}² − ${Q.fmt(K, 1)}²) = ${Q.fmt(a, 0)}.` }; } },
      { tag: 'varswap', gen: R => { const rs = Array.from({ length: 6 }, () => R.f(-0.03, 0.03, 4)); const s = rs.reduce((a, x) => a + Math.log(1 + x) ** 2, 0); const a = Math.sqrt(252 / rs.length * s) * 100; return { q: `Retornos diários simples: ${rs.map(x => Q.fmt(x * 100, 2) + '%').join(', ')}. Vol realizada anualizada (convenção de var swap: média zero, soma de ln² × 252/n), em pontos?`, a, tol: 0.003, dec: 2, e: `Σ ln²(1+r) = ${Q.fmt(s, 6)}; ×252/6 = ${Q.fmt(252 / 6 * s, 5)}; raiz ×100 = ${Q.fmt(a, 2)}.` }; } },
      { t: 'mcq', q: 'Com skew negativo, o strike justo do variance swap (em vol) comparado à vol ATM é:', o: ['Menor', 'Maior', 'Igual', 'Zero'], a: 1, e: 'A replicação pondera puts baixas (caras) com 1/K².' },
      { t: 'mcq', q: 'Vendido em var swap: um crash com vol realizada de 80 contra strike 20 gera perda proporcional a:', o: ['80 − 20', '80² − 20² (quadrática)', 'log(80/20)', 'Zero, há hedge'], a: 1, e: 'Payoff em variância: convexo. Por isso existem caps.' }
    ],
    cards: [['Var swap payoff', 'N_var·(σ_real² − K_var)'], ['Vega notional', 'N_vega = N_var × 2K_vol'], ['Strike var > ATM', 'Replicação pondera puts OTM por 1/K² (skew).'], ['Vol swap', 'Linear em vol; strike < var swap (convexidade).']]
  },
  {
    id: 'us3-2', title: 'VIX, futuros de VIX e o ecossistema de vol', tag: 'vix',
    goal: 'Entender o que o VIX mede, como seus futuros se comportam e os riscos dos produtos de vol.',
    body: String.raw`
<p>O <b>VIX</b> é o strike de um variance swap de 30 dias sobre o S&amp;P 500, calculado pela Cboe a partir de opções SPX (fórmula de replicação da lição anterior, interpolando dois vencimentos para 30 dias), expresso em pontos de vol.</p>
<ul><li>O VIX em si <b>não é negociável</b>: não dá para comprar o "spot VIX". Negociam-se futuros e opções de VIX.</li>
<li><b>Futuro de VIX</b> = expectativa (neutra a risco) do VIX no vencimento. Converge para o VIX spot na liquidação (via SOQ).</li>
<li>Estrutura a termo em <b>contango</b> na maior parte do tempo (futuros acima do spot): quem fica comprado em futuros de VIX perde com o "roll-down". Em crises, <b>backwardation</b>.</li></ul>
<h3>Produtos e desastres</h3>
<p>ETPs de VIX long (compram futuros curtos e rolam) perdem valor sistematicamente em contango. ETPs short (inverse) ganham com o roll — até o dia em que a vol explode. Em 5 de fevereiro de 2018 ("<b>Volmageddon</b>"), o VIX mais que dobrou num dia e produtos inversos alavancados perderam ~90% e foram encerrados. O rebalanceamento desses produtos (comprar futuros de VIX quando a vol sobe) amplificou o choque.</p>
<h3>Outras medidas</h3>
<p><b>VVIX</b>: "VIX do VIX" (vol implícita das opções de VIX) — preço da vol da vol. <b>SKEW index</b>: preço de caudas do S&amp;P. <b>VIX1D</b>, <b>VIX9D</b>, <b>VIX3M</b>: outros horizontes.</p>
<h3>Leitura de mesa</h3>
<p>VIX alto com futuros em backwardation = estresse agudo. Opções de VIX têm skew <b>positivo</b> (calls caras: vol sobe explosivamente). Hedge de cauda de um livro short vol pode usar calls de VIX — mas atenção: elas referenciam o <i>futuro</i>, não o spot.</p>`,
    desk: String.raw`"VIX futures in steep contango, roll yield is brutal for longs." "VVIX at 120." "Volmageddon". "Vol of vol bid".`,
    refs: [R_.hull('14.11', 'Implied volatilities (the VIX index)'), R_.hull('25.15', 'Volatility and variance swaps'), R_.wil('28.6', 'The volatility option')],
    ex: [
      { t: 'mcq', q: 'O VIX spot pode ser comprado diretamente?', o: ['Sim, como uma ação', 'Não; negociam-se futuros e opções de VIX', 'Só em ETF', 'Só na Cboe'], a: 1, e: 'É um índice calculado, não um ativo.' },
      { tag: 'vix', gen: R => { const sp = R.f(12, 18, 1), f1 = sp + R.f(1, 4, 1), days = R.int(20, 35); const a = (sp - f1); return { q: `VIX spot ${Q.fmt(sp, 1)}; futuro que vence em ${days} dias a ${Q.fmt(f1, 1)}. Se o VIX spot ficar parado até o vencimento, qual o PnL por unidade (pontos) de quem está comprado no futuro?`, a, tolAbs: 0.01, dec: 1, e: `Converge ao spot: ${Q.fmt(sp, 1)} − ${Q.fmt(f1, 1)} = ${Q.fmt(a, 1)} pontos (roll-down em contango).` }; } },
      { t: 'mcq', q: 'O skew das opções de VIX é tipicamente:', o: ['Negativo como o do S&P', 'Positivo (calls OTM mais caras)', 'Flat', 'Inexistente'], a: 1, e: 'A vol sobe de forma explosiva: calls de VIX são caras.' },
      { t: 'mcq', q: 'O que é o "Volmageddon" (5/2/2018)?', o: ['Um crash de juros', 'Explosão do VIX que destruiu produtos inversos de vol', 'Queda do dólar', 'Default soberano'], a: 1, e: 'VIX mais que dobrou; ETPs short vol colapsaram.' }
    ],
    cards: [['VIX', 'Strike de var swap de 30d do S&P (fórmula Cboe).'], ['Futuros de VIX', 'Convergem ao VIX; normalmente em contango.'], ['VVIX', 'Vol implícita das opções de VIX.']]
  },
  {
    id: 'us3-3', title: 'Dispersão e correlação implícita', tag: 'dispersao',
    goal: 'Relacionar vol de índice, vol dos componentes e correlação, e montar um trade de dispersão.',
    body: String.raw`
<p>A variância de um índice com pesos \(w_i\):</p>
\[ \sigma_I^2 = \sum_i w_i^2\sigma_i^2 + 2\sum_{i&lt;j} w_iw_j\sigma_i\sigma_j\rho_{ij}. \]
<p>Supondo uma correlação média \(\rho\) igual para todos os pares, a <b>correlação implícita</b>:</p>
\[ \rho_{impl} = \frac{\sigma_I^2 - \sum w_i^2\sigma_i^2}{\big(\sum w_i\sigma_i\big)^2 - \sum w_i^2\sigma_i^2} \;\approx\; \frac{\sigma_I^2}{\big(\sum w_i\sigma_i\big)^2}\ \ (\text{muitos papéis}). \]
<h3>O trade de dispersão</h3>
<p><b>Vender vol do índice e comprar vol dos componentes</b> (straddles ou var swaps), com pesos que neutralizam o vega. O resultado depende de quanto os papéis se movem <i>independentemente</i>: é uma posição <b>vendida em correlação</b>.</p>
<ul><li>Ganha quando a correlação realizada fica abaixo da implícita (mercado "de stock picking", papéis dispersos).</li>
<li>Perde em crises: tudo cai junto, a correlação vai a ~1, a vol do índice explode mais que a dos componentes.</li></ul>
<p>Por que a correlação implícita costuma ser "cara"? Demanda estrutural por puts de índice (hedge de carteiras) e oferta de vol de ações individuais (overwriting, estruturados). Fundos de vol fazem dispersão como estratégia sistemática.</p>
<h3>Correlação e estruturados</h3>
<p>Produtos <b>worst-of</b> (autocallables sobre 3 ações) criam posições de correlação para os bancos (próxima unidade). Mesas de exóticas gerenciam esse risco, entre outras formas, com trades de dispersão/correlação.</p>`,
    desk: String.raw`"Implied correlation at 0.45, realized at 0.25 — dispersion paid." "Short correlation / long dispersion." "Correlation swap". "Everything goes to one in a crisis".`,
    refs: [R_.hull('22.7', 'Correlations'), R_.wil(11, 'Multi-asset options'), R_.wil('28.7', 'Correlation swap')],
    ex: [
      { tag: 'dispersao', gen: R => { const sI = R.f(0.14, 0.25, 3), avg = R.f(0.25, 0.4, 3); const a = sI * sI / (avg * avg); return { q: `Vol implícita do índice ${F.p(sI, 1)}; média ponderada das vols dos componentes (Σwᵢσᵢ) ${F.p(avg, 1)}. Correlação implícita aproximada (muitos papéis)?`, a, tol: 0.005, dec: 3, e: `ρ ≈ σI²/(Σwσ)² = ${Q.fmt(sI * sI, 4)}/${Q.fmt(avg * avg, 4)} = ${Q.fmt(a, 3)}.` }; } },
      { tag: 'dispersao', gen: R => { const s1 = R.f(0.2, 0.4, 2), s2 = R.f(0.2, 0.4, 2), rho = R.f(0.2, 0.8, 2); const a = Math.sqrt(0.25 * s1 * s1 + 0.25 * s2 * s2 + 2 * 0.25 * s1 * s2 * rho) * 100; return { q: `Índice de 2 ações com pesos 50/50, vols ${F.p(s1, 0)} e ${F.p(s2, 0)}, correlação ${Q.fmt(rho, 2)}. Vol do índice (%)?`, a, tol: 0.003, unit: '%', dec: 2, e: `√(0,25·${s1}² + 0,25·${s2}² + 2·0,25·${s1}·${s2}·${rho}) = ${Q.fmt(a, 2)}%.` }; } },
      { t: 'mcq', q: 'Um trade de dispersão (vende vol de índice, compra vol dos componentes) é:', o: ['Comprado em correlação', 'Vendido em correlação', 'Neutro em correlação', 'Comprado em juros'], a: 1, e: 'Ganha se a correlação realizada for baixa.' },
      { t: 'mcq', q: 'Em um crash generalizado, o trade de dispersão tipicamente:', o: ['Ganha muito', 'Perde (correlação vai a ~1)', 'Não se mexe', 'Vira arbitragem'], a: 1, e: 'Tudo cai junto: vol de índice sobe mais que a dos componentes em termos relativos.' }
    ],
    cards: [['Variância de índice', 'Σw²σ² + 2Σ wᵢwⱼσᵢσⱼρᵢⱼ'], ['Correlação implícita', '≈ σI² / (Σ wᵢσᵢ)²'], ['Dispersão', 'Vende vol de índice, compra vol de componentes: short correlation.']]
  },
  {
    id: 'us3-4', title: 'Prêmio de risco de vol, gamma scalping com skew e sizing', tag: 'vrp',
    goal: 'Consolidar como mesas pensam trades de vol: prêmio de risco, assimetria e dimensionamento.',
    body: String.raw`
<h3>Volatility risk premium (VRP)</h3>
<p>Em média, a vol implícita do S&amp;P fica alguns pontos acima da realizada subsequente. Vender vol tem Sharpe atraente… e cauda péssima. O VRP é o prêmio de um seguro: quem vende é pago para carregar o risco de crash.</p>
<h3>Gamma scalping com skew</h3>
<p>Quando você compra uma put OTM e faz delta hedge, a vol que importa para o PnL é a <b>realizada no nível em que o seu gamma está</b>. Se o mercado cai até o strike da put e a vol realizada lá é alta (spot-vol negativo), a put "paga o skew". Se o mercado sobe, o gamma da put some e você só pagou theta. Avaliar se o skew está caro exige olhar vol realizada <i>condicional</i> ao nível do spot.</p>
<h3>Sizing</h3>
<ul><li>Dimensione em <b>vega</b> e em <b>stress</b>, não em nocional. "Quanto perco se a vol subir 10 pontos e o spot cair 10%?"</li>
<li>Posições short vol: limite de perda no cenário de crash, não no VaR.</li>
<li>Diversifique vencimentos: vega de 1 mês e de 1 ano não são intercambiáveis (use vega ponderada).</li></ul>
<h3>Métricas que o trader acompanha</h3>
<table><tr><th>Métrica</th><th>Uso</th></tr>
<tr><td>IV − RV (implícita menos realizada)</td><td>vol cara/barata</td></tr>
<tr><td>Percentil da IV no histórico</td><td>nível relativo</td></tr>
<tr><td>Inclinação da term structure</td><td>regime (calmo vs estresse)</td></tr>
<tr><td>Skew (RR, 90-110)</td><td>preço da proteção</td></tr>
<tr><td>Posicionamento de dealers (gamma exposure estimado)</td><td>dinâmica intradiária</td></tr></table>`,
    desk: String.raw`"Short vol is picking up nickels in front of a steamroller." "Size it to the stress, not the VaR." "IV-RV spread is wide, we're sellers." "Skew is paying" / "skew is not realizing".`,
    refs: [R_.hull(19, 'Volatility smiles'), R_.hull('21.8', 'Stress testing and back testing'), R_.wil(59, 'Speculating with options'), R_.wil(44, 'Derivatives **** ups')],
    sims: ['hedge', 'book'],
    ex: [
      { t: 'mcq', q: 'Por que a vol implícita de índices tende a ficar acima da realizada?', o: ['Erro de modelo', 'Prêmio de risco: compradores de proteção pagam para transferir risco de crash', 'Juros', 'Dividendos'], a: 1, e: 'VRP = prêmio do seguro.' },
      { t: 'mcq', q: 'O melhor jeito de dimensionar uma venda de vol é:', o: ['Pelo nocional', 'Pelo VaR paramétrico', 'Pela perda em cenários de stress (spot e vol juntos)', 'Pelo theta'], a: 2, e: 'O risco de short vol está na cauda.' },
      { tag: 'vrp', gen: R => { const V = R.int(50, 300) * 1000, dv = R.pick([10, 15, 20]), D = R.int(-5, 5) * 1e5, G = -R.int(1, 8) * 1e5, sp = R.pick([-10, -15]); return { q: `Livro: vega −US$ ${Q.fmt(V, 0)}/pt, delta cash US$ ${Q.fmt(D, 0)} (PnL por 1% = delta/100), gamma: Δcash muda US$ ${Q.fmt(G, 0)} por 1%. Stress: spot ${sp}% e vol +${dv}. Estime PnL (use: vega·δσ + Δcash·(δS%)/100 + ½·Γcash·(δS%)²/100).`, a: -V * dv + D * sp / 100 + 0.5 * G * sp * sp / 100, tol: 0.003, tolAbs: 10, unit: 'US$', dec: 0, e: `Vega: ${Q.fmt(-V * dv, 0)}; delta: ${Q.fmt(D * sp / 100, 0)}; gamma: ${Q.fmt(0.5 * G * sp * sp / 100, 0)}. Total ≈ ${Q.fmt(-V * dv + D * sp / 100 + 0.5 * G * sp * sp / 100, 0)}.` }; } }
    ],
    cards: [['VRP', 'IV média > RV subsequente: prêmio por carregar risco de crash.'], ['Skew realizando', 'A put paga se a vol realizada perto do strike for alta.']]
  }
  ]
});

/* ---------------- US4 — Exóticas e estruturados US ---------------- */
Course.unit('us', {
  id: 'us4', title: 'Exóticas e estruturados: reverse convertibles e autocallables',
  desc: 'Barreiras no mundo real (discretas, sensíveis ao skew), reverse convertibles, autocallables com memória e knock-in, worst-of e correlação, cliquets — e o risco que cada produto deixa na mesa.',
  sims: ['barrier', 'book', 'struct'], exam: { n: 10, minutes: 20 },
  lessons: [
  {
    id: 'us4-1', title: 'Barreiras na prática: skew, monitoramento e reservas', tag: 'barreiras-adv',
    goal: 'Entender por que barreiras são precificadas com modelos de smile e como mesas se protegem.',
    body: String.raw`
<p>Na Unidade 7 do Módulo Brasil você viu as fórmulas fechadas (vol flat, monitoramento contínuo). No mundo real:</p>
<ul><li><b>Monitoramento discreto</b> (fechamento diário) → correção BGK \(H e^{\pm0{,}5826\sigma\sqrt{\Delta t}}\).</li>
<li><b>Skew</b>: a probabilidade de tocar uma barreira abaixo depende da vol <i>nos níveis baixos</i> (mais alta com skew negativo). Uma put down-and-in precificada com a vol ATM fica barata demais. Com vol local ou SLV, o preço sobe.</li>
<li><b>Vega por strike / "skew vega"</b>: a sensibilidade relevante não é a vega ATM, mas o formato do smile entre K e H.</li></ul>
<h3>Reservas e ajustes</h3>
<p>Mesas de exóticas fazem <b>reservas</b> (valuation adjustments) sobre o preço de modelo: barrier shift (colchão para o salto de delta), reserva de modelo (diferença LV vs SLV), reserva de liquidez (custo de hedgear o vega em prazos longos), reserva de concentração. O "preço" da mesa = modelo + reservas; o day-1 PnL é o que sobra do preço cobrado do cliente.</p>
<h3>Gregas em PnL real</h3>
<p>Perto da barreira, pequenos erros de spot de referência (fixing) ou de horário de observação importam. Contratos especificam exatamente o preço de observação (fechamento oficial). Eventos corporativos (splits, dividendos especiais) exigem ajuste de barreira.</p>`,
    desk: String.raw`"Barrier reserve", "model reserve", "we shift the barrier 1% and smooth the digital". "Close-only monitoring". "The KI is live" (knock-in acionado).`,
    refs: [R_.wil('23.7', 'Market practice: what volatility should I use?'), R_.hull('25.8', 'Barrier options'), R_.hull('26.6', 'Barrier options (numerical procedures)')],
    sims: ['barrier'],
    ex: [
      { t: 'mcq', q: 'Precificar uma put down-and-in de autocall com a vol ATM (vol flat) tende a:', o: ['Superestimar o preço', 'Subestimar o preço (a vol perto da barreira baixa é maior pelo skew)', 'Acertar', 'Zerar o preço'], a: 1, e: 'Skew negativo: vol maior em níveis baixos ⇒ mais chance de knock-in.' },
      { tag: 'barreiras-adv', gen: R => { const S = 100, K = 100, H = R.pick([60, 65, 70]), T = 1, r = 0.04, v1 = R.f(0.18, 0.22, 2), v2 = v1 + R.f(0.04, 0.1, 2); const a = Q.barrier('pdi', S, K, H, T, r, 0, v2, 0) - Q.barrier('pdi', S, K, H, T, r, 0, v1, 0); return { q: `Put down-and-in S=K=100, H=${H}, T=1, r=4%. Diferença de preço entre usar vol ${F.p(v2, 0)} (vol "perto da barreira") e ${F.p(v1, 0)} (vol ATM)?`, a, tol: 0.02, tolAbs: 0.02, dec: 3, e: `PDI(${F.p(v2, 0)}) − PDI(${F.p(v1, 0)}) = ${Q.fmt(a, 3)} por 100 de nocional — enorme em livros grandes.` }; } },
      { t: 'mcq', q: 'O que é uma "reserva" de exóticas?', o: ['Um depósito na OCC', 'Um ajuste conservador sobre o preço de modelo para riscos difíceis de hedgear (modelo, liquidez, barreira)', 'Um tipo de rebate', 'O prêmio do cliente'], a: 1, e: 'Protege o PnL de riscos não capturados.' }
    ],
    cards: [['Barreira e skew', 'Vol perto da barreira importa: vol flat subprecifica DIPs.'], ['Reservas', 'Model, liquidity, barrier shift, concentration.']]
  },
  {
    id: 'us4-2', title: 'Reverse convertibles', tag: 'revconv',
    goal: 'Decompor reverse convertibles (com e sem barreira) e calcular o cupom.',
    body: String.raw`
<p>Um <b>reverse convertible</b> paga um cupom alto; no vencimento o investidor recebe o nocional de volta <b>se</b> a ação estiver acima do strike — senão, recebe ações (ou o equivalente em dinheiro), absorvendo a queda.</p>
\[ \text{Reverse convertible} = \text{Zero-cupom (+ cupom)} - \text{Put}(K). \]
<p>O investidor <b>vende uma put</b> ao banco e o prêmio financia o cupom extra. Cupom anual ≈ taxa de juros + prêmio da put anualizado (menos margem).</p>
<h3>Barrier reverse convertible (BRC)</h3>
<p>Mais popular: a perda só ocorre se a ação tiver tocado uma barreira (ex.: 70%) durante a vida (ou no vencimento, se "europeia") <b>e</b> terminar abaixo do strike. Isso é vender uma <b>put down-and-in</b>. Cupom menor que o RC puro, "proteção" até a barreira.</p>
<div class="w" data-w="barrier" data-a='{"kind":"pdi","K":100,"H":70,"days":252,"title":"Put down-and-in 100/70 (1 ano) — a que o investidor vende"}'></div>
<h3>Risco para a mesa</h3>
<p>A mesa fica <b>comprada</b> na put (DI). Resultado: long vega (sobretudo em strikes baixos), long skew, long gamma longe da barreira — mas perto da barreira, perto do vencimento, a DIP pode ficar short gamma e com vega negativo. O fluxo agregado de BRCs/autocalls deixa dealers <b>compridos em vol</b> de longo prazo, que eles reciclam vendendo vol listada — um dos motivos pelos quais vol longa e skew de índices europeus e asiáticos às vezes ficam "achatados".</p>`,
    desk: String.raw`"BRC 70% barrier, 9% coupon." "The investor is short a down-and-in put." "Street is long vol from structured issuance." "European barrier" = observada só no vencimento.`,
    refs: [R_.hull('11.1', 'Principal-protected notes'), R_.wil('29.4', 'Knockout options (term sheet)'), R_.wil(23, 'Barrier options')],
    sims: ['barrier?kind=pdi', 'struct?preset=Put down-and-in (a do autocall)'],
    ex: [
      { tag: 'revconv', gen: R => { const r = R.f(0.03, 0.05, 3), put = R.f(4, 12, 2), m = R.f(0.5, 1.5, 2); const a = (r * 100 + put - m); return { q: `RC de 1 ano: juros de 1 ano ${F.p(r, 1)}, a put ATM de 1 ano vale ${Q.fmt(put, 2)}% do nocional, margem do banco ${Q.fmt(m, 2)}%. Cupom aproximado (% a.a.)? (ignore o desconto do prêmio)`, a, tol: 0.003, unit: '%', dec: 2, e: `≈ juros + prêmio − margem = ${Q.fmt(r * 100, 2)} + ${Q.fmt(put, 2)} − ${Q.fmt(m, 2)} = ${Q.fmt(a, 2)}%.` }; } },
      { tag: 'revconv', gen: R => { const K = 100, H = 70, cup = R.f(6, 12, 1), ST = R.f(50, 120, 1), hit = ST < 70 ? true : R.pick([true, false]); const a = (ST >= K || !hit) ? 100 + cup : ST + cup; return { q: `BRC: nocional 100, strike 100, barreira 70 (contínua), cupom ${Q.fmt(cup, 1)}%. A ação ${hit ? 'tocou' : 'nunca tocou'} a barreira e terminou em ${Q.fmt(ST, 1)}. Quanto o investidor recebe no total (principal + cupom, em % do nocional)?`, a, tolAbs: 0.01, unit: '%', dec: 1, e: `${(ST >= K || !hit) ? 'Sem knock-in efetivo (ou acima do strike): recebe 100 + cupom.' : 'Knock-in e abaixo do strike: recebe S_T/S_0 × 100 + cupom.'} = ${Q.fmt(a, 1)}.` }; } },
      { t: 'mcq', q: 'Em um barrier reverse convertible, o investidor está:', o: ['Comprado numa call', 'Vendido numa put down-and-in', 'Comprado numa put', 'Vendido numa call up-and-out'], a: 1, e: 'Por isso recebe cupom alto.' },
      { t: 'mcq', q: 'O fluxo de emissão de BRCs/autocalls deixa os dealers:', o: ['Vendidos em vol longa', 'Comprados em vol longa (e em skew)', 'Neutros', 'Vendidos em juros'], a: 1, e: 'Dealers compram as DIPs dos investidores.' }
    ],
    cards: [['Reverse convertible', 'Zero-cupom + cupom − put: investidor vende put.'], ['BRC', 'Investidor vende put down-and-in.'], ['Fluxo de estruturados', 'Deixa dealers long vol/skew de prazos longos.']]
  },
  {
    id: 'us4-3', title: 'Autocallables', tag: 'autocall',
    goal: 'Entender a mecânica de um autocallable (Phoenix, memória, knock-in) e seus riscos.',
    body: String.raw`
<p>O produto estruturado mais vendido do mundo. Mecânica típica (1 ação ou índice, 3 anos, observações trimestrais):</p>
<ol><li><b>Autocall</b>: em cada data, se o ativo ≥ 100% do inicial, o produto é encerrado e paga nocional + cupom.</li>
<li><b>Cupom condicional (Phoenix)</b>: paga o cupom se o ativo ≥ barreira de cupom (ex.: 70%), mesmo sem autocall. Com <b>memória</b>, cupons não pagos são pagos depois, se a condição voltar.</li>
<li><b>Proteção</b>: no vencimento, se não houve autocall e o ativo está abaixo da barreira de capital (ex.: 60%), o investidor perde como a ação (put down-and-in). Acima dela, recebe o nocional.</li></ol>
<h3>Decomposição</h3>
<p>Investidor: vendido numa put down-and-in (a fonte principal do cupom) + comprado em digitais (cupons) + a característica de autocall (que encurta o prazo esperado). Banco: o oposto.</p>
<h3>Riscos para a mesa</h3>
<ul><li><b>Vega/skew</b>: comprado em vol de strikes baixos (DIP); vendido em digitais de cupom (skew). Líquido tipicamente long vega e long skew no início.</li>
<li><b>Gamma/vega mudam de sinal</b> conforme o spot se aproxima da barreira de capital e do vencimento. Perto de 60% no fim da vida, a DIP é um "penhasco" → gamma e delta gigantes.</li>
<li><b>Autocall ("call risk")</b>: perto de 100% em datas de observação, o produto vira uma digital — pin risk.</li>
<li><b>Dividendos</b> (forward), <b>juros</b>, <b>correlação</b> (worst-of).</li></ul>
<h3>Worst-of</h3>
<p>Autocallables sobre 3 ações pagam com base no <b>pior desempenho</b>. A put worst-of vale mais quando a correlação é <b>baixa</b> (mais chance de um dos papéis despencar): o investidor recebe cupom maior por aceitar isso. O banco, comprado na put worst-of, ganha se a correlação cair e perde se ela subir — é <b>vendido em correlação</b> via esse livro, e pode hedgear comprando correlação (por exemplo, vendendo dispersão). Esse risco de correlação é um dos mais difíceis de hedgear em mesas de exóticas.</p>`,
    desk: String.raw`"Phoenix with memory, 60% European KI, 3 worst-of." "The book gets short gamma as the KI approaches." "Autocall probability", "expected life". "Correlation risk from worst-ofs".`,
    refs: [R_.hull(25, 'Exotic options'), R_.wil(11, 'Multi-asset options'), R_.wil(80, 'Monte Carlo simulation'), R_.wil(29, 'Equity and FX term sheets')],
    sims: ['book', 'barrier?kind=pdi'],
    ex: [
      { tag: 'autocall', gen: R => { const obs = [R.f(0.85, 1.15, 3), R.f(0.8, 1.2, 3), R.f(0.75, 1.25, 3), R.f(0.7, 1.3, 3)], cup = R.pick([2, 2.5, 3]); let paid = 0, memo = 0, called = -1; for (let i = 0; i < 4; i++) { if (obs[i] >= 0.7) { paid += cup + memo; memo = 0; } else memo += cup; if (obs[i] >= 1) { called = i; break; } } const a = paid; return { q: `Phoenix com memória: cupom ${cup}% por trimestre se ativo ≥ 70%; autocall se ≥ 100%. Níveis nas observações: ${obs.map(x => Q.fmt(x * 100, 1) + '%').join(', ')}. Total de cupons pagos (em % do nocional) até o autocall ou até a 4ª observação?`, a, tolAbs: 0.01, unit: '%', dec: 1, e: `Siga as datas: paga cupom (+ memória) quando ≥ 70%; para no primeiro ≥ 100%${called >= 0 ? ' (autocall na obs. ' + (called + 1) + ')' : ''}. Total = ${Q.fmt(a, 1)}%.` }; } },
      { t: 'mcq', q: 'Na put worst-of do autocall, a mesa (compradora da put) está:', o: ['Comprada em correlação', 'Vendida em correlação (ganha se a correlação cair)', 'Neutra', 'Comprada em juros'], a: 1, e: 'A put worst-of vale mais com correlação baixa; quem é comprado nela ganha quando a correlação cai.' },
      { t: 'mcq', q: 'Perto do vencimento, com o ativo em 62% e barreira de capital em 60%, o livro do banco tem:', o: ['Gregas pequenas', 'Delta e gamma enormes e instáveis (penhasco da DIP)', 'Só theta', 'Só rho'], a: 1, e: 'A DIP vira quase uma digital de grande valor.' },
      { t: 'mcq', q: 'Por que autocallables "encurtam" o risco do banco quando o mercado sobe?', o: ['Porque os cupons param', 'Porque o produto é chamado (autocall) e todo o risco (vega, DIP) desaparece', 'Porque a vol sobe', 'Não encurtam'], a: 1, e: 'Rally ⇒ autocall ⇒ o banco perde a vega que tinha comprado (vira short vega em rallies).' }
    ],
    cards: [['Autocall', 'Encerra antecipadamente se o ativo ≥ nível de call nas observações.'], ['Phoenix com memória', 'Cupom condicional; cupons perdidos são pagos depois se a condição voltar.'], ['Worst-of', 'Paga pelo pior ativo; put worst-of vale mais com correlação baixa.']]
  },
  {
    id: 'us4-4', title: 'Cliquets, forward-starts e o risco de forward skew', tag: 'cliquet',
    goal: 'Conhecer produtos que dependem do smile futuro e por que são difíceis de precificar.',
    body: String.raw`
<p>Uma <b>forward-start</b> é uma opção cujo strike será fixado numa data futura \(t_1\) como % do spot daquela data (ex.: call ATM que começa em 6 meses e vence em 1 ano). No BS, seu valor é homogêneo: \(S_0 e^{-q t_1}\times c(1, k, T - t_1)\) — depende da <b>vol forward</b>, não do spot.</p>
<p>Um <b>cliquet</b> é uma sequência de forward-starts: paga a soma dos retornos periódicos, cada um limitado (local cap/floor), às vezes com cap/floor global. Popular em produtos de varejo e seguradoras.</p>
\[ \text{Payoff} = \max\Big(F_g,\ \min\Big(C_g,\ \sum_i \max\big(f_\ell, \min(c_\ell, R_i)\big)\Big)\Big),\quad R_i = S_{t_i}/S_{t_{i-1}} - 1. \]
<h3>O problema</h3>
<p>O valor depende do <b>smile futuro</b> (o skew que existirá em cada período). Vol local prevê um forward skew muito achatado; vol estocástica, um mais realista. A diferença de preço pode ser grande. Foi assim que várias mesas perderam dinheiro com cliquets nos anos 2000: modelaram com vol local e ficaram expostas ao forward skew e à vol da vol.</p>
<h3>Lição geral</h3>
<p>Antes de precificar qualquer exótica, pergunte: <b>de que parte da superfície (hoje e no futuro) este produto depende?</b> Isso define o modelo, as reservas e o hedge.</p>`,
    desk: String.raw`"Forward vol", "forward skew", "vol of vol exposure", "reset". "Cliquet blow-up" é um caso clássico citado em comitês de risco.`,
    refs: [R_.hull('25.4', 'Forward start options'), R_.hull('25.5', 'Cliquet options'), R_.wil('28.2', 'Forward-start options'), R_.wil(56, 'Volatility case study: the cliquet option')],
    ex: [
      { tag: 'cliquet', gen: R => { const rs = [R.f(-0.1, 0.12, 3), R.f(-0.1, 0.12, 3), R.f(-0.1, 0.12, 3), R.f(-0.1, 0.12, 3)], c = 0.05, f = 0; const s = rs.reduce((a, x) => a + Math.max(f, Math.min(c, x)), 0); const a = Math.max(0, s) * 100; return { q: `Cliquet trimestral de 1 ano: cada retorno trimestral limitado entre 0% e 5% (local floor/cap), soma com floor global 0%. Retornos: ${rs.map(x => Q.fmt(x * 100, 1) + '%').join(', ')}. Payoff (% do nocional)?`, a, tolAbs: 0.01, unit: '%', dec: 1, e: `Σ max(0, min(5%, Rᵢ)) = ${Q.fmt(s * 100, 1)}% ⇒ payoff ${Q.fmt(a, 1)}%.` }; } },
      { t: 'mcq', q: 'O preço de uma forward-start ATM no Black-Scholes depende principalmente de:', o: ['Spot atual', 'Vol forward entre t1 e T', 'Dividendos passados', 'Strike absoluto'], a: 1, e: 'Por homogeneidade, o spot se cancela (exceto dividendos até t1).' },
      { t: 'mcq', q: 'Por que vol local tende a subprecificar riscos de cliquets?', o: ['Porque ignora juros', 'Porque gera um forward skew achatado', 'Porque não calibra vanillas', 'Porque é muito lenta'], a: 1, e: 'O smile futuro em vol local se achata.' }
    ],
    cards: [['Forward-start', 'Strike fixado no futuro como % do spot; depende da vol forward.'], ['Cliquet', 'Soma de retornos periódicos com caps/floors locais e globais.'], ['Forward skew', 'Smile que existirá no futuro; modelo-dependente.']]
  }
  ]
});

/* ---------------- US5 — Microestrutura e market making ---------------- */
Course.unit('us', {
  id: 'us5', title: 'Microestrutura e market making',
  desc: 'Como um market maker de opções cota, ajusta por inventário e gerencia fluxo; posicionamento de dealers (gamma exposure), pin risk e vencimento; OTC vs listado.',
  sims: ['hedge', 'book'], exam: { n: 10, minutes: 20 },
  lessons: [
  {
    id: 'us5-1', title: 'Market making em opções: cotação em vol, edge e inventário', tag: 'mm',
    goal: 'Entender como um market maker cota, onde está o edge e como o inventário muda a cotação.',
    body: String.raw`
<p>Um market maker de opções (Citadel Securities, Susquehanna, Optiver, bancos…) cota milhares de séries ao mesmo tempo. O processo:</p>
<ol><li><b>Superfície teórica</b>: um modelo de vol (SVI/paramétrico) calibrado continuamente, com forward e juros corretos.</li>
<li><b>Bid/ask em vol</b> ao redor do teórico, convertido para preço. Largura depende de liquidez do ativo, vega da série e risco de seleção adversa.</li>
<li><b>Skew de inventário</b>: se o livro está muito vendido em vega de um vencimento, o market maker sobe bid e ask daquele vencimento (quer comprar, não quer vender mais).</li>
<li><b>Hedge</b>: delta imediatamente (ação/futuro); vega e gamma ao longo do tempo, com outras opções.</li></ol>
<h3>Edge e seleção adversa</h3>
<p>Edge por negócio = distância do preço negociado ao teórico × quantidade. O inimigo é o <b>fluxo informado</b>: quem compra calls antes de uma aquisição. Market makers segmentam o fluxo (varejo tende a ser pouco informado, por isso há pagamento por fluxo — PFOF — nos EUA) e alargam o spread em eventos.</p>
<h3>Métricas</h3>
<ul><li><b>Edge capturado</b> vs <b>PnL de hedge</b> (o que o mercado fez com o inventário).</li>
<li>Giro de inventário, vega por vencimento, gamma curto concentrado.</li></ul>`,
    desk: String.raw`"We're making markets 0.3 vol wide." "Skewing our quote." "Toxic flow." "Edge vs theo." "Lean on the bid".`,
    refs: [R_.hull('9.5', 'Trading (market makers)'), R_.hull('18.10', 'The realities of hedging')],
    ex: [
      { tag: 'mm', gen: R => { const theo = R.f(20, 30, 1), w = R.pick([0.4, 0.6, 1]), inv = R.pick([-1, 1]), sk = R.pick([0.2, 0.3, 0.5]); const mid = theo + (inv < 0 ? sk : -sk); const a = mid + w / 2; return { q: `Vol teórica ${Q.fmt(theo, 1)}. Você cota ${Q.fmt(w, 1)} vol de largura e, como está muito ${inv < 0 ? 'vendido' : 'comprado'} em vega desse vencimento, desloca o mid ${Q.fmt(sk, 1)} vol ${inv < 0 ? 'para cima' : 'para baixo'}. Qual o seu ask (em vol)?`, a, tolAbs: 0.01, dec: 2, e: `Mid = ${Q.fmt(mid, 2)}; ask = mid + ${Q.fmt(w / 2, 2)} = ${Q.fmt(a, 2)}.` }; } },
      { tag: 'mm', gen: R => { const n = R.int(10, 200), vg = R.f(0.05, 0.5, 2), e = R.f(0.1, 0.5, 2); const a = n * 100 * vg * e; return { q: `Você vende ${n} contratos (multiplicador 100) com vega de US$ ${Q.fmt(vg, 2)} por ação por ponto, a ${Q.fmt(e, 2)} vol acima do teórico. Edge em US$?`, a, tol: 0.002, unit: 'US$', dec: 2, e: `${n}×100×${Q.fmt(vg, 2)}×${Q.fmt(e, 2)} = ${Q.fmt(a, 0)}.` }; } },
      { t: 'mcq', q: 'O maior risco de um market maker que cota spreads apertados é:', o: ['Theta', 'Seleção adversa (fluxo informado)', 'Dividendos', 'Juros'], a: 1, e: 'Negociar contra quem sabe mais.' }
    ],
    cards: [['Skew de inventário', 'Deslocar o mid para desestimular o lado que aumenta o risco.'], ['Seleção adversa', 'Risco de negociar contra fluxo informado.'], ['PFOF', 'Pagamento por fluxo de varejo (EUA).']]
  },
  {
    id: 'us5-2', title: 'Fluxo de clientes e posicionamento de dealers (GEX)', tag: 'gex',
    goal: 'Entender como o fluxo agregado cria posições dos dealers e como o hedge delas pode afetar o mercado.',
    body: String.raw`
<p>Os fluxos estruturais de clientes deixam os dealers com posições previsíveis:</p>
<table><tr><th>Fluxo</th><th>Cliente</th><th>Dealer fica</th></tr>
<tr><td>Overwriting (venda de calls)</td><td>vende calls OTM</td><td>long calls (long gamma na alta)</td></tr>
<tr><td>Proteção de carteira</td><td>compra puts</td><td>short puts (short gamma na queda)</td></tr>
<tr><td>Estruturados (autocalls)</td><td>vende DIPs</td><td>long vol longa/skew</td></tr>
<tr><td>0DTE especulativo</td><td>compra/vende gamma de curtíssimo prazo</td><td>varia no dia</td></tr></table>
<h3>Gamma exposure (GEX)</h3>
<p>Estimativas públicas somam o gamma que os dealers teriam supondo que estão do outro lado do open interest. A ideia:</p>
<ul><li><b>Dealers long gamma</b>: hedgeiam vendendo na alta e comprando na queda → amortecem o movimento → mercado "preso", vol realizada baixa, pinning em strikes grandes.</li>
<li><b>Dealers short gamma</b>: hedgeiam comprando na alta e vendendo na queda → amplificam o movimento → vol realizada maior, movimentos de tendência.</li></ul>
<p>Cuidado: GEX público é uma estimativa com hipóteses fortes (quem está de qual lado). Mas o mecanismo é real e explica parte da dinâmica intradiária, especialmente perto de grandes vencimentos.</p>
<h3>Vanna e charm flows</h3>
<p>Quando a vol cai (após evento), o delta das puts vendidas pelos dealers encolhe (vanna) → dealers recompram hedges vendidos → pressão compradora ("vanna rally"). Perto do vencimento, charm faz o delta decair com o tempo → fluxos de rebalanceamento previsíveis ("charm flows").</p>`,
    desk: String.raw`"Dealers are long gamma above 5,000, short below." "Gamma flip level." "Vanna/charm tailwind into OpEx." "OpEx week", "window of weakness".`,
    refs: [R_.hull('18.13', 'Portfolio insurance'), R_.hull('18.14', 'Stock market volatility'), R_.wil(61, 'The feedback effect of hedging in illiquid markets'), R_.der(29, 'the feedback effect of hedging in illiquid markets')],
    ex: [
      { t: 'mcq', q: 'Se os dealers estão agregadamente long gamma, o efeito esperado do hedge deles é:', o: ['Amplificar movimentos', 'Amortecer movimentos (vendem na alta, compram na queda)', 'Nenhum', 'Aumentar juros'], a: 1, e: 'Long gamma hedgeia contra o movimento.' },
      { t: 'mcq', q: 'Investidores comprando muitas puts de proteção tendem a deixar os dealers:', o: ['Long gamma na queda', 'Short gamma na queda', 'Sem gamma', 'Long vega longa'], a: 1, e: 'Dealers vendidos em puts: short gamma quando o mercado cai.' },
      { tag: 'gex', gen: R => { const G = R.int(-40, 40) * 1e8, mv = R.pick([1, 2]); const a = -G * mv; return { q: `Estimativa: dealers têm gamma agregado de US$ ${Q.fmt(G / 1e9, 1)} bi de delta por 1% de move do S&P. O índice sobe ${mv}%. Quanto os dealers precisam negociar (em US$ bi; + compra, − venda) para voltar ao delta-neutro?`, a: a / 1e9, tol: 0.001, tolAbs: 0.05, unit: 'US$ bi', dec: 1, e: `Novo delta = ${Q.fmt(G / 1e9, 1)} × ${mv} = ${Q.fmt(G * mv / 1e9, 1)} bi ⇒ negociar ${Q.fmt(a / 1e9, 1)} bi (${a < 0 ? 'vendem na alta: amortecem' : 'compram na alta: amplificam'}).` }; } }
    ],
    cards: [['Dealers long gamma', 'Hedge amortece movimento; vol realizada baixa.'], ['Dealers short gamma', 'Hedge amplifica movimento.'], ['Vanna flow', 'Queda de vol reduz delta de puts vendidas ⇒ dealers recompram hedge.']]
  },
  {
    id: 'us5-3', title: 'Vencimento: pin risk, exercício e 0DTE', tag: 'expiry',
    goal: 'Gerenciar o dia do vencimento: pin risk, exercício, assignment e o gamma extremo de 0DTE.',
    body: String.raw`
<p>O dia do vencimento concentra riscos específicos:</p>
<ul><li><b>Pin risk</b>: spot fechando colado num strike onde você tem posição vendida grande. Você não sabe se será exercido (assignment) — e portanto qual será o seu delta na segunda-feira. Com opções de entrega física (ações, SPY), acordar com 100 mil ações a mais ou a menos é risco real de fim de semana.</li>
<li><b>Exercício pós-fechamento</b>: titulares podem decidir exercer (ou não) com base em notícias after-hours, até o cut-off. Uma opção "ligeiramente OTM" no fechamento pode ser exercida.</li>
<li><b>AM settlement</b> (SPX mensal): o valor final vem dos preços de abertura de sexta; entre o fechamento de quinta e a abertura, você não pode hedgear.</li></ul>
<h3>0DTE</h3>
<p>No dia do vencimento, uma opção ATM tem gamma muito alto: com poucas horas restantes, \(\Gamma \propto 1/\sqrt{T}\) explode. Um livro short 0DTE gamma precisa rebalancear em minutos. O theta intradiário é enorme (a opção perde valor a cada hora). Market makers cobram mais caro nas últimas horas ou reduzem tamanho.</p>
<h3>Práticas</h3>
<ol><li>Reduzir posições vendidas em strikes com grande open interest antes do fechamento.</li>
<li>Comprar de volta opções "pin" baratas (centavos) para eliminar a incerteza.</li>
<li>Planejar o delta de segunda-feira para cada cenário de exercício.</li></ol>`,
    desk: String.raw`"Pinned at 5,000." "Buy back the pennies." "After-hours exercise decisions." "Assignment risk." "Gamma is exploding into the close".`,
    refs: [R_.hull('9.4', 'Specification of stock options (expiration, exercise)'), R_.hull('18.6', 'Gamma')],
    sims: ['bs'],
    ex: [
      { tag: 'expiry', gen: R => { const h = R.pick([1, 2, 4]), s = R.f(0.12, 0.25, 2), S = R.step(4500, 6000, 50); const T = h / (252 * 6.5); const g = Q.bs('call', S, S, T, 0.04, 0, s).gamma; const a = g * S * 0.001 * 100; return { q: `SPX a ${S}, call ATM com ${h}h até o fechamento (T = ${h}/(252×6,5) anos), vol ${F.p(s, 0)}. Em quanto muda o delta (em unidades de índice, ×100 para %) num move de 0,1%? Responda Γ·S·0,1% em pontos percentuais de delta.`, a, tol: 0.02, unit: 'pp', dec: 2, e: `Γ = ${Q.fmt(g, 6)} ⇒ Γ·S·0,001 = ${Q.fmt(g * S * 0.001, 4)} = ${Q.fmt(a, 2)} pontos percentuais de delta por 0,1% de move.` }; } },
      { t: 'mcq', q: 'Você está vendido em 5.000 calls de SPY no strike 500 e o SPY fecha a 500,02 na sexta. O risco principal é:', o: ['Theta', 'Não saber quantas serão exercidas: incerteza de delta no fim de semana (pin risk)', 'Vega', 'Rho'], a: 1, e: 'Assignment incerto ⇒ posição em ações incerta.' },
      { t: 'mcq', q: 'Por que SPX mensal (AM-settled) tem um risco "gap" específico?', o: ['Porque é americano', 'Porque o valor final é definido pela abertura do dia, sem chance de hedge entre o fechamento anterior e a abertura', 'Porque não tem vega', 'Porque é físico'], a: 1, e: 'O SOQ é determinado na abertura.' }
    ],
    cards: [['Pin risk', 'Incerteza de exercício com spot colado no strike.'], ['AM settlement', 'Valor final pela abertura (SOQ).'], ['0DTE gamma', 'Γ ∝ 1/√T explode nas últimas horas.']]
  },
  {
    id: 'us5-4', title: 'OTC vs listado: ISDA, colateral e XVA', tag: 'otc',
    goal: 'Entender as diferenças contratuais e de risco entre derivativos de balcão e listados.',
    body: String.raw`
<table><tr><th></th><th>Listado</th><th>OTC</th></tr>
<tr><td>Contrato</td><td>padronizado</td><td>customizado (ISDA + confirmação)</td></tr>
<tr><td>Contraparte</td><td>clearing (OCC/B3)</td><td>bilateral (ou clearing para alguns produtos)</td></tr>
<tr><td>Colateral</td><td>margem da clearing</td><td>CSA (Credit Support Annex): margem de variação e inicial</td></tr>
<tr><td>Transparência</td><td>preços públicos</td><td>preço negociado</td></tr>
<tr><td>Produtos</td><td>vanillas curtas/médias</td><td>longos, exóticos, nocionais grandes</td></tr></table>
<h3>ISDA e CSA</h3>
<p>O <b>ISDA Master Agreement</b> é o contrato-mãe entre duas instituições: eventos de default, netting (compensação de todas as operações em caso de default), terminação. O <b>CSA</b> define colateral: o que é aceito, thresholds, frequência de chamada. Regras pós-2008 (UMR) exigem margem inicial para derivativos não compensados entre grandes participantes.</p>
<h3>XVA</h3>
<p>O preço "justo" de um OTC inclui ajustes: <b>CVA</b> (risco de crédito da contraparte), <b>DVA</b> (o próprio), <b>FVA</b> (custo de financiar o colateral não recebido), <b>MVA</b> (custo da margem inicial), <b>KVA</b> (custo de capital). Uma mesa de equity cobra do cliente sem CSA um preço diferente do cliente com CSA diário.</p>
<p>No Brasil, o análogo são os derivativos de balcão registrados (B3/CETIP) com ou sem garantia — com os mesmos conceitos.</p>`,
    desk: String.raw`"Do we have an ISDA/CSA with them?" "Uncollateralized, add CVA/FVA." "Novation". "Unwind the trade" = desfazer a operação OTC com o cliente.`,
    refs: [R_.hull('23.7', 'Credit risk in derivatives transactions (CVA)'), R_.hull('23.8', 'Credit risk mitigation'), R_.hull('2.5', 'OTC markets'), R_.wil(40, 'Credit risk'), R_.cqf(6, 'risco de crédito e CVA')],
    ex: [
      { t: 'mcq', q: 'O que o CSA de um ISDA define?', o: ['O modelo de precificação', 'As regras de colateral (o que, quanto, quando)', 'A vol implícita', 'O IR'], a: 1, e: 'Credit Support Annex = colateral.' },
      { t: 'mcq', q: 'O CVA é um ajuste pelo:', o: ['Risco de crédito da contraparte', 'Custo de capital', 'Risco de modelo', 'Dividendo'], a: 0, e: 'Credit Valuation Adjustment.' },
      { tag: 'otc', gen: R => { const EE = R.int(1, 20) * 1e6, pd = R.f(0.005, 0.03, 3), lgd = R.pick([0.6, 0.4]); const a = EE * pd * lgd; return { q: `Aproximação simples de CVA: exposição esperada média US$ ${Q.fmt(EE, 0)}, probabilidade de default no prazo ${F.p(pd, 1)}, LGD ${Q.fmt(lgd * 100, 0)}%. CVA ≈ EE × PD × LGD?`, a, tol: 0.001, unit: 'US$', dec: 0, e: `${Q.fmt(EE, 0)} × ${Q.fmt(pd, 3)} × ${lgd} = ${Q.fmt(a, 0)}.` }; } }
    ],
    cards: [['ISDA', 'Contrato-mãe de derivativos OTC (default, netting).'], ['CSA', 'Anexo de colateral do ISDA.'], ['XVA', 'CVA, DVA, FVA, MVA, KVA: ajustes ao preço OTC.']]
  }
  ]
});

/* ---------------- US6 — Livro de risco avançado ---------------- */
Course.unit('us', {
  id: 'us6', title: 'Gestão do livro: buckets, stress, PnL explain e capital',
  desc: 'Vega por bucket e ponderada, risco de skew e term structure, stress históricos, PnL explain completo (incluindo dividendos e borrow), limites, VaR/ES e um caso de gestão de um livro de autocalls.',
  sims: ['book'], exam: { n: 12, minutes: 25 },
  lessons: [
  {
    id: 'us6-1', title: 'Gregas por bucket: vega ladder, vega ponderada e skew risk', tag: 'buckets',
    goal: 'Ler um relatório de risco com gregas distribuídas por vencimento e strike.',
    body: String.raw`
<p>Um número único de vega esconde muito. Um livro com +1 mi de vega em 1 mês e −1 mi em 1 ano tem "vega zero" — e perde dinheiro se a curva de vol inclinar. Por isso o risco é reportado em <b>buckets</b>:</p>
<ul><li><b>Vega ladder</b> por vencimento (1M, 3M, 6M, 1A, 2A…).</li>
<li><b>Vega ponderada</b>: vol curta se move mais que a longa. Empiricamente, movimentos de vol escalam com ~\(1/\sqrt{T}\). Normaliza-se para um prazo de referência (ex.: 3M): \(\mathcal{V}_{w} = \mathcal{V}\times\sqrt{T_{ref}/T}\).</li>
<li><b>Skew risk</b>: sensibilidade a uma rotação do smile (ex.: +1 ponto no RR 25Δ, ou "vega por strike" em buckets de moneyness).</li>
<li><b>Curvatura/volga</b>: sensibilidade a movimentos das asas.</li>
<li><b>Gamma por strike</b> e por vencimento: onde está a concentração perto do spot e do vencimento.</li></ul>
<h3>Como hedgear</h3>
<p>Casar o vega por bucket com opções líquidas de cada vencimento; o skew com risk reversals; a curvatura com strangles/borboletas. O resíduo (vencimentos sem liquidez, strikes muito OTM) fica com limites e reservas.</p>
<p>No simulador, aba "Ladders", compare a vega bruta e a ponderada dos diferentes livros.</p>`,
    desk: String.raw`"Flat weighted vega but long the back end." "Skew-neutral." "Bucketed vega report." "We're short 3m, long 1y — a steepener".`,
    refs: [R_.hull('18.8', 'Vega'), R_.hull('19.6', 'Greek letters (volatility surface)'), R_.wil(50, 'Deterministic volatility surfaces')],
    sims: ['book'],
    ex: [
      { tag: 'buckets', gen: R => { const v1 = R.int(-500, 500) * 1000, v2 = R.int(-500, 500) * 1000, T1 = 1 / 12, T2 = 1; const a = v1 * Math.sqrt(0.25 / T1) + v2 * Math.sqrt(0.25 / T2); return { q: `Vega: ${Q.fmt(v1, 0)} em 1 mês e ${Q.fmt(v2, 0)} em 1 ano (por ponto). Vega ponderada total normalizada a 3M (fator √(0,25/T))?`, a, tol: 0.003, tolAbs: 10, dec: 0, e: `${Q.fmt(v1, 0)}×√3 + ${Q.fmt(v2, 0)}×0,5 = ${Q.fmt(a, 0)}.` }; } },
      { t: 'mcq', q: 'Um livro com +1 mi de vega em 1M e −1 mi em 1A ganha se:', o: ['A vol curta subir mais que a longa', 'A vol longa subir mais que a curta', 'Ambas caírem igual', 'Nunca'], a: 0, e: 'Comprado no curto, vendido no longo: ganha se o curto subir relativamente.' },
      { t: 'mcq', q: 'Para neutralizar exposição a skew (RR), a ferramenta natural é:', o: ['Straddles', 'Risk reversals', 'Futuros', 'DI1'], a: 1, e: 'RR isola a inclinação.' }
    ],
    cards: [['Vega ponderada', '𝒱·√(T_ref/T)'], ['Vega ladder', 'Vega por bucket de vencimento.'], ['Skew risk', 'Sensibilidade a rotação do smile (RR).']]
  },
  {
    id: 'us6-2', title: 'Stress testing: cenários históricos e hipotéticos', tag: 'stress',
    goal: 'Desenhar e interpretar stress tests para um livro de opções.',
    body: String.raw`
<p>Cenários de stress combinam choque de spot, de vol (com formato: curto sobe mais que longo, skew empina) e às vezes de correlação e dividendos. Exemplos históricos (S&amp;P):</p>
<table><tr><th>Evento</th><th>Spot</th><th>Vol</th></tr>
<tr><td>Black Monday (19/10/1987)</td><td>≈ −20% num dia</td><td>explosão</td></tr>
<tr><td>Lehman (set–out/2008)</td><td>−30% em semanas</td><td>VIX a ~80</td></tr>
<tr><td>Flash crash (06/05/2010)</td><td>−9% intradiário</td><td>salto curto</td></tr>
<tr><td>Volmageddon (05/02/2018)</td><td>−4%</td><td>VIX +20 pts num dia</td></tr>
<tr><td>Covid (mar/2020)</td><td>−34% em ~1 mês</td><td>VIX > 80</td></tr></table>
<h3>Boas práticas</h3>
<ul><li><b>Full revaluation</b>, não gregas.</li>
<li><b>Formato de vol</b>: aplicar choques por vencimento (ex.: +20 no 1M, +10 no 1A) e empinar o skew.</li>
<li><b>Liquidez</b>: supor que você só consegue desmontar parte da posição por dia.</li>
<li><b>Reverse stress test</b>: qual cenário zera o capital da mesa? Isso revela concentrações escondidas (barreiras, correlação).</li>
<li><b>Cenários "para cima"</b> também: um rally forte com vol caindo é doloroso para quem está long vol e pode disparar autocalls em massa.</li></ul>
<p>No simulador, a aba "Stress" compara full reval com a aproximação por gregas — a diferença é o risco de ordem superior.</p>`,
    desk: String.raw`"What's our 87-style number?" "Reverse stress", "stress limit", "liquidity horizon". "The grid looks fine until −15%, then the barriers kick in".`,
    refs: [R_.hull('21.8', 'Stress testing and back testing'), R_.wil(43, 'CrashMetrics'), R_.wil(58, 'Crash modeling'), R_.cqf(2, 'risco, VaR e stress')],
    sims: ['book'],
    ex: [
      { t: 'mcq', q: 'Por que usar full revaluation em stress tests de opções?', o: ['É mais barato', 'Gregas são aproximações locais que falham em choques grandes', 'É exigido só no Brasil', 'Gregas não existem em crise'], a: 1, e: 'Não linearidades de ordem superior dominam em choques grandes.' },
      { t: 'mcq', q: 'O que é um reverse stress test?', o: ['Rodar o stress de trás para frente no tempo', 'Encontrar o cenário que causaria uma perda inaceitável', 'Um stress com vol caindo', 'Um backtest'], a: 1, e: 'Parte da perda e procura o cenário.' },
      { tag: 'stress', gen: R => { const v1 = -R.int(100, 400) * 1000, v2 = -R.int(100, 400) * 1000, s1 = R.pick([15, 20, 25]), s2 = R.pick([5, 8, 10]); const a = v1 * s1 + v2 * s2; return { q: `Livro short vega: ${Q.fmt(v1, 0)}/pt no 1M e ${Q.fmt(v2, 0)}/pt no 1A. Cenário: vol 1M +${s1}, vol 1A +${s2}. Perda de vega (aprox. linear)?`, a, tol: 0.001, tolAbs: 10, dec: 0, e: `${Q.fmt(v1, 0)}×${s1} + ${Q.fmt(v2, 0)}×${s2} = ${Q.fmt(a, 0)} (antes de volga, que piora a perda de quem está short).` }; } }
    ],
    cards: [['Reverse stress test', 'Achar o cenário que gera uma perda inaceitável.'], ['Choque de vol com formato', 'Curto sobe mais que longo; skew empina.']]
  },
  {
    id: 'us6-3', title: 'PnL explain completo e controle', tag: 'explain-adv',
    goal: 'Montar um PnL explain de nível de banco, incluindo carry, dividendos, borrow e novos negócios.',
    body: String.raw`
<p>Um PnL explain completo de uma mesa de equity derivatives separa:</p>
<table><tr><th>Categoria</th><th>Componentes</th></tr>
<tr><td>Mercado — spot</td><td>delta, gamma (e speed em choques)</td></tr>
<tr><td>Mercado — vol</td><td>vega por bucket, skew, volga, vanna</td></tr>
<tr><td>Tempo</td><td>theta (com o relógio de variância da mesa)</td></tr>
<tr><td>Carry</td><td>juros sobre caixa, financiamento de ações, borrow, repo</td></tr>
<tr><td>Dividendos</td><td>mudança de expectativa de dividendos (div delta); dividendos pagos</td></tr>
<tr><td>Juros</td><td>rho por bucket da curva</td></tr>
<tr><td>Correlação</td><td>para livros multi-ativo</td></tr>
<tr><td>Novos negócios</td><td>day-1 PnL (edge)</td></tr>
<tr><td>Eventos / ajustes</td><td>eventos corporativos, mudanças de reservas, correções</td></tr>
<tr><td>Não explicado</td><td>resíduo — idealmente &lt; 5–10%</td></tr></table>
<h3>Quem olha</h3>
<p><b>Product control</b> (independente da mesa) reconcilia o PnL oficial, verifica preços de mercado (IPV — independent price verification) e questiona o unexplained. <b>Market risk</b> acompanha limites. O trader precisa conseguir explicar cada linha na reunião da manhã.</p>
<h3>Armadilhas comuns</h3>
<ul><li>Superfície de vol marcada com dados velhos → PnL "falso" que volta no dia seguinte.</li>
<li>Dividendo anunciado diferente do previsto → salto de PnL em opções longas.</li>
<li>Theta calculado com relógio diferente do usado na marcação → theta "sumindo" em fins de semana.</li></ul>`,
    desk: String.raw`"Explain is 92%." "Div delta hit us on the special dividend." "IPV difference on the long-dated vol." "Product control is asking about the unexplained".`,
    refs: [R_.hull('18ap', 'Taylor series expansions and hedge parameters'), R_.hull('21.5', 'Quadratic model')],
    sims: ['book'],
    ex: [
      { tag: 'explain-adv', gen: R => { const div = R.int(-3, 3) * 10000, dd = R.f(-0.5, 0.5, 2); const a = div * dd; return { q: `Sensibilidade a dividendos do livro: US$ ${Q.fmt(div, 0)} por US$ 1 de dividendo esperado (div delta). A expectativa de dividendos muda ${dd > 0 ? '+' : ''}${Q.fmt(dd, 2)} por ação. PnL de dividendos?`, a, tol: 0.001, tolAbs: 1, unit: 'US$', dec: 0, e: `${Q.fmt(div, 0)} × ${Q.fmt(dd, 2)} = ${Q.fmt(a, 0)}.` }; } },
      { t: 'mcq', q: 'Quem é responsável pela verificação independente de preços (IPV) e reconciliação do PnL?', o: ['O trader', 'Product control', 'O cliente', 'A OCC'], a: 1, e: 'Função independente da mesa.' },
      { t: 'mcq', q: 'Um livro vendido em calls longas ganha ou perde se a empresa anunciar corte de dividendos?', o: ['Ganha', 'Perde (forward sobe, calls encarecem)', 'Não afeta', 'Depende do rho'], a: 1, e: 'Dividendo menor ⇒ forward maior ⇒ calls ↑.' }
    ],
    cards: [['Div delta', 'Sensibilidade do livro a mudanças de dividendos esperados.'], ['IPV', 'Independent price verification (product control).'], ['Day-1 PnL', 'Edge dos novos negócios.']]
  },
  {
    id: 'us6-4', title: 'Caso final: gerindo um livro de autocalls', tag: 'caso',
    goal: 'Integrar tudo: ler o risco de um livro de autocalls e decidir hedges em diferentes cenários.',
    body: String.raw`
<p>Você herdou um livro de autocallables sobre o S&amp;P (barreira de capital 60%, autocall 100%, cupom 8% a.a.). Risco inicial típico: long vega de 1–3 anos, long skew, short digitais de cupom, delta hedgeado e <b>comprado em dividendos</b> (você é comprado na DIP, que vale mais se o forward cair — ou seja, se os dividendos esperados subirem).</p>
<h3>Cenário 1 — Rally lento (+15% em 6 meses, vol cai)</h3>
<p>Muitos produtos são autocallados. A vega longa que você tinha desaparece <i>junto com os produtos</i> — mas os hedges que você fez (vendeu vol listada para neutralizar o vega longo) continuam no livro. Resultado: você fica <b>short vega</b> "órfão". Ação: recomprar parte da vol vendida à medida que a probabilidade de autocall sobe (usar a vega "com probabilidade de autocall", não a estática).</p>
<h3>Cenário 2 — Queda de 25% com vol +15</h3>
<p>Os produtos se aproximam da barreira de 60%. A DIP ganha valor (você ganha no vega e no delta hedgeado), mas o gamma do livro muda de sinal perto da barreira e cresce com o tempo. Ação: reduzir concentração perto da barreira, planejar o hedge do "penhasco" (comprar puts perto de 60% ou digitais), avaliar reserva de barreira.</p>
<h3>Cenário 3 — Correlação sobe (worst-of)</h3>
<p>Em crise, as ações passam a andar juntas. A put worst-of que você tem vale menos (correlação alta reduz a dispersão do pior papel). Você perde no livro de correlação. Ação: o hedge de correlação (comprar correlação, por exemplo vendendo dispersão) deveria ter sido montado antes — em crise é caro.</p>
<h3>Checklist do trader</h3>
<ol><li>Gregas por bucket (vega, skew, gamma por strike) e sua evolução com o spot (ladders de spot).</li>
<li>Probabilidade de autocall e "vida esperada" do livro.</li>
<li>Stress com formatos de vol e correlação.</li>
<li>PnL explain diário e unexplained.</li>
<li>Limites e reservas.</li></ol>`,
    desk: String.raw`"The book gets shorter vega as it autocalls." "Barrier concentration at 60." "Correlation went to one and the worst-of book bled." "Hedge the call-probability-weighted vega".`,
    refs: [R_.hull(25, 'Exotic options'), R_.hull('21.8', 'Stress testing and back testing'), R_.wil(80, 'Monte Carlo simulation')],
    sims: ['book'],
    ex: [
      { t: 'mcq', q: 'Num rally forte, um livro de autocalls hedgeado estaticamente tende a ficar:', o: ['Long vega', 'Short vega (os produtos somem, os hedges ficam)', 'Neutro', 'Long correlação'], a: 1, e: 'A vega longa desaparece com os autocalls; a vol vendida como hedge permanece.' },
      { t: 'mcq', q: 'Comprado na DIP do autocall, a mesa fica em dividendos:', o: ['Vendida (perde se dividendos subirem)', 'Comprada (ganha se dividendos subirem, pois o forward cai e a put sobe)', 'Neutra', 'Depende do cupom'], a: 1, e: 'Dividendos maiores ⇒ forward menor ⇒ puts mais caras.' },
      { t: 'mcq', q: 'Em crise, a correlação sobe. Para a mesa comprada em puts worst-of:', o: ['Ganho', 'Perda (worst-of put vale menos com correlação alta)', 'Nada', 'Ganho só se a vol cair'], a: 1, e: 'Mesa vendida em correlação.' },
      { tag: 'caso', gen: R => { const V = R.int(200, 800) * 1000, p = R.f(0.3, 0.8, 2); const a = V * (1 - p); return { q: `Um livro tem vega de US$ ${Q.fmt(V, 0)}/pt vindo de autocalls. A probabilidade de autocall na próxima observação é ${Q.fmt(p * 100, 0)}%. Aproximando: vega esperada que permanece após a observação?`, a, tol: 0.002, unit: 'US$', dec: 0, e: `${Q.fmt(V, 0)} × (1 − ${Q.fmt(p, 2)}) = ${Q.fmt(a, 0)}. Hedgear a vega estática superestima o risco que vai ficar.` }; } }
    ],
    cards: [['Autocall e vega', 'Rally ⇒ autocalls ⇒ vega longa some; hedges ficam ⇒ short vega.'], ['DIP e dividendos', 'Comprado em DIP = comprado em dividendos.'], ['Checklist', 'Buckets, prob. de autocall, stress com correlação, explain, limites.']]
  }
  ]
});
})();
