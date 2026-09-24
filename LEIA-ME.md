# EqD Trading Academy

Plataforma de estudo gamificada de **Equity Derivatives Trading**, do zero ao nível de mesa, com dois grandes módulos (Brasil e US). Versão 7.

## Como rodar

1. Tenha o **Python 3.8+** instalado (https://www.python.org/downloads/ — marque "Add python.exe to PATH").
2. Dê dois cliques em **`INICIAR.bat`**.
3. O navegador abre em `http://localhost:8765`. Deixe a janela preta aberta enquanto estuda (fechar a janela encerra o servidor).

Não há nada para instalar via pip: o servidor usa só a biblioteca padrão do Python, e o app funciona 100% offline.

## Livros (pasta `Books`)

Deixe os PDFs na pasta **`Books`**, ao lado do `server.py`. Cada referência de leitura nas lições vira um link que abre o PDF **direto na página do capítulo/seção**. A tela **Biblioteca** lista todos os capítulos que o curso usa, livro por livro, com as lições que os citam; marque o que leu (+20 XP por capítulo, com conquistas de leitura).

Livros reconhecidos (pelo nome do arquivo): Hull, *Options, Futures, and Other Derivatives* (8ª ed.); Wilmott, *Paul Wilmott on Quantitative Finance* (2ª ed.); Wilmott, *Derivatives*; Wilmott, Howison & Dewynne, *The Mathematics of Financial Derivatives*; Elliott & Kopp, *Mathematics of Financial Markets*; Focardi & Fabozzi, *The Mathematics of Financial Modeling and Investment Management*. Se você adicionar *Brazilian Derivatives and Securities* (Carreira & Brostowicz) com esse nome no arquivo, os links dele passam a funcionar também. O mesmo vale para material do **CQF** (PDF com "CQF" no nome): a Biblioteca tem uma trilha que mapeia cada módulo do CQF às lições do app.

## Mesa: Head Trader

No menu **Prática → Mesa: Head Trader** você comanda uma mesa num mercado fictício que não para: duas ações e um ETF de índice correlacionados, vol que sobe quando o mercado cai, notícias que geram saltos e clientes pedindo preço (RFQ), com datas ex de dividendos que ajustam os strikes do seu livro. Você tem boleta (ação/ETF, calls e puts em três vencimentos que rolam), livro com posições e **gregas agrupadas** por ativo e por vencimento, stress (spot × vol), blotter de negócios, limites de risco e, no fechamento, **PnL explain** (delta, gamma, vega, theta, negócios), liquidação dos vencimentos, nota do dia e XP. O livro fica salvo junto com o seu progresso.

## Onde fica o progresso

- `data/progress.db` (SQLite), ao lado do app, com cópia no navegador.
- O servidor faz um backup automático por hora (mantém os últimos 30), que dá para restaurar em **Configurações**.
- Em Configurações também dá para exportar/importar o progresso em JSON (útil para mudar de computador).

## O que tem

- **Módulo Brasil (10 unidades, 56 lições)**: onde se negocia (bolsa, balcão, OTC), aluguel de ações (BTC), delta one (cash & carry, arbitragem de índice, ETFs, swaps), juros DI/252, opções na B3, vanillas × opções flexíveis, **eventos corporativos** (dividendos, JCP, desdobramentos, bonificações, ajuste de strike), **leitura de tela** (book, grade de opções, times & trades, open interest), binomial, **árvores na prática** (europeias × americanas, fronteira de exercício, dividendos), medida neutra a risco, Black-Scholes, **gráficos da mesa** (candles, vol realizada × implícita, cone de vol, IV rank), gregas, **delta hedge passo a passo** (planilha do hedge e PnL diário), "comprar vega / vender gamma", defeitos do BS, **bid/offer e execução**, estruturas, digitais e barreiras, DI1/dólar/cupom, COE, risco/PnL/margem/IR, desastres com derivativos e **remuneração eficiente do portfólio** (caixa, garantias, aluguel, carry).
- **Módulo US (6 unidades, 28 lições)**: mercado listado (SPX/SPY, americanas, 0DTE), superfície de vol, saltos e caudas gordas, variance swaps/VIX/dispersão, reverse convertibles, autocallables e leitura de term sheets, market making e pin risk, gestão de livro, PnL explain, métodos numéricos e **risco e retorno** (fronteira eficiente, Sharpe, Kelly — trilha CQF).
- **84 lições** com blocos "Na mesa", "Aprofundar" (matemática opcional), botão **i** em cada fórmula (legenda de cada símbolo, onde conseguir o dado e "montar na planilha"), **planilha** e **caderno de notas** por lição.
- **404 exercícios** (a maioria numérica, com parâmetros aleatórios e correção com explicação), **19 missões "Dia na mesa"**, **provas por unidade**, **288 flashcards** com repetição espaçada e glossário de mesa com ~190 termos.
- **8 simuladores** (Laboratório Black-Scholes, Construtor de Estruturas, Delta Hedge & PnL com jogo, Barreiras, Livro de Risco, Smile & Superfície, Calculadora Brasil e **Tela de Opções** — tela de mesa simulada com o jogo "Caça na tela") e **widgets interativos** dentro das lições (medida P × Q, Leland, gamma × vega, smile de Merton, Monte Carlo, diferenças finitas, candles e vol realizada × implícita, cone de vol, bid/offer, carry do livro, fronteira eficiente, árvore binomial visual, planilha de delta hedge e calculadora de eventos corporativos).
- **Gamificação**: XP e níveis (Estagiário → Lenda do Pit), combos e acertos críticos, estrelas por lição, quests diárias com baú, 43 conquistas, streak, meta diária, e a **Mesa: Head Trader** (simulador de livro completo).

## Dicas

- Respostas numéricas aceitam vírgula ou ponto (`0,25`, `0.25`, `1.500` e `1500`).
- Quer pular a progressão? Ative o **modo livre** em Configurações.
- Porta ocupada? Rode `INICIAR.bat --port 9000`.
- Regras de tributação e de produtos de balcão mudam com o tempo: confira a regulamentação vigente (B3, CVM, Receita).
