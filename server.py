#!/usr/bin/env python3
"""
Servidor HTTP leve para o Atlas Estatístico das Loterias Caixa.
Serve arquivos estáticos, a landing page /mega-da-virada e gerencia sessões multi-produto do Stripe.
Sem dependências externas - utiliza apenas a biblioteca padrão do Python 3.
"""

import http.server
import json
import os
import re
import socketserver
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

# Carregar variáveis do arquivo .env manualmente (sem precisar de python-dotenv)
ENV_PATH = Path(__file__).resolve().parent / ".env"
if ENV_PATH.exists():
    with open(ENV_PATH, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                key, val = line.split("=", 1)
                os.environ.setdefault(key.strip(), val.strip().strip('"').strip("'"))

STRIPE_SECRET_KEY = os.environ.get("STRIPE_SECRET_KEY", "").strip()
STRIPE_PUBLIC_KEY = os.environ.get(
    "STRIPE_PUBLIC_KEY",
    "pk_live_51UZBcCLbOL7pa0nJ9KZUc0S3yOubmdMqUXKPITZioDaIJZspSTytfWfkANsqEG59zA4v4xrHwofLRzPHN3XNXVhc00xahGUgKA"
).strip()
PORT = int(os.environ.get("PORT", "8080"))

PRODUCT_CATALOG = {
    "export_megasena": {
        "name": "Planilha Mega-Sena + Mega da Virada (XLSX + PDF)",
        "description": "Base completa de resultados da Mega-Sena e todas as edições da Mega da Virada em Excel (.xlsx) e PDF.",
        "amountCents": 1000,
        "unlocks": ["megasena"],
        "priceEnv": "STRIPE_PRICE_ID_EXPORT_MEGASENA",
        "linkEnv": "STRIPE_LINK_EXPORT_MEGASENA",
    },
    "export_lotofacil": {
        "name": "Planilha Lotofácil + Independência (XLSX + PDF)",
        "description": "Base completa de resultados da Lotofácil e Lotofácil da Independência em Excel (.xlsx) e PDF.",
        "amountCents": 1000,
        "unlocks": ["lotofacil"],
        "priceEnv": "STRIPE_PRICE_ID_EXPORT_LOTOFACIL",
        "linkEnv": "STRIPE_LINK_EXPORT_LOTOFACIL",
    },
    "export_quina": {
        "name": "Planilha Quina + São João (XLSX + PDF)",
        "description": "Base completa de resultados da Quina e Quina de São João em Excel (.xlsx) e PDF.",
        "amountCents": 1000,
        "unlocks": ["quina"],
        "priceEnv": "STRIPE_PRICE_ID_EXPORT_QUINA",
        "linkEnv": "STRIPE_LINK_EXPORT_QUINA",
    },
    "export_lotomania": {
        "name": "Planilha Lotomania + Páscoa (XLSX + PDF)",
        "description": "Base completa de resultados da Lotomania e Lotomania de Páscoa em Excel (.xlsx) e PDF.",
        "amountCents": 1000,
        "unlocks": ["lotomania"],
        "priceEnv": "STRIPE_PRICE_ID_EXPORT_LOTOMANIA",
        "linkEnv": "STRIPE_LINK_EXPORT_LOTOMANIA",
    },
    "combo_all": {
        "name": "Combo 4 Loterias Completo (XLSX + PDF)",
        "description": "Acesso vitalício para exportar Mega-Sena, Lotofácil, Quina, Lotomania e todos os concursos especiais.",
        "amountCents": 2490,
        "unlocks": ["megasena", "lotofacil", "quina", "lotomania"],
        "priceEnv": "STRIPE_PRICE_ID_COMBO_ALL",
        "linkEnv": "STRIPE_LINK_COMBO_ALL",
    },
    "kit_bolao_virada": {
        "name": "Kit Bolão Mega da Virada 2026 (Excel + Guia PDF)",
        "description": "Planilha com rateio de cotas, conferidor automático do concurso 3100, histórico da Virada e guia em PDF.",
        "amountCents": 1490,
        "unlocks": ["kit_bolao_virada"],
        "priceEnv": "STRIPE_PRICE_ID_KIT_BOLAO_VIRADA",
        "linkEnv": "STRIPE_LINK_KIT_BOLAO_VIRADA",
    },
    "dossie_especiais": {
        "name": "Dossiê Concursos Especiais (XLSX + PDF)",
        "description": "Comparativo histórico em Excel e PDF de Mega da Virada, Independência, Quina de São João e Páscoa.",
        "amountCents": 1990,
        "unlocks": ["dossie_especiais"],
        "priceEnv": "STRIPE_PRICE_ID_DOSSIE_ESPECIAIS",
        "linkEnv": "STRIPE_LINK_DOSSIE_ESPECIAIS",
    },
    "super_combo": {
        "name": "Pacote Completo Atlas + Virada (4 Loterias + Kit Bolão + Dossiê)",
        "description": "Todas as 4 planilhas oficiais + Kit Bolão Mega da Virada 2026 + Dossiê Concursos Especiais.",
        "amountCents": 3490,
        "unlocks": ["megasena", "lotofacil", "quina", "lotomania", "kit_bolao_virada", "dossie_especiais"],
        "priceEnv": "STRIPE_PRICE_ID_SUPER_COMBO",
        "linkEnv": "STRIPE_LINK_SUPER_COMBO",
    },
}

ALLOWED_RETURN_PATHS = {
    "/",
    "/index.html",
    "/mega-da-virada",
    "/mega-da-virada.html",
}


def sanitize_return_path(candidate):
    if not isinstance(candidate, str) or not candidate:
        return "/"
    clean = candidate.split("?", 1)[0].split("#", 1)[0].strip()
    return clean if clean in ALLOWED_RETURN_PATHS else "/"


def build_stripe_form(product_id, product, success_url, cancel_url, include_pix=True):
    form_data = {}
    configured_price = os.environ.get(product["priceEnv"], "").strip() if product.get("priceEnv") else ""
    if configured_price:
        form_data["line_items[0][price]"] = configured_price
    else:
        form_data["line_items[0][price_data][currency]"] = "brl"
        form_data["line_items[0][price_data][unit_amount]"] = str(product["amountCents"])
        form_data["line_items[0][price_data][product_data][name]"] = product["name"]
        form_data["line_items[0][price_data][product_data][description]"] = product["description"]

    form_data["line_items[0][quantity]"] = "1"
    form_data["mode"] = "payment"
    form_data["success_url"] = success_url
    form_data["cancel_url"] = cancel_url
    form_data["metadata[product_id]"] = product_id
    form_data["metadata[unlocks]"] = ",".join(product["unlocks"])
    form_data["payment_method_types[0]"] = "card"
    if include_pix:
        form_data["payment_method_types[1]"] = "pix"
    return urllib.parse.urlencode(form_data).encode("utf-8")


def call_stripe_checkout(encoded_data):
    req = urllib.request.Request(
        "https://api.stripe.com/v1/checkout/sessions",
        data=encoded_data,
        method="POST",
    )
    req.add_header("Authorization", f"Bearer {STRIPE_SECRET_KEY}")
    req.add_header("Content-Type", "application/x-www-form-urlencoded")
    with urllib.request.urlopen(req, timeout=15) as resp:
        return json.loads(resp.read().decode("utf-8"))


class LotteryRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(204)
        self.end_headers()

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        if path == "/api/stripe-config":
            public_products = {
                pid: {
                    "name": p["name"],
                    "amountCents": p["amountCents"],
                    "unlocks": p["unlocks"],
                }
                for pid, p in PRODUCT_CATALOG.items()
            }
            self.send_json({
                "ok": True,
                "publicKey": STRIPE_PUBLIC_KEY,
                "currency": "BRL",
                "products": public_products,
            })
            return

        if path == "/api/verify-session":
            query = urllib.parse.parse_qs(parsed.query)
            session_id = query.get("session_id", [""])[0].strip()

            session_regex = r"^cs_(live|test)_[a-zA-Z0-9_-]{20,120}$"
            if not session_id or not re.match(session_regex, session_id):
                self.send_json({"ok": False, "error": "Identificador de sessão inválido ou ausente."}, status=400)
                return

            if not STRIPE_SECRET_KEY:
                self.send_json({"ok": False, "error": "Serviço de pagamento não configurado no servidor."}, status=503)
                return

            try:
                req = urllib.request.Request(
                    f"https://api.stripe.com/v1/checkout/sessions/{urllib.parse.quote(session_id)}"
                )
                req.add_header("Authorization", f"Bearer {STRIPE_SECRET_KEY}")
                with urllib.request.urlopen(req, timeout=15) as resp:
                    data = json.loads(resp.read().decode("utf-8"))
                    is_paid = data.get("payment_status") == "paid"
                    is_completed = data.get("status") == "complete"
                    is_correct_currency = str(data.get("currency") or "").lower() == "brl"
                    amount_cents = int(data.get("amount_total") or 0)

                    metadata = data.get("metadata") or {}
                    meta_product_id = str(metadata.get("product_id") or "").strip()
                    product_name = None
                    unlocks = []
                    is_correct_amount = False

                    if meta_product_id and meta_product_id in PRODUCT_CATALOG:
                        product = PRODUCT_CATALOG[meta_product_id]
                        is_correct_amount = amount_cents == product["amountCents"]
                        product_name = product["name"]
                        unlocks = product["unlocks"]
                    elif not meta_product_id and amount_cents == 1500:
                        meta_product_id = "legacy_all_15"
                        product_name = "Pacote 4 Loterias (Compra Anterior)"
                        unlocks = ["megasena", "lotofacil", "quina", "lotomania"]
                        is_correct_amount = True

                    verified = is_paid and is_completed and is_correct_amount and is_correct_currency

                    self.send_json({
                        "ok": True,
                        "paid": verified,
                        "productId": meta_product_id or None,
                        "productName": product_name,
                        "amountCents": amount_cents,
                        "unlocks": unlocks if verified else [],
                        "status": data.get("status"),
                        "customer_email": data.get("customer_details", {}).get("email") if data.get("customer_details") else None,
                    })
                    return
            except urllib.error.HTTPError as e:
                self.send_json({"ok": False, "error": "Sessão de pagamento não localizada ou expirada."}, status=e.code)
                return
            except Exception:
                self.send_json({"ok": False, "error": "Falha na verificação com o gateway de pagamento."}, status=500)
                return

        # Reescrever rota limpa /mega-da-virada para /mega-da-virada.html (compatível com Netlify)
        if path in ("/mega-da-virada", "/mega-da-virada/"):
            self.path = "/mega-da-virada.html" + (f"?{parsed.query}" if parsed.query else "")

        # Bloqueio de arquivos sensíveis (.env, arquivos ocultos, configs de servidor)
        clean_path = os.path.normpath(urllib.parse.unquote(path)).replace("\\", "/")
        parts = [p for p in clean_path.split("/") if p]
        if any(part.startswith(".") for part in parts) or any(
            part in ("server.py", "netlify.toml", "package.json", "package-lock.json") for part in parts
        ):
            self.send_error(403, "Acesso proibido.")
            return

        super().do_GET()

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        if path == "/api/create-checkout-session":
            content_len = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(content_len) if content_len > 0 else b"{}"
            try:
                payload = json.loads(body.decode("utf-8")) if body else {}
            except Exception:
                payload = {}

            product_id = str(payload.get("productId") or "").strip() if isinstance(payload, dict) else ""
            product = PRODUCT_CATALOG.get(product_id)
            if not product:
                self.send_json({"ok": False, "error": "Produto selecionado inválido."}, status=400)
                return

            allowed_origins = [
                "https://lotery-statistics.netlify.app",
                f"http://localhost:{PORT}",
                f"http://127.0.0.1:{PORT}",
            ]

            host_header = self.headers.get("Host", f"localhost:{PORT}")
            scheme = "https" if self.headers.get("X-Forwarded-Proto") == "https" else "http"
            default_origin = f"{scheme}://{host_header}"

            candidate_origin = payload.get("origin") or default_origin
            origin = "https://lotery-statistics.netlify.app"
            try:
                u = urllib.parse.urlparse(candidate_origin)
                norm = f"{u.scheme}://{u.netloc}"
                if (
                    norm in allowed_origins
                    or (u.scheme == "https" and u.netloc.endswith(".netlify.app"))
                    or u.hostname in ("localhost", "127.0.0.1")
                ):
                    origin = norm
            except Exception:
                pass

            safe_return_path = sanitize_return_path(payload.get("returnPath"))
            success_url = f"{origin}{safe_return_path}?payment=success&session_id={{CHECKOUT_SESSION_ID}}"
            cancel_url = f"{origin}{safe_return_path}?payment=canceled&product={urllib.parse.quote(product_id)}"

            product_link = os.environ.get(product["linkEnv"], "").strip() if product.get("linkEnv") else ""
            if not STRIPE_SECRET_KEY:
                if product_link:
                    self.send_json({"ok": True, "url": product_link, "fallback": True, "productId": product_id})
                    return
                self.send_json({"ok": False, "error": "Serviço de pagamento não configurado no servidor."}, status=503)
                return

            try:
                data = call_stripe_checkout(build_stripe_form(product_id, product, success_url, cancel_url, True))
                self.send_json({
                    "ok": True,
                    "url": data.get("url"),
                    "sessionId": data.get("id"),
                    "productId": product_id,
                })
                return
            except urllib.error.HTTPError as e:
                err_body = ""
                try:
                    err_body = e.read().decode("utf-8").lower()
                except Exception:
                    err_body = ""
                if e.code == 400 and ("pix" in err_body or "payment_method_types" in err_body):
                    try:
                        data = call_stripe_checkout(
                            build_stripe_form(product_id, product, success_url, cancel_url, False)
                        )
                        self.send_json({
                            "ok": True,
                            "url": data.get("url"),
                            "sessionId": data.get("id"),
                            "productId": product_id,
                        })
                        return
                    except Exception:
                        pass
                if product_link:
                    self.send_json({"ok": True, "url": product_link, "fallback": True, "productId": product_id})
                    return
                self.send_json({
                    "ok": False,
                    "error": "Não foi possível iniciar o checkout Stripe no momento. Tente novamente em instantes.",
                }, status=502)
                return
            except Exception:
                if product_link:
                    self.send_json({"ok": True, "url": product_link, "fallback": True, "productId": product_id})
                    return
                self.send_json({
                    "ok": False,
                    "error": "Falha de comunicação com o provedor de pagamento. Tente novamente em instantes.",
                }, status=502)
                return

        self.send_response(404)
        self.end_headers()

    def send_json(self, data, status=200):
        body = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)


def main():
    root_dir = Path(__file__).resolve().parent
    os.chdir(root_dir)

    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), LotteryRequestHandler) as httpd:
        print(f"Servidor Atlas das Loterias ativo em http://localhost:{PORT}")
        print("Landing page Mega da Virada: http://localhost:{}/mega-da-virada".format(PORT))
        print("Gateway Stripe multi-produto configurado (planilhas a partir de R$ 10,00)")
        print("Pressione Ctrl+C para encerrar.")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nServidor encerrado.")


if __name__ == "__main__":
    main()
