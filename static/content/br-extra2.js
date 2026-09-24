/* Módulo Brasil — lições extras baseadas nos livros (v4) */
(function () {
const R_ = window.REF;

/* ============ BR3-6 — Medida neutra a risco ============ */
Course.addLesson('br3', {
  id: 'br3-6', title: 'Medida neutra a risco e martingais: por que o drift some do preço', tag: 'neutro',
  goal: 'Entender o que é a medida neutra a risco (Q), por que o retorno esperado da ação não entra no preço e o que N(d₂) realmente significa.',
  body: String.raw`
<p>Na árvore binomial (lição 3.1) aconteceu algo estranho: a probabilidade <i>real</i> de alta não entrou no preço. Usamos um \(p^*\) inventado a partir de juros, \(u\) e \(d\). Isso não é um truque de contas — é a ideia central de toda a precificação de derivativos.</p>
<h3>Dois mundos, os mesmos cenários</h3>
<ul><li><b>Mundo real (medida P)</b>: a ação sobe em média \(\mu\) ao ano — o retorno que um gestor espera, com prêmio de risco.</li>
<li><b>Mundo neutro a risco (medida Q)</b>: os <i>mesmos</i> cenários possíveis, mas com pesos diferentes, escolhidos de modo que todo ativo negociado renda, em média, a taxa livre de risco \(r\).</li></ul>
<p>Por que Q serve para precificar? Porque a opção pode ser <b>replicada</b> com ação + caixa (delta hedge). O custo da réplica não depende de \(\mu\): quem hedgeia não se importa com a direção. E a conta que devolve exatamente esse custo é a média sob Q, descontada:</p>
\[ V_0 = e^{-rT}\,\mathbb{E}^{\mathbb{Q}}\big[\,\text{payoff}(S_T)\,\big] \]
<h3>Martingal: o "jogo justo"</h3>
<p>Um processo é um <b>martingal</b> se a melhor previsão do valor futuro é o valor de hoje: \(\mathbb{E}[X_{t+1}\mid \text{hoje}] = X_t\). Sob Q, <b>preços descontados</b> (\(e^{-rt}S_t\), \(e^{-rt}V_t\)) são martingais. O teorema fundamental diz:</p>
<ol><li><b>Sem arbitragem</b> ⇔ existe pelo menos uma medida Q equivalente (mesmos cenários possíveis) com preços descontados martingais.</li>
<li><b>Mercado completo</b> (tudo replicável) ⇔ essa Q é <b>única</b>. É o caso do Black-Scholes e da árvore binomial.</li></ol>
<p>Com saltos ou vol estocástica o mercado fica <b>incompleto</b>: há infinitas Q possíveis, e é o preço das opções negociadas (a superfície de vol) que "escolhe" qual usar — isso é <b>calibrar</b>. Por isso a mesa diz que o modelo é calibrado ao mercado, não "verdadeiro".</p>
<h3>Consequências práticas</h3>
<ul><li><b>Duas ações com a mesma vol</b>, uma "boa" (μ = 30%) e outra "ruim" (μ = 0%), têm opções com o <b>mesmo preço</b>. Visão direcional não entra na vol — entra na escolha do trade.</li>
<li><b>N(d₂) é a probabilidade de exercício sob Q</b>, não a real. A "prob. de exercício" das telas de corretora é neutra a risco; para uma ação com drift alto, a chance real de a call terminar ITM é maior.</li>
<li><b>Digitais</b> custam \(e^{-rT}\,\mathbb{Q}(S_T &gt; K)\): o mercado de digitais revela probabilidades neutras a risco (ex.: as digitais de Copom).</li>
<li><b>Prêmio de risco</b>: a distância entre P e Q mede quanto o mercado cobra para carregar risco. Em vol, é o <b>volatility risk premium</b> (lição 5.1): a IV (Q) costuma ficar acima da realizada (P).</li></ul>
<div class="w" data-w="riskneutral"></div>`,
  desk: String.raw`"Isso é probabilidade neutra a risco, não é a chance real" — frase obrigatória ao mostrar N(d₂) para cliente. "O mercado está precificando 70% de corte de 50" (digitais de Copom). "Calibrar o modelo" = escolher os parâmetros para bater os preços de mercado.`,
  deep: String.raw`<p><b>Girsanov.</b> Sob P, \(dS = \mu S\,dt + \sigma S\,dW^{\mathbb{P}}\). Defina o preço de mercado do risco \(\lambda = (\mu - r)/\sigma\) e \(W^{\mathbb{Q}}_t = W^{\mathbb{P}}_t + \lambda t\). Pelo teorema de Girsanov, existe Q equivalente sob a qual \(W^{\mathbb{Q}}\) é browniano, com densidade</p>
\[ \frac{d\mathbb{Q}}{d\mathbb{P}} = \exp\!\Big(-\lambda W^{\mathbb{P}}_T - \tfrac12\lambda^2 T\Big), \]
<p>e então \(dS = rS\,dt + \sigma S\,dW^{\mathbb{Q}}\): só o drift muda, a vol é a mesma (medidas equivalentes concordam sobre a variação quadrática). No discreto (Elliott &amp; Kopp, cap. 2), \(p^* = (1 + r - d)/(u - d)\) é o único peso que torna \(S_t/(1+r)^t\) martingal na árvore; o limite CRR → Black-Scholes (EK §2.7) recupera a fórmula contínua.</p>`,
  refs: [R_.ek(1, 'Pricing by arbitrage'), R_.ek('2.3', 'Martingales and risk-neutral pricing'), R_.ek('2.7', 'From CRR to Black-Scholes'), R_.ek('7.2', "Girsanov's theorem"), R_.hull('12.2', 'Risk-neutral valuation'), R_.hull('14.7', 'Risk-neutral valuation'), R_.hull(27, 'Martingales and measures'), R_.wil('15.10', 'The real and risk-neutral worlds'), R_.ff(14, 'Arbitrage pricing: finite-state models'), R_.cqf(1, 'martingais e medida neutra a risco')],
  sims: ['bs'],
  ex: [
    { tag: 'neutro', gen: R => { const u = R.pick([1.1, 1.15, 1.2, 1.25]), d = Math.round(1 / u * 1000) / 1000, g = 1 + R.f(0.5, 3, 2) / 100; const a = (g - d) / (u - d); return { q: `Árvore de um passo: u = ${Q.fmt(u, 2)}, d = ${Q.fmt(d, 3)} e o caixa rende ${Q.fmt((g - 1) * 100, 2)}% no período. Qual a probabilidade neutra a risco de alta p*?`, a, tol: 0.002, dec: 4, e: `p* = (1 + r − d)/(u − d) = (${Q.fmt(g, 4)} − ${Q.fmt(d, 3)})/(${Q.fmt(u, 2)} − ${Q.fmt(d, 3)}) = ${Q.fmt(a, 4)}.` }; } },
    { t: 'mcq', q: 'Duas ações têm a mesma vol (30%), mas os analistas esperam retorno de 25% a.a. para a primeira e 5% para a segunda. Pelo Black-Scholes, as calls ATM de mesmo prazo:', o: ['A da primeira é mais cara', 'A da segunda é mais cara', 'Têm o mesmo preço', 'Não dá para saber'], a: 2, e: 'O drift real μ não entra no preço: a opção é replicada, e a réplica só depende de σ e r.' },
    { tag: 'neutro', gen: R => { const u = 1.2, d = 0.85, g = 1 + R.f(1, 3, 2) / 100, Qv = R.pick([100, 1000]); const p = (g - d) / (u - d), a = Qv * p / g; return { q: `Mesma árvore de um passo com S = 100, u = 1,20, d = 0,85, caixa rendendo ${Q.fmt((g - 1) * 100, 2)}% no período. Quanto vale hoje uma digital que paga R$ ${Qv} se a ação subir?`, a, tol: 0.002, unit: 'R$', dec: 2, e: `p* = (${Q.fmt(g, 4)} − 0,85)/0,35 = ${Q.fmt(p, 4)}; valor = ${Qv}·p*/${Q.fmt(g, 4)} = ${Q.fmt(a, 2)}.` }; } },
    { t: 'mcq', q: 'N(d₂) no Black-Scholes é:', o: ['A probabilidade real de a call terminar dentro do dinheiro', 'A probabilidade neutra a risco de a call terminar dentro do dinheiro', 'O delta da call', 'A vol implícita'], a: 1, e: 'É Q(S_T > K). A probabilidade real depende do drift μ.' },
    { tag: 'neutro', gen: R => { const mu = R.f(8, 30, 1) / 100, r = R.f(3, 14, 1) / 100, s = R.f(15, 45, 0) / 100; const a = (mu - r) / s; return { q: `Uma ação tem retorno esperado de ${Q.fmt(mu * 100, 1)}% a.a. e vol de ${Q.fmt(s * 100, 0)}%; a taxa livre de risco é ${Q.fmt(r * 100, 1)}%. Qual o preço de mercado do risco λ?`, a, tol: 0.005, tolAbs: 0.001, dec: 3, e: `λ = (μ − r)/σ = (${Q.fmt(mu, 3)} − ${Q.fmt(r, 3)})/${Q.fmt(s, 2)} = ${Q.fmt(a, 3)}.` }; } },
    { t: 'tf', q: 'Em um mercado incompleto (por exemplo, com saltos), a medida neutra a risco é única.', a: false, e: 'Incompleto ⇒ várias Q compatíveis com não-arbitragem; o mercado (calibração) escolhe.' }
  ],
  cards: [['Medida neutra a risco (Q)', 'Pesos em que todo ativo rende r em média; preços descontados são martingais.'], ['Precificação sob Q', 'V₀ = e^{−rT}·E^Q[payoff]'], ['Martingal', 'Melhor previsão do futuro = valor de hoje.'], ['Teorema fundamental', 'Sem arbitragem ⇔ existe Q; completo ⇔ Q única.'], ['N(d₂)', 'Probabilidade de exercício sob Q, não a real.']]
}, 'br3-5');

/* ============ BR5-5 — Comprar vega, vender gamma ============ */
Course.addLesson('br5', {
  id: 'br5-5', title: '"Comprar vega, vender gamma": separando as gregas pelo prazo', tag: 'vegagamma',
  goal: 'Entender por que gamma mora no curto e vega no longo, montar posições long/short vega e long/short gamma e ler o jargão de mesa.',
  body: String.raw`
<p>Toda opção comprada é long gamma <i>e</i> long vega ao mesmo tempo. Mas a <b>proporção</b> entre as duas muda com o prazo — e é isso que permite à mesa separá-las. No Black-Scholes, para a mesma opção:</p>
\[ \mathcal{V} = \sigma\,S^2\,T\;\Gamma \]
<p>Para um ATM: gamma cresce como \(1/\sqrt{T}\) (explode perto do vencimento) e vega cresce como \(\sqrt{T}\). Conclusão de mesa: <b>opção curta = gamma</b> (sensível ao que o mercado <i>realiza</i> nos próximos dias); <b>opção longa = vega</b> (sensível ao que o mercado <i>precifica</i> de vol).</p>
<h3>O dicionário</h3>
<table class="tbl"><tr><th>Jargão</th><th>Posição típica</th><th>Γ</th><th>Vega</th><th>Θ</th><th>Ganha se…</th></tr>
<tr><td>Comprar gamma</td><td>Compra straddle curto (1 sem–1 mês), delta-hedgeado</td><td>+</td><td>+ (pouco)</td><td>−</td><td>O mercado realiza mais que a vol paga</td></tr>
<tr><td>Comprar vega</td><td>Compra opções longas (6m–2a)</td><td>+ (pouco)</td><td>+</td><td>− (pouco)</td><td>A vol implícita sobe</td></tr>
<tr><td><b>Comprar vega, vender gamma</b></td><td><b>Long calendar</b>: vende o curto, compra o longo</td><td>−</td><td>+</td><td>+</td><td>IV longa sobe e/ou mercado fica parado</td></tr>
<tr><td>Comprar gamma, vender vega</td><td>Reverse calendar: compra o curto, vende o longo</td><td>+</td><td>−</td><td>−</td><td>Movimento forte já, com IV longa estável/caindo</td></tr>
<tr><td>Short vega</td><td>Vende opções longas (straddle 1a, puts longas)</td><td>− (pouco)</td><td>−</td><td>+</td><td>IV cai ou fica abaixo do que você vendeu</td></tr>
<tr><td>Short gamma</td><td>Vende opções curtas</td><td>−</td><td>− (pouco)</td><td>+</td><td>Mercado parado</td></tr></table>
<div class="w" data-w="gammavega"></div>
<h3>Por que alguém compraria vega vendendo gamma?</h3>
<ul><li><b>Estrutura a termo invertida</b> (curto &gt; longo, típico depois de um choque): vende a vol cara do curto, compra a barata do longo.</li>
<li><b>Visão de que a vol implícita longa vai subir</b> sem querer pagar o theta de estar long gamma no curto: o calendar é financiado pelo curto.</li>
<li><b>Risco</b>: um movimento forte no curto prazo machuca (short gamma) antes de a vega "pagar" — e a vol curta costuma mexer mais que a longa. Por isso a mesa olha <b>vega ponderada</b> (vega × \(\sqrt{T_{ref}/T}\)): 1 ponto de vol no longo não equivale a 1 ponto no curto.</li></ul>
<h3>Short vega: quem está e o que pode dar errado</h3>
<p>Estão short vega: quem vende straddles/strangles longos, quem vende puts longas como "seguro", fundos de venda de vol, e emissores que vendem opções dentro de produtos (ex.: o banco que entrega a call de um COE ao investidor). O PnL instantâneo é \(-\mathcal{V}\cdot\Delta\sigma\). O perigo é a combinação típica de crise: o spot cai, a vol dispara <i>e</i> o skew empina — short vega + short gamma + short skew perdem juntos. Limites de vega por prazo e stress de "vol +10 pts" existem por isso.</p>`,
  desk: String.raw`"Estou comprado em vega e vendido em gamma no curto" = long calendar. "Dando gamma" = vendendo opções curtas. "Pagando vega no longo" = comprando vol longa. "Vega ponderada" = vega ajustada por √(T_ref/T). "Short vol no longo, long no curto" = reverse calendar.`,
  deep: String.raw`<p>Da fórmula de BS com \(q = 0\): \(\Gamma = n(d_1)/(S\sigma\sqrt{T})\) e \(\mathcal{V} = S\,n(d_1)\sqrt{T}\); logo \(\mathcal{V}/\Gamma = \sigma S^2 T\) (exato, mesmo strike e mesmos parâmetros). Isso é a versão "grega" da identidade de theta: com \(r = 0\), \(\Theta = -\tfrac12\sigma^2S^2\Gamma = -\tfrac{\sigma}{2T}\mathcal{V}\). Para uma carteira com vários vencimentos a identidade não vale no agregado — é exatamente o que torna possível ter \(\Gamma &lt; 0\) e \(\mathcal{V} &gt; 0\) ao mesmo tempo.</p>`,
  refs: [R_.hull('18.8', 'Vega'), R_.hull('18.7', 'Relationship between delta, theta, and gamma'), R_.hull('11.3', 'Spreads (calendar spreads)'), R_.wil('7.7', 'Vega'), R_.wil('2.18', 'Calendar spreads'), R_.wil('7.10', 'A classification of hedging types')],
  sims: ['struct', 'book'],
  ex: [
    { tag: 'vegagamma', gen: R => { const G = R.f(0.01, 0.06, 3), s = R.f(0.2, 0.45, 2), S = R.f(20, 60, 1), T = R.pick([0.25, 0.5, 1]); const a = s * S * S * T * G / 100; return { q: `Uma opção tem Γ = ${Q.fmt(G, 3)}, σ = ${Q.fmt(s * 100, 0)}%, S = ${Q.fmt(S, 1)} e T = ${Q.fmt(T, 2)}. Pela identidade de Black-Scholes, qual a vega por 1 ponto de vol?`, a, tol: 0.005, dec: 4, e: `𝒱 = σS²TΓ = ${Q.fmt(s, 2)}·${Q.fmt(S * S, 2)}·${Q.fmt(T, 2)}·${Q.fmt(G, 3)} = ${Q.fmt(a * 100, 4)} por 1,00 de vol ⇒ ${Q.fmt(a, 4)} por ponto.` }; } },
    { t: 'mcq', q: 'Vender a call ATM de 1 mês e comprar a call ATM de 1 ano (mesmo strike) resulta tipicamente em:', o: ['Γ+, vega−, Θ−', 'Γ−, vega+, Θ+', 'Γ+, vega+, Θ−', 'Γ−, vega−, Θ+'], a: 1, e: 'Long calendar: short gamma do curto, long vega do longo, recebe theta.' },
    { tag: 'vegagamma', gen: R => { const s = R.f(0.2, 0.4, 2), d1 = R.pick([10, 21, 42]), d2 = R.pick([126, 252, 504]); const v = d => Q.bs('call', 100, 100, d / 252, 0.1, 0, s).vega / 100; const a = v(d2) - v(d1); return { q: `S = K = 100, r = 10%, σ = ${Q.fmt(s * 100, 0)}%. Você vende 1 call ATM de ${d1} d.u. e compra 1 call ATM de ${d2} d.u. Qual a vega líquida por ponto de vol?`, a, tol: 0.01, dec: 4, e: `Vega(${d2}d) − Vega(${d1}d) = ${Q.fmt(v(d2), 4)} − ${Q.fmt(v(d1), 4)} = ${Q.fmt(a, 4)} (positiva: comprado em vega).` }; } },
    { tag: 'vegagamma', gen: R => { const V = R.int(20, 300) * 1000, dv = R.f(1, 12, 1); const a = -V * dv; return { q: `Seu livro está short vega em R$ ${Q.fmt(V, 0)} por ponto. Num dia de estresse, a vol implícita sobe ${Q.fmt(dv, 1)} pontos em toda a curva. PnL de vega?`, a, tol: 0.001, tolAbs: 1, unit: 'R$', dec: 0, e: `−${Q.fmt(V, 0)} × ${Q.fmt(dv, 1)} = ${Q.fmt(a, 0)}.` }; } },
    { t: 'mcq', q: 'Qual trade é o exemplo clássico de "short vega"?', o: ['Comprar straddle de 1 semana', 'Vender straddle de 1 ano', 'Comprar futuro de índice', 'Comprar call de 2 anos'], a: 1, e: 'Vender opções longas concentra exposição negativa à vol implícita.' },
    { t: 'tf', q: 'Com mesmo strike, spot e vol, uma opção ATM de 1 semana tem mais gamma que uma ATM de 1 ano.', a: true, e: 'Gamma ATM ∝ 1/√T: o curto concentra gamma; o longo concentra vega.' },
    { t: 'mcq', q: '"Compro gamma e vendo vega" descreve:', o: ['Long calendar', 'Reverse calendar: compra o curto e vende o longo', 'Short straddle curto', 'Long strangle longo'], a: 1, e: 'Long gamma no curto financiado por vega vendida no longo.' }
  ],
  cards: [['Vega × gamma (BS)', '𝒱 = σS²TΓ: curto = gamma, longo = vega.'], ['Long calendar', 'Vende curto, compra longo: Γ−, vega+, Θ+ ("compra vega, vende gamma").'], ['Reverse calendar', 'Compra curto, vende longo: Γ+, vega−.'], ['Short vega', 'Perde −𝒱·Δσ quando a vol implícita sobe; típico de quem vende opções longas.'], ['Vega ponderada', 'Vega × √(T_ref/T): vol curta mexe mais que a longa.']]
}, 'br5-4');

/* ============ BR5-6 — Defeitos do Black-Scholes ============ */
Course.addLesson('br5', {
  id: 'br5-6', title: 'Onde o Black-Scholes falha: hedge discreto, custos, vol incerta, saltos e feedback', tag: 'defeitos',
  goal: 'Saber quais hipóteses do BS quebram na mesa, qual o efeito de cada uma no preço/PnL e como a mesa se defende.',
  body: String.raw`
<p>O Black-Scholes é o idioma do mercado — mas quase todas as suas hipóteses são falsas. Wilmott dedica uma parte inteira do PWOQF a isso. A pergunta útil não é "o modelo está certo?", e sim "<b>quanto eu erro por cada hipótese falsa, e para que lado</b>?".</p>
<table class="tbl"><tr><th>Hipótese do BS</th><th>Realidade</th><th>Efeito na mesa</th></tr>
<tr><td>Hedge contínuo</td><td>Rebalanceia 1× ao dia (ou por banda)</td><td>PnL do hedge vira aleatório: desvio ∝ √δt</td></tr>
<tr><td>Sem custos</td><td>Spread, emolumentos, impacto</td><td>Vol de compra &lt; vol de venda (Leland)</td></tr>
<tr><td>Vol constante e conhecida</td><td>Vol muda, tem smile e estrutura a termo</td><td>Vega, vanna, volga; preço em faixa (vol incerta)</td></tr>
<tr><td>Caminho contínuo (difusão)</td><td>Saltos e gaps</td><td>Delta hedge não protege o salto; skew</td></tr>
<tr><td>Hedge não move o preço</td><td>Hedgers grandes movem o mercado</td><td>Feedback: short gamma amplifica, long gamma amortece</td></tr>
<tr><td>Retornos normais</td><td>Caudas gordas</td><td>Eventos "de 10 desvios" acontecem; stress &gt; VaR</td></tr></table>
<h3>1. Hedge discreto</h3>
<p>Rebalanceando a cada \(\delta t\), o resultado de uma opção hedgeada deixa de ser determinístico: para um ATM, o desvio do erro de hedge em relação ao prêmio é de aprox. \(\sqrt{\pi/4}/\sqrt{N}\), onde \(N\) é o número de rebalanceamentos. Hedge diário de uma opção de 3 meses (63 dias) ⇒ ~11% do prêmio de ruído. É por isso que "vendi a 30, realizou 25" às vezes dá prejuízo.</p>
<h3>2. Custos de transação — Leland</h3>
<p>Cada rebalanceamento paga spread. Leland (1985) mostrou que, com custo proporcional \(\kappa\), a posição comprada deve ser avaliada com uma vol menor e a vendida com uma vol maior:</p>
\[ \check\sigma^2 = \sigma^2 - 2\kappa\sigma\sqrt{\frac{2}{\pi\,\delta t}}, \qquad \hat\sigma^2 = \sigma^2 + 2\kappa\sigma\sqrt{\frac{2}{\pi\,\delta t}} \]
<p>A intuição: long gamma vende na alta e compra na baixa, e o spread come parte de cada perna — é como se o mercado realizasse menos. Rebalancear mais vezes (δt menor) <b>aumenta</b> a correção: existe um ótimo entre ruído de hedge e custo.</p>
<div class="w" data-w="leland"></div>
<h3>3. Vol incerta</h3>
<p>Se você só sabe que a vol vai ficar entre \(\sigma_{min}\) e \(\sigma_{max}\), o preço "pior caso" usa \(\sigma_{max}\) onde seu gamma é negativo e \(\sigma_{min}\) onde é positivo (Avellaneda-Levy-Paras; Wilmott, cap. 52). Para uma posição vanilla vendida, isso dá a vol máxima; para carteiras com gamma de sinais mistos, o preço deixa de ser linear: uma opção adicionada pode "hedgear" parte da incerteza de outra. É a justificativa formal para cobrar reserva em livros exóticos.</p>
<h3>4. Saltos</h3>
<p>Num salto, o delta hedge chega tarde: a posição perde (ou ganha) \(V(S+J) - V(S) - \Delta\,J\), que é da ordem de \(\tfrac12\Gamma J^2\) e não se elimina com ação — só com outras opções. O mercado fica incompleto e o preço embute um prêmio de salto (Módulo US, lição de saltos).</p>
<h3>5. Feedback do hedge</h3>
<p>Quando os hedgers são grandes em relação à liquidez, o próprio hedge move o preço. Livro agregado <b>short gamma</b> (dealers vendidos em opções) compra na alta e vende na baixa ⇒ <b>amplifica</b> movimentos. Livro <b>long gamma</b> faz o contrário ⇒ amortece e "prende" o spot perto de strikes grandes (pinning). O crash de 1987 e a "portfolio insurance" são o exemplo histórico (Wilmott, cap. 61; Hull §18.13).</p>`,
  desk: String.raw`"Não dá para hedgear gap", "o hedge não paga o spread", "vol de compra / vol de venda", "reserva de vol incerta", "mercado short gamma: vai esticar". "Gamma trap" = dealers short gamma forçados a perseguir o movimento.`,
  deep: String.raw`<p><b>Número de Leland.</b> Escrevendo \(\check\sigma^2 = \sigma^2(1 - K)\) e \(\hat\sigma^2 = \sigma^2(1 + K)\), com \(K = \frac{2\kappa}{\sigma}\sqrt{\frac{2}{\pi\,\delta t}}\). Se \(K \ge 1\), a EDP da posição comprada deixa de ser bem-posta: os custos superam o ganho de gamma — rebalancear tão frequentemente é irracional. Para carteiras com gamma de sinal variável, Hoggard-Whalley-Wilmott mostram que a equação vira não linear: \(\partial_t V + \tfrac12\sigma^2S^2\partial_{SS}V - \kappa\sigma S^2\sqrt{2/(\pi\delta t)}\,|\partial_{SS}V| + rS\partial_SV - rV = 0\) — o termo em \(|\Gamma|\) é o que faz o preço de uma carteira ≠ soma dos preços.</p>`,
  refs: [R_.wil(46, 'Defects in the Black-Scholes model'), R_.wil(47, 'Discrete hedging'), R_.wil('48.3', 'The model of Leland (1985)'), R_.wil('48.4', 'The model of Hoggard, Whalley & Wilmott'), R_.wil(52, 'Uncertain parameters'), R_.wil(61, 'The feedback effect of hedging in illiquid markets'), R_.der(19, 'defects in the Black-Scholes model'), R_.der(20, 'discrete hedging'), R_.der(21, 'transaction costs'), R_.mfd(16, 'Options with transaction costs'), R_.cqf(3, 'limites do Black-Scholes')],
  sims: ['hedge'],
  ex: [
    { tag: 'defeitos', gen: R => { const s = R.f(0.15, 0.45, 2), k = R.int(5, 20) / 10000, n = R.pick([1, 2, 5]); const dt = n / 252, a = Math.sqrt(s * s - 2 * k * s * Math.sqrt(2 / (Math.PI * dt))) * 100; return { q: `σ = ${Q.fmt(s * 100, 0)}%, custo proporcional κ = ${Q.fmt(k * 10000, 0)} bps e rebalanceamento a cada ${n} dia(s) útil(eis) (δt = ${n}/252). Pelo modelo de Leland, qual a vol (em %) para avaliar a posição COMPRADA na opção?`, a, tol: 0.003, dec: 2, unit: '%', e: `σ̌² = σ² − 2κσ√(2/(πδt)) = ${Q.fmt(s * s, 4)} − ${Q.fmt(2 * k * s * Math.sqrt(2 / (Math.PI * dt)), 5)} ⇒ σ̌ = ${Q.fmt(a, 2)}%.` }; } },
    { tag: 'defeitos', gen: R => { const s = R.f(0.15, 0.45, 2), k = R.int(5, 20) / 10000, n = R.pick([1, 2, 5]); const dt = n / 252, a = Math.sqrt(s * s + 2 * k * s * Math.sqrt(2 / (Math.PI * dt))) * 100; return { q: `Mesmo contexto: σ = ${Q.fmt(s * 100, 0)}%, κ = ${Q.fmt(k * 10000, 0)} bps, rebalanceamento a cada ${n} d.u. Qual a vol de Leland para a posição VENDIDA?`, a, tol: 0.003, dec: 2, unit: '%', e: `σ̂² = σ² + 2κσ√(2/(πδt)) ⇒ σ̂ = ${Q.fmt(a, 2)}%.` }; } },
    { t: 'mcq', q: 'Com custos de transação, passar a rebalancear o hedge com mais frequência:', o: ['Estreita o spread entre vol de compra e de venda', 'Alarga o spread entre vol de compra e de venda, mas reduz o erro de hedge', 'Não muda nada', 'Elimina o risco de salto'], a: 1, e: 'A correção de Leland cresce com 1/√δt; o ruído de hedge cai com √δt.' },
    { tag: 'defeitos', gen: R => { const N = R.pick([21, 63, 126, 252]); const a = Math.sqrt(Math.PI / 4) / Math.sqrt(N) * 100; return { q: `Uma opção ATM será hedgeada ${N} vezes até o vencimento. Pela aproximação de Derman, o desvio-padrão do erro de hedge é quantos % do prêmio?`, a, tol: 0.005, dec: 2, unit: '%', e: `√(π/4)/√N = 0,8862/√${N} = ${Q.fmt(a, 2)}%.` }; } },
    { t: 'mcq', q: 'No modelo de vol incerta (σ entre σmin e σmax), uma posição comprada em straddle (Γ > 0) é avaliada, no pior caso, com:', o: ['σmax', 'σmin', 'A média', 'A vol implícita de mercado'], a: 1, e: 'Pior caso para quem é long gamma: o mercado realizar pouco ⇒ σmin.' },
    { t: 'tf', q: 'Quando o mercado agregado de dealers está short gamma, o hedge deles tende a amplificar os movimentos do spot.', a: true, e: 'Short gamma compra na alta e vende na baixa: realimenta o movimento (feedback).' },
    { t: 'mcq', q: 'Por que o delta hedge não protege contra um gap de −15% na abertura?', o: ['Porque o delta estava errado', 'Porque o ajuste só acontece depois do salto; a perda de convexidade (~½ΓJ²) já ocorreu', 'Porque vega é zero', 'Porque juros mudaram'], a: 1, e: 'Salto ⇒ mercado incompleto: só opções protegem contra gap.' }
  ],
  cards: [['Erro de hedge discreto', 'Desvio ≈ √(π/4)/√N do prêmio (ATM).'], ['Leland', 'σ̌² = σ² − 2κσ√(2/(πδt)) (comprado); σ̂² com + (vendido).'], ['Vol incerta', 'Pior caso: σmax onde Γ < 0, σmin onde Γ > 0.'], ['Feedback do hedge', 'Dealers short gamma amplificam movimentos; long gamma amortecem.']]
}, 'br5-5');

/* ============ BR10-5 — Desastres com derivativos ============ */
Course.addLesson('br10', {
  id: 'br10-5', title: 'Desastres com derivativos: Barings, LTCM, SocGen e os derivativos cambiais de 2008 no Brasil', tag: 'desastres',
  goal: 'Conhecer os casos clássicos de perdas com derivativos, o mecanismo de cada um e as lições de controle de risco que viraram regra nas mesas.',
  body: String.raw`
<p>Hull fecha o OFOD com um capítulo de "mishaps" e Wilmott tem o seu "Derivatives **** Ups". O padrão se repete: <b>alavancagem escondida + controle fraco + um cenário que "não podia acontecer"</b>.</p>
<h3>Barings (1995) — o trader que controlava a própria retaguarda</h3>
<p>Nick Leeson, em Cingapura, acumulou posições não autorizadas em futuros de Nikkei e vendeu straddles (short vol). Escondia as perdas numa conta de erros. O terremoto de Kobe derrubou o Nikkei; a perda (cerca de US$ 1 bilhão) quebrou um banco de 230 anos. <b>Lição</b>: segregar front office e back office; limites que alguém de fora realmente verifica.</p>
<h3>Metallgesellschaft (1993) — hedge certo, liquidez errada</h3>
<p>A empresa vendeu petróleo a preço fixo por até 10 anos e hedgeou com futuros curtos, rolando (<i>stack and roll</i>). Quando o petróleo caiu, os futuros geraram chamadas de margem enormes <i>hoje</i>, enquanto o ganho nos contratos de longo prazo só viria em anos. A diretoria desmontou no pior momento; perdas de US$ 1,33 bilhão. <b>Lição</b>: um hedge pode estar certo economicamente e matar você de liquidez; risco de base e de rolagem.</p>
<h3>Orange County (1994) — apostando que os juros não subiriam</h3>
<p>O tesoureiro do condado alavancou a carteira (recompras reversas e notas estruturadas que ganhavam com juros em queda). O Fed subiu juros em 1994; perda de ~US$ 1,5 bilhão e falência do condado. <b>Lição</b>: entender a sensibilidade (duration, convexidade) do que se compra; cliente inadequado para o produto.</p>
<h3>LTCM (1998) — convergência, alavancagem e liquidez</h3>
<p>O fundo dos prêmios Nobel fazia trades de convergência (spreads que "deveriam" fechar), com alavancagem altíssima. Com o default russo, houve fuga para a qualidade: todos os spreads abriram ao mesmo tempo, as correlações foram para 1, e todos queriam sair dos mesmos trades. Perdas em torno de US$ 4 bilhões; o Fed de Nova York coordenou um resgate por bancos credores. <b>Lição</b>: em crises, correlações sobem e a liquidez some; posição grande demais para o mercado não tem preço de saída; stress test &gt; VaR.</p>
<h3>Société Générale (2008) — operações fictícias</h3>
<p>Jérôme Kerviel acumulou dezenas de bilhões de euros em futuros de índices, escondidos por operações fictícias de compensação que ele cancelava antes das checagens. O desmonte gerou perda de € 4,9 bilhões. <b>Lição</b>: monitorar cancelamentos e operações sem confirmação, férias obrigatórias, reconciliar posições brutas, não só líquidas.</p>
<h3>Brasil, 2008 — Sadia, Aracruz e os "target forwards"</h3>
<p>Exportadoras que deveriam apenas <i>proteger</i> suas receitas em dólar venderam estruturas que ganhavam um pouco se o real continuasse se valorizando e <b>perdiam em dobro</b> se o dólar subisse (termos alavancados/"target forwards": a empresa vendia dólar a um preço melhor que o termo, mas, acima do strike, era obrigada a vender o dobro). Com a crise de setembro–outubro de 2008, o dólar saltou de ~R$ 1,60 para acima de R$ 2,30. A Sadia fechou 2008 com prejuízo de cerca de R$ 2,5 bilhões, puxado pelas perdas cambiais; a Aracruz teve perdas na casa de US$ 2 bilhões. <b>Lição</b>: o payoff alavancado transformou hedge em especulação — a empresa estava, na prática, <b>vendida em vol e em calls de dólar</b>, com nocional maior que a exposição real.</p>
<div class="w" data-w="payoff" data-a='{"title":"Target forward alavancado (visão da exportadora): compra 1 put e vende 2 calls de US$ a 1,75","legs":[{"qty":1,"type":"put","K":1.75,"days":126},{"qty":-2,"type":"call","K":1.75,"days":126}],"S":1.6,"vol":0.15,"r":0.1,"link":false}'></div>
<h3>O que virou regra nas mesas</h3>
<ol><li>Segregação front / middle / back office e confirmação independente de toda operação.</li>
<li>Limites (delta, vega, gamma, stress, perda máxima) monitorados por risco, fora da mesa.</li>
<li>Stress tests com movimentos extremos (±20–30%), não só VaR.</li>
<li>Liquidez: quanto tempo e custo para sair; chamadas de margem no cenário de stress.</li>
<li>Adequação (suitability): o cliente entende o payoff? O nocional casa com a exposição real?</li>
<li>Desconfiar de lucros fáceis e constantes — em geral são venda de opções disfarçada.</li></ol>`,
  desk: String.raw`"Isso é hedge ou é aposta?", "qual o nocional versus a exposição?", "roda o stress de 30%". "Picking up nickels in front of a steamroller" = vender opções fora do dinheiro por pouco prêmio até o dia do trator.`,
  deep: String.raw`<p>O target forward da exportadora se decompõe em vanillas: <b>long 1 put</b> de dólar no strike K (pode vender US$ a K se o dólar cair) e <b>short 2 calls</b> no mesmo K (se o dólar subir, é obrigada a vender o dobro a K). Custo zero na entrada porque as duas calls vendidas pagam a put — a empresa estava vendida em vol e em skew de alta do dólar, exatamente o que explode numa crise cambial. Com N dólares de nocional base, a perda no vencimento é \(2N(S_T - K)\) para \(S_T &gt; K\).</p>`,
  refs: [R_.hull(35, 'Derivatives mishaps and what we can learn from them'), R_.hull('3.6', 'Stack and roll (Metallgesellschaft)'), R_.wil(44, 'Derivatives **** ups'), R_.wil(43, 'CrashMetrics'), R_.ek('11.2', 'Coherent risk measures')],
  ex: [
    { tag: 'desastres', gen: R => { const K = R.pick([1.7, 1.75, 1.8]), S = R.pick([2.1, 2.2, 2.3, 2.4]), N = R.int(5, 40) * 10; const a = 2 * N * (S - K); return { q: `Uma exportadora vendeu um target forward: vende US$ ${N} mi a ${Q.fmt(K, 2)} se o dólar ficar abaixo do strike, mas é obrigada a vender US$ ${2 * N} mi a ${Q.fmt(K, 2)} se ficar acima. No vencimento o dólar está em ${Q.fmt(S, 2)}. Qual a perda (em R$ milhões) contra vender a mercado?`, a, tol: 0.001, tolAbs: 0.01, unit: 'R$ mi', dec: 2, e: `2·N·(S − K) = 2·${N}·(${Q.fmt(S, 2)} − ${Q.fmt(K, 2)}) = ${Q.fmt(a, 2)} mi.` }; } },
    { t: 'mcq', q: 'A principal falha de controle no caso Barings foi:', o: ['Modelo de precificação errado', 'O trader controlava front e back office e escondia perdas numa conta de erros', 'Taxa de juros alta', 'Falta de sistema de cotação'], a: 1, e: 'Sem segregação, ninguém de fora reconciliava as posições.' },
    { t: 'mcq', q: 'O problema central da Metallgesellschaft foi:', o: ['Especulação direcional sem hedge', 'Um hedge com futuros curtos que gerou chamadas de margem enormes antes de os contratos longos compensarem (risco de liquidez e de rolagem)', 'Fraude contábil', 'Risco de crédito de clientes'], a: 1, e: 'Stack and roll: descasamento de fluxo de caixa entre hedge e exposição.' },
    { t: 'mcq', q: 'O que o LTCM mostrou sobre crises?', o: ['Correlações caem', 'Correlações sobem, a liquidez some e posições grandes não têm preço de saída', 'VaR é suficiente', 'Convergência sempre acontece rápido'], a: 1, e: 'Em fuga para a qualidade, todos os spreads abrem juntos.' },
    { t: 'tf', q: 'Kerviel escondia suas posições com operações fictícias de compensação.', a: true, e: 'Por isso hoje se monitoram cancelamentos e operações sem confirmação.' },
    { tag: 'desastres', gen: R => { const n = R.int(50, 500) * 10, mv = R.f(2, 8, 1), px = R.int(3000, 6000) / 100, mult = 100; const a = n * mult * px * mv / 100; return { q: `Uma empresa hedgeia com ${Q.fmt(n, 0)} contratos futuros vendidos (multiplicador ${mult}) de uma commodity a US$ ${Q.fmt(px, 2)}. O preço sobe ${Q.fmt(mv, 1)}% num dia. Quanto de chamada de margem (US$) ela precisa pagar hoje?`, a, tol: 0.001, tolAbs: 1, unit: 'US$', dec: 0, e: `n·mult·preço·Δ% = ${Q.fmt(n, 0)}·${mult}·${Q.fmt(px, 2)}·${Q.fmt(mv / 100, 3)} = ${Q.fmt(a, 0)}. O ganho no contrato físico só vem depois — é o problema de liquidez.` }; } }
  ],
  cards: [['Barings', 'Sem segregação de funções; short straddles + futuros de Nikkei; Kobe.'], ['Metallgesellschaft', 'Hedge com futuros curtos (stack and roll) ⇒ crise de liquidez por margem.'], ['LTCM', 'Convergência alavancada; em crise correlação → 1 e liquidez some.'], ['SocGen', 'Posições escondidas por operações fictícias; € 4,9 bi.'], ['Target forward (2008)', 'Long put + short 2 calls: "hedge" que era venda alavancada de vol.']]
}, 'br10-4');
})();
