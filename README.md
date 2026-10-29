# Atlas Estatístico da Mega-Sena

Aplicação web sem dependências externas para consulta de todos os resultados históricos da Mega-Sena (desde o Concurso #1 em 11/03/1996 até o #3076 em 27/10/2026), análise gráfica das 60 dezenas e simulação financeira de apostas simples e múltiplas (6 a 10 dezenas).

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

2. **Gráficos e Métricas das Dezenas**
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
- `data/megasena.js`: Base histórica local pré-carregada (`window.MEGASENA_DRAWS`) para funcionamento direto via `file://` ou offline.
- `data/megasena.json`: Mesma base histórica em formato JSON puro.

## Como Rodar o Projeto

O projeto utiliza apenas HTML, CSS e JavaScript nativos, não exigindo instalação de pacotes (`npm install`) ou etapa de build.

### Opção 1: Abrir diretamente no navegador (sem servidor)
Basta dar duplo clique no arquivo `index.html` ou executar no terminal:

```bash
open index.html
```

*(Como os dados estão empacotados também em `data/megasena.js`, toda a base de 3.076 sorteios funciona mesmo abrindo via protocolo `file://`).*

### Opção 2: Rodar com servidor HTTP local (Python)
Para servir via HTTP na porta `8080`:

```bash
python3 -m http.server 8080
```

Depois, acesse no navegador: `http://localhost:8080`

## Como Atualizar a Base de Dados Local (Opcional)

Na própria interface do site, clique no botão **Atualizar da Caixa** no topo da página para consultar o último concurso disponível. Caso queira regerar os arquivos `data/megasena.json` e `data/megasena.js` via terminal com todos os concursos da API aberta:

```bash
python3 -c '
import urllib.request, json
raw = json.loads(urllib.request.urlopen("https://loteriascaixa-api.herokuapp.com/api/megasena", timeout=30).read().decode("utf-8"))
compact = []
for item in sorted(raw, key=lambda x: x["concurso"]):
    premios = {}
    for p in item.get("premiacoes", []):
        if p.get("faixa") in (1, 2, 3):
            k = str(7 - p["faixa"])
            val = float(p["valorPremio"] or 0)
            if k == "6" and val == 0:
                val = float(item.get("valorAcumuladoProximoConcurso") or item.get("valorEstimadoProximoConcurso") or 0)
            premios[k] = {"g": int(p["ganhadores"] or 0), "v": round(val, 2)}
    compact.append({"c": item["concurso"], "d": item["data"], "n": [int(x) for x in item["dezenas"]], "p": premios, "a": bool(item.get("acumulou", False))})
body = json.dumps(compact, separators=(",", ":"))
open("data/megasena.json", "w", encoding="utf-8").write(body)
open("data/megasena.js", "w", encoding="utf-8").write("window.MEGASENA_DRAWS=" + body + ";\n")
print("Atualizado:", len(compact), "concursos")
'
```

