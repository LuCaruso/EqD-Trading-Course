/* ============ MÓDULO BRASIL — Unidades 4 a 6 ============ */
(function () {
const R_ = window.REF;
const bs = (t, S, K, T, r, s, q) => Q.bs(t, S, K, T, r, q || 0, s);

/* ---------------- BR4 — As gregas ---------------- */
Course.unit('br', {
  id: 'br4', title: 'As gregas',
  desc: 'Delta, gamma, theta, vega, rho e as de segunda ordem (vanna, volga, charm): o que medem, como se comportam com spot, tempo e vol, e como a mesa as expressa em R$.',
  sims: ['bs', 'struct'], exam: { n: 12, minutes: 25 },
  lessons: [
  {
    id: 'br4-1', title: 'Delta: sensibilidade ao spot e hedge ratio', tag: 'delta',
    goal: 'Calcular e interpretar o delta de calls, puts e carteiras, e expressá-lo em ações, em R$ e em contratos.',
    body: String.raw`
<p>O <b>delta</b> é a derivada do preço da opção em relação ao spot: \(\Delta = \partial V/\partial S\). No Black-Scholes:</p>
\[ \Delta_{call} = e^{-qT}N(d_1) \in [0,1], \qquad \Delta_{put} = e^{-qT}\big(N(d_1) - 1\big) \in [-1, 0]. \]
<p>Três leituras do mesmo número:</p>
<ol><li><b>Sensibilidade</b>: se o spot sobe R$ 1, a call sobe ~R$ Δ.</li>
<li><b>Hedge ratio</b>: para neutralizar 1 call comprada, venda Δ ações (a carteira replicante da Unidade 3).</li>
<li><b>Exposição equivalente</b>: 10.000 calls com Δ = 0,55 "são" 5.500 ações. Com spot a R$ 40, isso é <b>delta cash</b> de R$ 220.000.</li></ol>
<p>Formato: a call deep OTM tem Δ ≈ 0; ATM, Δ ≈ 0,5 (um pouco acima, por causa de juros e do \(\tfrac12\sigma^2\)); deep ITM, Δ ≈ 1. Com o vencimento chegando, a curva de delta fica mais "degrau" — pequenas variações de spot perto do strike mudam muito o delta. (Isso é gamma, próxima lição.)</p>
<div class="w" data-w="greek" data-a='{"g":"delta","type":"call","title":"Delta de uma call K=100 para 3 prazos"}'></div>
<p>Pela paridade put-call, \(\Delta_{call} - \Delta_{put} = e^{-qT}\): call e put do mesmo strike diferem em "uma ação".</p>
<h3>Delta de carteira</h3>
<p>Delta é <b>aditivo</b>: some quantidade × delta de cada posição (ações têm Δ = 1, futuros ≈ 1 em unidades de ativo). O resultado é o que a mesa hedgeia. Um livro "delta-neutro" não ganha nem perde com pequenos moves do spot — mas continua exposto a gamma, vega e theta.</p>
<h3>"Delta" como nome de strike</h3>
<p>Na mesa, "a put 25 delta" é a put cujo delta é −0,25 (OTM). Nomear strikes por delta normaliza moneyness entre ativos e prazos — é como o smile é cotado.</p>`,
    desk: String.raw`"Estou longo 2 milhões de delta" = delta cash +R$ 2 mi. "Delta 50" = ATM. "Me dá o delta com a ref 38,20" = o cliente fecha a opção e o hedge em ação ao mesmo tempo, a um spot de referência combinado (cross).`,
    deep: String.raw`<p>Derivação: \(\partial c/\partial S = e^{-qT}N(d_1) + S e^{-qT}n(d_1)\partial d_1/\partial S - Ke^{-rT}n(d_2)\partial d_2/\partial S\). Como \(S e^{-qT} n(d_1) = K e^{-rT} n(d_2)\) (identidade-chave do BS) e \(\partial d_1/\partial S = \partial d_2/\partial S\), os dois últimos termos se cancelam. Essa identidade aparece em quase todas as derivações de gregas.</p>`,
    refs: [R_.hull('18.4', 'Delta hedging'), R_.wil('7.3', 'Delta'), R_.wil(12, 'How to delta hedge'), R_.ek('7.10', 'The Greeks'), R_.cqf(3, 'delta hedging')],
    sims: ['bs'],
    ex: [
      { tag: 'delta', gen: R => { const S = R.f(90, 110, 1), K = R.pick([95, 100, 105]), T = R.pick([0.25, 0.5]), r = 0.1, s = R.f(0.2, 0.4, 2); const g = bs('call', S, K, T, r, s); return { q: `Delta de uma call: S = ${S}, K = ${K}, T = ${T}, r = 10% (cont.), σ = ${F.p(s, 0)}, q = 0.`, a: g.delta, tolAbs: 0.003, dec: 4, e: `d1 = ${Q.fmt(g.d1, 4)} ⇒ Δ = N(d1) = ${Q.fmt(g.delta, 4)}.` }; } },
      { tag: 'delta', gen: R => { const dc = R.f(0.3, 0.8, 2), q = 0; const a = dc - 1; return { q: `Uma call europeia tem delta ${Q.fmt(dc, 2)} (sem dividendos). Qual o delta da put de mesmo strike e vencimento?`, a, tolAbs: 0.001, dec: 2, e: `Δput = Δcall − 1 = ${Q.fmt(a, 2)}.` }; } },
      { tag: 'delta', gen: R => { const n = R.int(2, 20) * 1000, d = R.f(0.2, 0.8, 2), S = R.f(15, 70, 2), side = R.sign(); const a = -side * n * d; return { q: `Você está ${side > 0 ? 'comprado' : 'vendido'} em ${Q.fmt(n, 0)} calls com delta ${Q.fmt(d, 2)}. Quantas ações você precisa ${'negociar'} para ficar delta-neutro? (positivo = comprar, negativo = vender)`, a, tolAbs: 1, unit: 'ações', dec: 0, e: `Delta da posição = ${side > 0 ? '+' : '−'}${Q.fmt(n, 0)} × ${Q.fmt(d, 2)} = ${Q.fmt(side * n * d, 0)}. Para zerar: ${a > 0 ? 'comprar' : 'vender'} ${Q.fmt(Math.abs(a), 0)} ações.` }; } },
      { tag: 'delta', gen: R => { const n1 = R.int(1, 10) * 1000, d1 = R.f(0.3, 0.7, 2), n2 = R.int(1, 10) * 1000, d2 = R.f(-0.7, -0.2, 2), st = R.int(-5, 5) * 500, S = R.f(20, 50, 2); const a = (n1 * d1 - n2 * d2 + st) * S; return { q: `Livro: +${n1} calls (Δ ${Q.fmt(d1, 2)}), −${n2} puts (Δ ${Q.fmt(d2, 2)}), ${st >= 0 ? '+' : ''}${st} ações. Spot ${F.r(S)}. Qual o <b>delta cash</b> em R$?`, a, tol: 0.002, tolAbs: 5, unit: 'R$', dec: 0, e: `Δ ações = ${n1}·${Q.fmt(d1, 2)} − ${n2}·(${Q.fmt(d2, 2)}) + ${st} = ${Q.fmt(n1 * d1 - n2 * d2 + st, 1)}; × ${Q.fmt(S, 2)} = ${Q.fmt(a, 0)}.` }; } },
      { t: 'mcq', q: 'Uma call ATM curta (5 dias) e uma call ATM longa (1 ano), mesma vol. Se o spot subir 3%, qual delta muda mais?', o: ['A longa', 'A curta', 'Mudam igual', 'Nenhuma muda'], a: 1, e: 'A curva de delta da opção curta é mais íngreme perto do strike: gamma maior.' }
    ],
    cards: [['Delta call (BS)', 'e^{−qT}N(d1)'], ['Delta put (BS)', 'e^{−qT}(N(d1) − 1)'], ['Delta cash', 'Σ qty·Δ × spot: exposição em R$.'], ['"Put 25 delta"', 'Put OTM com Δ = −0,25; forma de nomear strikes.']]
  },
  {
    id: 'br4-2', title: 'Gamma: convexidade e o delta que se mexe', tag: 'gamma',
    goal: 'Entender gamma como a curvatura da opção, calcular gamma em unidades de mesa e o PnL de gamma de um move.',
    body: String.raw`
<p><b>Gamma</b> é a derivada do delta em relação ao spot: \(\Gamma = \partial^2 V/\partial S^2\). No BS (igual para call e put):</p>
\[ \Gamma = \frac{e^{-qT}\,n(d_1)}{S\,\sigma\sqrt{T}}. \]
<p>Gamma mede o quanto o seu hedge "envelhece" quando o spot anda. Comprado em opções = <b>long gamma</b> (Γ > 0); vendido = <b>short gamma</b>.</p>
<h3>Por que gamma dá dinheiro (e custa dinheiro)</h3>
<p>Expandindo o valor da opção em Taylor para um move \(\delta S\):</p>
\[ \delta V \approx \Delta\,\delta S + \tfrac12\,\Gamma\,(\delta S)^2. \]
<p>Se você está delta-hedgeado, o primeiro termo se cancela com o hedge. Sobra \(\tfrac12\Gamma(\delta S)^2\) — sempre positivo para quem é long gamma, <b>não importa a direção</b>. Long gamma ganha com movimento; short gamma perde com movimento.</p>
<div class="w" data-w="greek" data-a='{"g":"gamma","type":"call","title":"Gamma de uma call K=100: pico ATM, explode perto do vencimento"}'></div>
<h3>Formato</h3>
<ul><li>Máximo perto do ATM; decai para ITM e OTM.</li>
<li>Quanto mais curta a opção, mais alto e estreito o pico: gamma ATM ∝ \(1/\sqrt{T}\).</li>
<li>Vol alta "espalha" o gamma; vol baixa concentra.</li></ul>
<h3>Unidades de mesa</h3>
<ul><li><b>Gamma em ações por 1%</b>: \(\Gamma \cdot S \cdot 1\%\) — quanto o delta (em ações) muda num move de 1%.</li>
<li><b>Gamma cash por 1%</b>: \(\Gamma\cdot S\cdot 1\% \cdot S\) — quanto o delta cash muda num move de 1%. É o número que aparece no relatório de risco ("gamma de R$ 800 mil por 1%").</li>
<li><b>PnL de gamma de um move de x%</b>: \(\tfrac12\Gamma (xS)^2\).</li></ul>`,
    desk: String.raw`"Estou longo gamma" = vou ganhar se o mercado andar (e pagar theta se ficar parado). "Gamma de 1 milhão por ponto percentual" = se a bolsa subir 1%, meu delta cash aumenta R$ 1 mi. "Short gamma perto do vencimento" é a posição que tira o sono do trader.`,
    deep: String.raw`<p>Para a opção ATM (\(d_1\approx 0\)), \(n(d_1)\approx 1/\sqrt{2\pi}\approx 0{,}4\), então \(\Gamma_{ATM} \approx \dfrac{0{,}4}{S\sigma\sqrt{T}}\). Compare com o vega ATM \(\approx 0{,}4\, S\sqrt{T}\): gamma e vega de opções vanilla estão ligados por \(\mathcal{V} = \Gamma\, S^2 \sigma T\). Isto é, opções longas "carregam" o risco de vol como vega; as curtas, como gamma.</p>`,
    refs: [R_.hull('18.6', 'Gamma'), R_.wil('7.4', 'Gamma')],
    sims: ['bs'],
    ex: [
      { tag: 'gamma', gen: R => { const S = 100, K = R.pick([95, 100, 105]), T = R.pick([0.1, 0.25, 0.5]), s = R.f(0.2, 0.35, 2); const g = bs('call', S, K, T, 0.05, s); return { q: `Gamma BS de uma opção: S = 100, K = ${K}, T = ${T}, r = 5%, σ = ${F.p(s, 0)}, q = 0.`, a: g.gamma, tol: 0.01, dec: 5, e: `Γ = n(d1)/(Sσ√T) com d1 = ${Q.fmt(g.d1, 4)}: ${Q.fmt(g.gamma, 5)}.` }; } },
      { tag: 'gamma', gen: R => { const G = R.f(0.02, 0.12, 3), dS = R.f(1, 4, 2); const a = 0.5 * G * dS * dS; return { q: `Uma opção delta-hedgeada tem Γ = ${Q.fmt(G, 3)}. O spot anda R$ ${Q.fmt(dS, 2)} (qualquer direção). PnL aproximado do gamma, por opção?`, a, tol: 0.005, unit: 'R$', dec: 4, e: `½Γ(δS)² = 0,5 × ${Q.fmt(G, 3)} × ${Q.fmt(dS, 2)}² = ${Q.fmt(a, 4)}.` }; } },
      { tag: 'gamma', gen: R => { const n = R.int(5, 50) * 1000, G = R.f(0.01, 0.06, 3), S = R.f(30, 60, 2); const a = n * G * S * 0.01 * S; return { q: `Livro com ${Q.fmt(n, 0)} opções compradas, Γ = ${Q.fmt(G, 3)} cada, spot ${F.r(S)}. Qual o <b>gamma cash por 1%</b> (variação do delta cash em R$ num move de +1%)?`, a, tol: 0.003, unit: 'R$', dec: 0, e: `n·Γ·(S·1%)·S = ${n}×${Q.fmt(G, 3)}×${Q.fmt(S * 0.01, 4)}×${Q.fmt(S, 2)} = ${Q.fmt(a, 0)}.` }; } },
      { t: 'mcq', q: 'Você está vendido em straddle ATM de 3 dias, delta-hedgeado. Qual o maior risco?', o: ['Vol implícita subir 1 ponto', 'Um move grande do spot antes do vencimento (short gamma alto)', 'Juros subirem', 'Dividendos'], a: 1, e: 'Perto do vencimento, gamma ATM é enorme; um move grande gera perda de ½Γ(δS)² não coberta pelo theta.' },
      { t: 'tf', q: 'Gamma de uma call e de uma put com mesmo strike e vencimento (europeias, BS) é igual.', a: true, e: 'Diferem por um termo linear em S (paridade), cuja segunda derivada é zero.' }
    ],
    cards: [['Gamma (BS)', 'Γ = e^{−qT} n(d1)/(S σ √T)'], ['PnL de gamma', '½ Γ (δS)²'], ['Gamma cash por 1%', 'Γ · S · 1% · S'], ['Onde gamma é máximo', 'ATM, e explode perto do vencimento.']]
  },
  {
    id: 'br4-3', title: 'Theta: o aluguel da convexidade', tag: 'theta',
    goal: 'Entender theta, sua relação com gamma (a "equação" central da mesa) e o breakeven de uma posição delta-hedgeada.',
    body: String.raw`
<p><b>Theta</b> é a variação do valor com a passagem do tempo, tudo mais constante: \(\Theta = \partial V/\partial t\). Opções compradas perdem valor com o tempo (Θ < 0): o valor extrínseco "derrete". Mesas expressam theta <b>por dia</b> (por dia útil no Brasil: \(\Theta/252\)).</p>
<h3>A relação que todo trader carrega na cabeça</h3>
<p>A equação de Black-Scholes pode ser escrita como</p>
\[ \Theta + \tfrac12\sigma^2 S^2\,\Gamma + (r-q)S\Delta - rV = 0. \]
<p>Para uma posição delta-hedgeada e ignorando juros (efeito pequeno no curto prazo):</p>
\[ \boxed{\;\Theta \approx -\tfrac12\,\sigma^2 S^2\,\Gamma\;} \]
<p>Theta é o <b>preço</b> do gamma. Quem é long gamma paga theta todo dia; quem é short gamma recebe. É um aluguel: você paga para ter a convexidade.</p>
<h3>O breakeven diário</h3>
<p>Num dia, o long gamma ganha \(\tfrac12\Gamma(\delta S)^2\) e paga \(\tfrac12\Gamma S^2\sigma^2\,\delta t\). Empata quando</p>
\[ \left(\frac{\delta S}{S}\right)^2 = \sigma^2\,\delta t \;\Rightarrow\; \frac{|\delta S|}{S} = \frac{\sigma}{\sqrt{252}}. \]
<p>Com vol implícita de 32%, o breakeven é ~2% ao dia. Se o ativo se mexer mais que isso (em média quadrática), o long gamma ganha; menos, perde. Isso conecta tudo: <b>comprar vol implícita σ é apostar que o ativo vai se mexer mais que σ/√252 por dia</b>.</p>
<div class="w" data-w="greek" data-a='{"g":"theta","type":"call","title":"Theta por dia útil de uma call K=100"}'></div>
<p>Theta é mais negativo no ATM e acelera perto do vencimento (como gamma). Opções deep ITM de put podem ter theta positivo (efeito juros: você receberá K no futuro).</p>`,
    desk: String.raw`"Quanto estou pagando de theta?" "O livro sangra 40 mil de theta por dia." "Fim de semana é theta de graça para quem está vendido" (em base corrida — no Brasil, com base 252, o theta do fim de semana não existe no modelo, mas o mercado costuma antecipar a queda de vol na sexta).`,
    deep: String.raw`<p>A relação \(\Theta \approx -\tfrac12\sigma^2S^2\Gamma\) vale exatamente para uma carteira delta-neutra financiada com \(r=q=0\). Com juros, uma carteira delta-hedgeada autofinanciada rende \(r\) sobre seu valor, e a EDP diz que o PnL no intervalo é \(\tfrac12\Gamma S^2[(\delta S/S)^2 - \sigma^2\delta t]\) — a mesma conclusão. Essa expressão é a base do "PnL de gamma-theta" de qualquer relatório de risco.</p>`,
    refs: [R_.hull('18.5', 'Theta'), R_.hull('18.7', 'Relationship between delta, theta, and gamma'), R_.wil('7.5', 'Theta')],
    sims: ['bs', 'hedge'],
    ex: [
      { tag: 'theta', gen: R => { const s = R.f(0.15, 0.6, 2); const a = s / Math.sqrt(252) * 100; return { q: `Uma posição long gamma delta-hedgeada foi comprada a ${F.p(s, 0)} de vol implícita. Qual o move diário (em %) necessário para empatar gamma e theta? (base 252)`, a, tol: 0.005, unit: '%', dec: 3, e: `σ/√252 = ${Q.fmt(a, 3)}%.` }; } },
      { tag: 'theta', gen: R => { const G = R.f(0.01, 0.05, 3), S = R.f(40, 120, 1), s = R.f(0.2, 0.45, 2); const a = -0.5 * s * s * S * S * G / 252; return { q: `Opção com Γ = ${Q.fmt(G, 3)}, S = ${S}, σ = ${F.p(s, 0)}. Pela relação Θ ≈ −½σ²S²Γ, qual o theta por dia útil (base 252)?`, a, tol: 0.01, unit: 'R$', dec: 4, e: `−½ × ${s}² × ${S}² × ${Q.fmt(G, 3)} / 252 = ${Q.fmt(a, 4)}.` }; } },
      { tag: 'theta', gen: R => { const S = 100, K = 100, du = R.pick([10, 21, 63]), s = R.f(0.2, 0.4, 2), r = 0.1; const g = bs('call', S, K, du / 252, r, s); const a = g.theta / 252; return { q: `Theta BS por dia útil de uma call ATM: S = K = 100, ${du} du, r = 10% (cont.), σ = ${F.p(s, 0)}.`, a, tol: 0.01, dec: 4, e: `Θ anual = ${Q.fmt(g.theta, 3)} ⇒ por dia útil: ${Q.fmt(a, 4)}.` }; } },
      { tag: 'theta', gen: R => { const G = R.f(0.02, 0.06, 3), S = 100, iv = R.f(0.2, 0.3, 2), mv = R.f(0.5, 3, 2); const gain = 0.5 * G * (S * mv / 100) ** 2, cost = 0.5 * iv * iv * S * S * G / 252; const a = gain - cost; return { q: `Long gamma delta-hedgeado: Γ = ${Q.fmt(G, 3)}, S = 100, comprado a ${F.p(iv, 0)} de vol. Hoje o spot andou ${Q.fmt(mv, 2)}%. PnL do dia (gamma − theta, ignore juros)?`, a, tolAbs: 0.003, unit: 'R$', dec: 4, e: `Gamma: ½·${Q.fmt(G, 3)}·(${Q.fmt(S * mv / 100, 2)})² = ${Q.fmt(gain, 4)}. Theta: ½·${iv}²·100²·${Q.fmt(G, 3)}/252 = ${Q.fmt(cost, 4)}. PnL = ${Q.fmt(a, 4)}.` }; } },
      { t: 'mcq', q: 'Uma posição tem gamma positivo. O que se espera do theta?', o: ['Positivo', 'Negativo', 'Zero', 'Não há relação'], a: 1, e: 'Θ ≈ −½σ²S²Γ: long gamma paga theta.' }
    ],
    cards: [['Θ vs Γ', 'Θ ≈ −½ σ² S² Γ (delta-hedgeado, sem juros)'], ['Breakeven diário', '|δS|/S = σ/√252'], ['PnL gamma-theta', '½ Γ S² [(δS/S)² − σ² δt]']]
  },
  {
    id: 'br4-4', title: 'Vega e rho', tag: 'vega',
    goal: 'Medir a exposição à volatilidade implícita e aos juros, e entender como vega muda com prazo e moneyness.',
    body: String.raw`
<p><b>Vega</b> (\(\mathcal{V}\), não é letra grega de verdade) é a sensibilidade à vol implícita:</p>
\[ \mathcal{V} = \frac{\partial V}{\partial \sigma} = S e^{-qT} n(d_1)\sqrt{T}. \]
<p>Igual para call e put. Mesas cotam vega <b>por ponto de vol</b> (divida por 100): "vega de R$ 0,12" = o prêmio sobe R$ 0,12 se a IV subir 1 ponto.</p>
<ul><li>Máximo perto do ATM (do forward).</li>
<li>Cresce com \(\sqrt{T}\): opções longas são "pura vega". Opções curtas são "pura gamma".</li>
<li>Aproximação ATM: \(\mathcal{V}_{1pt} \approx 0{,}4\,S\sqrt{T}/100\).</li></ul>
<div class="w" data-w="greek" data-a='{"g":"vega","type":"call","title":"Vega por ponto de vol, K=100"}'></div>
<h3>Vega vs gamma: dois jeitos de estar "comprado em vol"</h3>
<p>Estar long vega é ganhar se a <b>vol implícita</b> subir (marcação a mercado). Estar long gamma é ganhar se a <b>vol realizada</b> for alta (via hedge). Uma opção comprada tem as duas coisas, mas em proporções que dependem do prazo. Um calendar (vende curta, compra longa) pode ser short gamma e long vega ao mesmo tempo — veremos na Unidade 6.</p>
<h3>Rho</h3>
<p><b>Rho</b> = \(\partial V/\partial r\). Call: \(K T e^{-rT}N(d_2) > 0\); put: \(-KTe^{-rT}N(-d_2) < 0\). Juros mais altos encarecem calls (o forward sobe) e barateiam puts. No Brasil, com juros altos e voláteis, rho de opções longas não é desprezível — e a mesa costuma hedgear com DI1. Mesas cotam rho por 1% (ou por 1 bp) de juros.</p>`,
    desk: String.raw`"Estou comprado em 300 mil de vega" = ganho R$ 300 mil se a vol subir 1 ponto em toda a curva. "Vega de 1 ano é diferente de vega de 1 mês" — por isso existe a vega ponderada (Módulo US). "Vol crush" = queda brusca de IV (pós-evento), destrói long vega.`,
    refs: [R_.hull('18.8', 'Vega'), R_.hull('18.9', 'Rho'), R_.wil('7.7', 'Vega'), R_.wil('7.8', 'Rho')],
    sims: ['bs'],
    ex: [
      { tag: 'vega', gen: R => { const S = R.f(20, 150, 0), T = R.pick([1 / 12, 0.25, 0.5, 1, 2]); const a = 0.4 * S * Math.sqrt(T) / 100; return { q: `Aproximação ATM: qual o vega por ponto de vol de uma opção com S = ${S} e T = ${Q.fmt(T, 3)} ano?`, a, tol: 0.01, dec: 4, e: `0,4 × ${S} × √${Q.fmt(T, 3)} / 100 = ${Q.fmt(a, 4)}.` }; } },
      { tag: 'vega', gen: R => { const S = 100, K = R.pick([90, 100, 110]), T = R.pick([0.25, 1]), s = R.f(0.2, 0.35, 2); const g = bs('put', S, K, T, 0.05, s); const a = g.vega / 100; return { q: `Vega BS (por 1 ponto de vol) de uma put: S = 100, K = ${K}, T = ${T}, r = 5%, σ = ${F.p(s, 0)}.`, a, tol: 0.005, dec: 4, e: `𝒱 = S·n(d1)·√T = ${Q.fmt(g.vega, 3)}; por ponto: ${Q.fmt(a, 4)}.` }; } },
      { tag: 'vega', gen: R => { const n = R.int(10, 200) * 100, v = R.f(0.03, 0.2, 3), dv = R.f(-4, 4, 1); const a = n * v * dv; return { q: `Você está vendido em ${Q.fmt(n, 0)} opções com vega de ${Q.fmt(v, 3)} por ponto cada. A vol implícita varia ${dv > 0 ? '+' : ''}${Q.fmt(dv, 1)} pontos. PnL aproximado?`, a: -a, tol: 0.002, tolAbs: 1, unit: 'R$', dec: 0, e: `−${n} × ${Q.fmt(v, 3)} × ${Q.fmt(dv, 1)} = ${Q.fmt(-a, 0)}.` }; } },
      { t: 'mcq', q: 'Para uma exposição a vol implícita com o mínimo de gamma, você usaria:', o: ['Opções ATM de 1 semana', 'Opções ATM de 1-2 anos', 'Opções deep ITM curtas', 'Futuro'], a: 1, e: 'Vega cresce com √T e gamma cai com 1/√T: opções longas são quase pura vega.' },
      { t: 'mcq', q: 'Se a taxa DI sobe fortemente, o que acontece (tudo mais constante) com uma call longa de índice e uma put longa?', o: ['Ambas sobem', 'Call sobe, put cai', 'Call cai, put sobe', 'Ambas caem'], a: 1, e: 'Rho da call > 0 (forward sobe), rho da put < 0.' }
    ],
    cards: [['Vega (BS)', '𝒱 = S e^{−qT} n(d1) √T (divida por 100 p/ 1 pt)'], ['Vega ATM aprox.', '0,4 · S · √T / 100 por ponto'], ['Rho da call', 'K T e^{−rT} N(d2) > 0'], ['Long vega vs long gamma', 'Vega: IV sobe. Gamma: vol realizada alta.']]
  },
  {
    id: 'br4-5', title: 'Gregas de segunda ordem: vanna, volga e charm', tag: 'gregas2',
    goal: 'Entender as sensibilidades cruzadas que explicam por que as gregas de primeira ordem mudam — e por que elas importam para estruturas e smile.',
    body: String.raw`
<p>As gregas de primeira ordem mudam quando o mercado se mexe. As de segunda ordem medem <i>como</i>:</p>
<table><tr><th>Grega</th><th>Definição</th><th>Pergunta que responde</th></tr>
<tr><td><b>Vanna</b></td><td>\(\partial\Delta/\partial\sigma = \partial\mathcal{V}/\partial S\)</td><td>Se a vol subir, meu delta muda quanto? Se o spot andar, meu vega muda quanto?</td></tr>
<tr><td><b>Volga</b> (vomma)</td><td>\(\partial\mathcal{V}/\partial\sigma\)</td><td>Meu vega aumenta ou diminui quando a vol se mexe? (convexidade em vol)</td></tr>
<tr><td><b>Charm</b></td><td>\(-\partial\Delta/\partial T\)</td><td>Quanto meu delta muda só pela passagem do tempo? ("delta bleed")</td></tr>
<tr><td>Speed</td><td>\(\partial\Gamma/\partial S\)</td><td>Como o gamma muda com o spot.</td></tr>
<tr><td>Color</td><td>\(\partial\Gamma/\partial t\)</td><td>Como o gamma muda com o tempo.</td></tr></table>
<p>No BS: \(\text{Vanna} = -e^{-qT}n(d_1)\,d_2/\sigma\) e \(\text{Volga} = \mathcal{V}\,d_1 d_2/\sigma\).</p>
<h3>Intuições</h3>
<ul><li><b>Vanna</b>: para uma call OTM (\(d_2<0\)), vanna > 0: se a vol sobe, a call fica "mais perto" de ITM e o delta aumenta. Vanna é o que liga <b>skew</b> e <b>delta</b>: quem vende risk reversals carrega vanna. Com skew negativo, quando o mercado cai a vol sobe, e o delta das suas opções muda por vanna — um efeito que o BS puro ignora.</li>
<li><b>Volga</b>: opções OTM (asas) têm volga positivo: seu vega cresce quando a vol sobe. Por isso estar comprado nas asas é estar "comprado em vol da vol". Isso explica por que o mercado cobra mais pelas asas (curvatura do smile).</li>
<li><b>Charm</b>: uma call OTM perde delta com o tempo (se nada acontecer, ela vai virar pó); uma ITM ganha delta (tende a 1). Na sexta-feira, antes do fim de semana, o charm do livro precisa ser rebalanceado — traders de índice sabem que o hedge "escorrega".</li></ul>
<div class="w" data-w="greek" data-a='{"g":"vanna","type":"call","title":"Vanna (Δ por +1 vol) — sinal troca no ATM"}'></div>
<div class="w" data-w="greek" data-a='{"g":"volga","type":"call","title":"Volga — positivo nas asas, ~0 no ATM"}'></div>`,
    desk: String.raw`"O livro está long vanna": se o mercado cair e a vol subir, o delta cai ainda mais — cuidado com o hedge. "Comprar as asas para ficar long volga". "Delta bleed de fim de semana" = charm.`,
    deep: String.raw`<p>O PnL de uma opção para um move conjunto \((\delta S, \delta\sigma, \delta t)\) em Taylor de segunda ordem:</p>
\[ \delta V \approx \Delta\,\delta S + \tfrac12\Gamma\,\delta S^2 + \mathcal{V}\,\delta\sigma + \tfrac12\text{Volga}\,\delta\sigma^2 + \text{Vanna}\,\delta S\,\delta\sigma + \Theta\,\delta t. \]
<p>Esse é exatamente o <b>PnL explain</b> que o simulador "Livro de Risco" calcula. Os termos cruzados (vanna) e em \(\delta\sigma^2\) (volga) são o que métodos de precificação de exóticas como o <i>vanna-volga</i> (usado em FX) tentam precificar a partir de risk reversals e borboletas.</p>`,
    refs: [R_.hull('18ap', 'Taylor series expansions and hedge parameters'), R_.wil('7.6', 'Speed'), R_.wil(7, 'The Greeks (cross derivatives)')],
    sims: ['bs', 'book'],
    ex: [
      { tag: 'gregas2', gen: R => { const S = 100, K = R.pick([90, 110, 120]), T = 0.5, s = R.f(0.2, 0.3, 2); const g = bs('call', S, K, T, 0.05, s); const a = g.vanna / 100; return { q: `Vanna BS de uma call (variação do delta por +1 ponto de vol): S = 100, K = ${K}, T = 0,5, r = 5%, σ = ${F.p(s, 0)}.`, a, tol: 0.02, tolAbs: 0.0002, dec: 5, e: `Vanna = −n(d1)·d2/σ = ${Q.fmt(g.vanna, 4)}; por ponto: ${Q.fmt(a, 5)}.` }; } },
      { tag: 'gregas2', gen: R => { const V = R.f(0.1, 0.3, 3), vol = R.f(0.05, 0.3, 3), dv = R.f(1, 5, 1); const a = V * dv + 0.5 * vol * dv * dv; return { q: `Opção com vega = ${Q.fmt(V, 3)} por ponto e volga = ${Q.fmt(vol, 3)} (vega/pt por pt). A vol sobe ${Q.fmt(dv, 1)} pontos. PnL de vol aproximado (vega + volga)?`, a, tol: 0.005, dec: 4, e: `𝒱·δσ + ½·Volga·δσ² = ${Q.fmt(V * dv, 4)} + ${Q.fmt(0.5 * vol * dv * dv, 4)} = ${Q.fmt(a, 4)}.` }; } },
      { t: 'mcq', q: 'Qual posição tem volga mais positivo?', o: ['Call ATM comprada', 'Strangle 10-delta comprado (asas)', 'Ação', 'Put ATM vendida'], a: 1, e: 'Volga é ~0 no ATM e positivo nas asas: comprar asas = long volga.' },
      { t: 'mcq', q: 'Uma call OTM, sem movimento de spot e vol, com o passar dos dias tem seu delta:', o: ['Aumentando', 'Diminuindo', 'Constante', 'Indo para 0,5'], a: 1, e: 'Charm: a call OTM perde probabilidade de exercício com o tempo; o delta cai.' },
      { t: 'tf', q: 'Vanna pode ser vista tanto como a sensibilidade do delta à vol quanto como a sensibilidade do vega ao spot.', a: true, e: 'Derivadas cruzadas comutam: ∂²V/∂S∂σ.' }
    ],
    cards: [['Vanna', '∂Δ/∂σ = ∂𝒱/∂S — liga skew e delta.'], ['Volga', '∂𝒱/∂σ — convexidade em vol; positiva nas asas.'], ['Charm', 'Variação do delta com o tempo ("delta bleed").'], ['Taylor completo', 'ΔδS + ½ΓδS² + 𝒱δσ + ½Volga δσ² + Vanna δSδσ + Θδt']]
  }
  ]
});

/* ---------------- BR5 — Jargão e dinâmica da mesa ---------------- */
Course.unit('br', {
  id: 'br5', title: 'Jargão e dinâmica da mesa',
  desc: 'Comprar e vender vol, delta hedge na prática, gamma scalping, PnL de vol implícita vs realizada, como se cota em vol e a linguagem do dia a dia de uma mesa brasileira.',
  sims: ['hedge'], exam: { n: 10, minutes: 20 },
  lessons: [
  {
    id: 'br5-1', title: '"Comprar vol", "vender vol": o que significa de verdade', tag: 'jargao',
    goal: 'Traduzir as expressões da mesa em posições e gregas.',
    body: String.raw`
<p>Na mesa de derivativos, ninguém diz "comprei uma call porque acho que vai subir". A linguagem gira em torno de <b>volatilidade</b>:</p>
<table><tr><th>Expressão</th><th>Posição típica</th><th>Gregas</th></tr>
<tr><td>Comprar vol / estar long vol</td><td>comprar opções (straddle, strangle) e delta-hedgear</td><td>Γ+, 𝒱+, Θ−</td></tr>
<tr><td>Vender vol / dar vol</td><td>vender opções e delta-hedgear</td><td>Γ−, 𝒱−, Θ+</td></tr>
<tr><td>Long gamma</td><td>opções curtas compradas</td><td>ganha com movimento realizado</td></tr>
<tr><td>Short vega</td><td>opções longas vendidas</td><td>ganha se IV cair</td></tr>
<tr><td>Pagar theta / receber theta</td><td>long / short opções</td><td>custo / renda diária</td></tr>
<tr><td>Comprar skew</td><td>comprar puts OTM vs vender calls (ou vs ATM)</td><td>long vanna/skew</td></tr>
<tr><td>Comprar as asas</td><td>comprar strangles bem OTM</td><td>long volga</td></tr></table>
<p>"Comprar vol" pressupõe <b>delta hedge</b>. Sem hedge, você está fazendo uma aposta direcional com alavancagem. Com hedge, você isolou o risco de volatilidade: seu PnL depende de a vol realizada (ou a implícita futura) ser maior do que a que você pagou.</p>
<h3>Duas formas de ganhar com vol</h3>
<ol><li><b>Trade de implícita</b>: compra opção a 25 de IV, a IV vai a 30, vende. Lucro ≈ vega × 5. Horizonte curto; é trading de marcação a mercado.</li>
<li><b>Trade de realizada</b>: compra a 25, carrega até o vencimento fazendo delta hedge, e o ativo realiza 30. Lucro ≈ Σ ½ΓS²(σ²<sub>real</sub> − σ²<sub>impl</sub>)dt. Esse é o gamma scalping (lição 3).</li></ol>
<p>A <b>vol risk premium</b>: historicamente, a IV de índices de ações tende a ficar acima da vol realizada (o mercado paga caro por proteção). Vender vol dá dinheiro "na maioria dos meses" e perde muito nos crashes. Entender essa assimetria é o começo de gestão de risco de vol.</p>`,
    desk: String.raw`"Estou dando vol no curto e tomando no longo" = vendido em vol de prazos curtos e comprado nos longos. "Vol bid" = demanda por opções, IV subindo. "Vol offered" = oferta, IV caindo. "Dar o straddle a 28" = vender o straddle ATM a 28 de vol.`,
    refs: [R_.hull('18.10', 'The realities of hedging'), R_.wil('12.2', 'What if implied and actual volatilities are different?'), R_.wil(59, 'Speculating with options')],
    sims: ['hedge'],
    ex: [
      { t: 'mcq', q: '"Estou vendido em vol no vencimento de julho." Qual posição é mais provável?', o: ['Comprado em straddle de julho', 'Vendido em straddle/strangle de julho, delta-hedgeado', 'Vendido em futuro de julho', 'Comprado em puts de julho sem hedge'], a: 1, e: 'Vender vol = vender opções (tipicamente ATM/strangles) e hedgear o delta.' },
      { t: 'mcq', q: 'Um trader "long gamma" delta-hedgeado quer que o mercado:', o: ['Suba', 'Caia', 'Se mexa muito, em qualquer direção', 'Fique parado'], a: 2, e: 'Ganha ½Γ(δS)² em qualquer direção; perde theta se ficar parado.' },
      { t: 'mcq', q: 'Qual combinação descreve um straddle vendido?', o: ['Γ+, 𝒱+, Θ−', 'Γ−, 𝒱−, Θ+', 'Γ+, 𝒱−, Θ+', 'Γ−, 𝒱+, Θ−'], a: 1, e: 'Vender opções: short gamma, short vega, recebe theta.' },
      { tag: 'jargao', gen: R => { const V = R.int(50, 400) * 1000, iv0 = R.f(22, 30, 1), iv1 = iv0 + R.f(-4, 4, 1); const a = V * (iv1 - iv0); return { q: `Você está long R$ ${Q.fmt(V, 0)} de vega (por ponto). A IV foi de ${Q.fmt(iv0, 1)} para ${Q.fmt(iv1, 1)}. PnL de vega?`, a, tol: 0.001, tolAbs: 1, unit: 'R$', dec: 0, e: `${Q.fmt(V, 0)} × (${Q.fmt(iv1, 1)} − ${Q.fmt(iv0, 1)}) = ${Q.fmt(a, 0)}.` }; } },
      { t: 'tf', q: 'Comprar uma call e não fazer hedge é, na linguagem de mesa, "comprar vol".', a: false, e: 'Sem hedge é uma aposta direcional alavancada. "Comprar vol" implica isolar a vol via delta hedge.' }
    ],
    cards: [['Comprar vol', 'Comprar opções e delta-hedgear: Γ+, 𝒱+, Θ−.'], ['Vol risk premium', 'IV de índices tende a ficar acima da realizada.'], ['Dar vol', 'Vender opções (vender vol).']]
  },
  {
    id: 'br5-2', title: 'Delta hedge na prática: frequência, bandas e custos', tag: 'hedge',
    goal: 'Saber como e quando rebalancear o hedge e o trade-off entre erro de hedge e custo de transação.',
    body: String.raw`
<p>Black-Scholes supõe hedge contínuo e sem custo. Na prática você rebalanceia de tempos em tempos e paga bid/ask (e emolumentos). Consequências:</p>
<ul><li><b>Erro de hedge</b>: com rebalanceamento a cada \(\delta t\), o PnL final de uma posição hedgeada deixa de ser determinístico; seu desvio-padrão cresce com \(\sqrt{\delta t}\) (aprox. \(\sqrt{\pi/4}\,\mathcal{V}\sigma\sqrt{\delta t/T}\) para uma opção ATM — Derman, 1999). <b>Quanto mais espaçado, mais ruído</b>: hedgear 4× menos frequente dobra o desvio.</li>
<li><b>Custo</b>: rebalancear mais vezes custa mais spread. Short gamma é pior: você sempre compra na alta e vende na baixa (o hedge "persegue" o mercado).</li></ul>
<h3>Estratégias usuais</h3>
<ol><li><b>Por tempo</b>: rebalanceia no fechamento (ou a cada X horas). Simples; padrão em muitas mesas para livros grandes.</li>
<li><b>Por banda de delta</b>: só rebalanceia quando o delta líquido sai de uma faixa (ex.: ± R$ 500 mil). Eficiente em custo.</li>
<li><b>Por move do spot</b>: rebalanceia a cada x% de movimento (ex.: a cada 1%). Natural para long gamma: você "realiza" o gamma quando o mercado anda.</li></ol>
<h3>A mecânica do long gamma</h3>
<p>Comprado em straddle, delta-neutro. O mercado sobe 2%: seu delta fica positivo (gamma) → você <b>vende</b> ações no preço alto. O mercado volta: delta negativo → você <b>compra</b> de volta mais barato. Cada ida-e-volta embolsa um pedaço. Isso é o <b>gamma scalping</b>. O short gamma faz o contrário: compra caro e vende barato, e é pago pelo theta para isso.</p>
<p>Experimente no simulador: compare o desvio-padrão do PnL rebalanceando a cada 1, 5 e 21 dias, com e sem custos.</p>`,
    desk: String.raw`"Rebalancear o delta", "re-hedgear", "fazer o delta no fechamento (MOC/call de fechamento)". "Deixar o delta correr" = não rebalancear de propósito, tomando uma visão direcional temporária. "Hedge com o futuro" = usar IND/WIN para ajustar o delta de índice.`,
    deep: String.raw`<p>Com hedge em intervalos \(\delta t\), o PnL em cada intervalo é \(\tfrac12\Gamma S^2[(\delta S/S)^2 - \sigma^2\delta t]\). Sob GBM, \((\delta S/S)^2\) tem média \(\sigma_r^2\delta t\) e variância \(2\sigma_r^4\delta t^2\). Somando \(N = T/\delta t\) intervalos, a variância total cresce como \(N\delta t^2 = T\delta t\): desvio \(\propto \sqrt{\delta t}\). (Derman, 1999; Wilmott, PWOQF cap. 47.)</p>
<p><b>Custos de transação — o modelo de Leland (1985).</b> Com custo proporcional \(\kappa\) (negociar \(\nu\) ações custa \(\kappa|\nu|S\)), a posição <b>comprada</b> em call/put deve ser avaliada com uma vol <b>menor</b>, \(\check\sigma^2 = \sigma^2 - 2\kappa\sigma\sqrt{2/(\pi\,\delta t)}\), e a posição <b>vendida</b> com uma vol <b>maior</b>, \(\hat\sigma^2 = \sigma^2 + 2\kappa\sigma\sqrt{2/(\pi\,\delta t)}\). Intuição: quem está long gamma vende ativo na alta e compra na baixa, e o spread come um pedaço de cada rebalanceamento — é como se a vol realizada fosse menor; quem está short gamma compra na alta e vende na baixa pagando o spread — é como se fosse maior. Consequências de mesa: (1) custos criam um <b>bid/ask natural de vol</b> (\(\check\sigma\) no bid, \(\hat\sigma\) no offer); (2) rebalancear mais vezes (\(\delta t\) menor) <i>aumenta</i> esse spread; (3) para livros com gamma de sinais mistos a correção deixa de ser um simples ajuste de vol (Hoggard-Whalley-Wilmott). Ver Wilmott, PWOQF §48.3–48.4.</p>`,
    refs: [R_.wil(47, 'Discrete hedging'), R_.wil('48.3', 'The model of Leland (1985)'), R_.wil('48.8', 'Hedging to a bandwidth'), R_.hull('18.4', 'Delta hedging'), R_.mfd(16, 'Options with transaction costs'), R_.der(21, 'transaction costs')],
    sims: ['hedge'],
    ex: [
      { t: 'mcq', q: 'Você está short gamma e o mercado sobe forte. Para manter o delta neutro, você:', o: ['Vende ações (no preço alto)', 'Compra ações (no preço alto)', 'Não faz nada', 'Compra puts'], a: 1, e: 'Short gamma: o delta fica negativo quando sobe; você precisa comprar — na alta. Por isso short gamma "persegue" o mercado.' },
      { t: 'mcq', q: 'Se você passa a rebalancear 4 vezes menos (ex.: semanal em vez de diário, aprox.), o desvio-padrão do erro de hedge:', o: ['Cai pela metade', 'Não muda', 'Dobra (∝ √δt)', 'Quadruplica'], a: 2, e: 'Desvio ∝ √δt: 4× o intervalo ⇒ 2× o desvio.' },
      { tag: 'hedge', gen: R => { const n = R.int(5, 30) * 1000, G = R.f(0.02, 0.06, 3), S = R.f(30, 60, 2), mv = R.f(1, 3, 1) * R.sign(); const a = -n * G * S * mv / 100; return { q: `Você está long ${Q.fmt(n, 0)} opções com Γ = ${Q.fmt(G, 3)} cada, delta-neutro, spot ${F.r(S)}. O spot anda ${mv > 0 ? '+' : ''}${Q.fmt(mv, 1)}%. Quantas ações você negocia para voltar ao delta-neutro? (+ compra, − venda)`, a, tol: 0.01, tolAbs: 1, unit: 'ações', dec: 0, e: `Novo delta ≈ n·Γ·δS = ${n}·${Q.fmt(G, 3)}·${Q.fmt(S * mv / 100, 3)} = ${Q.fmt(-a, 0)}. Para zerar: ${Q.fmt(a, 0)} ações (${a < 0 ? 'vende na alta' : 'compra na baixa'} — gamma scalping).` }; } },
      { tag: 'hedge', gen: R => { const sh = R.int(5, 50) * 1000, S = R.f(20, 60, 2), bps = R.f(2, 10, 1); const a = sh * S * bps / 10000; return { q: `Um rebalanceamento de ${Q.fmt(sh, 0)} ações a ${F.r(S)} com custo total (spread + taxas) de ${Q.fmt(bps, 1)} bps sobre o financeiro custa quanto?`, a, tol: 0.002, unit: 'R$', dec: 2, e: `${sh} × ${Q.fmt(S, 2)} × ${Q.fmt(bps, 1)}/10.000 = ${Q.fmt(a, 2)}.` }; } },
      { t: 'mcq', q: 'Para uma posição long gamma, qual regra de rebalanceamento "captura" mais naturalmente o gamma?', o: ['Nunca rebalancear', 'Rebalancear a cada movimento de x% do spot', 'Rebalancear só no vencimento', 'Rebalancear aleatoriamente'], a: 1, e: 'Rebalancear por move realiza o gamma a cada perna do movimento.' }
    ],
    cards: [['Erro de hedge discreto', 'Desvio ∝ √(intervalo de hedge).'], ['Gamma scalping', 'Long gamma: vende na alta, compra na baixa ao re-hedgear.'], ['Hedge por banda', 'Rebalanceia só quando o delta sai de uma faixa.']]
  },
  {
    id: 'br5-3', title: 'PnL de vol: implícita vs realizada', tag: 'pnlvol',
    goal: 'Calcular o PnL esperado de uma posição de vol delta-hedgeada e entender de onde ele vem ao longo do tempo.',
    body: String.raw`
<p>Somando o PnL diário de gamma-theta até o vencimento, para uma opção comprada a vol implícita \(\sigma_i\) e hedgeada com essa mesma vol, num mercado que realiza \(\sigma_r\):</p>
\[ \text{PnL} \approx \sum_t \tfrac12\,\Gamma_t S_t^2\,(\sigma_r^2 - \sigma_i^2)\,\delta t. \]
<p>Três lições fundamentais:</p>
<ol><li><b>O sinal</b> depende só de \(\sigma_r\) vs \(\sigma_i\). Long vol ganha se \(\sigma_r > \sigma_i\).</li>
<li><b>O tamanho</b> depende de quanto gamma você tinha <i>onde</i> a vol foi realizada. Se o ativo "explodiu" quando você estava longe do strike (gamma baixo), você ganha pouco. O PnL é <b>path-dependent</b> (dependente do caminho).</li>
<li><b>Aproximação útil</b> (vega): \(\text{PnL} \approx \mathcal{V}\cdot(\sigma_r - \sigma_i)\), com vega em R$ por 1,00 de vol. Ex.: vega R$ 50 mil por ponto, realizou 3 pontos acima ⇒ ~R$ 150 mil.</li></ol>
<h3>Qual vol usar para calcular o delta?</h3>
<p>Hedgear com a <b>implícita</b>: o PnL diário é suave e depende do caminho (a fórmula acima). Hedgear com a <b>realizada</b> (se você a conhecesse): o PnL final é determinístico = diferença de preços BS com as duas vols, mas o caminho oscila muito. Na prática, mesas hedgeiam com a vol de mercado (implícita), às vezes ajustada pelo smile.</p>
<p>Use o simulador "Delta Hedge & PnL" com vol implícita 25% e realizada 20% (vendido em call) e veja: o PnL médio no Monte Carlo fica perto de \(\mathcal{V}(\sigma_r - \sigma_i)\), mas cada caminho individual varia.</p>`,
    desk: String.raw`"Realizou 18 contra 22 que eu vendi: dia bom para o livro." "Estou pagando 30 e o papel está realizando 25: sangrando theta." "Vol realizada de 10 dias" é o indicador mais olhado ao lado da IV.`,
    deep: String.raw`<p>A fórmula vem de: hedgeando com \(\sigma_i\), \(d\Pi = \tfrac12\Gamma_i S^2(\sigma_r^2 - \sigma_i^2)dt\) (determinística por instante, mas \(\Gamma_i S^2\) depende do caminho). Hedgeando com \(\sigma_r\), o PnL total é determinístico, igual a \(V(\sigma_r) - V(\sigma_i)\) (em valor presente), mas o incremento diário tem um termo em \(dW\) proporcional a \((\Delta_i - \Delta_r)\), o que torna o caminho do PnL ruidoso. Ver Wilmott, discussão sobre "qual vol usar no hedge" (Ahmad & Wilmott, 2005).</p>`,
    refs: [R_.wil('12.3', 'Implied versus actual: which volatility to hedge with?'), R_.wil('12.4', 'Case 1: hedge with actual volatility'), R_.wil('12.5', 'Case 2: hedge with implied volatility'), R_.hull('18.4', 'Delta hedging'), R_.cqf(3, 'hedge com vol implícita × realizada')],
    sims: ['hedge'],
    ex: [
      { tag: 'pnlvol', gen: R => { const V = R.int(20, 200) * 1000, si = R.f(20, 35, 1), sr = si + R.f(-6, 6, 1), side = R.sign(); const a = side * V * (sr - si); return { q: `Você está ${side > 0 ? 'comprado' : 'vendido'} em opções com vega de R$ ${Q.fmt(V, 0)} por ponto, negociadas a ${Q.fmt(si, 1)}% de IV. Delta-hedgeando até o vencimento, o ativo realiza ${Q.fmt(sr, 1)}%. PnL aproximado?`, a, tol: 0.001, tolAbs: 1, unit: 'R$', dec: 0, e: `≈ ${side > 0 ? '+' : '−'}vega × (σr − σi) = ${side > 0 ? '' : '−'}${Q.fmt(V, 0)} × (${Q.fmt(sr - si, 1)}) = ${Q.fmt(a, 0)}.` }; } },
      { tag: 'pnlvol', gen: R => { const G = R.f(0.01, 0.04, 3), S = 100, si = R.f(0.2, 0.3, 2), sr = R.f(0.15, 0.4, 2), days = R.pick([5, 10, 21]); const a = 0.5 * G * S * S * (sr * sr - si * si) * days / 252; return { q: `Long gamma com Γ = ${Q.fmt(G, 3)} (suponha constante), S = 100, comprado a ${F.p(si, 0)} de IV. Nos próximos ${days} dias úteis o ativo realiza ${F.p(sr, 0)}. PnL aproximado de gamma-theta?`, a, tol: 0.01, tolAbs: 0.001, dec: 4, e: `½·Γ·S²·(σr² − σi²)·(${days}/252) = 0,5·${Q.fmt(G, 3)}·10.000·(${Q.fmt(sr * sr, 4)} − ${Q.fmt(si * si, 4)})·${Q.fmt(days / 252, 4)} = ${Q.fmt(a, 4)}.` }; } },
      { t: 'mcq', q: 'Você comprou vol a 25, o ativo realizou 35 no mês, mas o seu PnL foi pequeno. A explicação mais provável:', o: ['Erro na fórmula', 'O movimento aconteceu quando o spot estava longe do strike (gamma baixo) — PnL é path-dependent', 'Theta foi zero', 'Vega é negativo'], a: 1, e: 'O ganho é ponderado pelo gamma no momento em que a vol foi realizada.' },
      { t: 'mcq', q: 'Um vendedor de vol que hedgeia com a vol implícita tem, dia a dia:', o: ['PnL determinístico ao final e caminho volátil', 'PnL diário suave (gamma-theta), resultado final dependente do caminho', 'PnL sempre zero', 'PnL igual ao de não hedgear'], a: 1, e: 'Hedge com implícita ⇒ incrementos ½ΓS²(σr² − σi²)dt: suaves, mas o total depende de onde o gamma estava.' }
    ],
    cards: [['PnL de vol hedgeado', 'Σ ½ Γ S² (σr² − σi²) δt'], ['Aproximação vega', 'PnL ≈ 𝒱 · (σr − σi)'], ['Path dependence', 'Ganho depende do gamma no momento em que a vol é realizada.']]
  },
  {
    id: 'br5-4', title: 'Cotando em vol: RFQ, bid/ask, referência e a rotina da mesa', tag: 'cotacao',
    goal: 'Entender como uma opção é pedida, cotada e fechada, e o vocabulário do dia a dia de uma mesa brasileira.',
    body: String.raw`
<h3>O fluxo de um pedido de preço (RFQ)</h3>
<ol><li>O <b>sales</b> liga: "Cliente quer comprar 50 mil PETR outubro 40 calls, me dá um preço."</li>
<li>O trader olha a superfície de vol, o inventário do livro e o risco: "Cota 31,5 / 32,5" (bid/ask em vol).</li>
<li>O cliente "pega" a 32,5 (compra da mesa). Define-se a <b>referência</b> (spot combinado, ex.: R$ 38,20) e o <b>delta</b> que vem junto: a mesa vende a call e, <i>ao mesmo tempo</i>, compra do cliente o delta em ações a R$ 38,20. Isso é um <b>"delta cruzado" / "com delta"</b> — o cliente não assume risco de spot na execução.</li>
<li>O prêmio em R$ sai do BS com a vol negociada, o spot de referência, a taxa e os dividendos.</li></ol>
<h3>Bid/ask e edge</h3>
<p>O spread em vol vira dinheiro via vega: 1 ponto de spread numa opção com vega de R$ 0,05 é R$ 0,05 por opção. Em 50 mil opções, R$ 2.500 de "edge" teórico. O trader ajusta o meio (mid) conforme o inventário: se já está muito vendido em vol, cota mais alto para desestimular mais compras ("skewar o preço").</p>
<h3>Vocabulário de mesa (Brasil)</h3>
<table><tr><th>Termo</th><th>Significado</th></tr>
<tr><td>Trava (de alta/baixa)</td><td>spread vertical (Unidade 6)</td></tr>
<tr><td>Boxe / box de 4 pontas</td><td>box (renda fixa sintética)</td></tr>
<tr><td>Rolar</td><td>trocar a posição de um vencimento para outro</td></tr>
<tr><td>Virar a mão</td><td>inverter a posição (de comprado para vendido)</td></tr>
<tr><td>Pregão / leilão de abertura/fechamento</td><td>sessões da B3; muitos hedges são feitos no call de fechamento</td></tr>
<tr><td>Formador de mercado (market maker)</td><td>participante credenciado na B3 com obrigação de cotar</td></tr>
<tr><td>Exercício / "vencimento de opções"</td><td>dia de alta atividade; "pin" no strike com grande open interest</td></tr>
<tr><td>Ajuste</td><td>preço de ajuste de futuros / fluxo diário</td></tr></table>
<h3>A rotina</h3>
<p>Manhã: PnL explain do dia anterior, risco do livro (gregas, cenários), notícias (eventos, dividendos, Copom). Durante o pregão: atender fluxo, re-hedgear, ajustar a superfície. Fim do dia: marcar a superfície de vol (<b>mark-to-market</b>), fechamento dos hedges, relatório de risco.</p>`,
    desk: String.raw`"Me mostra um two-way" = cota bid e ask. "Pego a 32,5" / "dou a 31,5" = fecho. "Você está bid/offered em quanto?" "Com delta a 38,20" = o hedge é cruzado com o cliente naquela referência. "Estou axe para vender vol" = quero vender vol, vou cotar agressivo desse lado.`,
    refs: [R_.hull('9.5', 'Trading (market makers)'), R_.car('microestrutura e prática do mercado brasileiro')],
    ex: [
      { tag: 'cotacao', gen: R => { const n = R.int(10, 100) * 1000, v = R.f(0.02, 0.1, 3), sp = R.pick([0.5, 1, 1.5, 2]); const a = n * v * sp / 2; return { q: `Você cota ${Q.fmt(n, 0)} opções com vega de R$ ${Q.fmt(v, 3)}/ponto, spread de ${Q.fmt(sp, 1)} ponto de vol (bid/ask simétrico ao redor do mid). O cliente fecha. Qual o edge teórico vs o mid, em R$?`, a, tol: 0.002, unit: 'R$', dec: 0, e: `Metade do spread × vega × quantidade = ${Q.fmt(sp / 2, 2)} × ${Q.fmt(v, 3)} × ${n} = ${Q.fmt(a, 0)}.` }; } },
      { tag: 'cotacao', gen: R => { const n = R.int(10, 80) * 1000, d = R.f(0.3, 0.7, 2); const a = Math.round(n * d); return { q: `O cliente compra ${Q.fmt(n, 0)} calls (delta ${Q.fmt(d, 2)}) "com delta". Quantas ações a mesa <b>compra</b> do cliente na referência para ficar delta-neutra?`, a, tolAbs: 1, unit: 'ações', dec: 0, e: `A mesa vendeu calls (Δ = −${Q.fmt(n * d, 0)}); compra ${Q.fmt(a, 0)} ações do cliente para zerar.` }; } },
      { t: 'mcq', q: 'Seu livro já está muito vendido em vol e chega um RFQ de cliente querendo comprar mais opções. O natural é:', o: ['Cotar a vol mais baixa para ganhar o negócio', 'Cotar o mid mais alto ("skewar") para desestimular ou cobrar pelo risco adicional', 'Recusar sempre', 'Cotar sem spread'], a: 1, e: 'O inventário afeta o preço: você cobra mais pelo risco que já tem em excesso.' },
      { t: 'mcq', q: '"Rolar a posição" significa:', o: ['Exercer a opção', 'Encerrar o vencimento atual e abrir a mesma exposição no próximo vencimento', 'Dobrar a posição', 'Fazer delta hedge'], a: 1, e: 'Rolagem = trocar o vencimento mantendo a exposição.' }
    ],
    cards: [['RFQ', 'Request for quote: pedido de preço do cliente via sales.'], ['"Com delta" / cross', 'Opção e hedge em ações fechados juntos numa referência de spot.'], ['Two-way', 'Cotação com bid e ask.'], ['Axe', 'Interesse do trader em fazer um lado específico.']]
  }
  ]
});

/* ---------------- BR6 — Estruturas ---------------- */
Course.unit('br', {
  id: 'br6', title: 'Estruturas e o impacto nas gregas',
  desc: 'Travas, straddles, strangles, borboletas, condors, risk reversals, collars, fences, seagulls, calendars — o payoff, as gregas e a visão de vol de cada uma, e como uma estrutura muda as gregas do livro.',
  sims: ['struct', 'book'], exam: { n: 12, minutes: 25 },
  lessons: [
  {
    id: 'br6-1', title: 'Spreads verticais (travas)', tag: 'estruturas',
    goal: 'Montar e ler travas de alta e de baixa, e ver por que as gregas delas são "localizadas".',
    body: String.raw`
<p>Uma <b>trava</b> (vertical spread) combina opções do mesmo tipo e vencimento com strikes diferentes:</p>
<ul><li><b>Trava de alta com calls</b> (bull call spread): compra call \(K_1\), vende call \(K_2 > K_1\). Paga prêmio; lucro máximo \(K_2-K_1-\text{custo}\) se \(S_T\ge K_2\).</li>
<li><b>Trava de baixa com puts</b> (bear put spread): compra put \(K_2\), vende put \(K_1 < K_2\).</li>
<li>Travas "a crédito": vender a mais cara e comprar a mais barata (ex.: vender put spread = trava de alta com puts, recebe prêmio).</li></ul>
<div class="w" data-w="payoff" data-a='{"preset":"Trava de alta com call (bull call spread)"}'></div>
<h3>Gregas</h3>
<p>A trava é a diferença de duas opções: suas gregas também. Com o spot entre os strikes:</p>
<ul><li>Delta positivo e limitado (máximo no meio dos strikes perto do vencimento).</li>
<li><b>Gamma e vega trocam de sinal</b>: perto de \(K_1\) (a opção comprada domina), long gamma/vega; perto de \(K_2\) (a vendida domina), short gamma/vega. Uma trava de alta com spot já perto do strike de cima é vendida em vol!</li>
<li>Theta idem, com sinal oposto ao gamma.</li></ul>
<p>Pela paridade, trava de alta com calls ≡ trava de alta com puts (mesmos strikes) + caixa: mesmo risco, fluxo de prêmio diferente.</p>
<h3>Uso</h3>
<p>Varejo usa travas como aposta direcional barata. Na mesa, travas aparecem como hedge de skew (vender o call spread OTM contra calls compradas) e dentro de produtos estruturados (COE com participação limitada = call spread).</p>`,
    desk: String.raw`"Compra a 40/44 de outubro" = trava de alta 40/44. "Trava de alta com puts a crédito" é a mesma exposição recebendo o prêmio na entrada. "Call spread 100/120" em produtos = participação limitada a 20%.`,
    refs: [R_.hull('11.3', 'Spreads'), R_.wil('2.14', 'Bull and bear spreads')],
    sims: ['struct?preset=Trava de alta com call (bull call spread)'],
    ex: [
      { tag: 'estruturas', gen: R => { const K1 = R.step(28, 36, 1), K2 = K1 + R.pick([2, 3, 4]), c1 = R.f(1.5, 3, 2), c2 = R.f(0.3, 1.2, 2); const a = (K2 - K1) - (c1 - c2); return { q: `Trava de alta: compra call ${K1} a ${F.r(c1)} e vende call ${K2} a ${F.r(c2)}. Lucro máximo por unidade?`, a, tolAbs: 0.005, unit: 'R$', dec: 2, e: `(${K2} − ${K1}) − (${Q.fmt(c1, 2)} − ${Q.fmt(c2, 2)}) = ${Q.fmt(a, 2)}.` }; } },
      { tag: 'estruturas', gen: R => { const K1 = R.step(28, 36, 1), K2 = K1 + R.pick([2, 3, 4]), c1 = R.f(1.5, 3, 2), c2 = R.f(0.3, 1.2, 2); const a = K1 + (c1 - c2); return { q: `Mesma trava (compra call ${K1} a ${F.r(c1)}, vende call ${K2} a ${F.r(c2)}): breakeven no vencimento?`, a, tolAbs: 0.005, unit: 'R$', dec: 2, e: `K1 + custo líquido = ${K1} + ${Q.fmt(c1 - c2, 2)} = ${Q.fmt(a, 2)}.` }; } },
      { tag: 'estruturas', gen: R => { const S = 100, K1 = 100, K2 = R.pick([105, 110, 115]), T = 0.25, s = 0.25, r = 0.1; const g1 = bs('call', S, K1, T, r, s), g2 = bs('call', S, K2, T, r, s); const a = (g1.vega - g2.vega) / 100; return { q: `Trava de alta 100/${K2}, 3 meses, S = 100, vol 25% flat, r = 10%. Vega líquido por ponto?`, a, tol: 0.02, tolAbs: 0.0005, dec: 4, e: `𝒱(100)/100 − 𝒱(${K2})/100 = ${Q.fmt(g1.vega / 100, 4)} − ${Q.fmt(g2.vega / 100, 4)} = ${Q.fmt(a, 4)}.` }; } },
      { t: 'mcq', q: 'Você tem uma trava de alta com calls 100/110 e o spot está em 109, faltando 2 semanas. Sua exposição a vol é:', o: ['Comprado em vol', 'Vendido em vol (a call 110 vendida domina)', 'Neutro sempre', 'Depende só dos juros'], a: 1, e: 'Perto do strike vendido, o gamma/vega da opção vendida domina: a trava fica short vol.' },
      { t: 'tf', q: 'Uma trava de alta com calls e uma trava de alta com puts, mesmos strikes e vencimento (europeias), têm o mesmo delta, gamma e vega.', a: true, e: 'Diferem por caixa (paridade): gregas iguais.' }
    ],
    cards: [['Trava de alta (calls)', 'Compra call K1, vende call K2 > K1.'], ['Gregas da trava', 'Trocam de sinal entre os strikes: long vol perto de K1, short vol perto de K2.']]
  },
  {
    id: 'br6-2', title: 'Straddle, strangle, borboleta e condor: estruturas de vol', tag: 'estruturas',
    goal: 'Dominar as estruturas "puras" de volatilidade e o que cada uma expressa sobre movimento, vol e curvatura.',
    body: String.raw`
<table><tr><th>Estrutura</th><th>Montagem</th><th>Visão</th><th>Gregas (spot no centro)</th></tr>
<tr><td>Straddle comprado</td><td>call + put ATM</td><td>vai mexer muito</td><td>Δ≈0, Γ+ alto, 𝒱+, Θ−</td></tr>
<tr><td>Strangle comprado</td><td>put OTM + call OTM</td><td>vai mexer <i>muito</i> (mais barato)</td><td>Δ≈0, Γ+, 𝒱+, Θ−, volga+</td></tr>
<tr><td>Borboleta comprada</td><td>+1 K1, −2 K2, +1 K3 (calls)</td><td>vai parar perto de K2</td><td>Γ−, 𝒱− no centro</td></tr>
<tr><td>Iron condor vendido</td><td>−strangle interno +strangle externo</td><td>vai ficar num intervalo</td><td>Γ−, 𝒱−, Θ+, risco limitado</td></tr></table>
<div class="w" data-w="payoff" data-a='{"preset":"Long straddle"}'></div>
<div class="w" data-w="payoff" data-a='{"preset":"Long butterfly"}'></div>
<h3>O straddle como "termômetro" da vol</h3>
<p>O straddle ATM é o instrumento-padrão para comprar/vender vol: tem delta ~0 na montagem e máximo gamma e vega. Seu preço dá uma estimativa rápida do <b>move esperado</b> até o vencimento:</p>
\[ \text{Straddle}_{ATM} \approx 0{,}8\,S\,\sigma\sqrt{T} \quad(\text{duas vezes } 0{,}4\,S\sigma\sqrt{T}). \]
<p>E \(\sqrt{2/\pi}\approx0{,}8\) é exatamente \(E|Z|\): o straddle ≈ valor esperado do move absoluto. Traders usam o straddle de vencimento curto para ler o "move precificado" de um evento (resultado, Copom, eleição).</p>
<h3>Borboleta: curvatura e probabilidade</h3>
<p>Uma borboleta apertada (\(K\pm\delta K\)) paga como uma "agulha" em \(K\): seu preço dividido por \(\delta K^2\) é a densidade neutra a risco de terminar em \(K\) (descontada). Borboletas de asa (25-delta) medem a <b>curvatura do smile</b> — o preço das caudas.</p>
<p>Repare nas gregas: a borboleta comprada é short gamma/vega no centro e long nas asas. Não é um "straddle vendido barato" — é uma aposta de <i>onde</i> o spot vai estar.</p>`,
    desk: String.raw`"Straddle de earnings está precificando 6% de move." "Vender o strangle 10-delta" = vender asas. "Fly" = borboleta. "Comprar o fly" = apostar em imobilidade num ponto (ou comprar curvatura, no contexto de smile).`,
    refs: [R_.hull('11.4', 'Combinations'), R_.hull('11.3', 'Spreads (butterfly spreads)'), R_.wil('2.15', 'Straddles and strangles'), R_.wil('2.17', 'Butterflies and condors')],
    sims: ['struct?preset=Long straddle', 'struct?preset=Long butterfly', 'struct?preset=Short iron condor'],
    ex: [
      { tag: 'estruturas', gen: R => { const S = R.f(20, 150, 0), s = R.f(0.15, 0.6, 2), T = R.pick([1 / 52, 1 / 12, 0.25]); const a = 0.8 * S * s * Math.sqrt(T); return { q: `Aproximação: preço de um straddle ATM com S = ${S}, σ = ${F.p(s, 0)}, T = ${Q.fmt(T, 4)} ano?`, a, tol: 0.01, dec: 3, e: `0,8 × ${S} × ${s} × √${Q.fmt(T, 4)} = ${Q.fmt(a, 3)}.` }; } },
      { tag: 'estruturas', gen: R => { const S = R.f(30, 60, 2), st = R.f(1, 5, 2); const a = st / S * 100; return { q: `O straddle ATM que vence logo após o balanço custa ${F.r(st)} com a ação a ${F.r(S)}. Qual o move (em %) aproximadamente precificado?`, a, tol: 0.005, unit: '%', dec: 2, e: `Straddle ≈ move absoluto esperado: ${Q.fmt(st, 2)}/${Q.fmt(S, 2)} = ${Q.fmt(a, 2)}%.` }; } },
      { tag: 'estruturas', gen: R => { const K = R.step(28, 40, 1), w = R.pick([1, 2, 3]), c = R.f(0.2, 0.8, 2), ST = K + R.f(-4, 4, 2); const pay = Math.max(ST - (K - w), 0) - 2 * Math.max(ST - K, 0) + Math.max(ST - (K + w), 0); const a = pay - c; return { q: `Borboleta comprada ${K - w}/${K}/${K + w} com calls, custo ${F.r(c)}. No vencimento, S = ${F.r(ST)}. Lucro?`, a, tolAbs: 0.005, unit: 'R$', dec: 2, e: `Payoff = max(S−${K - w},0) − 2max(S−${K},0) + max(S−${K + w},0) = ${Q.fmt(pay, 2)}; lucro = ${Q.fmt(a, 2)}.` }; } },
      { t: 'mcq', q: 'Qual estrutura é long volga (ganha com vol da vol) de forma mais pura?', o: ['Straddle ATM', 'Strangle bem OTM comprado', 'Borboleta comprada', 'Trava de alta'], a: 1, e: 'Asas OTM têm volga alto; ATM tem volga ~0.' },
      { t: 'mcq', q: 'Um iron condor vendido tem perda máxima:', o: ['Ilimitada', 'Limitada à distância entre strikes de uma asa menos o prêmio recebido', 'Zero', 'Igual ao prêmio'], a: 1, e: 'As asas compradas limitam a perda.' }
    ],
    cards: [['Straddle ATM aprox.', '≈ 0,8·S·σ·√T ≈ move absoluto esperado'], ['Borboleta', '+1 K1, −2 K2, +1 K3; preço ∝ densidade em K2.'], ['Strangle', 'Put OTM + call OTM.']]
  },
  {
    id: 'br6-3', title: 'Risk reversal, collar, fence e seagull: estruturas de skew', tag: 'estruturas',
    goal: 'Entender as estruturas que misturam direção e skew e como elas aparecem em hedge de clientes brasileiros.',
    body: String.raw`
<h3>Risk reversal (RR)</h3>
<p>Compra call OTM + vende put OTM (tipicamente 25-delta). Delta positivo, vega ~0 (se simétrico), mas exposição forte ao <b>skew</b>: com skew negativo, a put vendida é "cara" em vol, então o RR costuma sair com crédito ou custo zero. O preço do RR em vol (\(\sigma_{25C} - \sigma_{25P}\)) é a cotação padrão do skew.</p>
<p>Gregas-chave: <b>vanna</b>. Quem vende o RR (vende call, compra put) fica long skew: ganha se as puts ficarem relativamente mais caras — tipicamente, se o mercado cair.</p>
<h3>Collar</h3>
<p>Ação + put comprada + call vendida. O clássico hedge "custo zero" de uma carteira: a call vendida financia a put. Resultado: participação no intervalo [K<sub>put</sub>, K<sub>call</sub>]. É ação + RR vendido.</p>
<div class="w" data-w="payoff" data-a='{"preset":"Collar (ação + put − call)"}'></div>
<h3>Fence e seagull</h3>
<p><b>Fence</b> (muito usado no Brasil por empresas e investidores): ação + put spread comprado + call vendida. A proteção só vale até o strike baixo do put spread (abaixo dele, você volta a perder). Fica mais barata que o collar porque vende uma put mais OTM.</p>
<p><b>Seagull</b> (gaivota): call spread comprado financiado por put vendida (ou o espelho). Três pernas, custo próximo de zero, direcional com risco na cauda.</p>
<div class="w" data-w="payoff" data-a='{"preset":"Fence (ação + put spread − call)"}'></div>
<h3>A leitura de mesa</h3>
<p>Estruturas "custo zero" nunca são grátis: o cliente vende opcionalidade (normalmente a cauda ou a alta) para comprar outra. A mesa que compra essa cauda dele fica com o risco de skew/crash. Em hedge de exportadores/importadores com dólar, fences e seagulls são o pão de cada dia (e historicamente geraram perdas enormes quando mal dimensionados — vide 2008).</p>`,
    desk: String.raw`"RR 25-delta está −4" = a put 25Δ tem 4 pontos de vol a mais que a call 25Δ. "Zero-cost collar". "Fence com proteção entre 90 e 80". "Seagull" / "gaivota".`,
    refs: [R_.hull(11, 'Trading strategies involving options'), R_.wil('2.16', 'Risk reversal'), R_.wil('50.10', 'Volatility information contained in a risk-reversal'), R_.car('estruturas de hedge cambial com opções')],
    sims: ['struct?preset=Risk reversal (long call 25d / short put 25d)', 'struct?preset=Collar (ação + put − call)', 'struct?preset=Fence (ação + put spread − call)', 'struct?preset=Seagull (call spread − put)'],
    ex: [
      { tag: 'estruturas', gen: R => { const S0 = R.f(30, 50, 2), Kp = Math.round(S0 * 0.9), Kc = Math.round(S0 * 1.12), net = R.f(-0.2, 0.2, 2), ST = S0 * (1 + R.f(-0.3, 0.3, 3)); const v = Math.min(Math.max(ST, Kp), Kc); const a = v - S0 - net; return { q: `Collar: ação comprada a ${F.r(S0)}, put ${Kp} comprada, call ${Kc} vendida, custo líquido das opções ${F.r(net)} (${net >= 0 ? 'pago' : 'recebido'}). No vencimento S = ${F.r(ST)}. Lucro por ação?`, a, tolAbs: 0.01, unit: 'R$', dec: 2, e: `Valor final = min(max(S, ${Kp}), ${Kc}) = ${Q.fmt(v, 2)}; lucro = ${Q.fmt(v, 2)} − ${Q.fmt(S0, 2)} − (${Q.fmt(net, 2)}) = ${Q.fmt(a, 2)}.` }; } },
      { tag: 'estruturas', gen: R => { const S0 = 100, K1 = 95, K2 = 85, Kc = 110, ST = R.f(60, 120, 1); const val = ST + Math.max(K1 - ST, 0) - Math.max(K2 - ST, 0) - Math.max(ST - Kc, 0); const a = val - S0; return { q: `Fence: ação a 100, compra put 95, vende put 85, vende call 110 (custo zero). No vencimento S = ${Q.fmt(ST, 1)}. Resultado por ação?`, a, tolAbs: 0.01, dec: 2, e: `Valor = S + max(95−S,0) − max(85−S,0) − max(S−110,0) = ${Q.fmt(val, 2)}; resultado = ${Q.fmt(a, 2)}. ${ST < 85 ? 'Abaixo de 85 a proteção acaba: você perde 10 a menos que a ação.' : ''}` }; } },
      { tag: 'estruturas', gen: R => { const vp = R.f(24, 34, 1), vc = vp - R.f(2, 8, 1); const a = vc - vp; return { q: `A put 25-delta está a ${Q.fmt(vp, 1)}% de vol e a call 25-delta a ${Q.fmt(vc, 1)}%. Qual o risk reversal 25Δ (call − put) em pontos de vol?`, a, tolAbs: 0.05, dec: 1, e: `RR = σ_call − σ_put = ${Q.fmt(vc, 1)} − ${Q.fmt(vp, 1)} = ${Q.fmt(a, 1)}.` }; } },
      { t: 'mcq', q: 'Um collar (ação + put − call) é equivalente a:', o: ['Ação + risk reversal vendido (vende call, compra put)', 'Straddle', 'Borboleta', 'Box'], a: 0, e: 'Comprar put + vender call = vender o RR.' },
      { t: 'mcq', q: 'Qual o principal risco de quem faz uma fence "custo zero" para proteger uma carteira?', o: ['Theta', 'Quedas muito fortes (abaixo do strike da put vendida), onde a proteção acaba', 'Juros', 'Nenhum'], a: 1, e: 'A put vendida devolve o risco de cauda.' }
    ],
    cards: [['Risk reversal', 'Call OTM − put OTM (mesmo delta); cota o skew.'], ['Collar', 'Ação + put − call.'], ['Fence', 'Ação + put spread − call: proteção limitada.'], ['Seagull', 'Call spread comprado financiado por put vendida.']]
  },
  {
    id: 'br6-4', title: 'Calendars e diagonais: estrutura a termo', tag: 'estruturas',
    goal: 'Entender estruturas com vencimentos diferentes e como elas separam gamma de vega.',
    body: String.raw`
<p>Um <b>calendar spread</b> vende a opção curta e compra a longa, mesmo strike. Com spot perto do strike:</p>
<ul><li>A curta tem mais gamma e theta; a longa, mais vega.</li>
<li>Resultado: <b>short gamma, long vega, recebe theta</b>. Você ganha se o spot ficar parado (theta da curta) <i>e/ou</i> se a vol implícita dos vencimentos longos subir.</li>
<li>Risco: movimento forte do spot (short gamma) e queda da vol longa.</li></ul>
<div class="w" data-w="payoff" data-a='{"preset":"Calendar (vende curta, compra longa)","title":"Calendar: PnL no vencimento da curta (arco) e hoje"}'></div>
<p>O calendar é a estrutura natural para operar a <b>estrutura a termo da vol</b>: se a vol de 1 mês está muito acima da de 6 meses (estrutura invertida após um choque), vender o curto e comprar o longo aposta na normalização.</p>
<h3>Vol forward</h3>
<p>A vol entre dois vencimentos \(T_1<T_2\) implícita pela superfície é</p>
\[ \sigma_{1,2} = \sqrt{\frac{\sigma_2^2T_2 - \sigma_1^2T_1}{T_2 - T_1}}. \]
<p>Um calendar ATM ponderado por vega é, aproximadamente, uma posição comprada nessa vol forward. Se \(\sigma_2^2T_2 < \sigma_1^2T_1\), a variância total estaria diminuindo com o prazo: arbitragem de calendário.</p>
<h3>Diagonais</h3>
<p>Strikes e vencimentos diferentes (ex.: vende call curta OTM, compra call longa ATM): mistura calendar com direção. Muito usada como "lançamento coberto sintético" (a call longa substitui a ação).</p>`,
    desk: String.raw`"Vender o front, comprar o back" = calendar. "A curva de vol está invertida" = curto > longo. "Vega ponderada" (weighted vega) para comparar vencimentos.`,
    refs: [R_.hull('11.3', 'Spreads (calendar and diagonal spreads)'), R_.wil('2.18', 'Calendar spreads'), R_.hull('19.5', 'The volatility term structure and volatility surfaces')],
    sims: ['struct?preset=Calendar (vende curta, compra longa)', 'smile'],
    ex: [
      { tag: 'estruturas', gen: R => { const s1 = R.f(0.25, 0.4, 3), T1 = R.pick([1 / 12, 0.25]), s2 = R.f(0.2, 0.3, 3), T2 = R.pick([0.5, 1]); const v = (s2 * s2 * T2 - s1 * s1 * T1) / (T2 - T1); if (v <= 0) return { q: `Vol de ${Q.fmt(T1, 3)} ano = ${F.p(s1, 1)} e de ${T2} ano = ${F.p(s2, 1)}. Existe arbitragem de calendário? Responda 1 para sim, 0 para não.`, a: 1, tolAbs: 0.01, dec: 0, e: `σ2²T2 = ${Q.fmt(s2 * s2 * T2, 4)} < σ1²T1 = ${Q.fmt(s1 * s1 * T1, 4)}: variância total decrescente ⇒ arbitragem.` }; const a = Math.sqrt(v) * 100; return { q: `Vol ATM de ${Q.fmt(T1, 3)} ano = ${F.p(s1, 1)} e de ${T2} ano = ${F.p(s2, 1)}. Qual a vol forward entre os dois vencimentos, em %?`, a, tol: 0.003, unit: '%', dec: 2, e: `√[(${Q.fmt(s2, 3)}²·${T2} − ${Q.fmt(s1, 3)}²·${Q.fmt(T1, 3)})/(${T2} − ${Q.fmt(T1, 3)})] = ${Q.fmt(a, 2)}%.` }; } },
      { t: 'mcq', q: 'Calendar ATM (vende 1 mês, compra 6 meses), spot no strike. Gregas:', o: ['Long gamma, short vega', 'Short gamma, long vega, theta positivo', 'Long gamma, long vega', 'Todas zero'], a: 1, e: 'Curta domina gamma/theta; longa domina vega.' },
      { t: 'mcq', q: 'Após um choque, a vol de 1 mês foi a 45 e a de 6 meses a 30. Um trader que acha que o choque vai se dissipar faria:', o: ['Compra o curto, vende o longo', 'Vende o curto, compra o longo (calendar)', 'Compra os dois', 'Nada'], a: 1, e: 'Aposta na normalização da estrutura invertida.' },
      { t: 'tf', q: 'Em um calendar, o maior risco perto do vencimento da perna curta é um movimento forte do spot.', a: true, e: 'Short gamma concentrado na opção curta.' }
    ],
    cards: [['Calendar', 'Vende curta, compra longa: Γ−, 𝒱+, Θ+.'], ['Vol forward', '√[(σ2²T2 − σ1²T1)/(T2 − T1)]']]
  },
  {
    id: 'br6-5', title: 'Como uma estrutura muda as gregas do livro', tag: 'livro',
    goal: 'Agregar gregas, prever o efeito de um novo trade no livro e escolher estruturas para neutralizar riscos específicos.',
    body: String.raw`
<p>Gregas são <b>aditivas</b>: o livro é a soma das posições. Quando entra um trade de cliente, a pergunta do trader é: <i>o que isso faz com o meu risco, e o que eu preciso fazer para voltar aos limites?</i></p>
<h3>Mapa mental por estrutura (spot no centro, comprado)</h3>
<table><tr><th>Estrutura</th><th>Δ</th><th>Γ</th><th>𝒱</th><th>Θ</th><th>Skew/vanna</th><th>Volga</th></tr>
<tr><td>Call</td><td>+</td><td>+</td><td>+</td><td>−</td><td>±</td><td>+ (se OTM)</td></tr>
<tr><td>Put</td><td>−</td><td>+</td><td>+</td><td>−</td><td>±</td><td>+ (se OTM)</td></tr>
<tr><td>Straddle</td><td>0</td><td>++</td><td>++</td><td>−−</td><td>0</td><td>~0</td></tr>
<tr><td>Strangle</td><td>0</td><td>+</td><td>+</td><td>−</td><td>0</td><td>++</td></tr>
<tr><td>Risk reversal (call−put)</td><td>+</td><td>~0</td><td>~0</td><td>~0</td><td>short skew</td><td>~0</td></tr>
<tr><td>Borboleta</td><td>0</td><td>−</td><td>−</td><td>+</td><td>0</td><td>+</td></tr>
<tr><td>Calendar</td><td>0</td><td>−</td><td>+</td><td>+</td><td>—</td><td>—</td></tr></table>
<h3>Neutralizando riscos: a ordem natural</h3>
<ol><li><b>Vega</b> (e sua distribuição por vencimento): hedgeia com opções do vencimento certo (tipicamente ATM ou straddles).</li>
<li><b>Gamma</b>: ajusta com opções curtas.</li>
<li><b>Skew</b>: risk reversals.</li>
<li><b>Delta</b> por último, com ação ou futuro (é o mais barato e líquido, e as opções que você negociou antes mudaram o delta).</li></ol>
<p>Exemplo: um cliente compra da mesa 1.000 calls de 1 ano 110% (COE). A mesa fica: short vega longo, short volga, long skew (vendeu call OTM), delta negativo. Hedge: compra vega de 1 ano (ATM ou calls listadas), compra delta com futuro. O risco residual (skew, volga, correlação spot-vol) vira parte do livro e é gerenciado com limites.</p>
<p>No simulador <b>Livro de Risco</b>, adicione posições e observe como as gregas agregadas e a grade spot × vol se movem. É o dia a dia do trader.</p>`,
    desk: String.raw`"Esse trade me deixa curto de vega de 1 ano e longo de gamma curto; vou comprar um straddle de 1 ano para neutralizar." "O cliente me deu skew" = eu comprei puts OTM (ou vendi calls OTM) do cliente.`,
    refs: [R_.hull('18.6', 'Gamma (making a portfolio gamma neutral)'), R_.hull('18.8', 'Vega'), R_.wil('7.10', 'A classification of hedging types')],
    sims: ['book', 'struct'],
    ex: [
      { tag: 'livro', gen: R => { const G = R.int(-5000, -1000), Go = R.f(0.02, 0.06, 3), Dopt = R.f(0.4, 0.6, 2); const n = -G / Go; const a = n; return { q: `Seu livro tem gamma de ${Q.fmt(G, 0)} (em ações por R$1 de spot). Você quer zerar o gamma usando calls ATM com Γ = ${Q.fmt(Go, 3)} cada. Quantas calls comprar?`, a, tol: 0.005, tolAbs: 1, unit: 'calls', dec: 0, e: `n = −Γlivro/Γopção = ${Q.fmt(-G, 0)}/${Q.fmt(Go, 3)} = ${Q.fmt(a, 0)}.` }; } },
      { tag: 'livro', gen: R => { const G = R.int(-5000, -1000), Go = R.f(0.02, 0.06, 3), Dopt = R.f(0.45, 0.6, 2), Db = R.int(-3000, 3000); const n = -G / Go; const a = -(Db + n * Dopt); return { q: `Continuando: o livro tinha delta de ${Q.fmt(Db, 0)} ações e gamma ${Q.fmt(G, 0)}. Você compra ${Q.fmt(n, 0)} calls (Γ ${Q.fmt(Go, 3)}, Δ ${Q.fmt(Dopt, 2)}) para zerar o gamma. Quantas ações negociar depois para zerar o delta? (+ compra, − venda)`, a, tolAbs: 2, unit: 'ações', dec: 0, e: `Novo delta = ${Q.fmt(Db, 0)} + ${Q.fmt(n, 0)}×${Q.fmt(Dopt, 2)} = ${Q.fmt(Db + n * Dopt, 0)} ⇒ negociar ${Q.fmt(a, 0)}. Delta sempre por último!` }; } },
      { tag: 'livro', gen: R => { const V1 = R.int(-400, -100) * 1000, Vo = R.f(0.1, 0.4, 3); const a = -V1 / Vo; return { q: `O livro está short R$ ${Q.fmt(-V1, 0)} de vega (por ponto) no vencimento de 1 ano. Straddles de 1 ano têm vega de R$ ${Q.fmt(Vo, 3)} por ponto (por unidade). Quantos straddles comprar para zerar?`, a, tol: 0.005, unit: 'straddles', dec: 0, e: `${Q.fmt(-V1, 0)}/${Q.fmt(Vo, 3)} = ${Q.fmt(a, 0)}.` }; } },
      { t: 'mcq', q: 'Um cliente compra da mesa calls de 1 ano 120% (bem OTM). O risco que sobra para a mesa, além de delta e vega, é principalmente:', o: ['Rho de DI', 'Short volga e exposição a skew (vendeu asa de call)', 'Long gamma curto', 'Nenhum'], a: 1, e: 'A mesa vendeu uma asa: short volga e sensível ao formato do smile.' },
      { t: 'mcq', q: 'Por que o delta deve ser ajustado por último?', o: ['Porque é o menos importante', 'Porque os hedges com opções mudam o delta; ajustar antes seria refazer', 'Porque a B3 exige', 'Porque é o mais caro'], a: 1, e: 'Toda opção comprada/vendida para hedgear gamma/vega traz delta junto.' }
    ],
    cards: [['Ordem de hedge', 'Vega → gamma → skew → delta (por último).'], ['Gregas de livro', 'Somam-se: Σ qty × grega.'], ['Calendar no mapa', 'Γ−, 𝒱+, Θ+']]
  }
  ]
});
})();
