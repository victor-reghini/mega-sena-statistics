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

4. **Histórico Completo de Concursos**
   - Busca por número do concurso ou data (`dd/mm/aaaa`).
   - Filtro por dezena específica sorteada (`01` a `60`) e por status do prêmio principal (Todos, Com ganhadores na Sena, Acumulados).
   - Modal de detalhes com o rateio completo de cada concurso (Sena, Quina e Quadra) e atalho para carregar as dezenas daquele sorteio no simulador.
   - Botão **Atualizar da Caixa** para buscar novos sorteios via API pública sem precisar recarregar a página.

## Estrutura de Arquivos

- `index.html`: Estrutura semântica da aplicação e controles acessíveis por teclado.
- `styles.css`: Estilos responsivos (celular, tablet e desktop) com suporte a tema Claro e Escuro (contraste WCAG AA validado).
- `app.js`: Motor de simulação combinatória, cálculo de estatísticas, gráficos e tabela paginada.
- `data/megasena.js` / `data/megasena.json`: Base da Mega-Sena (3.077 concursos).
- `data/lotofacil.js` / `data/lotofacil.json`: Base da Lotofácil (3.816 concursos).
- `data/quina.js` / `data/quina.json`: Base da Quina (7.154 concursos).
- `data/lotomania.js` / `data/lotomania.json`: Base da Lotomania (2.993 concursos).

## Como Rodar o Projeto

O projeto utiliza apenas HTML, CSS e JavaScript nativos, não exigindo instalação de pacotes (`npm install`) ou etapa de build.

### Opção 1: Abrir diretamente no navegador (sem servidor)
Basta dar duplo clique no arquivo `index.html` ou executar no terminal:

```bash
open index.html
```

*(Como os dados estão empacotados também em `data/megasena.js`, toda a base de 3.077 sorteios funciona mesmo abrindo via protocolo `file://`).*

### Opção 2: Rodar com servidor HTTP local (Python)
Para servir via HTTP na porta `8080`:

```bash
python3 -m http.server 8080
```

Depois, acesse no navegador: `http://localhost:8080`

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

