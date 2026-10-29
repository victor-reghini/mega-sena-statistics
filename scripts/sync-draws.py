#!/usr/bin/env python3
import json
import os
import sys
import urllib.request

JSON_PATH = "data/megasena.json"
JS_PATH = "data/megasena.js"
LATEST_URL = "https://loteriascaixa-api.herokuapp.com/api/megasena/latest"
ALL_URL = "https://loteriascaixa-api.herokuapp.com/api/megasena"

def fetch_json(url, timeout=30):
    req = urllib.request.Request(url, headers={"User-Agent": "MegaSenaBot/1.0"})
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return json.loads(resp.read().decode("utf-8"))

def format_draw(item):
    premios = {}
    for p in item.get("premiacoes", []):
        faixa = p.get("faixa")
        if faixa in (1, 2, 3):
            k = str(7 - faixa)
            val = float(p.get("valorPremio") or 0)
            if k == "6" and val == 0:
                val = float(item.get("valorAcumuladoProximoConcurso") or item.get("valorEstimadoProximoConcurso") or 0)
            premios[k] = {"g": int(p.get("ganhadores") or 0), "v": round(val, 2)}
    return {
        "c": int(item["concurso"]),
        "d": str(item["data"]),
        "n": sorted([int(x) for x in item["dezenas"]]),
        "p": premios,
        "a": bool(item.get("acumulou", False))
    }

def main():
    if not os.path.exists(JSON_PATH):
        print(f"Erro: {JSON_PATH} não encontrado.", file=sys.stderr)
        sys.exit(1)

    with open(JSON_PATH, "r", encoding="utf-8") as f:
        local_draws = json.load(f)

    current_max = local_draws[-1]["c"] if local_draws else 0
    print(f"Último concurso local: #{current_max}")

    try:
        latest_item = fetch_json(LATEST_URL)
    except Exception as e:
        print(f"Erro ao consultar último concurso na API: {e}", file=sys.stderr)
        sys.exit(0)  # Sai sem falhar o build em caso de indisponibilidade temporária da API

    latest_concurso = int(latest_item.get("concurso", 0))
    print(f"Último concurso na Caixa: #{latest_concurso}")

    if latest_concurso <= current_max:
        print("Base já está atualizada. Nenhuma modificação necessária.")
        return

    diff = latest_concurso - current_max
    print(f"Novos concursos detectados: {diff}")

    if diff == 1:
        local_draws.append(format_draw(latest_item))
        new_draws = local_draws
    else:
        # Se houver mais de 1 concurso de diferença, puxa todos para garantir integridade
        print("Obtendo histórico completo para preencher múltiplos concursos...")
        try:
            all_raw = fetch_json(ALL_URL, timeout=60)
            new_draws = [format_draw(x) for x in sorted(all_raw, key=lambda x: int(x["concurso"]))]
        except Exception as e:
            print(f"Falha ao obter histórico completo: {e}", file=sys.stderr)
            local_draws.append(format_draw(latest_item))
            new_draws = local_draws

    # Salva apenas se o número de concursos aumentou
    if len(new_draws) > len(local_draws) or new_draws[-1]["c"] > current_max:
        body = json.dumps(new_draws, separators=(",", ":"))
        with open(JSON_PATH, "w", encoding="utf-8") as f:
            f.write(body)
        with open(JS_PATH, "w", encoding="utf-8") as f:
            f.write("window.MEGASENA_DRAWS=" + body + ";\n")
        print(f"Sucesso: Base atualizada para {len(new_draws)} concursos (último: #{new_draws[-1]['c']}).")

if __name__ == "__main__":
    main()
