/* Módulo Brasil — lições v7: eventos corporativos, árvores (europeias × americanas) e delta hedge passo a passo */
(function () {
const R_ = window.REF;

/* ============ BR2-7 — Eventos corporativos ============ */
Course.addLesson('br2', {
  id: 'br2-7', title: 'Eventos corporativos: dividendos, JCP, desdobramentos, bonificações, subscrições e OPAs', tag: 'eventos',
  goal: 'Saber o que cada evento corporativo faz com o preço da ação, como a B3 ajusta as opções listadas e o que muda no livro e no hedge da mesa.',
  body: String.raw`
<p>A empresa decide algo — pagar dividendos, desdobrar ações, emitir novas — e o preço da ação salta de forma <b>mecânica</b>, sem que o valor da companhia mude. Se as opções não fossem ajustadas, quem tem call ou put ganharia ou perderia só por causa do evento. Entender esses ajustes é rotina de mesa: todo dia alguém pergunta "o strike já foi ajustado?".</p>
<h3>As datas</h3>
<ul><li><b>Data de aprovação (anúncio)</b>: a empresa declara o evento e o valor.</li>
<li><b>Data com</b>: último dia em que quem compra a ação ainda tem direito ao provento.</li>
<li><b>Data ex</b>: primeiro pregão sem o direito; a ação passa a ser negociada "ex". Em teoria, cai o valor do provento na abertura.</li>
<li><b>Pagamento</b>: o dinheiro cai na conta (às vezes meses depois).</li></ul>
<h3>Proventos em dinheiro</h3>
<ul><li><b>Dividendos</b> e <b>juros sobre capital próprio (JCP)</b>. O JCP tem imposto retido na fonte; dividendos têm regras próprias — ambas mudaram recentemente, então confira a legislação vigente.</li>
<li>Na data ex, o preço teórico é \(S_{ex} = S_{com} - D\).</li></ul>
<h3>Eventos em ações</h3>
<ul><li><b>Desdobramento (split)</b>: 1 ação vira N; o preço se divide por N. <b>Grupamento (inplit)</b>: N ações viram 1; o preço se multiplica por N.</li>
<li><b>Bonificação</b>: a empresa distribui ações novas (ex.: 10% — 1 ação para cada 10); o preço teórico se divide por 1,10.</li>
<li><b>Subscrição</b>: direito de comprar ações novas a um preço fixo; o direito tem valor (e é negociado separadamente).</li>
<li><b>Cisão (spin-off), incorporação, OPA</b> (oferta pública de aquisição): eventos "complexos", tratados caso a caso.</li></ul>
<h3>Como a B3 ajusta as opções listadas</h3>
<p>A regra geral é deixar o titular da opção <b>neutro</b> ao evento:</p>
\[ K_{aj} = K - D \quad\text{(proventos em dinheiro)}, \qquad K_{aj} = \frac{K}{f}, \quad Q_{aj} = Q \times f \quad\text{(eventos em ações)} \]
<p>O fator \(f\) é 2 num desdobramento 1:2, 0,1 num grupamento 10:1, 1,10 numa bonificação de 10%. O strike é arredondado em 2 casas. No caderno de fórmulas da B3, o JCP e os rendimentos entram <b>líquidos</b> do imposto retido, e a subscrição reduz o strike pelo valor teórico do direito. Resultado: o valor intrínseco da opção quase não muda (veja a calculadora abaixo).</p>
<div class="w" data-w="corpevent"></div>
<h3>Consequências para o trader</h3>
<ul><li><b>Precificação</b>: como o strike é ajustado pelos proventos, as opções de ações da B3 são praticamente <b>protegidas contra dividendos</b> — por isso as mesas costumam usar \(q \approx 0\) no Black-Scholes delas. O mesmo não vale para <b>futuros e termos</b> (o preço justo desconta os dividendos esperados, lição 1.7) nem, em geral, para <b>opções de índice</b>.</li>
<li><b>EUA</b>: opções listadas <b>não</b> são ajustadas por dividendos ordinários (só por dividendos especiais relevantes). Lá, o dividendo esperado entra no preço (forward menor) e cria o incentivo de exercer calls americanas na véspera da data ex (lição US1-3).</li>
<li><b>Hedge na data ex</b>: a ação do seu hedge cai \(D\), mas você recebe o dividendo (se comprado) ou paga o reembolso ao doador (se vendido via BTC). Com a opção ajustada, o livro fica neutro — <b>se</b> tudo foi lançado certo. Esquecer o provento a receber/pagar é um erro clássico de PnL.</li>
<li><b>Balcão e estruturados</b>: o term sheet define se há proteção a dividendos. Se não houver, o preço embute os dividendos esperados e a mesa carrega <b>risco de dividendos</b>.</li>
<li><b>OPA e M&amp;A</b>: a vol implícita desaba quando o preço fica "preso" ao valor da oferta; a opção pode ser liquidada pelo valor da oferta. O risco é o negócio não sair (salto).</li></ul>`,
  desk: String.raw`"Ficou ex hoje", "o strike já veio ajustado?", "data com é amanhã", "o JCP ajusta pelo líquido", "série ajustada (strike quebrado)", "o papel desdobrou, dobrou a quantidade de opções", "dividend protected".`,
  deep: String.raw`<p>O caderno de fórmulas da B3 combina os eventos numa só fórmula: o novo strike é \(\big[K + S\cdot Z - D - J - \text{Rend} - \dots\big]/(1 + B + S)\), onde \(B\) é a proporção de bonificação, \(S\) a proporção de subscrição a preço \(Z\), \(D\) dividendos, \(J\) JCP líquido e Rend rendimentos líquidos. É a mesma ideia de preço teórico ex: o que o acionista recebe (ou paga) por ação sai do strike, e o que multiplica o número de ações divide o strike. Wilmott (PWOQF cap. 8 e 64) discute o comportamento do valor da opção no salto da data ex quando <i>não</i> há ajuste: \(V(S, t_{ex}^-) = V(S - D, t_{ex}^+)\).</p>`,
  refs: [R_.hull('9.4', 'Specification of stock options (dividends and stock splits)'), R_.hull('10.7', 'Effect of dividends'), R_.hull('14.12', 'Dividends'), R_.wil('8.3', 'Dividend structures'), R_.wil('8.5', 'The behavior of an option value across a dividend date'), R_.wil(64, 'Advanced dividend modeling'), R_.car('eventos corporativos e ajustes no mercado brasileiro')],
  ex: [
    { tag: 'eventos', gen: R => { const S = R.f(20, 60, 2), D = R.f(0.3, 2.5, 2); const a = S - D; return { q: `Uma ação fechou a R$ ${Q.fmt(S, 2)} na data com e paga dividendo de R$ ${Q.fmt(D, 2)} por ação. Qual o preço teórico de abertura na data ex?`, a, tol: 0.001, tolAbs: 0.005, unit: 'R$', dec: 2, e: `S_ex = S_com − D = ${Q.fmt(S, 2)} − ${Q.fmt(D, 2)} = ${Q.fmt(a, 2)}.` }; } },
    { tag: 'eventos', gen: R => { const K = R.int(20, 60) + R.pick([0, 0.5]), D = R.f(0.3, 2.5, 2); const a = K - D; return { q: `Você tem calls de strike R$ ${Q.fmt(K, 2)}. A empresa paga dividendo de R$ ${Q.fmt(D, 2)} por ação. Pela regra de ajuste por proventos em dinheiro, qual o novo strike?`, a, tol: 0.001, tolAbs: 0.005, unit: 'R$', dec: 2, e: `K_aj = K − D = ${Q.fmt(K, 2)} − ${Q.fmt(D, 2)} = ${Q.fmt(a, 2)}.` }; } },
    { tag: 'eventos', gen: R => { const K = R.int(20, 90), q = R.int(1, 20) * 1000, N = R.pick([2, 3, 4, 5]), ask = R.u() < 0.5; const a = ask ? K / N : q * N; return { q: `Desdobramento de 1 para ${N}. Você tem ${Q.fmt(q, 0)} opções com strike R$ ${Q.fmt(K, 2)}. ${ask ? 'Qual o novo strike?' : 'Qual a nova quantidade de opções?'}`, a, tol: 0.001, tolAbs: 0.005, unit: ask ? 'R$' : 'opções', dec: ask ? 2 : 0, e: `Fator = ${N}: strike ÷ ${N} = ${Q.fmt(K / N, 2)}; quantidade × ${N} = ${Q.fmt(q * N, 0)}.` }; } },
    { tag: 'eventos', gen: R => { const K = R.f(1, 6, 2), N = R.pick([10, 20, 50]); const a = K * N; return { q: `Grupamento de ${N} ações em 1. Uma opção tinha strike R$ ${Q.fmt(K, 2)}. Qual o novo strike?`, a, tol: 0.001, tolAbs: 0.01, unit: 'R$', dec: 2, e: `Fator = 1/${N}: K ÷ (1/${N}) = K × ${N} = ${Q.fmt(a, 2)}.` }; } },
    { tag: 'eventos', gen: R => { const K = R.int(20, 60), b = R.pick([5, 10, 20, 25]); const a = K / (1 + b / 100); return { q: `A empresa aprova bonificação de ${b}% em ações. Qual o strike ajustado de uma opção com strike R$ ${Q.fmt(K, 2)}?`, a, tol: 0.001, tolAbs: 0.006, unit: 'R$', dec: 2, e: `Fator = 1 + ${b}% = ${Q.fmt(1 + b / 100, 2)} ⇒ K_aj = ${K}/${Q.fmt(1 + b / 100, 2)} = ${Q.fmt(a, 2)}.` }; } },
    { tag: 'eventos', gen: R => { const K = R.int(20, 60), J = R.f(0.4, 2, 2); const a = K - J * 0.85; return { q: `JCP bruto de R$ ${Q.fmt(J, 2)} por ação. Supondo imposto retido de 15% e ajuste do strike pelo valor líquido, qual o novo strike de uma opção de strike R$ ${K}?`, a, tol: 0.001, tolAbs: 0.006, unit: 'R$', dec: 2, e: `JCP líquido = ${Q.fmt(J, 2)} × 0,85 = ${Q.fmt(J * 0.85, 3)} ⇒ K_aj = ${K} − ${Q.fmt(J * 0.85, 3)} = ${Q.fmt(a, 2)}.` }; } },
    { t: 'mcq', q: 'Por que as mesas costumam usar dividend yield q ≈ 0 no Black-Scholes das opções de ações listadas na B3?', o: ['Porque empresas brasileiras não pagam dividendos', 'Porque o strike é ajustado pelos proventos em dinheiro, então o titular fica protegido contra o dividendo', 'Porque a B3 proíbe dividendos', 'Porque q só vale para índices'], a: 1, e: 'O ajuste de strike neutraliza o efeito do dividendo na opção.' },
    { t: 'mcq', q: 'Nos EUA, uma call americana listada deep ITM, com dividendo ordinário grande amanhã (data ex) e sem ajuste de strike. O risco para quem está vendido nela é:', o: ['Nenhum', 'Ser exercido hoje (assignment) e ficar sem as ações que dariam direito ao dividendo', 'O strike cair', 'A vol subir'], a: 1, e: 'Sem ajuste, o titular exerce na véspera para capturar o dividendo.' }
  ],
  cards: [['Data com / data ex', 'Com = último dia com direito; ex = ação negociada sem o provento, cai ~D.'], ['Ajuste por dividendo (B3)', 'K_aj = K − D (JCP pelo líquido do IR).'], ['Ajuste por evento em ações', 'K_aj = K/f; Q_aj = Q·f (split f = N, grupamento f = 1/N, bonificação f = 1 + b).'], ['Dividend protected', 'Opção ajustada pelos proventos: q ≈ 0 no modelo.'], ['EUA', 'Opções listadas não ajustam dividendos ordinários: dividendo entra no forward e cria exercício antecipado de calls.']]
}, 'br2-6');

/* ============ BR3-8 — Árvores na prática ============ */
Course.addLesson('br3', {
  id: 'br3-8', title: 'Árvores na prática: europeias × americanas, fronteira de exercício e dividendos', tag: 'arvores',
  goal: 'Construir e ler uma árvore binomial nó a nó, comparar europeias e americanas, encontrar a fronteira de exercício antecipado e saber como a árvore lida com dividendos e convergência.',
  body: String.raw`
<p>As lições 3.1 e 3.2 montaram a árvore. Aqui você vai <b>operar</b> uma: mexer nos parâmetros, ver cada nó e entender onde a americana se afasta da europeia.</p>
<h3>Europeia × americana em uma frase</h3>
<p>A <b>europeia</b> só pode ser exercida no vencimento: o valor em cada nó é a média neutra a risco descontada dos filhos. A <b>americana</b> pode ser exercida em qualquer nó: o valor é o maior entre exercer agora e continuar:</p>
\[ V_{ij} = \max\Big(\text{payoff}(S_{ij}),\; e^{-r\Delta t}\big[p^* V_{i+1,j+1} + (1-p^*)V_{i+1,j}\big]\Big) \]
<div class="w" data-w="treeviz" data-a='{"type":"put"}'></div>
<h3>O que o widget mostra</h3>
<ul><li><b>Nós em destaque</b>: onde exercer a put americana é ótimo — sempre na parte de baixo da árvore (spot baixo, put muito dentro do dinheiro) e mais cedo quanto maiores os juros.</li>
<li><b>Fronteira de exercício \(S^*(t)\)</b>: abaixo dela, exerça; acima, espere. Ela sobe em direção a \(K\) conforme o vencimento chega. É a mesma "fronteira livre" da EDP da americana (Wilmott, Howison &amp; Dewynne, cap. 7).</li>
<li><b>Call sem dividendos</b>: americana = europeia em todos os nós (nunca vale exercer antes).</li>
<li><b>Convergência</b>: com mais passos, a europeia converge para o Black-Scholes em zigue-zague (N par × ímpar). Truques: média de N e N+1, ou usar a fórmula BS no último passo.</li></ul>
<h3>Relações que valem sempre</h3>
<p>Sem dividendos: \(C_{am} = C_{eu}\) e \(P_{am} \ge P_{eu}\). A paridade put-call exata só vale para europeias; para americanas vira um intervalo:</p>
\[ S - K \;\le\; C_{am} - P_{am} \;\le\; S - K e^{-rT} \]
<h3>Dividendos na árvore</h3>
<ul><li><b>Dividend yield contínuo</b> (índices, moedas): basta usar \(p^* = (e^{(r-q)\Delta t} - d)/(u-d)\).</li>
<li><b>Dividendo discreto em reais</b>: subtrair \(D\) dos nós quebra a recombinação (a árvore "explode"). A saída clássica (Hull §20.3): monte a árvore sobre \(S^* = S - \text{VP(dividendos)}\) e some o VP dos dividendos de volta a cada nó antes do vencimento.</li>
<li>É nos nós logo antes da data ex que a <b>call americana</b> pode ser exercida (sem ajuste de strike, como nos EUA).</li></ul>
<h3>Além da binomial</h3>
<p>Árvores <b>trinomiais</b> (sobe, fica, desce) convergem mais suavemente e são equivalentes a um esquema explícito de diferenças finitas; para barreiras, alinhe os nós com a barreira. Para vários ativos ou dependência de caminho forte, a árvore cresce demais e o Monte Carlo assume (lição US6-5).</p>`,
  desk: String.raw`"Rodei numa árvore de 500 passos", "o prêmio americano está em 3 centavos", "fronteira de exercício", "essa put já é exercício ótimo", "a árvore não recombina com dividendo discreto".`,
  deep: String.raw`<p>No tempo discreto, o valor da americana é o <b>envelope de Snell</b> do payoff descontado: o menor supermartingal (sob Q) que domina o payoff. A regra ótima é parar na primeira vez que o valor encontra o payoff (Elliott &amp; Kopp, cap. 5). No contínuo, o problema vira uma EDP com restrição \(V \ge\) payoff e condições de continuidade de \(V\) e \(\partial V/\partial S\) na fronteira ("smooth pasting"); para a put perpétua, \(S^* = \frac{2r}{2r + \sigma^2}K\) (Wilmott, PWOQF §9.2).</p>`,
  refs: [R_.hull('12.5', 'American options'), R_.hull('20.1', 'Binomial trees'), R_.hull('20.3', 'Binomial model for a dividend-paying stock'), R_.hull('10.4', 'Put–call parity (American options)'), R_.wil(15, 'The binomial model'), R_.wil(9, 'Early exercise and American options'), R_.mfd(10, 'Binomial methods'), R_.mfd(7, 'American options'), R_.ek(5, 'Discrete-time American options'), R_.der(12, 'the binomial model')],
  sims: ['bs'],
  ex: [
    { tag: 'arvores', gen: R => { const S = 100, K = R.pick([95, 100, 105]), s = R.f(0.2, 0.4, 2), r = R.f(0.05, 0.14, 2), T = R.pick([0.5, 1]); const b = Q.binomial('put', S, K, T, r, 0, s, 2, true), e = Q.binomial('put', S, K, T, r, 0, s, 2, false); return { q: `Árvore CRR de 2 passos: S = 100, K = ${K}, σ = ${Q.fmt(s * 100, 0)}%, r = ${Q.fmt(r * 100, 0)}% contínuo, T = ${Q.fmt(T, 1)} ano. Qual o preço da put AMERICANA? (Use o widget para conferir nó a nó.)`, a: b.price, tol: 0.003, dec: 4, unit: 'R$', e: `u = ${Q.fmt(b.u, 4)}, d = ${Q.fmt(b.d, 4)}, p* = ${Q.fmt(b.p, 4)}. Americana = ${Q.fmt(b.price, 4)} (europeia = ${Q.fmt(e.price, 4)}; prêmio de exercício antecipado = ${Q.fmt(b.price - e.price, 4)}).` }; } },
    { tag: 'arvores', gen: R => { const S = 100, K = R.pick([100, 105, 110]), s = R.f(0.2, 0.4, 2), r = R.f(0.08, 0.15, 2), T = 1, N = R.pick([3, 4]); const b = Q.binomial('put', S, K, T, r, 0, s, N, true), e = Q.binomial('put', S, K, T, r, 0, s, N, false); const a = b.price - e.price; return { q: `Árvore CRR de ${N} passos, put com S = 100, K = ${K}, σ = ${Q.fmt(s * 100, 0)}%, r = ${Q.fmt(r * 100, 0)}%, T = 1. Qual o prêmio de exercício antecipado (americana − europeia)?`, a, tol: 0.01, tolAbs: 0.0006, dec: 4, unit: 'R$', e: `Americana ${Q.fmt(b.price, 4)} − europeia ${Q.fmt(e.price, 4)} = ${Q.fmt(a, 4)}.` }; } },
    { tag: 'arvores', gen: R => { const S = R.f(30, 60, 2), K = R.int(30, 60), r = R.f(0.08, 0.14, 2), T = R.pick([0.25, 0.5, 1]); const a = S - K * Math.exp(-r * T); return { q: `Sem dividendos, S = ${Q.fmt(S, 2)}, K = ${K}, r = ${Q.fmt(r * 100, 0)}%, T = ${Q.fmt(T, 2)}. Qual o limite SUPERIOR de C_am − P_am?`, a, tol: 0.001, tolAbs: 0.005, dec: 3, unit: 'R$', e: `C − P ≤ S − K·e^{−rT} = ${Q.fmt(S, 2)} − ${Q.fmt(K * Math.exp(-r * T), 3)} = ${Q.fmt(a, 3)} (o limite inferior é S − K = ${Q.fmt(S - K, 2)}).` }; } },
    { t: 'mcq', q: 'Na put americana, a fronteira de exercício S*(t):', o: ['Fica acima do strike', 'Fica abaixo do strike e sobe em direção a K conforme o vencimento se aproxima', 'É igual ao spot', 'Não existe'], a: 1, e: 'Perto do vencimento quase não há valor de espera: basta estar um pouco ITM para exercer.' },
    { t: 'tf', q: 'Sem dividendos, uma call americana vale exatamente o mesmo que a europeia correspondente.', a: true, e: 'Exercer cedo joga fora valor extrínseco e antecipa o pagamento do strike.' },
    { t: 'mcq', q: 'Por que subtrair um dividendo discreto em reais em cada nó é um problema na árvore binomial?', o: ['Porque dividendos não existem em árvores', 'Porque os nós deixam de recombinar e o número de nós explode', 'Porque p* fica negativo', 'Porque a árvore vira trinomial'], a: 1, e: 'Solução: árvore sobre S − VP(dividendos) (Hull §20.3).' },
    { t: 'mcq', q: 'Aumentar os juros, mantendo o resto, faz a fronteira de exercício da put americana:', o: ['Descer (exercer menos)', 'Subir (exercer mais cedo)', 'Não mudar', 'Sumir'], a: 1, e: 'Com juros maiores, receber K antes vale mais: o exercício fica atraente mais cedo.' }
  ],
  cards: [['Nó da americana', 'V = max(payoff, e^{−rΔt}[p*Vu + (1−p*)Vd]).'], ['Prêmio de exercício antecipado', 'Americana − europeia; zero para calls sem dividendos.'], ['Paridade americana', 'S − K ≤ C − P ≤ S − Ke^{−rT}.'], ['Fronteira de exercício', 'Put: abaixo de S*(t), exerça; S*(t) → K no vencimento.'], ['Dividendo discreto', 'Árvore sobre S − VP(div) para manter a recombinação.']]
}, 'br3-7');

/* ============ BR4-6 — Delta hedge passo a passo e PnL ============ */
Course.addLesson('br4', {
  id: 'br4-6', title: 'Delta hedge passo a passo: a planilha do hedge e o PnL dia a dia', tag: 'deltapnl',
  goal: 'Executar mentalmente (e na planilha) o ciclo diário do delta hedge e decompor o PnL do dia em opção, ações, juros e na aproximação gamma-theta.',
  body: String.raw`
<p>Você vendeu 1.000 calls. A partir daí, todo dia a mesa faz o mesmo ciclo — e o PnL que aparece no fechamento sai inteiro dele.</p>
<h3>O ciclo diário</h3>
<ol><li><b>Marcar</b> a opção no fechamento (preço do modelo com a vol de mercado).</li>
<li><b>Calcular o delta novo</b> da posição: \(q\,\Delta_t\) (ações equivalentes).</li>
<li><b>Rebalancear</b>: negociar ações para que o hedge seja \(-q\,\Delta_t\). Quantidade a negociar = \(-q(\Delta_t - \Delta_{t-1})\).</li>
<li><b>Carregar o caixa</b>: prêmio recebido, compras e vendas de ações — tudo rende (ou custa) juros.</li>
<li><b>Apurar o PnL</b>: variação da opção + variação das ações + juros (+ custos, aluguel, dividendos).</li></ol>
\[ \text{PnL}_t = q\,(V_t - V_{t-1}) \;-\; q\,\Delta_{t-1}\,(S_t - S_{t-1}) \;+\; \text{juros do caixa} \]
<h3>Por que o PnL do dia é "gamma contra theta"</h3>
<p>Pela equação de Black-Scholes, a parte de delta cancela com o hedge e a parte de juros cancela com o carry. O que sobra, para um dia com retorno \(\delta S/S\):</p>
\[ \text{PnL}_t \approx q\cdot\tfrac12\,\Gamma\,S^2\left[\Big(\frac{\delta S}{S}\Big)^2 - \sigma_i^2\,\delta t\right] \]
<ul><li>O dia "empata" quando \(|\delta S/S| = \sigma_i\sqrt{\delta t} \approx \sigma_i/16\): o <b>move de breakeven</b> (lição 4.3).</li>
<li>Vendido em opções (\(q&lt;0\)): dias calmos rendem, dias de movimento grande custam — em qualquer direção.</li>
<li>Somando até o vencimento, o resultado se aproxima de \(q\,\mathcal{V}\,(\sigma_r - \sigma_i)\) (lição 5.3), mas depende do caminho: o gamma que você tinha no dia em que o mercado andou.</li></ul>
<div class="w" data-w="hedgeledger"></div>
<h3>Como ler a planilha</h3>
<ul><li><b>PnL opções</b> e <b>PnL ações</b> são grandes e de sinais opostos — o hedge funcionando. O que importa é a soma.</li>
<li><b>Juros do caixa</b>: vendido em calls com hedge comprado, você carrega um caixa negativo (as ações custam mais que o prêmio): pagar juros é parte do theta.</li>
<li><b>≈ Γ-Θ</b>: a aproximação do dia. A diferença para o PnL real vem de gamma mudando dentro do dia e de termos de ordem maior — fica grande perto do vencimento com o spot no strike.</li>
<li><b>No vencimento</b>: a opção liquida pelo payoff e o hedge é desmontado; o acumulado é o resultado do trade de vol.</li></ul>
<h3>Erros clássicos no hedge</h3>
<ul><li><b>Unidades</b>: delta em ações × delta em contratos (opções de ações na B3 são cotadas por ação, em lotes; IND = R$ 1 por ponto; WIN = R$ 0,20 por ponto; DOL = US$ 50 mil por contrato).</li>
<li><b>Preço velho</b>: calcular o delta com o spot ou a vol da manhã.</li>
<li><b>Esquecer eventos</b>: data ex, ajuste de strike, reembolso de dividendos no BTC (lição 2.7).</li>
<li><b>Delta de modelo errado</b>: com smile, o delta Black-Scholes não é o delta "verdadeiro" (shadow delta, Módulo US).</li>
<li><b>Hedge de índice com ações</b> (ou o contrário) sem ajustar beta.</li></ul>`,
  desk: String.raw`"Rebalanceei no fechamento", "comprei 3.200 de hedge", "o PnL veio de gamma", "pagando theta", "o hedge está atrasado", "carregando caixa negativo", "ajustei o delta pelo beta".`,
  deep: String.raw`<p>Com \(\Pi = qV - q\Delta S\) e caixa \(B = -qV + q\Delta S\) rendendo \(r\): \(d(\text{PnL}) = q\,dV - q\Delta\,dS + rB\,dt\). Por Itô, \(dV = \Theta dt + \Delta dS + \tfrac12\Gamma (dS)^2\), e pela EDP de BS, \(\Theta + \tfrac12\sigma_i^2S^2\Gamma = r(V - \Delta S)\). Substituindo: \(d(\text{PnL}) = q\cdot\tfrac12\Gamma\big[(dS)^2 - \sigma_i^2S^2dt\big]\). Com \((dS)^2 = \sigma_r^2S^2dt\) em tempo contínuo, obtém-se \(\tfrac12 q\Gamma S^2(\sigma_r^2 - \sigma_i^2)dt\) — a fórmula da lição 5.3 (Wilmott, PWOQF cap. 12; hedge discreto no cap. 47).</p>`,
  refs: [R_.hull('18.4', 'Delta hedging'), R_.hull('18.7', 'Relationship between delta, theta, and gamma'), R_.hull('18.10', 'The realities of hedging'), R_.wil(12, 'How to delta hedge'), R_.wil(47, 'Discrete hedging'), R_.der(20, 'discrete hedging'), R_.cqf(3, 'delta hedging')],
  sims: ['hedge'],
  ex: [
    { tag: 'deltapnl', gen: R => { const q = -R.int(5, 50) * 1000, d0 = R.f(0.3, 0.7, 3), d1 = Math.min(0.99, Math.max(0.01, d0 + R.f(-0.12, 0.12, 3))); const a = -q * (d1 - d0); return { q: `Você está ${q < 0 ? 'vendido' : 'comprado'} em ${Q.fmt(Math.abs(q), 0)} calls. O delta foi de ${Q.fmt(d0, 3)} para ${Q.fmt(d1, 3)}. Quantas ações você negocia no rebalanceamento? (+ compra, − venda)`, a, tol: 0.001, tolAbs: 1, unit: 'ações', dec: 0, e: `Negociar = −q·(Δ_novo − Δ_velho) = ${Q.fmt(-q, 0)} × (${Q.fmt(d1, 3)} − ${Q.fmt(d0, 3)}) = ${Q.fmt(a, 0)}.` }; } },
    { tag: 'deltapnl', gen: R => { const q = R.pick([-1, 1]) * R.int(5, 50) * 1000, G = R.f(0.02, 0.08, 3), S = R.f(30, 60, 1), si = R.f(0.2, 0.45, 2), mv = R.f(-4, 4, 1); const a = q * 0.5 * G * S * S * (Math.pow(mv / 100, 2) - si * si / 252); return { q: `Posição de ${Q.fmt(q, 0)} opções (negativo = vendido), Γ = ${Q.fmt(G, 3)} por opção, S = ${Q.fmt(S, 1)}, vol implícita ${Q.fmt(si * 100, 0)}%. Delta-hedgeado, o ativo anda ${Q.fmt(mv, 1)}% no dia. PnL aproximado (gamma-theta)?`, a, tol: 0.01, tolAbs: 1, unit: 'R$', dec: 0, e: `q·½ΓS²[(δS/S)² − σ²/252] = ${Q.fmt(q, 0)}·0,5·${Q.fmt(G, 3)}·${Q.fmt(S * S, 1)}·[${Q.fmt(Math.pow(mv / 100, 2), 6)} − ${Q.fmt(si * si / 252, 6)}] = ${Q.fmt(a, 0)}.` }; } },
    { tag: 'deltapnl', gen: R => { const S = R.f(20, 80, 2), si = R.f(0.15, 0.6, 2); const a = S * si / Math.sqrt(252); return { q: `Ação a R$ ${Q.fmt(S, 2)}, vol implícita de ${Q.fmt(si * 100, 0)}%. Qual o movimento diário (em R$) que empata gamma e theta de uma posição delta-hedgeada?`, a, tol: 0.005, unit: 'R$', dec: 3, e: `S·σ/√252 = ${Q.fmt(S, 2)} × ${Q.fmt(si, 2)} / 15,87 = ${Q.fmt(a, 3)}.` }; } },
    { tag: 'deltapnl', gen: R => { const n = R.int(5, 50) * 1000, d = R.f(0.3, 0.7, 2), S0 = R.f(30, 60, 2), S1 = S0 * (1 + R.f(-3, 3, 1) / 100); const sh = n * d; const a = sh * (S1 - S0); return { q: `Vendido em ${Q.fmt(n, 0)} calls com delta ${Q.fmt(d, 2)}, você está comprado em ${Q.fmt(sh, 0)} ações de hedge. O spot vai de ${Q.fmt(S0, 2)} para ${Q.fmt(S1, 2)}. Qual o PnL só da perna de ações?`, a, tol: 0.002, tolAbs: 1, unit: 'R$', dec: 0, e: `${Q.fmt(sh, 0)} × (${Q.fmt(S1, 2)} − ${Q.fmt(S0, 2)}) = ${Q.fmt(a, 0)}. A opção vendida anda no sentido contrário: o que sobra é gamma − theta.` }; } },
    { t: 'mcq', q: 'Vendido em opções e delta-hedgeado, o mercado cai 5% num dia (muito acima do breakeven). O resultado do dia tende a ser:', o: ['Lucro, porque a queda favorece quem vendeu calls', 'Prejuízo, porque short gamma perde com movimentos grandes em qualquer direção', 'Zero, porque está hedgeado', 'Depende só do theta'], a: 1, e: 'Hedge de delta não protege de gamma: ½ΓS²(δS/S)² supera o theta recebido.' },
    { t: 'mcq', q: 'Na planilha do hedge, as colunas "PnL opções" e "PnL ações" costumam ser:', o: ['Pequenas e do mesmo sinal', 'Grandes e de sinais opostos; a soma é o que importa', 'Sempre iguais a zero', 'Sempre positivas'], a: 1, e: 'É o hedge funcionando: o resíduo é gamma, theta e juros.' },
    { t: 'tf', q: 'Vendido em calls e comprado em ações de hedge, o caixa da estratégia costuma ficar negativo e o custo desses juros faz parte do resultado.', a: true, e: 'As ações custam mais que o prêmio recebido; o financiamento entra no PnL (e no theta).' }
  ],
  cards: [['Ciclo do hedge', 'Marca → novo delta → rebalanceia → carrega o caixa → apura o PnL.'], ['Ações a negociar', '−q·(Δ_novo − Δ_velho).'], ['PnL diário (aprox.)', 'q·½ΓS²[(δS/S)² − σᵢ²δt].'], ['Breakeven diário', '|δS/S| = σᵢ/√252 ≈ σᵢ/16.'], ['Resultado até o vencimento', '≈ q·𝒱·(σ_real − σ_impl), dependente do caminho.']]
}, 'br4-5');
})();
