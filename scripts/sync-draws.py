#!/usr/bin/env python3
import json
import os
import sys
import urllib.request

API_ENDPOINTS = [
    "https://loteriascaixa-api.herokuapp.com/api",
    "https://servicebus2.caixa.gov.br/portaldeloterias/api"
]

def fetch_json(path, timeout=30):
    last_err = None
    for base in API_ENDPOINTS:
        url = f"{base}/{path.lstrip('/')}"
        try:
            req = urllib.request.Request(url, headers={
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            })
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                return json.loads(resp.read().decode("utf-8"))
        except Exception as e:
            last_err = e
            continue
    raise RuntimeError(f"Falha ao consultar API em todos os endpoints configurados: {last_err}")

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

MAISMILIONARIA_FAIXA_MAP = {
    1: "6+2",
    2: "6+1",
    3: "5+2",
    4: "5+1",
    5: "4+2",
    6: "4+1",
    7: "3+2",
    8: "3+1",
    9: "2+2",
    10: "2+1",
}

def format_maismilionaria(p, item):
    faixa = p.get("faixa")
    k = MAISMILIONARIA_FAIXA_MAP.get(faixa)
    if not k:
        return None, None
    val = float(p.get("valorPremio") or 0)
    if k == "6+2" and val == 0:
        val = float(item.get("valorAcumuladoProximoConcurso") or item.get("valorEstimadoProximoConcurso") or 0)
    return k, {"g": int(p.get("ganhadores") or 0), "v": round(val, 2)}

def format_timemania(p, item):
    faixa = p.get("faixa")
    if faixa in (1, 2, 3, 4, 5):
        k = str(8 - faixa)
    elif faixa == 6:
        k = "time"
    else:
        return None, None
    val = float(p.get("valorPremio") or 0)
    if k == "7" and val == 0:
        val = float(item.get("valorAcumuladoProximoConcurso") or item.get("valorEstimadoProximoConcurso") or 0)
    return k, {"g": int(p.get("ganhadores") or 0), "v": round(val, 2)}

DUPLASENA_FAIXA_MAP = {
    1: "6",
    2: "5",
    3: "4",
    4: "3",
    5: "2_6",
    6: "2_5",
    7: "2_4",
    8: "2_3",
}

def format_duplasena(p, item):
    faixa = p.get("faixa")
    k = DUPLASENA_FAIXA_MAP.get(faixa)
    if not k:
        return None, None
    val = float(p.get("valorPremio") or 0)
    if k == "6" and val == 0:
        val = float(item.get("valorAcumuladoProximoConcurso") or item.get("valorEstimadoProximoConcurso") or 0)
    return k, {"g": int(p.get("ganhadores") or 0), "v": round(val, 2)}

def format_diadesorte(p, item):
    faixa = p.get("faixa")
    if faixa in (1, 2, 3, 4):
        k = str(8 - faixa)
    elif faixa == 5:
        k = "mes"
    else:
        return None, None
    val = float(p.get("valorPremio") or 0)
    if k == "7" and val == 0:
        val = float(item.get("valorAcumuladoProximoConcurso") or item.get("valorEstimadoProximoConcurso") or 0)
    return k, {"g": int(p.get("ganhadores") or 0), "v": round(val, 2)}

def format_supersete(p, item):
    faixa = p.get("faixa")
    if faixa in (1, 2, 3, 4, 5):
        k = str(8 - faixa)
        val = float(p.get("valorPremio") or 0)
        if k == "7" and val == 0:
            val = float(item.get("valorAcumuladoProximoConcurso") or item.get("valorEstimadoProximoConcurso") or 0)
        return k, {"g": int(p.get("ganhadores") or 0), "v": round(val, 2)}
    return None, None

