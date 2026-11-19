# Atlas Estatístico das Loterias Caixa (Mega-Sena, Lotofácil, Quina e Lotomania)

Aplicação web sem dependências externas para consulta de todos os resultados históricos oficiais das principais loterias da Caixa Econômica Federal (**Mega-Sena**, **Lotofácil**, **Quina** e **Lotomania**), análise gráfica de frequências/atrasos e simulação financeira combinatória de apostas simples e múltiplas. O sistema busca automaticamente os sorteios mais recentes sempre que o usuário acessa o site e possui rotina diária no GitHub Actions.

## Funcionalidades

1. **Simulador de Aposta (6 a 10 Dezenas) e Extrato Histórico**
   - Volante interativo (`01` a `60`) com validação contra todos os 3.076 sorteios passados.
   - Cálculo combinatório oficial da Caixa Econômica Federal para apostas múltiplas:
     - **6 dezenas:** 1 aposta simples (R$ 6,00)
     - **7 dezenas:** 7 apostas simples (R$ 42,00)
     - **8 dezenas:** 28 apostas simples (R$ 168,00)
     - **9 dezenas:** 84 apostas simples (R$ 504,00)
     - **10 dezenas:** 210 apostas simples (R$ 1.260,00)
   - Multiplicação proporcional de prêmios de Sena (6), Quina (5) e Quadra (4) segundo a distribuição hipergeométrica $\binom{h}{m} \times \binom{k - h}{6 - m}$.
   - Destaque automático dos concursos com maior número de acertos (ex.: Concurso #2057 com 5 acertos pagando R$ 46.108,12) e alerta explícito quando nenhum prêmio é encontrado ou quando o custo da aposta supera o valor recebido.
   - Extrato financeiro detalhado com duas modalidades de custo: **1 Concurso Avulso** ou **Teimosinha Histórica (todos os 3.076 concursos)**.

2. **Simulador de Gastos Acumulados com Apostas vs. Investimentos Mais Rentáveis**
   - Permite informar **quantas apostas por mês**, **quantidade de dezenas (6 a 10)** e o período (**desde que ano** entre 1996 e 2026 ou **há quantos anos**).
   - Aplica os **reajustes históricos oficiais da Caixa** mês a mês (`R$ 1,00` em 1996, `R$ 1,50` em 2003, `R$ 2,00` em 2005, `R$ 2,50` em 2014, `R$ 3,50` em 2015, `R$ 4,50` em 2019, `R$ 5,00` em 2023 e `R$ 6,00` em 2025/2026) ou **reajustes periódicos simulados** (+25% a cada 3 anos).
   - Compara o total desembolsado na loteria com o patrimônio acumulado (aportes mensais + juros compostos) em 5 alternativas de investimento: **Poupança Tradicional**, **Tesouro IPCA+**, **Tesouro Selic / CDB 100% CDI**, **LCI/LCA Isentas ou FIIs** e **Carteira Diversificada / ETFs**, exibindo também o extrato de gastos por faixa de reajuste.

3. **Gráficos e Métricas das Dezenas**
   - Indicadores gerais: total de concursos, percentual de acumulados, dezena mais sorteada, dezena menos sorteada, dezena com maior atraso atual e soma média por sorteio.
   - Matriz interativa das 60 dezenas ordenável por ordem numérica, maior frequência, menor frequência ou maior atraso.
   - Gráfico das 10 dezenas há mais concursos consecutivos sem sair.
   - Gráfico de proporção entre dezenas pares e ímpares por sorteio.
   - Gráfico de distribuição por linha do volante (`01 a 10` até `51 a 60`).

3. **Extrapolação Probabilística (Dezenas, Centenas e Milhares de Jogos à Frente)**
   - Seleção de horizonte futuro: `+20` e `+50` (dezenas), `+250` e `+500` (centenas), `+1.000` e `+5.000` (milhares de concursos).
   - Três métodos de projeção: **Expectativa Empírica Direta** ($p_i = f_i / N$), **Simulação de Monte Carlo Ponderada** (amostragem sem reposição de $H$ sorteios futuros) e **Regressão à Média + Pressão de Ciclo**.
   - Gráfico SVG multi-escala comparando a trajetória das dezenas líderes, média teórica (10%) e lanterna em `+50`, `+500`, `+1.000` e `+5.000` jogos, além de projeções de aparições adicionais, pressão de ciclo, paridade e linhas do volante.

4. **Filtro de Concursos Especiais e Landing Page da Mega da Virada (`/mega-da-virada`)**
   - Atalhos rápidos e filtro no histórico, simulador e métricas para os concursos especiais anuais: **Mega da Virada** (Mega-Sena), **Lotofácil da Independência**, **Quina de São João** e **Lotomania de Páscoa**.
   - Página dedicada em [`mega-da-virada.html`](mega-da-virada.html) (`/mega-da-virada`) com a história desde 2008/2009, gráfico de evolução dos prêmios, tabela completa de ganhadores (2009 a 2025), análise estatística de apostas simples vs. bolões, calculadora interativa de cotas, dezenas que mais saíram e vitrine comercial.

5. **Histórico Completo de Concursos e Exportação Multi-Produto (XLSX / PDF)**
   - Busca por número do concurso ou data (`dd/mm/aaaa`).
   - Filtro por dezena específica sorteada, por tipo de concurso (Todos, Somente Concursos Especiais, Somente Regulares) e por status do prêmio principal (Todos, Com ganhadores, Acumulados).
   - Modal de detalhes com o rateio completo de cada concurso e identificação das edições especiais.
   - Botão **Atualizar da Caixa** para buscar novos sorteios via API pública sem precisar recarregar a página.
   - **Exportação Paga por Loteria, Combos e Produtos Extras (via Stripe):**
     - **Exportação Individual por Loteria (R$ 10,00 cada):** Mega-Sena + Mega da Virada, Lotofácil + Independência, Quina + São João ou Lotomania + Páscoa em `.xlsx` e `.pdf`.
     - **Combo 4 Loterias Completo (R$ 24,90):** desbloqueia todas as 4 modalidades (economia de 38%) com exportação consolidada multi-abas.
     - **Kit Bolão Mega da Virada 2026 (R$ 14,90):** planilha Excel de 4 abas com fórmulas automáticas de rateio de cotas, conferidor automático para o Concurso `#3100`, histórico da Virada e frequência das 60 dezenas + Guia Executivo em PDF.
     - **Dossiê Concursos Especiais (R$ 19,90):** Excel de 5 abas e PDF consolidado comparando Mega da Virada, Lotofácil da Independência, Quina de São João e Lotomania de Páscoa.
     - **Pacote Completo Atlas + Virada (R$ 34,90):** reúne todas as 4 planilhas históricas + Kit Bolão Mega da Virada 2026 + Dossiê Concursos Especiais.
     - Checkout seguro Stripe com suporte a **Pix instantâneo** e **Cartão de Crédito**.

## Estrutura de Arquivos

- `index.html`: Estrutura semântica da aplicação principal, filtro de concursos especiais e modais multi-produto.
- `mega-da-virada.html`: Landing page analítica e comercial dedicada à Mega da Virada (`/mega-da-virada`).
- `styles.css` / `virada.css`: Estilos responsivos com suporte a tema Claro e Escuro (contraste WCAG AA).
- `special-draws.js`: Catálogo e detector compartilhado de concursos especiais (Mega da Virada, Independência, São João e Páscoa).
- `store.js`: Catálogo de produtos, gestão de permissões, checkout/verificação Stripe e geradores XLSX/PDF (incluindo Kit Bolão e Dossiê Especiais).
- `app.js` / `virada.js`: Motores de simulação, gráficos e interatividade das páginas.
- `server.py`: Servidor HTTP leve em Python com endpoints para sessões dinâmicas multi-produto do Stripe Checkout e rota `/mega-da-virada`.
- `vendor/`: Bibliotecas locais para geração de planilhas (`xlsx.full.min.js`) e documentos (`jspdf.umd.min.js`, `jspdf.plugin.autotable.min.js`).
- `data/*.js` / `data/*.json`: Bases históricas oficiais da Mega-Sena, Lotofácil, Quina e Lotomania.

## Como Rodar o Projeto

O projeto utiliza apenas HTML, CSS e JavaScript nativos, não exigindo instalação de pacotes (`npm install`) ou etapa de build.

### Opção 1: Servidor Integrado com Checkout Stripe (Recomendado)
Para servir a aplicação e processar as sessões dinâmicas do Stripe:

```bash
python3 server.py
```

Acesse no navegador: `http://localhost:8080`

### Opção 2: Servidor HTTP padrão do Python
```bash
python3 -m http.server 8080
```

### Opção 3: Abrir diretamente no navegador (sem servidor)
Basta dar duplo clique no arquivo `index.html` ou executar no terminal:

```bash
open index.html
```

*(Como as bibliotecas XLSX/PDF estão empacotadas em `vendor/` e os dados em `data/`, a aplicação funciona mesmo abrindo via protocolo `file://`).*

## Como Publicar no Netlify

O projeto já está 100% configurado para o **Netlify** com suporte a **Netlify Functions** para o Stripe Checkout:

1. Conecte o repositório no [Netlify Dashboard](https://app.netlify.com/).
2. As configurações em [`netlify.toml`](netlify.toml) detectam automaticamente:
   - **Publish directory:** `.` (raiz)
   - **Functions directory:** `netlify/functions`
   - **Build command:** *(deixar vazio - zero build)*
3. No painel do Netlify (**Site configuration > Environment variables**), adicione:
   - `STRIPE_SECRET_KEY`: sua chave restrita/secreta do Stripe (já habilita automaticamente todos os produtos e valores via `price_data` dinâmico na API Stripe).
   - *(Opcional)* Variáveis `STRIPE_PRICE_ID_*` ou `STRIPE_LINK_*` caso deseje associar Price IDs ou Links pré-cadastrados (veja `.env.example`).
   *(Nota: não adicione a variável PORT no Netlify, pois o Netlify não necessita de porta).*
4. Clique em **Deploy**. As rotas `/api/create-checkout-session` e `/api/verify-session` funcionarão como Serverless Functions automaticamente.

## Como Atualizar a Base de Dados Local (Opcional)

A aplicação busca novos resultados automaticamente via API oficial sempre que a página é acessada ou quando a aba ganha foco.

### Atualização Automática via GitHub Actions
O repositório possui uma rotina diária em [`.github/workflows/sync-draws.yml`](.github/workflows/sync-draws.yml) que executa o script [`scripts/sync-draws.py`](scripts/sync-draws.py) diariamente às 20:15, 22:15 e 00:15 BRT. Ele checa todas as loterias suportadas (Mega-Sena, Lotofácil, Quina e Lotomania) e só realiza commit e push caso haja novos concursos ou rateios consolidados.

### Atualização Manual via Terminal
Você pode atualizar todas as loterias de uma vez ou especificar apenas uma:

```bash
# Atualiza todas as loterias (Mega-Sena, Lotofácil, Quina, Lotomania)
python3 scripts/sync-draws.py

# Ou atualiza apenas uma específica:
python3 scripts/sync-draws.py megasena
python3 scripts/sync-draws.py lotofacil
python3 scripts/sync-draws.py quina
python3 scripts/sync-draws.py lotomania
```

