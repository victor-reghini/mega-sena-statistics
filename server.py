#!/usr/bin/env python3
"""
Servidor HTTP leve para o Atlas Estatístico das Loterias Caixa.
Serve arquivos estáticos e gerencia sessões de checkout do Stripe (R$ 15,00).
Sem dependências externas - utiliza apenas a biblioteca padrão do Python 3.
"""

import http.server
import json
import os
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
            if not session_id:
                self.send_json({"ok": False, "error": "session_id ausente"}, status=400)
                return

            try:
                req = urllib.request.Request(
                    f"https://api.stripe.com/v1/checkout/sessions/{urllib.parse.quote(session_id)}"
                )
                req.add_header("Authorization", f"Bearer {STRIPE_SECRET_KEY}")
                with urllib.request.urlopen(req, timeout=15) as resp:
                    data = json.loads(resp.read().decode("utf-8"))
                    paid = (data.get("payment_status") == "paid")
                    self.send_json({
                        "ok": True,
                        "paid": paid,
                        "status": data.get("status"),
                        "customer_email": data.get("customer_details", {}).get("email") if data.get("customer_details") else None
                    })
                    return
            except urllib.error.HTTPError as e:
                err_body = e.read().decode("utf-8")
                self.send_json({"ok": False, "error": f"Erro Stripe: {e.code}", "detail": err_body}, status=e.code)
                return
            except Exception as e:
                self.send_json({"ok": False, "error": str(e)}, status=500)
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

            # Obter a origem da requisição para montar as URLs de retorno
            host_header = self.headers.get("Host", f"localhost:{PORT}")
            scheme = "https" if self.headers.get("X-Forwarded-Proto") == "https" else "http"
            origin = payload.get("origin") or f"{scheme}://{host_header}"

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
            except urllib.error.HTTPError as e:
                err_body = e.read().decode("utf-8")
                # Fallback para o link de pagamento caso a criação dinâmica falhe
                self.send_json({
                    "ok": True,
                    "url": STRIPE_PAYMENT_LINK,
                    "fallback": True,
                    "notice": "Usando link direto de pagamento Stripe"
                })
                return
            except Exception as e:
                self.send_json({
                    "ok": True,
                    "url": STRIPE_PAYMENT_LINK,
                    "fallback": True,
                    "error": str(e)
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