CONFIGS = {
    "megasena": {"var": "MEGASENA_DRAWS", "parser": format_megasena, "fix_zero": False},
    "lotofacil": {"var": "LOTOFACIL_DRAWS", "parser": format_lotofacil, "fix_zero": False},
    "quina": {"var": "QUINA_DRAWS", "parser": format_quina, "fix_zero": False},
    "lotomania": {"var": "LOTOMANIA_DRAWS", "parser": format_lotomania, "fix_zero": True},
    "maismilionaria": {"var": "MAISMILIONARIA_DRAWS", "parser": format_maismilionaria, "fix_zero": False, "kind": "maismilionaria"},
    "timemania": {"var": "TIMEMANIA_DRAWS", "parser": format_timemania, "fix_zero": False, "kind": "timemania"},
    "duplasena": {"var": "DUPLASENA_DRAWS", "parser": format_duplasena, "fix_zero": False, "kind": "duplasena"},
    "diadesorte": {"var": "DIADESORTE_DRAWS", "parser": format_diadesorte, "fix_zero": False, "kind": "diadesorte"},
    "supersete": {"var": "SUPERSETE_DRAWS", "parser": format_supersete, "fix_zero": False, "kind": "supersete"},
}

def format_draw(item, parser, fix_zero=False, kind=None):
    premios = {}
    for p in item.get("premiacoes", []):
        k, v = parser(p, item)
        if k and v:
            premios[k] = v
    raw_nums = [int(x) for x in item.get("dezenas", [])]
    if fix_zero:
        raw_nums = [100 if x == 0 else x for x in raw_nums]

    out = {
        "c": int(item["concurso"]),
        "d": str(item["data"]),
        "n": sorted(raw_nums),
        "p": premios,
        "a": bool(item.get("acumulou", False)),
    }

    if kind == "maismilionaria":
        trevos = [int(x) for x in (item.get("trevos") or []) if str(x).strip().isdigit()]
        out["tr"] = sorted(trevos)
    elif kind == "timemania":
        tm = str(item.get("timeCoracao") or "").strip()
        if tm:
            out["tm"] = tm
    elif kind == "duplasena":
        if len(raw_nums) >= 12:
            out["n"] = sorted(raw_nums[:6])
            out["n2"] = sorted(raw_nums[6:12])
        else:
            out["n"] = sorted(raw_nums[:6])
            out["n2"] = []
    elif kind == "diadesorte":
        ms = str(item.get("mesSorte") or "").strip()
        if ms:
            out["ms"] = ms
    elif kind == "supersete":
        cols = raw_nums[:7]
        out["cols"] = cols
        out["n"] = [idx * 10 + dig + 1 for idx, dig in enumerate(cols)]

    return out

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
        latest = fetch_json(f"{name}/latest")
    except Exception as e:
        print(f"[{name}] Erro ao consultar último concurso: {e}", file=sys.stderr)
        return

    latest_concurso = int(latest.get("concurso", 0))
    print(f"[{name}] Último na Caixa: #{latest_concurso}")

    kind = cfg.get("kind")

    if latest_concurso == current_max:
        # Verifica se o último sorteio local estava sem rateio e agora possui
        if local_draws and not local_draws[-1].get("p") and latest.get("premiacoes"):
            print(f"[{name}] Atualizando rateio do concurso #{current_max}...")
            local_draws[-1] = format_draw(latest, cfg["parser"], cfg["fix_zero"], kind)
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
        new_draws.append(format_draw(latest, cfg["parser"], cfg["fix_zero"], kind))
    elif 1 < diff <= 15:
        print(f"[{name}] Baixando {diff} concursos pendentes incrementalmente...")
        for c in range(current_max + 1, latest_concurso):
            try:
                c_item = fetch_json(f"{name}/{c}", timeout=20)
                new_draws.append(format_draw(c_item, cfg["parser"], cfg["fix_zero"], kind))
            except Exception as e:
                print(f"[{name}] Erro ao buscar concurso #{c}: {e}", file=sys.stderr)
        new_draws.append(format_draw(latest, cfg["parser"], cfg["fix_zero"], kind))
    else:
        print(f"[{name}] Grande defasagem ({diff}), puxando histórico completo...")
        try:
            all_raw = fetch_json(f"{name}", timeout=60)
            new_draws = [
                format_draw(x, cfg["parser"], cfg["fix_zero"], kind)
                for x in sorted(all_raw, key=lambda x: int(x["concurso"]))
            ]
        except Exception as e:
            print(f"[{name}] Falha no histórico completo ({e}), incluindo apenas último.", file=sys.stderr)
            new_draws.append(format_draw(latest, cfg["parser"], cfg["fix_zero"], kind))

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
