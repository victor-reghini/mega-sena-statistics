#!/usr/bin/env python3
import json
import os
import sys
import urllib.request

API_BASE = "https://loteriascaixa-api.herokuapp.com/api"

def fetch_json(url, timeout=30):
    req = urllib.request.Request(url, headers={"User-Agent": "LoteriasBot/1.0"})
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return json.loads(resp.read().decode("utf-8"))

def format_megasena(p, item):
    faixa = p.get("faixa")
    if faixa in (1, 2, 3):
        k = str(7 - faixa)
        val = float(p.get("valorPremio") or 0)
        if k == "6" and val == 0:
            val = float(item.get("valorAcumuladoProximoConcurso") or item.get("valorEstimadoProximoConcurso") or 0)
        return k, {"g": int(p.get("ganhadores") or 0), "v": round(val, 2)}
    return None, None

def format_lotofacil(p, item):
    faixa = p.get("faixa")
    if faixa in (1, 2, 3, 4, 5):
        k = str(16 - faixa)
        val = float(p.get("valorPremio") or 0)
        if k == "15" and val == 0:
            val = float(item.get("valorAcumuladoProximoConcurso") or item.get("valorEstimadoProximoConcurso") or 0)
        return k, {"g": int(p.get("ganhadores") or 0), "v": round(val, 2)}
    return None, None

def format_quina(p, item):
    faixa = p.get("faixa")
    if faixa in (1, 2, 3, 4):
        k = str(6 - faixa)
        val = float(p.get("valorPremio") or 0)
        if k == "5" and val == 0:
            val = float(item.get("valorAcumuladoProximoConcurso") or item.get("valorEstimadoProximoConcurso") or 0)
        return k, {"g": int(p.get("ganhadores") or 0), "v": round(val, 2)}
    return None, None

def format_lotomania(p, item):
    faixa = p.get("faixa")
    desc = p.get("descricao", "")
    k = "0" if "0 acertos" in desc or faixa == 7 else str(21 - faixa)
    val = float(p.get("valorPremio") or 0)
    if k == "20" and val == 0:
        val = float(item.get("valorAcumuladoProximoConcurso") or item.get("valorEstimadoProximoConcurso") or 0)
    return k, {"g": int(p.get("ganhadores") or 0), "v": round(val, 2)}

CONFIGS = {
    "megasena": {"var": "MEGASENA_DRAWS", "parser": format_megasena, "fix_zero": False},
    "lotofacil": {"var": "LOTOFACIL_DRAWS", "parser": format_lotofacil, "fix_zero": False},
    "quina": {"var": "QUINA_DRAWS", "parser": format_quina, "fix_zero": False},
    "lotomania": {"var": "LOTOMANIA_DRAWS", "parser": format_lotomania, "fix_zero": True},
}

def format_draw(item, parser, fix_zero=False):
    premios = {}
    for p in item.get("premiacoes", []):
        k, v = parser(p, item)
        if k and v:
            premios[k] = v
    nums = [int(x) for x in item.get("dezenas", [])]
    if fix_zero:
        nums = [100 if x == 0 else x for x in nums]
    return {
        "c": int(item["concurso"]),
        "d": str(item["data"]),
        "n": sorted(nums),
        "p": premios,
        "a": bool(item.get("acumulou", False))
    }

def sync_lottery(name, cfg):
    json_path = f"data/{name}.json"
    js_path = f"data/{name}.js"

    if not os.path.exists(json_path):
        print(f"[{name}] Arquivo {json_path} não encontrado, criando novo.")
        local_draws = []
    else:
        with open(json_path, "r", encoding="utf-8") as f:
            local_draws = json.load(f)

    current_max = local_draws[-1]["c"] if local_draws else 0
    print(f"[{name}] Atual: #{current_max}")

    try:
        latest = fetch_json(f"{API_BASE}/{name}/latest")
    except Exception as e:
        print(f"[{name}] Erro ao consultar último concurso: {e}", file=sys.stderr)
        return

    latest_concurso = int(latest.get("concurso", 0))
    print(f"[{name}] Último na Caixa: #{latest_concurso}")

    if latest_concurso == current_max:
        # Verifica se o último sorteio local estava sem rateio e agora possui
        if local_draws and not local_draws[-1].get("p") and latest.get("premiacoes"):
            print(f"[{name}] Atualizando rateio do concurso #{current_max}...")
            local_draws[-1] = format_draw(latest, cfg["parser"], cfg["fix_zero"])
            body = json.dumps(local_draws, separators=(",", ":"))
            with open(json_path, "w", encoding="utf-8") as f:
                f.write(body)
            with open(js_path, "w", encoding="utf-8") as f:
                f.write(f"window.{cfg['var']}={body};\n")
            print(f"[{name}] SUCESSO: Rateio atualizado para #{current_max}.")
            return True
        print(f"[{name}] Base já sincronizada.")
        return False

    if latest_concurso < current_max:
        print(f"[{name}] API retornou concurso anterior ({latest_concurso} < {current_max}). Ignorando.")
        return False

    diff = latest_concurso - current_max
    print(f"[{name}] Novos concursos: {diff}")

    new_draws = list(local_draws)
    if diff == 1:
        new_draws.append(format_draw(latest, cfg["parser"], cfg["fix_zero"]))
    elif 1 < diff <= 15:
        print(f"[{name}] Baixando {diff} concursos pendentes incrementalmente...")
        for c in range(current_max + 1, latest_concurso):
            try:
                c_item = fetch_json(f"{API_BASE}/{name}/{c}", timeout=20)
                new_draws.append(format_draw(c_item, cfg["parser"], cfg["fix_zero"]))
            except Exception as e:
                print(f"[{name}] Erro ao buscar concurso #{c}: {e}", file=sys.stderr)
        new_draws.append(format_draw(latest, cfg["parser"], cfg["fix_zero"]))
    else:
        print(f"[{name}] Grande defasagem ({diff}), puxando histórico completo...")
        try:
            all_raw = fetch_json(f"{API_BASE}/{name}", timeout=60)
            new_draws = [
                format_draw(x, cfg["parser"], cfg["fix_zero"])
                for x in sorted(all_raw, key=lambda x: int(x["concurso"]))
            ]
        except Exception as e:
            print(f"[{name}] Falha no histórico completo ({e}), incluindo apenas último.", file=sys.stderr)
            new_draws.append(format_draw(latest, cfg["parser"], cfg["fix_zero"]))

    if len(new_draws) > len(local_draws) or new_draws[-1]["c"] > current_max:
        body = json.dumps(new_draws, separators=(",", ":"))
        with open(json_path, "w", encoding="utf-8") as f:
            f.write(body)
        with open(js_path, "w", encoding="utf-8") as f:
            f.write(f"window.{cfg['var']}={body};\n")
        print(f"[{name}] SUCESSO: Atualizado para {len(new_draws)} concursos (último: #{new_draws[-1]['c']}).")
        return True
    return False

def main():
    target = sys.argv[1] if len(sys.argv) > 1 else None
    updated = []
    for name, cfg in CONFIGS.items():
        if target and target != name:
            continue
        try:
            if sync_lottery(name, cfg):
                updated.append(name)
        except Exception as e:
            print(f"[{name}] Erro inesperado: {e}", file=sys.stderr)

    if updated:
        print(f"\nResumo: Loterias atualizadas com sucesso: {', '.join(updated)}")
    else:
        print("\nResumo: Todas as loterias já estão em dia.")

if __name__ == "__main__":
    main()
