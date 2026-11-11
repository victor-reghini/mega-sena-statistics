#!/usr/bin/env python3
"""
Servidor HTTP leve para o Atlas Estatístico das Loterias Caixa.
Serve arquivos estáticos e gerencia sessões de checkout do Stripe (R$ 15,00).
Sem dependências externas - utiliza apenas a biblioteca padrão do Python 3.
"""

import http.server
import json
import os
import re
import socketserver
import sys
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

STRIPE_SECRET_KEY = os.environ.get("STRIPE_SECRET_KEY", "")
STRIPE_PUBLIC_KEY = os.environ.get(
    "STRIPE_PUBLIC_KEY",
    "pk_live_51UZBcCLbOL7pa0nJ9KZUc0S3yOubmdMqUXKPITZioDaIJZspSTytfWfkANsqEG59zA4v4xrHwofLRzPHN3XNXVhc00xahGUgKA"
)
STRIPE_PRICE_ID = os.environ.get("STRIPE_PRICE_ID", "price_1UaaJVLbOL7pa0nJ0ROoF0wr")
STRIPE_PAYMENT_LINK = os.environ.get(
    "STRIPE_PAYMENT_LINK",
    "https://buy.stripe.com/bJe6oI5Sd2JbgDLewzeQM00"
)
PORT = int(os.environ.get("PORT", "8080"))


class LotteryRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Habilitar CORS para integrações locais
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
            self.send_json({
                "ok": True,
                "publicKey": STRIPE_PUBLIC_KEY,
                "paymentLink": STRIPE_PAYMENT_LINK,
                "price": 15.00,
                "currency": "BRL"
            })
            return

        if path == "/api/verify-session":
            query = urllib.parse.parse_qs(parsed.query)
            session_id = query.get("session_id", [""])[0].strip()

            SESSION_REGEX = r"^cs_(live|test)_[a-zA-Z0-9_-]{20,120}$"
            if not session_id or not re.match(SESSION_REGEX, session_id):
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
                    is_paid = (data.get("payment_status") == "paid")
                    is_completed = (data.get("status") == "complete")
                    is_correct_amount = (int(data.get("amount_total") or 0) == 1500)
                    is_correct_currency = (str(data.get("currency") or "").lower() == "brl")

                    verified = is_paid and is_completed and is_correct_amount and is_correct_currency

                    self.send_json({
                        "ok": True,
                        "paid": verified,
                        "status": data.get("status"),
                        "customer_email": data.get("customer_details", {}).get("email") if data.get("customer_details") else None
                    })
                    return
            except urllib.error.HTTPError as e:
                self.send_json({"ok": False, "error": "Sessão de pagamento não localizada ou expirada."}, status=e.code)
                return
            except Exception as e:
                self.send_json({"ok": False, "error": "Falha na verificação com o gateway de pagamento."}, status=500)
                return

        # Bloqueio de arquivos sensíveis (.env, arquivos ocultos, configs de servidor)
        clean_path = os.path.normpath(urllib.parse.unquote(path)).replace("\\", "/")
        parts = [p for p in clean_path.split("/") if p]
        if any(part.startswith(".") for part in parts) or any(part in ("server.py", "netlify.toml", "package.json", "package-lock.json") for part in parts):
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

            # Validação e sanitização da origem de retorno (Allowlist de segurança)
            ALLOWED_ORIGINS = [
                "https://lotery-statistics.netlify.app",
                f"http://localhost:{PORT}",
                f"http://127.0.0.1:{PORT}"
            ]

            host_header = self.headers.get("Host", f"localhost:{PORT}")
            scheme = "https" if self.headers.get("X-Forwarded-Proto") == "https" else "http"
            default_origin = f"{scheme}://{host_header}"

            candidate_origin = payload.get("origin") or default_origin
            origin = "https://lotery-statistics.netlify.app"
            try:
                u = urllib.parse.urlparse(candidate_origin)
                norm = f"{u.scheme}://{u.netloc}"
                if norm in ALLOWED_ORIGINS or u.netloc.endswith(".netlify.app") or "localhost" in u.netloc or "127.0.0.1" in u.netloc:
                    origin = norm
            except Exception:
                pass

            success_url = f"{origin}/?payment=success&session_id={{CHECKOUT_SESSION_ID}}"
            cancel_url = f"{origin}/?payment=canceled"

            form_data = {
                "line_items[0][price]": STRIPE_PRICE_ID,
                "line_items[0][quantity]": "1",
                "mode": "payment",
                "success_url": success_url,
                "cancel_url": cancel_url,
                "payment_method_types[0]": "card",
                "payment_method_types[1]": "pix"
            }
            encoded_data = urllib.parse.urlencode(form_data).encode("utf-8")

            try:
                req = urllib.request.Request(
                    "https://api.stripe.com/v1/checkout/sessions",
                    data=encoded_data,
                    method="POST"
                )
                req.add_header("Authorization", f"Bearer {STRIPE_SECRET_KEY}")
                req.add_header("Content-Type", "application/x-www-form-urlencoded")

                with urllib.request.urlopen(req, timeout=15) as resp:
                    data = json.loads(resp.read().decode("utf-8"))
                    self.send_json({
                        "ok": True,
                        "url": data.get("url"),
                        "sessionId": data.get("id"),
                        "paymentLink": STRIPE_PAYMENT_LINK
                    })
                    return
            except urllib.error.HTTPError:
                # Fallback para o link de pagamento caso a criação dinâmica falhe
                self.send_json({
                    "ok": True,
                    "url": STRIPE_PAYMENT_LINK,
                    "fallback": True,
                    "notice": "Usando link direto de pagamento Stripe"
                })
                return
            except Exception:
                self.send_json({
                    "ok": True,
                    "url": STRIPE_PAYMENT_LINK,
                    "fallback": True
                })
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
        print(f"Gateway Stripe configurado (R$ 15,00)")
        print(f"Pressione Ctrl+C para encerrar.")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nServidor encerrado.")


if __name__ == "__main__":
    main()

