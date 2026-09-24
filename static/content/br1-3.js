/* ============ MÓDULO BRASIL — Unidades 1 a 3 ============ */
(function () {
const R_ = window.REF;

/* ---------------- BR1 — Fundamentos de mercado ---------------- */
Course.unit('br', {
  id: 'br1', title: 'Fundamentos: mercado, juros e derivativos lineares',
  desc: 'O que é um derivativo, quem opera, como funcionam os juros no Brasil (DI, 252 dias úteis), termos e futuros, e o PnL de posições lineares.',
  sims: ['br'], exam: { n: 10, minutes: 20 },
  lessons: [
  {
    id: 'br1-1', title: 'O que é um derivativo e quem está na mesa', tag: 'fundamentos',
    goal: 'Entender o que é um derivativo, os tipos básicos e os papéis de cada participante — inclusive o da mesa proprietária.',
    body: String.raw`
<p>Um <b>derivativo</b> é um contrato cujo valor <i>deriva</i> do preço de outro ativo — o <b>ativo-objeto</b> (em inglês, <i>underlying</i>): uma ação (PETR4), um índice (Ibovespa, S&amp;P 500), uma taxa de juros (DI), uma moeda (dólar), uma commodity. O contrato define hoje o que vai acontecer em datas futuras em função do que o ativo fizer.</p>
<p>Existem quatro famílias básicas:</p>
<ul>
<li><b>Termo (forward)</b>: compromisso de comprar/vender o ativo numa data futura, a um preço fixado hoje. Negociado bilateralmente (balcão/OTC) ou registrado na B3.</li>
<li><b>Futuro</b>: parecido com o termo, mas padronizado, negociado em bolsa e com <b>ajuste diário</b> (o ganho ou perda é liquidado todo dia).</li>
<li><b>Swap</b>: troca de fluxos (ex.: pago CDI, recebo a variação do Ibovespa).</li>
<li><b>Opção</b>: o <i>direito</i>, mas não a obrigação, de comprar (call) ou vender (put) o ativo a um preço fixado (strike). Quem compra paga um <b>prêmio</b> por esse direito.</li>
</ul>
<p>Termos, futuros e swaps são <b>lineares</b>: o ganho varia 1-para-1 com o ativo. Opções são <b>não lineares</b> (convexas): o ganho acelera num sentido e é limitado no outro. Toda a sofisticação de uma mesa de equity derivatives vem dessa não linearidade — e é daí que surgem as "gregas".</p>
<h3>Quem opera</h3>
<table><tr><th>Participante</th><th>Objetivo</th><th>Exemplo</th></tr>
<tr><td>Hedger</td><td>reduzir um risco que já tem</td><td>fundo de ações compra puts de Ibovespa para se proteger de queda</td></tr>
<tr><td>Especulador / investidor direcional</td><td>tomar uma visão de mercado com alavancagem</td><td>compra calls de VALE3 esperando alta</td></tr>
<tr><td>Arbitrador</td><td>explorar desalinhamentos de preço sem risco (ou quase)</td><td>compra à vista e vende futuro caro demais</td></tr>
<tr><td>Market maker / dealer</td><td>ganhar o spread (bid/ask) e gerir o risco residual</td><td>mesa de banco cotando opções para clientes</td></tr></table>
<h3>Flow vs. proprietária</h3>
<p>Num banco, a mesa de derivativos de renda variável costuma se dividir em <b>flow</b> (atende clientes: cota estruturas, vende COEs, faz market making e depois gerencia o risco que ficou) e <b>proprietária</b> (usa o capital do banco para tomar posições: vol relativa, dispersão, arbitragens, posições direcionais em vol). Nos dois casos, o trader passa o dia gerenciando um <b>livro</b> (<i>book</i>) de posições e suas sensibilidades.</p>
<p>O que diferencia um trader de derivativos de um investidor: ele raramente quer "apostar na direção". Ele quer entender <i>exatamente</i> qual risco carrega — delta, gamma, vega, theta — e decidir quais manter e quais neutralizar.</p>`,
    desk: String.raw`"O livro" = conjunto de posições da mesa. "Carregar risco" = manter uma exposição. "Zerar" = fechar a posição. Quando o head pergunta "como está o livro?", ele quer ouvir gregas e PnL, não opinião sobre a bolsa.`,
    refs: [R_.hull(1, 'Introduction'), R_.wil(1, 'Products and markets'), R_.wil(2, 'Derivatives'), R_.der(1, 'products and markets'), R_.mfd(1, 'An introduction to options and markets')],
    ex: [
      { t: 'mcq', q: 'Qual destes instrumentos é <b>não linear</b> no preço do ativo-objeto?', o: ['Contrato futuro de Ibovespa', 'Termo de PETR4', 'Opção de compra (call) de VALE3', 'Swap CDI × Ibovespa'], a: 2, e: 'A opção tem payoff assimétrico (max(S−K,0)), que é convexo. Os demais variam linearmente com o ativo.' },
      { t: 'mcq', q: 'Um fundo de previdência que tem uma carteira de ações e compra puts de Ibovespa está atuando como:', o: ['Especulador', 'Hedger', 'Arbitrador', 'Market maker'], a: 1, e: 'Ele está reduzindo um risco que já possui (queda da carteira) — é hedge.' },
      { t: 'tf', q: 'No mercado futuro, ganhos e perdas são liquidados diariamente via ajuste; no termo, em geral, a liquidação ocorre no vencimento.', a: true, e: 'Esse é o ponto-chave da diferença: o ajuste diário (marcação a mercado com fluxo de caixa) reduz o risco de crédito.' },
      { t: 'mcq', q: 'Qual a principal fonte de receita esperada de um market maker de opções?', o: ['Acertar a direção do mercado', 'O spread entre compra e venda (bid/ask) e a gestão eficiente do risco residual', 'Dividendos das ações do hedge', 'Taxa de corretagem'], a: 1, e: 'O market maker ganha o edge do bid/ask e tenta neutralizar os riscos que não quer carregar.' },
      { t: 'mcq', q: 'Quem compra uma opção:', o: ['Tem a obrigação de comprar o ativo', 'Recebe o prêmio', 'Paga o prêmio e tem o direito de exercer', 'Precisa depositar margem ilimitada'], a: 2, e: 'O titular paga o prêmio e ganha um direito. Quem assume obrigação (e recebe o prêmio) é o lançador/vendedor.' }
    ],
    cards: [['Derivativo', 'Contrato cujo valor depende do preço de outro ativo (ativo-objeto/underlying).'], ['Linear vs não linear', 'Termo/futuro/swap: ganho 1-para-1 com o ativo. Opções: payoff convexo, assimétrico.'], ['Mesa flow vs prop', 'Flow: atende clientes e gerencia o risco resultante. Prop: toma posições com capital do banco.']]
  },
  {
    id: 'br1-2', title: 'Juros no Brasil: CDI, 252 dias úteis e taxa contínua', tag: 'juros',
    goal: 'Dominar a convenção brasileira de juros (exponencial, base 252 dias úteis) e saber converter para a taxa contínua usada no Black-Scholes.',
    body: String.raw`
<p>No Brasil, a taxa de referência de curto prazo é o <b>CDI</b> (taxa DI), muito próxima da Selic. A convenção de mercado é <b>exponencial em base 252 dias úteis</b>: uma taxa anual \(i\) rende, em \(du\) dias úteis, o fator</p>
\[ \text{Fator} = (1+i)^{du/252}. \]
<p>Exemplo: com DI a 10,50% a.a., em 126 dias úteis (meio ano útil), o fator é \(1{,}105^{0{,}5}=1{,}05119\) — ou seja, 5,119% no período.</p>
<p>Um título que paga R$ 100.000 daqui a \(du\) dias úteis vale hoje o <b>PU</b> (preço unitário):</p>
\[ PU = \frac{100.000}{(1+i)^{du/252}}. \]
<p>É exatamente assim que se precifica o contrato <b>DI1</b> na B3, que veremos na Unidade 8.</p>
<h3>Por que taxa contínua?</h3>
<p>Modelos como Black-Scholes usam capitalização <b>contínua</b>: \(e^{rT}\). Para usar uma taxa DI no modelo, basta igualar os fatores:</p>
\[ e^{r\,T} = (1+i)^{T} \;\Rightarrow\; r = \ln(1+i), \qquad T = du/252. \]
<p>Com \(i=10{,}50\%\), \(r = \ln(1{,}105) = 9{,}985\%\). Parece detalhe, mas errar a convenção de juros é um erro clássico de estagiário que muda o preço de opções longas.</p>
<h3>Outras convenções que você vai encontrar</h3>
<ul>
<li><b>Linear 360</b> (dias corridos): usada no cupom cambial (dólar) e em muitos mercados internacionais: fator \(1 + i\cdot dc/360\).</li>
<li><b>Act/365 e Act/360</b> nos EUA (SOFR usa Act/360) — veremos no Módulo US.</li>
<li><b>Tempo para vol</b>: no Brasil, a vol é quase sempre anualizada em <b>dias úteis</b> (252), porque o preço só se mexe quando a bolsa abre. Nos EUA, o padrão é 365 dias corridos.</li>
</ul>
<div class="box warn"><div class="bt">Pegadinha</div>Taxa DI 10% a.a. <b>não</b> significa 10%/252 por dia. O fator diário é \(1{,}10^{1/252} - 1 = 0{,}0378\%\).</div>`,
    desk: String.raw`"O DI janeiro 27 está a 14,20" = a taxa implícita no contrato DI1 com vencimento em jan/27 é 14,20% a.a. (exp. 252). "Tomar taxa" = apostar que a taxa sobe; "dar taxa" = apostar que cai.`,
    deep: String.raw`<p>A equivalência entre convenções vem de igualar fatores de capitalização no mesmo período. Para uma taxa exponencial 252 \(i\), a taxa contínua é \(r=\ln(1+i)\), e a taxa linear 360 equivalente em \(dc\) dias corridos é \(i_{lin} = \big[(1+i)^{du/252}-1\big]\cdot 360/dc\). Como \(du/dc\) varia com feriados, a conversão entre "anos úteis" e "anos corridos" não é constante — por isso o mercado brasileiro é tão preso aos dias úteis.</p>`,
    refs: [R_.hull('4.2', 'Measuring interest rates (compounding)'), R_.wil(1, 'Products and markets (the time value of money)'), R_.car('convenções de taxa, CDI e dias úteis')],
    sims: ['br'],
    ex: [
      { tag: 'juros', gen: R => { const i = R.f(0.08, 0.15, 4), du = R.pick([63, 126, 189, 252, 378, 504]); const a = Math.pow(1 + i, du / 252); return { q: `Com taxa DI de ${F.p(i, 2)} a.a. (exp. 252), qual o <b>fator</b> de capitalização em ${du} dias úteis?`, a, tol: 0.0002, dec: 5, e: `Fator = (1+${Q.fmt(i, 4)})^(${du}/252) = ${Q.fmt(a, 5)}.` }; } },
      { tag: 'juros', gen: R => { const i = R.f(0.09, 0.15, 4), du = R.int(20, 750); const a = 100000 / Math.pow(1 + i, du / 252); return { q: `Qual o PU de um título que paga R$ 100.000 em ${du} dias úteis, com taxa ${F.p(i, 2)} a.a.?`, a, tol: 0.0005, unit: 'R$', dec: 2, e: `PU = 100.000 / (1+${Q.fmt(i, 4)})^(${du}/252) = ${Q.fmt(a, 2)}.` }; } },
      { tag: 'juros', gen: R => { const i = R.f(0.06, 0.16, 4); const a = Math.log(1 + i) * 100; return { q: `Converta a taxa ${F.p(i, 2)} a.a. (exp. 252) para taxa contínua, em % a.a.`, a, tol: 0.002, unit: '%', dec: 3, e: `r = ln(1+${Q.fmt(i, 4)}) = ${Q.fmt(a, 3)}%.` }; } },
      { tag: 'juros', gen: R => { const i = R.f(0.08, 0.15, 4); const a = (Math.pow(1 + i, 1 / 252) - 1) * 100; return { q: `Com DI a ${F.p(i, 2)} a.a., qual a taxa <b>diária</b> (em %)?`, a, tol: 0.003, unit: '%', dec: 4, e: `(1+${Q.fmt(i, 4)})^(1/252) − 1 = ${Q.fmt(a, 4)}% ao dia útil.` }; } },
      { t: 'mcq', q: 'No Black-Scholes aplicado a uma opção brasileira de 100 dias úteis com DI a 12%, qual combinação é consistente?', o: ['r = 12%, T = 100/365', 'r = ln(1,12), T = 100/252', 'r = 12%/252, T = 100', 'r = ln(1,12), T = 100/360'], a: 1, e: 'A taxa exponencial 252 converte para contínua via ln(1+i), e o tempo é contado em dias úteis sobre 252.' }
    ],
    cards: [['Fator DI em du dias úteis', '(1+i)^(du/252)'], ['PU de título/DI1', '100.000 / (1+i)^(du/252)'], ['Taxa DI → contínua', 'r = ln(1+i)'], ['Base de vol no Brasil', 'Dias úteis, 252 por ano.']]
  },
  {
    id: 'br1-3', title: 'Termo e futuro: preço justo, carry e ajuste diário', tag: 'futuros',
    goal: 'Precificar um termo por não-arbitragem (cash-and-carry), entender base, contango/backwardation e o ajuste diário dos futuros da B3.',
    body: String.raw`
<p>Quanto vale hoje o compromisso de comprar uma ação em \(T\)? Pense no <b>cash-and-carry</b>: se eu comprar a ação hoje (pagando \(S\) com dinheiro emprestado a \(r\)) e segurar até \(T\), no fim terei a ação e uma dívida de \(S e^{rT}\), menos os dividendos que recebi no caminho. Portanto, sem arbitragem:</p>
\[ F = S\,e^{(r-q)T} \quad\text{(dividend yield contínuo }q) \qquad\text{ou}\qquad F = (S - VP(\text{div}))\,e^{rT}. \]
<p>Na convenção brasileira: \(F = S\cdot(1+i)^{du/252} - \text{dividendos (levados ao vencimento)}\).</p>
<p>Se o termo estiver acima disso, o arbitrador compra à vista e vende termo (cash-and-carry); se estiver abaixo, faz o reverso (vende a ação alugada e compra termo). Por isso o termo carrega o "custo de carregamento" (<i>carry</i>): juros menos o que o ativo rende.</p>
<h3>Base, contango e backwardation</h3>
<ul><li><b>Base</b> = futuro − spot. Com juros positivos e poucos dividendos, o futuro fica acima do spot: <b>contango</b>.</li>
<li>Quando os dividendos (ou o custo de aluguel/escassez) superam os juros, o futuro fica abaixo: <b>backwardation</b>.</li></ul>
<h3>Futuros na B3</h3>
<table><tr><th>Contrato</th><th>Objeto</th><th>Tamanho</th></tr>
<tr><td>IND / WIN</td><td>Ibovespa (cheio / mini)</td><td>R$ 1,00 / R$ 0,20 por ponto</td></tr>
<tr><td>DOL / WDO</td><td>Dólar comercial (cheio / mini)</td><td>US$ 50.000 / US$ 10.000</td></tr>
<tr><td>DI1</td><td>Taxa DI acumulada</td><td>PU 100.000 no vencimento</td></tr></table>
<p>O futuro de Ibovespa vence na quarta-feira mais próxima do dia 15 dos meses pares. Todo dia a B3 calcula o <b>preço de ajuste</b> e credita/debita a diferença: se você comprou 10 IND a 130.000 e o ajuste do dia foi 131.200, recebe \(10 \times 1.200 \times R\$1 = R\$\,12.000\) no dia seguinte. A posição passa a "valer" 131.200 como novo preço de referência.</p>
<p>Um efeito sutil: como o ajuste é recebido/pago em dinheiro todo dia e reinvestido ao CDI, futuro e termo não são idênticos quando juros e ativo são correlacionados. Para equity isso é desprezível; em DI1 veremos que importa.</p>`,
    desk: String.raw`"Vender o futuro para hedgear" é o jeito mais barato de zerar delta de Ibovespa. Traders brasileiros medem delta em "contratos de índice" ou em R$. "Rolar" = trocar o vencimento curto pelo próximo antes de vencer.`,
    deep: String.raw`<p>Sem arbitragem: carteira A = comprar 1 ação e vender 1 termo a \(F\); valor final \(= F + \text{div}\cdot e^{r(T-t_d)}\), sem risco. Custo inicial \(=S\). Logo \(S e^{rT} = F + \text{div}\,e^{r(T-t_d)}\), o que dá a fórmula com dividendos discretos. Com aluguel de ações (custo de "borrow" \(b\)), o reverse cash-and-carry exige alugar a ação, e o termo pode ficar entre dois limites: \(S e^{(r-q-b)T} \le F \le S e^{(r-q)T}\) em mercados com fricção.</p>`,
    refs: [R_.hull(5, 'Determination of forward and futures prices'), R_.hull('2.4', 'The operation of margins'), R_.wil(1, 'Products and markets (futures and forwards)')],
    ex: [
      { tag: 'futuros', gen: R => { const S = R.f(20, 60, 2), i = R.f(0.09, 0.14, 4), du = R.pick([42, 63, 84, 126]); const a = S * Math.pow(1 + i, du / 252); return { q: `PETR4 está a ${F.r(S)}. DI a ${F.p(i, 2)} a.a., ${du} dias úteis até o vencimento, sem dividendos. Qual o preço justo do termo?`, a, tol: 0.0005, unit: 'R$', dec: 3, e: `F = ${Q.fmt(S, 2)} × (1+${Q.fmt(i, 4)})^(${du}/252) = ${Q.fmt(a, 3)}.` }; } },
      { tag: 'futuros', gen: R => { const S = R.f(40, 80, 2), i = R.f(0.09, 0.14, 4), du = 126, d = R.f(0.8, 2.5, 2); const a = S * Math.pow(1 + i, du / 252) - d; return { q: `Uma ação a ${F.r(S)} vai pagar dividendos que, levados ao vencimento, somam ${F.r(d)}. DI ${F.p(i, 2)}, ${du} du. Qual o termo justo?`, a, tol: 0.0006, unit: 'R$', dec: 3, e: `F = S·(1+i)^(du/252) − div = ${Q.fmt(S * Math.pow(1 + i, du / 252), 3)} − ${Q.fmt(d, 2)} = ${Q.fmt(a, 3)}.` }; } },
      { tag: 'futuros', gen: R => { const n = R.int(5, 40) * R.sign(), p0 = R.step(120000, 140000, 5), p1 = p0 + R.step(-2500, 2500, 5); const a = n * (p1 - p0) * 1; return { q: `Você está ${n > 0 ? 'comprado' : 'vendido'} em ${Math.abs(n)} contratos IND (R$ 1/ponto), com preço de referência ${Q.fmt(p0, 0)}. O ajuste do dia foi ${Q.fmt(p1, 0)}. Qual o ajuste recebido (+) ou pago (−) em R$?`, a, tolAbs: 0.5, unit: 'R$', dec: 0, e: `${n} × (${p1} − ${p0}) × R$1 = ${Q.fmt(a, 0)}.` }; } },
      { t: 'mcq', q: 'Um futuro de índice está sendo negociado <b>abaixo</b> do spot (backwardation). A explicação mais provável é:', o: ['Juros muito altos', 'Dividendos esperados (e/ou custo de aluguel) maiores que o custo de carregamento em juros', 'Excesso de compradores de futuro', 'Erro de precificação que nunca se corrige'], a: 1, e: 'F = S·e^{(r−q)T}: se q > r, F < S.' },
      { t: 'mcq', q: 'O termo está negociando R$ 2 acima do preço justo de cash-and-carry. A arbitragem é:', o: ['Comprar termo e vender a ação', 'Comprar a ação (financiada) e vender o termo', 'Comprar os dois', 'Não há arbitragem possível'], a: 1, e: 'Compra o barato (ação + financiamento) e vende o caro (termo), travando R$ 2 no vencimento.' }
    ],
    cards: [['Termo justo (dividend yield)', 'F = S·e^{(r−q)T}'], ['Contango vs backwardation', 'Contango: F > S (juros > dividendos). Backwardation: F < S.'], ['Ajuste diário', 'Liquidação diária da variação do preço de ajuste do futuro.'], ['IND / WIN', 'Futuro de Ibovespa: R$1/ponto (cheio), R$0,20/ponto (mini).']]
  },
  {
    id: 'br1-4', title: 'Posições, PnL linear e alavancagem', tag: 'pnl',
    goal: 'Calcular PnL de posições compradas/vendidas, entender alavancagem com futuros e a ideia de exposição (delta) em R$.',
    body: String.raw`
<p>Estar <b>comprado</b> (<i>long</i>) é ganhar quando o preço sobe; estar <b>vendido</b> (<i>short</i>) é ganhar quando cai. Para posições lineares:</p>
\[ \text{PnL} = q \times (P_1 - P_0) \times \text{multiplicador}, \]
<p>com \(q>0\) para comprado e \(q<0\) para vendido. Vender a descoberto uma ação exige alugá-la (paga-se taxa de aluguel); vender um futuro não — basta depositar margem.</p>
<h3>Exposição em R$ ("delta cash")</h3>
<p>A forma mais útil de medir risco linear é a <b>exposição financeira</b>: quanto você ganha se o ativo subir 1%. Se você tem 20.000 ações de VALE3 a R$ 60, sua exposição é R$ 1.200.000, e um move de 1% dá R$ 12.000. Um contrato IND com o índice a 130.000 pontos equivale a R$ 130.000 de exposição.</p>
<p>Essa noção — <b>exposição equivalente em ações ou em R$</b> — é exatamente o que chamaremos de <b>delta</b> quando chegarmos às opções. Todo o livro de opções de uma mesa é resumido, primeiro, num "delta em R$".</p>
<h3>Alavancagem</h3>
<p>Com futuros, você controla R$ 130.000 de exposição depositando só a margem (digamos R$ 15.000). Alavancagem ≈ 8,7×. Isso amplifica o retorno sobre o capital — e as perdas. O PnL não muda: é sempre exposição × variação. O que muda é quanto capital você usou.</p>
<h3>Retornos: simples vs log</h3>
<p>Retorno simples: \(R = S_1/S_0 - 1\). Retorno logarítmico: \(\ln(S_1/S_0)\). Log-retornos somam no tempo (o retorno de 2 dias é a soma dos logs diários) e são a base dos modelos de volatilidade que veremos na Unidade 3.</p>`,
    desk: String.raw`"Estou comprado em 5 milhões de delta" = a posição ganha ~R$ 50 mil se o ativo subir 1%. "Book flat" = sem exposição direcional. "Pagar o spread" = executar agredindo o preço do outro lado.`,
    refs: [R_.hull(1, 'Introduction (hedgers, speculators, arbitrageurs)'), R_.hull(3, 'Hedging strategies using futures')],
    ex: [
      { tag: 'pnl', gen: R => { const q = R.int(1, 50) * 100, p0 = R.f(10, 90, 2), p1 = p0 * (1 + R.f(-0.08, 0.08, 4)); const a = -q * (p1 - p0); return { q: `Você vendeu a descoberto ${q} ações a ${F.r(p0)}. Hoje a ação está a ${F.r(p1)}. Qual o seu PnL (ignore aluguel)?`, a, tolAbs: 1, unit: 'R$', dec: 2, e: `Vendido: PnL = −${q} × (${Q.fmt(p1, 2)} − ${Q.fmt(p0, 2)}) = ${Q.fmt(a, 2)}.` }; } },
      { tag: 'pnl', gen: R => { const q = R.int(5, 60) * 100, S = R.f(20, 100, 2); const a = q * S * 0.01; return { q: `Quanto ganha, em R$, uma posição comprada em ${q} ações a ${F.r(S)} se a ação subir 1%?`, a, tol: 0.001, unit: 'R$', dec: 2, e: `Exposição = ${q} × ${Q.fmt(S, 2)} = ${Q.fmt(q * S, 2)}; 1% disso = ${Q.fmt(a, 2)}.` }; } },
      { tag: 'pnl', gen: R => { const idx = R.step(115000, 145000, 500), n = R.int(2, 30); const a = n * idx * 0.2; return { q: `Qual a exposição em R$ de ${n} contratos de mini índice (WIN, R$ 0,20/ponto) com o Ibovespa a ${Q.fmt(idx, 0)} pontos?`, a, tol: 0.001, unit: 'R$', dec: 0, e: `${n} × ${Q.fmt(idx, 0)} × 0,20 = ${Q.fmt(a, 0)}.` }; } },
      { tag: 'pnl', gen: R => { const r1 = R.f(-0.05, 0.05, 4), r2 = R.f(-0.05, 0.05, 4); const a = (Math.log(1 + r1) + Math.log(1 + r2)) * 100; return { q: `Uma ação sobe ${F.p(r1, 2)} num dia e ${F.p(r2, 2)} no outro. Qual o log-retorno total dos dois dias, em %?`, a, tolAbs: 0.002, unit: '%', dec: 3, e: `ln(1${r1 >= 0 ? '+' : ''}${Q.fmt(r1, 4)}) + ln(1${r2 >= 0 ? '+' : ''}${Q.fmt(r2, 4)}) = ${Q.fmt(a, 3)}%. Log-retornos somam.` }; } },
      { t: 'mcq', q: 'Você tem R$ 20 mil de margem e compra futuros com exposição de R$ 200 mil. O índice cai 3%. Seu PnL e o retorno sobre a margem são:', o: ['−R$ 600; −3%', '−R$ 6.000; −30%', '−R$ 6.000; −3%', '−R$ 60.000; −300%'], a: 1, e: 'PnL = 200.000 × (−3%) = −6.000. Sobre a margem de 20.000, isso é −30%: alavancagem de 10×.' }
    ],
    cards: [['PnL linear', 'q × (P1 − P0) × multiplicador'], ['Delta cash (exposição)', 'Quantidade equivalente × preço: quanto você ganha por 1% × 100.'], ['Log-retorno', 'ln(S1/S0); somam ao longo do tempo.']]
  }
  ]
});

/* ---------------- BR2 — Opções: conceitos ---------------- */
Course.unit('br', {
  id: 'br2', title: 'Opções: conceitos, B3 e paridade',
  desc: 'Calls e puts, payoff e lucro, nomenclatura e regras da B3, moneyness, valor intrínseco e extrínseco, limites de arbitragem, paridade put-call e as primeiras estratégias.',
  sims: ['struct', 'bs'], exam: { n: 10, minutes: 20 },
  lessons: [
  {
    id: 'br2-1', title: 'Call e put: direitos, payoff e lucro', tag: 'payoff',
    goal: 'Desenhar mentalmente o payoff e o lucro das quatro posições básicas: comprado/vendido em call/put.',
    body: String.raw`
<p>Uma <b>call</b> dá ao titular o direito de <b>comprar</b> o ativo pelo strike \(K\) até (ou em) uma data. Uma <b>put</b> dá o direito de <b>vender</b> por \(K\). No vencimento, o titular só exerce se for vantajoso:</p>
\[ \text{Payoff call} = \max(S_T - K, 0), \qquad \text{Payoff put} = \max(K - S_T, 0). \]
<p>O <b>lucro</b> desconta o prêmio pago \(c\) ou \(p\): lucro da call comprada \(= \max(S_T-K,0) - c\). O vendedor (lançador) tem o espelho: recebe o prêmio e assume a obrigação.</p>
<table><tr><th>Posição</th><th>Ganha se</th><th>Perda máxima</th><th>Ganho máximo</th></tr>
<tr><td>Comprado em call</td><td>sobe muito</td><td>prêmio</td><td>ilimitado</td></tr>
<tr><td>Vendido em call</td><td>não sobe</td><td>ilimitada</td><td>prêmio</td></tr>
<tr><td>Comprado em put</td><td>cai muito</td><td>prêmio</td><td>\(K - \text{prêmio}\)</td></tr>
<tr><td>Vendido em put</td><td>não cai</td><td>\(K - \text{prêmio}\)</td><td>prêmio</td></tr></table>
<div class="w" data-w="payoff" data-a='{"preset":"Long call","title":"Call comprada K=100 (63 dias, vol 25%)"}'></div>
<p>O <b>ponto de equilíbrio</b> (breakeven) no vencimento: call comprada \(= K + c\); put comprada \(= K - p\).</p>
<p>A intuição mais importante: comprar opção é <b>comprar convexidade</b> — perdas limitadas, ganhos que aceleram. Isso tem um preço (o prêmio) que "derrete" com o tempo se nada acontecer. Vender opção é o oposto: você recebe um fluxo pequeno e constante e carrega o risco de um movimento grande. Toda a Unidade 5 é sobre esse duelo.</p>`,
    desk: String.raw`"Lançar" = vender opção (lançador = vendedor). "Titular" = comprador. "Virar pó" = opção vencer sem valor. "Opção de 1 centavo" = OTM demais, só loteria.`,
    refs: [R_.hull(9, 'Mechanics of options markets'), R_.wil('2.4', 'Payoff diagrams'), R_.mfd(1, 'What is an option?')],
    sims: ['struct?preset=Long call', 'struct?preset=Long put'],
    ex: [
      { tag: 'payoff', gen: R => { const K = R.step(20, 40, 0.5), S = K + R.f(-5, 6, 2), c = R.f(0.3, 2.5, 2); const a = Math.max(S - K, 0) - c; return { q: `Você comprou uma call de strike ${F.r(K)} pagando ${F.r(c)}. No vencimento a ação fecha em ${F.r(S)}. Qual o seu lucro por ação?`, a, tolAbs: 0.005, unit: 'R$', dec: 2, e: `max(${Q.fmt(S, 2)} − ${Q.fmt(K, 2)}, 0) − ${Q.fmt(c, 2)} = ${Q.fmt(a, 2)}.` }; } },
      { tag: 'payoff', gen: R => { const K = R.step(20, 40, 0.5), S = K + R.f(-6, 4, 2), p = R.f(0.3, 2.5, 2); const a = p - Math.max(K - S, 0); return { q: `Você <b>vendeu</b> uma put de strike ${F.r(K)} recebendo ${F.r(p)}. No vencimento a ação está em ${F.r(S)}. Qual o seu lucro por ação?`, a, tolAbs: 0.005, unit: 'R$', dec: 2, e: `Prêmio − max(K−S,0) = ${Q.fmt(p, 2)} − ${Q.fmt(Math.max(K - S, 0), 2)} = ${Q.fmt(a, 2)}.` }; } },
      { tag: 'payoff', gen: R => { const K = R.step(15, 50, 0.5), p = R.f(0.4, 3, 2); const a = K - p; return { q: `Breakeven no vencimento de uma put comprada com strike ${F.r(K)} e prêmio ${F.r(p)}?`, a, tolAbs: 0.005, unit: 'R$', dec: 2, e: `K − p = ${Q.fmt(a, 2)}. Abaixo disso, a put dá lucro.` }; } },
      { t: 'mcq', q: 'Qual posição tem <b>perda potencial ilimitada</b>?', o: ['Comprado em put', 'Vendido em put', 'Vendido em call', 'Comprado em call'], a: 2, e: 'Se o ativo subir sem limite, o vendedor da call paga S−K sem limite.' },
      { t: 'mcq', q: 'Um investidor acha que PETR4 vai ficar parada ou subir pouco e quer ganhar com isso. A posição simples mais alinhada é:', o: ['Comprar call ATM', 'Vender put (receber prêmio)', 'Comprar put', 'Comprar call muito OTM'], a: 1, e: 'Vender put ganha o prêmio se a ação não cair abaixo do strike — combina com visão "neutra a levemente altista".' }
    ],
    cards: [['Payoff call', 'max(S_T − K, 0)'], ['Payoff put', 'max(K − S_T, 0)'], ['Breakeven call comprada', 'K + prêmio'], ['Lançador', 'Vendedor da opção: recebe o prêmio, assume a obrigação.']]
  },
  {
    id: 'br2-2', title: 'Opções na B3: tickers, vencimentos, exercício e moneyness', tag: 'b3',
    goal: 'Ler um ticker de opção da B3, saber as regras de vencimento e exercício, e classificar ITM/ATM/OTM, valor intrínseco e extrínseco.',
    body: String.raw`
<h3>Lendo o ticker</h3>
<p>Opções de ações na B3 têm código: <b>raiz do ativo (4 letras) + letra da série + número</b>. A letra indica tipo e mês de vencimento:</p>
<table><tr><th>Mês</th><th>Jan</th><th>Fev</th><th>Mar</th><th>Abr</th><th>Mai</th><th>Jun</th><th>Jul</th><th>Ago</th><th>Set</th><th>Out</th><th>Nov</th><th>Dez</th></tr>
<tr><td>Call</td><td>A</td><td>B</td><td>C</td><td>D</td><td>E</td><td>F</td><td>G</td><td>H</td><td>I</td><td>J</td><td>K</td><td>L</td></tr>
<tr><td>Put</td><td>M</td><td>N</td><td>O</td><td>P</td><td>Q</td><td>R</td><td>S</td><td>T</td><td>U</td><td>V</td><td>W</td><td>X</td></tr></table>
<p>Ex.: <code>PETRF400</code> = call de PETR4, vencimento em junho; <code>VALEU550</code> = put de VALE3 em setembro. O número é um código de série (hoje costuma lembrar o strike, mas o strike oficial é o da tabela de séries — ele muda quando há ajuste por proventos).</p>
<h3>Regras principais (ações)</h3>
<ul><li><b>Vencimento</b>: 3ª sexta-feira do mês (há séries semanais em alguns ativos).</li>
<li><b>Estilo</b>: a maioria das <b>calls é americana</b> (pode exercer a qualquer momento); a maioria das <b>puts é europeia</b> (só no vencimento). Sempre confira na série.</li>
<li><b>Lote</b>: negocia-se em múltiplos de 100 opções (cada opção = 1 ação).</li>
<li><b>Proventos</b>: a B3 ajusta o strike quando a ação paga dividendos/JCP, para que o provento não transfira valor entre titular e lançador.</li>
<li><b>Exercício automático</b> no vencimento para séries suficientemente ITM (há regras de percentual mínimo; o titular pode pedir para não exercer).</li></ul>
<h3>Moneyness</h3>
<p>Para uma call: <b>ITM</b> (<i>in-the-money</i>) se \(S>K\), <b>ATM</b> se \(S\approx K\), <b>OTM</b> se \(S<K\). Para put, o contrário. O prêmio se divide em:</p>
\[ \text{Prêmio} = \underbrace{\max(S-K,0)}_{\text{valor intrínseco}} + \underbrace{\text{valor extrínseco}}_{\text{"valor tempo"}}. \]
<p>O valor extrínseco é o preço da <i>possibilidade</i> de o ativo se mexer até o vencimento. Ele é máximo perto do ATM e vai a zero no vencimento. Opções OTM são <b>só</b> valor extrínseco.</p>
<p>Na mesa, moneyness raramente é dito em R$: fala-se em <b>% do spot</b> ("a 90% put"), em <b>delta</b> ("a put 25 delta") ou em moneyness do forward \(K/F\).</p>`,
    desk: String.raw`"Série de junho a 40", "a F40", "a 25-delta put", "strike 95%": formas diferentes de nomear o mesmo tipo de coisa. Em Ibovespa, os traders falam em pontos ("a call 135 mil").`,
    refs: [R_.hull(9, 'Mechanics of options markets'), R_.hull('10.1', 'Factors affecting option prices'), R_.wil('2.7', 'Market conventions')],
    ex: [
      { t: 'mcq', q: 'O ticker <code>VALEK600</code> representa:', o: ['Put de VALE3 com vencimento em novembro', 'Call de VALE3 com vencimento em novembro', 'Call de VALE3 com vencimento em outubro', 'Put de VALE3 com vencimento em maio'], a: 1, e: 'K é a 11ª letra: call de novembro.' },
      { t: 'mcq', q: 'O ticker <code>PETRS350</code> representa:', o: ['Call de julho', 'Put de julho', 'Put de agosto', 'Call de setembro'], a: 1, e: 'Puts vão de M (jan) a X (dez). S é a 7ª: julho.' },
      { tag: 'b3', gen: R => { const S = R.f(25, 45, 2), K = S + R.pick([-4, -3, -2, 2, 3]), prem = Math.max(S - K, 0) + R.f(0.2, 1.2, 2); const a = prem - Math.max(S - K, 0); return { q: `Uma call de strike ${F.r(K)} custa ${F.r(prem)} com a ação a ${F.r(S)}. Qual o valor <b>extrínseco</b>?`, a, tolAbs: 0.005, unit: 'R$', dec: 2, e: `Intrínseco = max(${Q.fmt(S, 2)} − ${Q.fmt(K, 2)}, 0) = ${Q.fmt(Math.max(S - K, 0), 2)}. Extrínseco = ${Q.fmt(prem, 2)} − intrínseco = ${Q.fmt(a, 2)}.` }; } },
      { t: 'mcq', q: 'Uma put com strike 30 e ação a 34 está:', o: ['ITM', 'ATM', 'OTM', 'Depende da vol'], a: 2, e: 'A put só tem valor intrínseco se S < K. Com S=34 > 30, está OTM.' },
      { t: 'tf', q: 'Por que a B3 ajusta o strike de opções quando a ação paga dividendos? Afirmação: para evitar que o pagamento do provento transfira valor do titular da call para o lançador.', a: true, e: 'A ação cai pelo valor do dividendo na data ex; sem ajuste, a call perderia valor artificialmente.' }
    ],
    cards: [['Letras de call na B3', 'A (jan) a L (dez)'], ['Letras de put na B3', 'M (jan) a X (dez)'], ['Vencimento de opções de ações B3', '3ª sexta-feira do mês'], ['Valor extrínseco', 'Prêmio − valor intrínseco; máximo perto do ATM, zero no vencimento.']]
  },
  {
    id: 'br2-3', title: 'Limites de arbitragem e paridade put-call', tag: 'paridade',
    goal: 'Saber os limites de preço de calls e puts e usar a paridade put-call para sintetizar posições e detectar arbitragem — inclusive o box.',
    body: String.raw`
<p>Sem modelo nenhum, só com "não existe almoço grátis", dá para dizer muito sobre preços de opções europeias:</p>
<ul><li>\(\max(S e^{-qT} - K e^{-rT}, 0) \le c \le S e^{-qT}\) — uma call nunca vale mais que a ação.</li>
<li>\(\max(K e^{-rT} - S e^{-qT}, 0) \le p \le K e^{-rT}\).</li>
<li>Calls são decrescentes em \(K\); puts, crescentes. E o preço é <b>convexo</b> em \(K\): uma borboleta nunca pode ter custo negativo.</li></ul>
<h3>Paridade put-call</h3>
<p>Considere: carteira A = call comprada + dinheiro \(K e^{-rT}\); carteira B = put comprada + ação (\(S e^{-qT}\), já descontados dividendos). No vencimento ambas valem \(\max(S_T, K)\). Logo, hoje:</p>
\[ c - p = S\,e^{-qT} - K\,e^{-rT} = (F - K)\,e^{-rT}. \]
<p>Consequências práticas enormes:</p>
<ul><li><b>Call comprada + put vendida (mesmo K) = termo sintético</b> comprado a \(K\). Mesas usam isso o tempo todo ("sintético").</li>
<li>Call = put + ação − dinheiro: qualquer opção pode ser convertida na outra com ação e caixa. Por isso call e put do mesmo strike/vencimento têm <b>a mesma vol implícita</b> e o mesmo gamma/vega.</li>
<li><b>Conversão / reversão</b>: arbitragens entre call, put e ação quando a paridade quebra.</li></ul>
<h3>O box (4 pontas)</h3>
<p>Compre a call K1 e venda a put K1 (termo sintético comprado a K1); venda a call K2 e compre a put K2 (termo sintético vendido a K2). Resultado: recebe \(K_2 - K_1\) <b>com certeza</b> no vencimento. O box é, portanto, uma aplicação (ou captação) de renda fixa:</p>
\[ \text{Box} = (K_2 - K_1)\,e^{-rT}. \]
<p>No Brasil, o box de 4 pontas foi muito usado como aplicação/captação com taxa próxima do CDI (e com tributação específica — veja a Unidade 10). Se o box negociar a uma taxa muito diferente do DI, há arbitragem.</p>
<div class="w" data-w="payoff" data-a='{"preset":"Box (4 pontas)","title":"Box 95/105: payoff constante = 10"}'></div>`,
    desk: String.raw`"Montar um sintético" = call comprada + put vendida (ou o contrário). "Conversão" = comprar ação + comprar put + vender call (trava um valor livre). "O box está pagando 101% do CDI" = a taxa implícita do box.`,
    deep: String.raw`<p>A paridade é uma relação <i>modelo-independente</i>: vale para qualquer distribuição do ativo, desde que as opções sejam europeias e você possa financiar/alugar. Para americanas, vale apenas uma desigualdade: \(S e^{-qT} - K \le C - P \le S - K e^{-rT}\). A convexidade em strike vem de que \(\partial^2 c/\partial K^2 = e^{-rT} f(K) \ge 0\), onde \(f\) é a densidade neutra a risco (Breeden-Litzenberger) — tema do Módulo US.</p>`,
    refs: [R_.hull('10.3', 'Upper and lower bounds for option prices'), R_.hull('10.4', 'Put–call parity'), R_.wil('2.12', 'Put-call parity'), R_.mfd('3.4', 'Put-call parity')],
    sims: ['struct?preset=Box (4 pontas)'],
    ex: [
      { tag: 'paridade', gen: R => { const S = R.f(20, 60, 2), K = Math.round(S), r = R.f(0.08, 0.13, 4), T = R.pick([0.25, 0.5]), c = R.f(1, 4, 2); const a = c - S + K * Math.exp(-r * T); return { q: `S = ${F.r(S)}, K = ${F.r(K)}, r contínua = ${F.p(r, 2)}, T = ${T} ano, sem dividendos. A call europeia vale ${F.r(c)}. Pela paridade, quanto vale a put europeia?`, a, tolAbs: 0.01, unit: 'R$', dec: 3, e: `p = c − S + K·e^{−rT} = ${Q.fmt(c, 2)} − ${Q.fmt(S, 2)} + ${Q.fmt(K * Math.exp(-r * T), 3)} = ${Q.fmt(a, 3)}.` }; } },
      { tag: 'paridade', gen: R => { const K1 = R.step(20, 30, 1), K2 = K1 + R.pick([2, 4, 5]), r = R.f(0.09, 0.14, 4), du = R.pick([126, 252]); const a = (K2 - K1) / Math.pow(1 + r, du / 252); return { q: `Um box ${K1}/${K2} vence em ${du} dias úteis. Com DI a ${F.p(r, 2)}, qual o preço justo do box (por unidade)?`, a, tolAbs: 0.003, unit: 'R$', dec: 4, e: `Box = (K2 − K1)/(1+i)^(du/252) = ${K2 - K1}/${Q.fmt(Math.pow(1 + r, du / 252), 5)} = ${Q.fmt(a, 4)}.` }; } },
      { t: 'mcq', q: 'Call comprada + put vendida, mesmo strike K e vencimento, equivale a:', o: ['Straddle', 'Termo (forward) comprado a K', 'Box', 'Put protetora'], a: 1, e: 'No vencimento: max(S−K,0) − max(K−S,0) = S − K. É um termo sintético.' },
      { t: 'mcq', q: 'Uma call europeia está sendo vendida por menos que S·e^{−qT} − K·e^{−rT}. Você deveria:', o: ['Vender a call e comprar a ação', 'Comprar a call, vender a ação (a descoberto) e aplicar o caixa', 'Não fazer nada', 'Comprar a put'], a: 1, e: 'A call está abaixo do limite inferior: compre o barato (call) e venda o sintético caro (ação − caixa).' },
      { t: 'tf', q: 'Pela paridade put-call, uma call e uma put europeias de mesmo strike e vencimento têm a mesma vol implícita.', a: true, e: 'Como c − p é fixo pelo forward, se a call estiver "cara" em vol, a put também estará. Na prática pequenas diferenças vêm de custos de aluguel/dividendos e exercício americano.' }
    ],
    cards: [['Paridade put-call', 'c − p = S·e^{−qT} − K·e^{−rT}'], ['Termo sintético', 'Call comprada + put vendida no mesmo strike.'], ['Box', 'Termo sintético comprado em K1 + vendido em K2 = renda fixa (K2−K1)·e^{−rT}.'], ['Limite superior da call', 'c ≤ S·e^{−qT}']]
  },
  {
    id: 'br2-4', title: 'Primeiras estratégias: lançamento coberto e put protetora', tag: 'estrategias',
    goal: 'Entender as duas estratégias mais populares do varejo brasileiro e enxergá-las como combinações de posições.',
    body: String.raw`
<h3>Lançamento coberto (covered call)</h3>
<p>Você tem a ação e vende uma call OTM. Recebe o prêmio (renda extra) e, em troca, abre mão da alta acima do strike. Pela paridade:</p>
\[ \text{ação} - \text{call}(K) = \text{put vendida}(K) + \text{dinheiro}\,K e^{-rT}. \]
<p>Ou seja, <b>lançamento coberto = vender put</b> (mais renda fixa). É muito popular no Brasil ("fazer renda com opções"), mas note o risco: na queda, você perde praticamente tudo o que a ação cair; na alta, ganho limitado.</p>
<div class="w" data-w="payoff" data-a='{"preset":"Covered call (lançamento coberto)"}'></div>
<h3>Put protetora</h3>
<p>Você tem a ação e compra uma put: um "seguro" contra queda. Perda máxima: \(S_0 - K + p\). Pela paridade, ação + put = call + dinheiro: a put protetora tem o mesmo perfil de uma <b>call comprada</b>.</p>
<div class="w" data-w="payoff" data-a='{"preset":"Put protetora"}'></div>
<h3>O raciocínio de mesa</h3>
<p>Olhe para qualquer estratégia e pergunte: <i>que risco de opção sobrou?</i> O lançamento coberto é, no fundo, uma put vendida: <b>vendido em volatilidade</b>. A put protetora é uma call comprada: <b>comprado em volatilidade</b>. A embalagem ("renda", "seguro") muda; o risco não. Quando um cliente faz lançamento coberto em massa, a mesa que compra essas calls fica comprada em vol — e isso afeta preços de vol no mercado brasileiro.</p>`,
    desk: String.raw`"Fazer uma cobertura" / "travar a carteira" = comprar puts. "Venda coberta" = lançamento coberto. "Overwriting" é o nome institucional para vender calls contra uma carteira.`,
    refs: [R_.hull('11.2', 'Trading an option and the underlying asset'), R_.wil('2.5', 'Writing options')],
    sims: ['struct?preset=Covered call (lançamento coberto)', 'struct?preset=Put protetora'],
    ex: [
      { tag: 'estrategias', gen: R => { const S0 = R.f(25, 40, 2), K = Math.round(S0 * 1.06), c = R.f(0.4, 1.2, 2); const a = K - S0 + c; return { q: `Você compra a ação a ${F.r(S0)} e lança uma call ${F.r(K)} por ${F.r(c)}. Qual o lucro <b>máximo</b> por ação no vencimento?`, a, tolAbs: 0.005, unit: 'R$', dec: 2, e: `Lucro máx. = (K − S0) + prêmio = ${Q.fmt(K - S0, 2)} + ${Q.fmt(c, 2)} = ${Q.fmt(a, 2)}.` }; } },
      { tag: 'estrategias', gen: R => { const S0 = R.f(25, 40, 2), K = Math.round(S0 * 0.93), p = R.f(0.3, 1.0, 2); const a = S0 - K + p; return { q: `Você tem a ação comprada a ${F.r(S0)} e compra uma put ${F.r(K)} por ${F.r(p)}. Qual a perda <b>máxima</b> por ação?`, a, tolAbs: 0.005, unit: 'R$', dec: 2, e: `Perda máx. = (S0 − K) + prêmio = ${Q.fmt(S0 - K, 2)} + ${Q.fmt(p, 2)} = ${Q.fmt(a, 2)}.` }; } },
      { t: 'mcq', q: 'Pela paridade put-call, o lançamento coberto tem o mesmo perfil de risco que:', o: ['Call comprada', 'Put vendida (+ renda fixa)', 'Straddle vendido', 'Put comprada'], a: 1, e: 'S − C = −P + K·e^{−rT}.' },
      { t: 'mcq', q: 'Em termos de volatilidade, quem faz put protetora está:', o: ['Vendido em vol', 'Neutro em vol', 'Comprado em vol', 'Vendido em juros'], a: 2, e: 'Comprar put = comprar opcionalidade = comprado em vol (vega positivo).' }
    ],
    cards: [['Lançamento coberto =', 'Ação − call = put vendida + renda fixa (vendido em vol).'], ['Put protetora =', 'Ação + put = call + renda fixa (comprado em vol).']]
  }
  ]
});

/* ---------------- BR3 — Precificação ---------------- */
Course.unit('br', {
  id: 'br3', title: 'Precificação: binomial, passeio aleatório e Black-Scholes',
  desc: 'Da árvore de um passo à fórmula de Black-Scholes: replicação, probabilidade neutra ao risco, movimento browniano geométrico, volatilidade histórica e implícita — com a adaptação para o Brasil.',
  sims: ['bs'], exam: { n: 12, minutes: 25 },
  lessons: [
  {
    id: 'br3-1', title: 'Árvore binomial de um passo: replicação e neutralidade ao risco', tag: 'binomial',
    goal: 'Entender a ideia mais importante de derivativos: o preço de uma opção é o custo de replicá-la — e isso não depende da probabilidade real de alta.',
    body: String.raw`
<p>Suponha a ação a \(S=100\) que, em um período, vai para \(Su=110\) ou \(Sd=90\). Juros de 1% no período. Quanto vale uma call com \(K=100\)? Ela paga 10 (alta) ou 0 (baixa).</p>
<p><b>Replicação</b>: monte uma carteira com \(\Delta\) ações e \(B\) em caixa que pague o mesmo nos dois estados:</p>
\[ 110\Delta + 1{,}01B = 10, \qquad 90\Delta + 1{,}01B = 0. \]
<p>Subtraindo: \(\Delta = \frac{10-0}{110-90} = 0{,}5\). Então \(B = -90\cdot 0{,}5/1{,}01 = -44{,}55\). O custo da carteira hoje: \(0{,}5\times100 - 44{,}55 = 5{,}45\). Se a call valesse outra coisa, haveria arbitragem. <b>Preço = 5,45.</b></p>
<p>Repare: <b>ninguém disse qual a probabilidade de alta</b>. Ela não entra. O que entra é só o intervalo de possibilidades — ou seja, a <b>volatilidade</b>. Esse \(\Delta = (C_u - C_d)/(S_u - S_d)\) é exatamente o <b>delta</b>: a quantidade de ações que hedgeia a opção.</p>
<h3>Probabilidade neutra ao risco</h3>
<p>Podemos reescrever o preço como um valor esperado descontado com uma "probabilidade" artificial \(p^*\):</p>
\[ C = e^{-r\Delta t}\,[\,p^* C_u + (1-p^*) C_d\,], \qquad p^* = \frac{e^{(r-q)\Delta t} - d}{u - d}. \]
<p>No exemplo, \(p^* = (1{,}01 - 0{,}9)/(1{,}1-0{,}9) = 0{,}55\), e \(C = (0{,}55\times10)/1{,}01 = 5{,}45\). ✓</p>
<p>\(p^*\) é a probabilidade que faz a ação render exatamente a taxa livre de risco. Precificar "como se" os investidores fossem neutros ao risco dá o preço certo porque o hedge elimina o risco. Esse é o coração da teoria: <b>preço de derivativo = custo do hedge</b>.</p>`,
    desk: String.raw`Quando um trader diz "o preço é o custo do hedge", está falando exatamente disso. O cliente pode ter a visão que quiser; a mesa cobra o que custa replicar e mais uma margem.`,
    deep: String.raw`<p>Formalmente, a ausência de arbitragem equivale à existência de uma medida \(\mathbb{Q}\) sob a qual preços descontados são martingais (Teorema Fundamental). No modelo binomial de um passo com dois estados, o mercado é completo (2 ativos, 2 estados) e \(\mathbb{Q}\) é única. A condição \(d < e^{r\Delta t} < u\) é necessária para \(0<p^*<1\) — caso contrário, a própria ação ou o caixa dominariam o outro.</p>`,
    refs: [R_.hull('12.1', 'A one-step binomial model and a no-arbitrage argument'), R_.hull('12.2', 'Risk-neutral valuation'), R_.wil(15, 'The binomial model'), R_.ek(1, 'Pricing by arbitrage')],
    sims: ['bs'],
    ex: [
      { tag: 'binomial', gen: R => { const S = 100, u = R.pick([1.1, 1.15, 1.2]), d = R.pick([0.85, 0.9]), K = R.pick([95, 100, 105]), r = R.pick([0.01, 0.02]); const Cu = Math.max(S * u - K, 0), Cd = Math.max(S * d - K, 0); const a = (Cu - Cd) / (S * u - S * d); return { q: `S = 100, sobe para ${Q.fmt(S * u, 0)} ou cai para ${Q.fmt(S * d, 0)}. Call K = ${K}. Qual o delta de replicação (nº de ações por call)?`, a, tol: 0.001, dec: 4, e: `Δ = (Cu − Cd)/(Su − Sd) = (${Q.fmt(Cu, 2)} − ${Q.fmt(Cd, 2)})/(${Q.fmt(S * u - S * d, 0)}) = ${Q.fmt(a, 4)}.` }; } },
      { tag: 'binomial', gen: R => { const S = 100, u = R.pick([1.1, 1.15, 1.2]), d = R.pick([0.85, 0.9]), K = R.pick([95, 100, 105]), g = R.pick([1.01, 1.02]); const p = (g - d) / (u - d); const a = (p * Math.max(S * u - K, 0) + (1 - p) * Math.max(S * d - K, 0)) / g; return { q: `S = 100, sobe para ${Q.fmt(S * u, 0)} ou cai para ${Q.fmt(S * d, 0)}. Juros no período: ${Q.fmt((g - 1) * 100, 0)}% (fator ${g}). Quanto vale uma call europeia K = ${K}?`, a, tol: 0.002, dec: 4, e: `p* = (${g} − ${d})/(${u} − ${d}) = ${Q.fmt(p, 4)}. C = [p*·${Q.fmt(Math.max(S * u - K, 0), 2)} + (1−p*)·${Q.fmt(Math.max(S * d - K, 0), 2)}]/${g} = ${Q.fmt(a, 4)}.` }; } },
      { tag: 'binomial', gen: R => { const u = R.pick([1.1, 1.2, 1.25]), d = R.pick([0.8, 0.9]), g = R.pick([1.0, 1.01, 1.03]); const a = (g - d) / (u - d); return { q: `u = ${u}, d = ${d}, fator de juros no período = ${g}. Qual a probabilidade neutra ao risco p*?`, a, tol: 0.001, dec: 4, e: `p* = (${g} − ${d})/(${u} − ${d}) = ${Q.fmt(a, 4)}.` }; } },
      { t: 'mcq', q: 'Dois traders concordam sobre u, d e juros, mas um acha que a chance de alta é 80% e o outro 30%. No modelo binomial, eles:', o: ['Chegam a preços diferentes', 'Chegam ao mesmo preço, pois a probabilidade real não entra', 'O primeiro acha a call mais barata', 'Não conseguem precificar'], a: 1, e: 'O preço vem da replicação; a probabilidade real não entra.' },
      { t: 'mcq', q: 'Na árvore binomial, o número de ações da carteira replicante de uma call é:', o: ['O gamma', 'O delta', 'O vega', 'O prêmio'], a: 1, e: 'Δ = (Cu − Cd)/(Su − Sd): a sensibilidade da opção ao ativo.' }
    ],
    cards: [['Delta binomial', 'Δ = (Cu − Cd)/(Su − Sd)'], ['p* neutra ao risco', 'p* = (e^{(r−q)Δt} − d)/(u − d)'], ['Princípio da replicação', 'Preço do derivativo = custo da carteira que o replica (custo do hedge).']]
  },
  {
    id: 'br3-2', title: 'Binomial multi-passo, CRR e opções americanas', tag: 'binomial',
    goal: 'Construir árvores de vários passos, calibrar u e d à volatilidade (Cox-Ross-Rubinstein), precificar americanas e ver a convergência para Black-Scholes.',
    body: String.raw`
<p>Com vários passos, fazemos o mesmo raciocínio de trás para frente (<b>backward induction</b>): no vencimento, o valor é o payoff; em cada nó anterior, o valor é o esperado neutro a risco descontado dos dois filhos.</p>
<p>Para ligar a árvore à volatilidade \(\sigma\), Cox, Ross e Rubinstein propuseram:</p>
\[ u = e^{\sigma\sqrt{\Delta t}}, \quad d = 1/u, \quad p^* = \frac{e^{(r-q)\Delta t}-d}{u-d}. \]
<p>Assim a variância do log-retorno por passo é \(\approx \sigma^2 \Delta t\). Quando o número de passos \(N\to\infty\), o preço converge para o de <b>Black-Scholes</b> (com um zigue-zague característico — veja no laboratório).</p>
<h3>Americanas</h3>
<p>Em cada nó, compare o valor de continuar com o valor de exercer agora e fique com o maior:</p>
\[ V = \max\big(\text{payoff imediato},\; e^{-r\Delta t}[p^* V_u + (1-p^*)V_d]\big). \]
<p>Resultados clássicos:</p>
<ul><li><b>Call americana sem dividendos nunca deve ser exercida antes</b>: vale mais viva (tem valor tempo e o strike é pago depois). Logo, vale igual à europeia.</li>
<li><b>Put americana</b> deep ITM pode ser exercida antes: receber \(K\) hoje e aplicar a juros pode valer mais que esperar. Com juros brasileiros altos, isso é bem relevante!</li>
<li><b>Call americana com dividendos</b>: pode valer exercer <i>imediatamente antes</i> da data ex, para capturar o dividendo.</li></ul>
<p>Como as calls de ações na B3 são majoritariamente americanas e as ações pagam dividendos (com ajuste de strike, o que reduz esse incentivo), você vai ouvir discussões sobre "exercício antecipado" perto de datas ex.</p>`,
    desk: String.raw`"Early exercise" / "exercício antecipado". Traders de B3 verificam, perto de datas com provento, se vale exercer calls deep ITM. Em puts deep ITM com DI alto, o exercício antecipado (quando americanas) acontece com mais frequência.`,
    refs: [R_.hull(12, 'Binomial trees'), R_.hull('20.1', 'Binomial trees (numerical procedures)'), R_.wil('15.20', 'Early exercise'), R_.mfd(10, 'Binomial methods'), R_.ek('2.7', 'From CRR to Black-Scholes')],
    sims: ['bs'],
    ex: [
      { tag: 'binomial', gen: R => { const s = R.pick([0.2, 0.25, 0.3, 0.4]), dt = R.pick([1 / 12, 1 / 52, 0.25]); const a = Math.exp(s * Math.sqrt(dt)); return { q: `No modelo CRR com σ = ${F.p(s, 0)} e Δt = ${Q.fmt(dt, 4)} ano, quanto vale u?`, a, tol: 0.0005, dec: 5, e: `u = e^{σ√Δt} = e^{${s}×${Q.fmt(Math.sqrt(dt), 4)}} = ${Q.fmt(a, 5)}.` }; } },
      { tag: 'binomial', gen: R => { const S = 100, K = R.pick([95, 100, 105]), u = 1.1, d = 1 / 1.1, g = 1.01; const p = (g - d) / (u - d); const put = [Math.max(K - S * u * u, 0), Math.max(K - S, 0), Math.max(K - S * d * d, 0)]; const vu = (p * put[0] + (1 - p) * put[1]) / g, vd = (p * put[1] + (1 - p) * put[2]) / g; const a = (p * vu + (1 - p) * vd) / g; return { q: `Árvore de 2 passos: S=100, u=1,1, d=1/1,1, fator de juros por passo 1,01. Preço da put <b>europeia</b> K=${K}?`, a, tol: 0.003, dec: 4, e: `p* = ${Q.fmt(p, 4)}. Nós finais: ${put.map(x => Q.fmt(x, 3)).join(', ')}. Nós intermediários: ${Q.fmt(vu, 4)} e ${Q.fmt(vd, 4)}. Raiz: ${Q.fmt(a, 4)}.` }; } },
      { tag: 'binomial', gen: R => { const S = 100, K = R.pick([105, 110]), u = 1.1, d = 1 / 1.1, g = 1.02; const p = (g - d) / (u - d); const put = [Math.max(K - S * u * u, 0), Math.max(K - S, 0), Math.max(K - S * d * d, 0)]; const vu = Math.max((p * put[0] + (1 - p) * put[1]) / g, K - S * u), vd = Math.max((p * put[1] + (1 - p) * put[2]) / g, K - S * d); const a = Math.max((p * vu + (1 - p) * vd) / g, K - S); return { q: `Mesma árvore (S=100, u=1,1, d=1/1,1) mas fator de juros 1,02 por passo. Preço da put <b>americana</b> K=${K}?`, a, tol: 0.003, dec: 4, e: `Em cada nó: max(exercício, continuação). Nó de baixa: max(${Q.fmt(K - S * d, 3)}, ${Q.fmt((p * put[1] + (1 - p) * put[2]) / g, 3)}) = ${Q.fmt(vd, 4)}. Raiz = ${Q.fmt(a, 4)}.` }; } },
      { t: 'mcq', q: 'Por que uma call americana sobre ação sem dividendos não deve ser exercida antecipadamente?', o: ['Porque é proibido', 'Porque vivendo ela vale pelo menos S − K·e^{−rT} > S − K: exercer joga fora valor tempo e juros', 'Porque o delta é sempre 1', 'Porque a vol é zero'], a: 1, e: 'c ≥ S − K·e^{−rT} > S − K. Vender a call vale mais que exercê-la.' },
      { t: 'tf', q: 'Com juros altos (como no Brasil), o prêmio de exercício antecipado de puts americanas tende a ser maior.', a: true, e: 'Receber K antes e aplicar a juros altos torna o exercício antecipado mais atraente.' }
    ],
    cards: [['CRR', 'u = e^{σ√Δt}, d = 1/u'], ['Backward induction', 'Valor do nó = e^{−rΔt}[p* V_u + (1−p*) V_d] (americana: max com exercício).'], ['Call americana s/ div', 'Nunca exercer antes: vale igual à europeia.']]
  },
  {
    id: 'br3-3', title: 'Passeio aleatório, lognormal e volatilidade', tag: 'vol',
    goal: 'Entender o modelo de preços por trás do Black-Scholes (movimento browniano geométrico) e o que é volatilidade — e calcular a vol histórica.',
    body: String.raw`
<p>O modelo padrão supõe que o log do preço faz um passeio aleatório com pequenos passos independentes. Em tempo contínuo, o <b>movimento browniano geométrico</b> (GBM):</p>
\[ \frac{dS}{S} = \mu\,dt + \sigma\,dW. \]
<p>\(\mu\) é a tendência (drift) e \(\sigma\) a <b>volatilidade</b>: o desvio-padrão anualizado dos log-retornos. Consequências:</p>
<ul><li>\(\ln(S_T/S_0) \sim \mathcal{N}\big((\mu - \tfrac{1}{2}\sigma^2)T,\; \sigma^2 T\big)\): o preço é <b>lognormal</b> (nunca negativo, assimétrico à direita).</li>
<li>O desvio cresce com \(\sqrt{T}\): a incerteza de 4 anos é o dobro (não o quádruplo) da de 1 ano.</li>
<li>Move diário típico: \(\sigma/\sqrt{252}\). Com vol de 32%, o desvio diário é ~2%. Essa "regra do 16" (\(\sqrt{256}=16\)) é usada o tempo todo: <b>vol ÷ 16 ≈ move diário</b>.</li></ul>
<h3>Volatilidade histórica (realizada)</h3>
<p>Com \(n\) preços de fechamento diários, calcule os log-retornos \(r_i = \ln(S_i/S_{i-1})\) e:</p>
\[ \hat\sigma_{\text{diária}} = \sqrt{\tfrac{1}{n-1}\textstyle\sum (r_i - \bar r)^2}, \qquad \hat\sigma_{\text{anual}} = \hat\sigma_{\text{diária}}\sqrt{252}. \]
<p>Na mesa, é comum usar a média zero (\(\bar r = 0\)) e janelas de 10, 21, 63 dias. A <b>vol realizada</b> é o que o mercado de fato entregou; a <b>vol implícita</b> (próxima lição) é o que o mercado está <i>cobrando</i> nas opções. O trader de vol vive do gap entre as duas.</p>
<div class="box"><div class="bt">Intuição</div>A vol não diz <i>para onde</i> o preço vai, só <i>quanto</i> ele chacoalha. Opções são o único instrumento que permite apostar diretamente nisso.</div>`,
    desk: String.raw`"A vol realizada de 1 mês está em 28 e a implícita em 32: a vol está cara." "Regra do 16": vol 24 → move diário esperado ~1,5%.`,
    deep: String.raw`<p>Aplicando o lema de Itô a \(f=\ln S\): \(df = \frac{1}{S}dS - \frac{1}{2S^2}(dS)^2 = (\mu - \tfrac12\sigma^2)dt + \sigma dW\), usando \((dW)^2 = dt\). O termo \(-\tfrac12\sigma^2\) é a "correção de convexidade": a média do log é menor que o log da média. Essa mesma correção explica por que \(E[S_T] = S_0e^{\mu T}\) mas a mediana é \(S_0 e^{(\mu-\sigma^2/2)T}\).</p>`,
    refs: [R_.hull(13, 'Wiener processes and Itô\'s lemma'), R_.hull('14.4', 'Volatility'), R_.wil(3, 'The random behavior of assets'), R_.wil(4, 'Elementary stochastic calculus'), R_.mfd(2, 'Asset price random walks'), R_.ff(10, 'Stochastic differential equations'), R_.cqf(1, 'passeio aleatório, Itô e SDEs')],
    ex: [
      { tag: 'vol', gen: R => { const s = R.f(0.15, 0.6, 2); const a = s / Math.sqrt(252) * 100; return { q: `Uma ação tem vol anual de ${F.p(s, 0)}. Qual o desvio-padrão diário do retorno (base 252), em %?`, a, tol: 0.005, unit: '%', dec: 3, e: `σ/√252 = ${Q.fmt(s * 100, 0)}%/15,87 = ${Q.fmt(a, 2)}%. (Regra do 16: ≈ ${Q.fmt(s * 100 / 16, 2)}%.)` }; } },
      { tag: 'vol', gen: R => { const d = R.f(0.8, 3, 2); const a = d * Math.sqrt(252); return { q: `O desvio-padrão dos retornos diários de VALE3 foi ${Q.fmt(d, 2)}%. Qual a vol anualizada (base 252), em %?`, a, tol: 0.005, unit: '%', dec: 1, e: `${Q.fmt(d, 2)}% × √252 = ${Q.fmt(a, 1)}%.` }; } },
      { tag: 'vol', gen: R => { const rs = [R.f(-0.03, 0.03, 4), R.f(-0.03, 0.03, 4), R.f(-0.03, 0.03, 4), R.f(-0.03, 0.03, 4), R.f(-0.03, 0.03, 4)]; const ss = rs.reduce((a, x) => a + x * x, 0); const a = Math.sqrt(ss / rs.length * 252) * 100; return { q: `Log-retornos diários: ${rs.map(x => Q.fmt(x * 100, 2) + '%').join(', ')}. Usando <b>média zero</b> e dividindo por n=5, qual a vol realizada anualizada (252), em %?`, a, tol: 0.01, unit: '%', dec: 1, e: `Σr² = ${Q.fmt(ss, 6)}; /5 × 252 = ${Q.fmt(ss / 5 * 252, 5)}; raiz = ${Q.fmt(a, 1)}%.` }; } },
      { tag: 'vol', gen: R => { const s = R.f(0.2, 0.4, 2), T = R.pick([1, 4, 9]); const a = s * Math.sqrt(T) * 100; return { q: `Com vol ${F.p(s, 0)} a.a., qual o desvio-padrão do log-retorno acumulado em ${T} ano(s), em %?`, a, tol: 0.005, unit: '%', dec: 1, e: `σ√T = ${Q.fmt(s * 100, 0)}% × √${T} = ${Q.fmt(a, 1)}%.` }; } },
      { t: 'mcq', q: 'No GBM, a distribuição de S_T é:', o: ['Normal', 'Lognormal', 'Uniforme', 'Poisson'], a: 1, e: 'ln(S_T) é normal ⇒ S_T é lognormal (sempre positivo, cauda direita mais longa).' }
    ],
    cards: [['GBM', 'dS/S = μ dt + σ dW'], ['Regra do 16', 'Vol anual ÷ 16 ≈ desvio diário (√256 = 16).'], ['Vol realizada', 'Desvio-padrão dos log-retornos × √252.'], ['Escala com o tempo', 'Desvio cresce com √T.']]
  },
  {
    id: 'br3-4', title: 'A fórmula de Black-Scholes', tag: 'bs',
    goal: 'Conhecer, interpretar e aplicar a fórmula de Black-Scholes-Merton — inclusive com a convenção brasileira.',
    body: String.raw`
<p>Black, Scholes e Merton (1973) mostraram que, no GBM, uma opção pode ser replicada <b>continuamente</b> com a ação e caixa (o limite da árvore binomial). O resultado para uma call europeia com dividend yield \(q\):</p>
\[ c = S e^{-qT} N(d_1) - K e^{-rT} N(d_2), \qquad p = K e^{-rT} N(-d_2) - S e^{-qT} N(-d_1), \]
\[ d_1 = \frac{\ln(S/K) + (r - q + \tfrac12\sigma^2)T}{\sigma\sqrt{T}}, \qquad d_2 = d_1 - \sigma\sqrt{T}. \]
<p>\(N(\cdot)\) é a função de distribuição normal padrão. Leitura:</p>
<ul><li>\(N(d_2)\) = probabilidade (neutra a risco) de a call terminar ITM.</li>
<li>\(e^{-qT}N(d_1)\) = <b>delta</b> da call: quantas ações segurar para hedgear.</li>
<li>A call = "receber a ação se ITM" − "pagar K se ITM", ambos em valor presente.</li></ul>
<p>Só há <b>um</b> parâmetro não observável: \(\sigma\). Por isso o mercado cota opções <b>em vol</b>, e não em preço.</p>
<h3>Aplicando no Brasil</h3>
<ul><li>\(T\) = dias úteis / 252.</li>
<li>\(r = \ln(1 + \text{taxa DI do prazo})\) — use a taxa da curva de DI para o vencimento da opção.</li>
<li>Dividendos: como a B3 ajusta o strike por proventos, na prática muitas mesas usam \(q\approx 0\) para opções de ação com ajuste (ou modelam dividendos discretos com cuidado).</li>
<li>Opções de índice (Ibovespa): prefira precificar sobre o <b>futuro</b> (modelo de Black, Unidade 8/US), que já embute juros e dividendos.</li></ul>
<p>Hipóteses do modelo (e onde elas falham): vol constante (falha: há smile), sem custos (falha: há bid/ask), hedge contínuo (falha: hedge discreto), preços contínuos (falha: gaps). Grande parte do trabalho da mesa é gerenciar exatamente essas falhas.</p>`,
    desk: String.raw`"Qual a vol dessa call?" — ninguém pergunta o preço primeiro. "Me cota a PETR junho 40 em vol." O preço sai da vol + modelo + parâmetros de mercado (spot, taxa, dividendos).`,
    deep: String.raw`<p>Derivação pela EDP: monte \(\Pi = V - \Delta S\). Por Itô, \(d\Pi = (\partial_t V + \tfrac12\sigma^2S^2\partial_{SS}V)dt + (\partial_S V - \Delta)dS\). Escolhendo \(\Delta = \partial_S V\), o risco some; sem arbitragem, \(d\Pi = r\Pi dt\). Resulta a equação de Black-Scholes:</p>
\[ \frac{\partial V}{\partial t} + \tfrac12\sigma^2S^2\frac{\partial^2 V}{\partial S^2} + (r-q)S\frac{\partial V}{\partial S} - rV = 0. \]
<p>Note que \(\mu\) desapareceu. Com a condição final \(V(S,T) = \max(S-K,0)\), a solução (mudança de variáveis para a equação do calor) é a fórmula acima. Equivalentemente, \(V = e^{-rT}\mathbb{E}^{\mathbb{Q}}[\text{payoff}]\) com \(S\) crescendo a \(r-q\).</p>`,
    refs: [R_.hull('14.8', 'Black–Scholes–Merton pricing formulas'), R_.wil(5, 'The Black-Scholes model'), R_.wil(7, 'The Black-Scholes formulae and the Greeks'), R_.mfd(3, 'The Black-Scholes model'), R_.ek('7.6', 'Black-Scholes prices'), R_.car('ajustes de convenção para opções locais'), R_.cqf(3, 'Black-Scholes')],
    sims: ['bs'],
    ex: [
      { tag: 'bs', gen: R => { const S = R.f(90, 110, 1), K = 100, T = R.pick([0.25, 0.5, 1]), r = R.f(0.02, 0.1, 3), s = R.f(0.15, 0.4, 2); const g = Q.bs('call', S, K, T, r, 0, s); return { q: `Calcule d1 para: S = ${S}, K = ${K}, T = ${T}, r = ${F.p(r, 1)} (contínua), σ = ${F.p(s, 0)}, sem dividendos.`, a: g.d1, tolAbs: 0.003, dec: 4, e: `d1 = [ln(${S}/${K}) + (${r} + ½·${s}²)·${T}]/(${s}·√${T}) = ${Q.fmt(g.d1, 4)}.` }; } },
      { tag: 'bs', gen: R => { const S = R.f(90, 110, 1), K = R.pick([95, 100, 105]), T = R.pick([0.25, 0.5, 1]), r = R.f(0.02, 0.1, 3), s = R.f(0.15, 0.4, 2); const g = Q.bs('call', S, K, T, r, 0, s); return { q: `Preço Black-Scholes de uma call europeia: S = ${S}, K = ${K}, T = ${T} ano, r = ${F.p(r, 1)} contínua, σ = ${F.p(s, 0)}, q = 0.`, a: g.price, tol: 0.005, dec: 4, e: `d1 = ${Q.fmt(g.d1, 4)}, d2 = ${Q.fmt(g.d2, 4)}, N(d1) = ${Q.fmt(g.nd1, 4)}, N(d2) = ${Q.fmt(g.nd2, 4)}. c = ${S}·N(d1) − ${K}·e^{−rT}·N(d2) = ${Q.fmt(g.price, 4)}.`, hint: 'Use o Laboratório BS para conferir (mas tente na mão/planilha primeiro).' }; } },
      { tag: 'bs', gen: R => { const S = R.f(20, 40, 2), K = Math.round(S * R.f(0.95, 1.05, 2)), du = R.pick([21, 42, 63]), i = R.f(0.1, 0.15, 4), s = R.f(0.25, 0.45, 2); const T = du / 252, r = Math.log(1 + i); const g = Q.bs('put', S, K, T, r, 0, s); return { q: `Put europeia de PETR4: S = ${F.r(S)}, K = ${F.r(K)}, ${du} dias úteis, DI = ${F.p(i, 2)} a.a. (exp. 252), vol ${F.p(s, 0)}, sem dividendos. Preço BS?`, a: g.price, tol: 0.006, unit: 'R$', dec: 4, e: `T = ${du}/252 = ${Q.fmt(T, 4)}; r = ln(1+${Q.fmt(i, 4)}) = ${Q.fmt(r, 5)}. d1 = ${Q.fmt(g.d1, 4)}, d2 = ${Q.fmt(g.d2, 4)}. p = K·e^{−rT}·N(−d2) − S·N(−d1) = ${Q.fmt(g.price, 4)}.` }; } },
      { tag: 'bs', gen: R => { const S = 100, K = R.pick([90, 100, 110]), T = 0.5, r = 0.05, s = R.f(0.2, 0.35, 2); const g = Q.bs('call', S, K, T, r, 0, s); const a = g.nd2 * 100; return { q: `S = 100, K = ${K}, T = 0,5, r = 5%, σ = ${F.p(s, 0)}. Qual a probabilidade neutra a risco de a call terminar ITM (em %)?`, a, tolAbs: 0.15, unit: '%', dec: 2, e: `N(d2) com d2 = ${Q.fmt(g.d2, 4)}: ${Q.fmt(a, 2)}%.` }; } },
      { t: 'mcq', q: 'Qual parâmetro do Black-Scholes <b>não</b> é diretamente observável no mercado?', o: ['Spot', 'Strike', 'Taxa de juros', 'Volatilidade futura'], a: 3, e: 'Por isso opções são cotadas em vol implícita.' },
      { t: 'mcq', q: 'O drift μ (retorno esperado da ação) aparece na fórmula de Black-Scholes?', o: ['Sim, no d1', 'Sim, no desconto', 'Não: o hedge elimina a dependência de μ', 'Só para puts'], a: 2, e: 'Na EDP o termo em μ se cancela com o delta hedge. Preço usa r (medida neutra a risco).' }
    ],
    cards: [['BS call', 'c = S e^{−qT} N(d1) − K e^{−rT} N(d2)'], ['d1, d2', 'd1 = [ln(S/K) + (r−q+σ²/2)T]/(σ√T); d2 = d1 − σ√T'], ['N(d2)', 'Prob. neutra a risco de a call terminar ITM.'], ['Brasil no BS', 'T = du/252; r = ln(1+DI).']]
  },
  {
    id: 'br3-5', title: 'Vol implícita, vol realizada e a primeira olhada no smile', tag: 'vol',
    goal: 'Entender a vol implícita como "preço" da opção, compará-la com a realizada, e ver por que ela varia por strike.',
    body: String.raw`
<p>Se o mercado paga R$ 1,85 numa call, qual \(\sigma\) no Black-Scholes reproduz esse preço? Essa é a <b>volatilidade implícita</b> (IV). Não existe fórmula fechada: resolve-se numericamente (Newton-Raphson usando o vega, ou bisseção). Como o preço é crescente em \(\sigma\), a solução é única.</p>
<p>A IV é a linguagem da mesa porque:</p>
<ul><li>Normaliza preços: uma call de R$ 0,50 e outra de R$ 5,00 podem ter a mesma IV.</li>
<li>Permite comparar strikes, vencimentos e ativos diferentes.</li>
<li>É o que você compara com a vol que <i>espera</i> realizar: comprar opção a 25 e o ativo realizar 35 = ganho (se hedgeado — Unidade 5).</li></ul>
<h3>Regra de bolso do vega</h3>
<p>Perto do ATM, o prêmio é quase linear na vol: \(\Delta\text{preço} \approx \text{vega}\times\Delta\sigma\). Para uma opção ATM, uma aproximação útil (Brenner-Subrahmanyam):</p>
\[ c_{ATM} \approx 0{,}4\, S\,\sigma\sqrt{T}. \]
<p>Ex.: S = 100, vol 25%, 3 meses → \(0{,}4\times100\times0{,}25\times0{,}5 = 5{,}0\). Traders usam isso para fazer conta de cabeça.</p>
<h3>O smile</h3>
<p>Se o Black-Scholes fosse perfeito, todas as opções do mesmo ativo e vencimento teriam a mesma IV. Não têm. Em ações e índices, puts OTM (strikes baixos) negociam com IV maior: é o <b>skew</b>. O mercado precifica que quedas são mais violentas que altas (e que a vol sobe quando o mercado cai). No Brasil, em ativos como dólar, o formato é diferente (calls de dólar mais caras — o "medo" é de depreciação do real).</p>
<p>O smile é a forma como o mercado "corrige" as hipóteses do modelo. Estudaremos a superfície de vol a fundo no Módulo US.</p>`,
    desk: String.raw`"A vol está cara/barata" = IV alta/baixa vs realizada ou vs histórico. "Pagar vol" = comprar opção; "dar vol" = vender. "Skew está íngreme" = puts muito mais caras que calls.`,
    refs: [R_.hull('14.11', 'Implied volatilities'), R_.hull(19, 'Volatility smiles'), R_.wil(49, 'Overview of volatility modeling'), R_.der(22, 'volatility smiles and surfaces')],
    sims: ['bs', 'smile'],
    ex: [
      { tag: 'vol', gen: R => { const S = R.f(20, 120, 0), s = R.f(0.15, 0.5, 2), T = R.pick([1 / 12, 0.25, 0.5, 1]); const a = 0.4 * S * s * Math.sqrt(T); return { q: `Pela aproximação 0,4·S·σ·√T, qual o preço aproximado de uma call ATM com S = ${S}, σ = ${F.p(s, 0)}, T = ${Q.fmt(T, 3)} ano?`, a, tol: 0.01, dec: 3, e: `0,4 × ${S} × ${s} × √${Q.fmt(T, 3)} = ${Q.fmt(a, 3)}.` }; } },
      { tag: 'vol', gen: R => { const S = 100, K = R.pick([95, 100, 105]), T = 0.25, r = 0.05, s = R.f(0.18, 0.4, 3); const px = Q.bsPrice('call', S, K, T, r, 0, s); return { q: `Uma call (S=100, K=${K}, T=0,25, r=5%, q=0) negocia a ${Q.fmt(px, 4)}. Qual a vol implícita (em %)? <span class="muted">Use o laboratório BS → aba "Vol implícita", ou Newton na planilha.</span>`, a: s * 100, tolAbs: 0.1, unit: '%', dec: 2, e: `A IV que reproduz ${Q.fmt(px, 4)} é ${Q.fmt(s * 100, 2)}%.` }; } },
      { tag: 'vol', gen: R => { const vega = R.f(0.05, 0.3, 3), dv = R.f(-3, 3, 1); const a = vega * dv; return { q: `Uma opção tem vega de ${Q.fmt(vega, 3)} (R$ por ponto de vol). A IV sobe de ${Q.fmt(25, 1)} para ${Q.fmt(25 + dv, 1)}. Variação aproximada do prêmio?`, a, tolAbs: 0.002, unit: 'R$', dec: 3, e: `ΔP ≈ vega × Δσ = ${Q.fmt(vega, 3)} × ${Q.fmt(dv, 1)} = ${Q.fmt(a, 3)}.` }; } },
      { t: 'mcq', q: 'Em opções de Ibovespa, normalmente a IV de puts OTM (strike 85%) comparada à ATM é:', o: ['Menor', 'Igual', 'Maior', 'Sempre zero'], a: 2, e: 'Skew negativo típico de equity: proteção contra queda é mais cara.' },
      { t: 'mcq', q: 'Você compra uma opção a 22 de IV e o ativo realiza 30 de vol até o vencimento. Com delta hedge diário, o PnL esperado é:', o: ['Negativo', 'Aproximadamente zero', 'Positivo', 'Indeterminado'], a: 2, e: 'Comprado em vol ganha quando a realizada supera a implícita paga (Unidade 5 detalha).' }
    ],
    cards: [['Vol implícita', 'σ que faz o BS reproduzir o preço de mercado.'], ['Call ATM aproximada', '≈ 0,4·S·σ·√T'], ['Skew de equity', 'Puts OTM com IV maior que calls OTM.']]
  }
  ]
});
})();
