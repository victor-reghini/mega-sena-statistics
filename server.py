#!/usr/bin/env python3
"""
Servidor HTTP leve para o Atlas Estatístico das Loterias Caixa.
Serve arquivos estáticos, a landing page /mega-da-virada, gerencia sessões Stripe com assinatura HMAC-SHA256
(impedindo bypass por URL, query ou console) e envia planilhas por e-mail via reghinidev@gmail.com.
Sem dependências externas - utiliza apenas a biblioteca padrão do Python 3.
"""

import base64
from email.message import EmailMessage
import hashlib
import hmac
import html
import http.server
import json
import os
import re
import secrets
import smtplib
import socketserver
import ssl
import sys
import time
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
STRIPE_PRICE_ID = os.environ.get("STRIPE_PRICE_ID", "price_1UaaJVLbOL7pa0nJ0ROoF0wr").strip()
STRIPE_PAYMENT_LINK = os.environ.get(
    "STRIPE_PAYMENT_LINK",
    "https://buy.stripe.com/bJe6oI5Sd2JbgDLewzeQM00"
).strip()

SMTP_USER = os.environ.get("SMTP_USER", "reghinidev@gmail.com").strip() or "reghinidev@gmail.com"
SMTP_PASSWORD = (os.environ.get("SMTP_PASSWORD", "") or os.environ.get("GMAIL_APP_PASSWORD", "")).strip()
SMTP_HOST = os.environ.get("SMTP_HOST", "smtp.gmail.com").strip() or "smtp.gmail.com"
SMTP_PORT = int(os.environ.get("SMTP_PORT", "465"))
PORT = int(os.environ.get("PORT", "8080"))

ALL_LOTTERIES = [
    "megasena",
    "lotofacil",
    "quina",
    "lotomania",
    "maismilionaria",
    "timemania",
    "duplasena",
    "diadesorte",
    "supersete",
]

PRODUCT_CATALOG = {
    "export_megasena": {
        "name": "Planilha Mega-Sena + Mega da Virada (XLSX + PDF)",
        "description": "Base completa de resultados da Mega-Sena e todas as edições da Mega da Virada em Excel (.xlsx) e PDF.",
        "amountCents": 1000,
        "unlocks": ["megasena"],
        "priceEnv": "STRIPE_PRICE_ID_EXPORT_MEGASENA",
        "linkEnv": "STRIPE_LINK_EXPORT_MEGASENA",
        "defaultPriceId": "price_1UdY0eLbOL7pa0nJXI2uQFTq",
        "defaultLink": "https://buy.stripe.com/aFa6oI94p1F73QZ88beQM01",
    },
    "export_lotofacil": {
        "name": "Planilha Lotofácil + Independência (XLSX + PDF)",
        "description": "Base completa de resultados da Lotofácil e Lotofácil da Independência em Excel (.xlsx) e PDF.",
        "amountCents": 1000,
        "unlocks": ["lotofacil"],
        "priceEnv": "STRIPE_PRICE_ID_EXPORT_LOTOFACIL",
        "linkEnv": "STRIPE_LINK_EXPORT_LOTOFACIL",
        "defaultPriceId": "price_1UdY0gLbOL7pa0nJBrD7rC7F",
        "defaultLink": "https://buy.stripe.com/eVqfZi1BX5Vndrz9cfeQM02",
    },
    "export_quina": {
        "name": "Planilha Quina + São João (XLSX + PDF)",
        "description": "Base completa de resultados da Quina e Quina de São João em Excel (.xlsx) e PDF.",
        "amountCents": 1000,
        "unlocks": ["quina"],
        "priceEnv": "STRIPE_PRICE_ID_EXPORT_QUINA",
        "linkEnv": "STRIPE_LINK_EXPORT_QUINA",
        "defaultPriceId": "price_1UdY0hLbOL7pa0nJIH7PZBlW",
        "defaultLink": "https://buy.stripe.com/4gM8wQ5Sd1F7fzH0FJeQM03",
    },
    "export_lotomania": {
        "name": "Planilha Lotomania + Páscoa (XLSX + PDF)",
        "description": "Base completa de resultados da Lotomania e Lotomania de Páscoa em Excel (.xlsx) e PDF.",
        "amountCents": 1000,
        "unlocks": ["lotomania"],
        "priceEnv": "STRIPE_PRICE_ID_EXPORT_LOTOMANIA",
        "linkEnv": "STRIPE_LINK_EXPORT_LOTOMANIA",
        "defaultPriceId": "price_1UdY0iLbOL7pa0nJO77PSg9g",
        "defaultLink": "https://buy.stripe.com/9B6dRa3K5abDevDewzeQM04",
    },
    "export_maismilionaria": {
        "name": "Planilha +Milionária Completa (XLSX + PDF)",
        "description": "Base completa de resultados da +Milionária (6 dezenas + 2 trevos e 10 faixas de rateio) em Excel (.xlsx) e PDF.",
        "amountCents": 1000,
        "unlocks": ["maismilionaria"],
        "priceEnv": "STRIPE_PRICE_ID_EXPORT_MAISMILIONARIA",
        "linkEnv": "STRIPE_LINK_EXPORT_MAISMILIONARIA",
        "defaultPriceId": "price_1Uf1U7LbOL7pa0nJBxgL5iRa",
        "defaultLink": "https://buy.stripe.com/28E00k0xTfvX3QZ2NReQM09",
    },
    "export_timemania": {
        "name": "Planilha Timemania Completa (XLSX + PDF)",
        "description": "Base completa de resultados da Timemania (7 dezenas + Time do Coração) em Excel (.xlsx) e PDF.",
        "amountCents": 1000,
        "unlocks": ["timemania"],
        "priceEnv": "STRIPE_PRICE_ID_EXPORT_TIMEMANIA",
        "linkEnv": "STRIPE_LINK_EXPORT_TIMEMANIA",
        "defaultPriceId": "price_1Uf1U9LbOL7pa0nJG6V3Bdg1",
        "defaultLink": "https://buy.stripe.com/eVq3cw0xTcjLdrz1JNeQM0a",
    },
    "export_duplasena": {
        "name": "Planilha Dupla Sena + Dupla de Páscoa (XLSX + PDF)",
        "description": "Base completa de resultados da Dupla Sena (1º e 2º sorteios) e edições da Dupla de Páscoa em Excel (.xlsx) e PDF.",
        "amountCents": 1000,
        "unlocks": ["duplasena"],
        "priceEnv": "STRIPE_PRICE_ID_EXPORT_DUPLASENA",
        "linkEnv": "STRIPE_LINK_EXPORT_DUPLASENA",
        "defaultPriceId": "price_1Uf1UALbOL7pa0nJHJP9GZ8y",
        "defaultLink": "https://buy.stripe.com/00wfZidkF3Nf3QZ2NReQM0b",
    },
    "export_diadesorte": {
        "name": "Planilha Dia de Sorte Completa (XLSX + PDF)",
        "description": "Base completa de resultados do Dia de Sorte (7 dezenas + Mês da Sorte) em Excel (.xlsx) e PDF.",
        "amountCents": 1000,
        "unlocks": ["diadesorte"],
        "priceEnv": "STRIPE_PRICE_ID_EXPORT_DIADESORTE",
        "linkEnv": "STRIPE_LINK_EXPORT_DIADESORTE",
        "defaultPriceId": "price_1Uf1UCLbOL7pa0nJhjK2JkFC",
        "defaultLink": "https://buy.stripe.com/9B6bJ23K5dnPafn3RVeQM0c",
    },
    "export_supersete": {
        "name": "Planilha Super Sete Completa (XLSX + PDF)",
        "description": "Base completa de resultados do Super Sete (7 colunas numeradas de 0 a 9) em Excel (.xlsx) e PDF.",
        "amountCents": 1000,
        "unlocks": ["supersete"],
        "priceEnv": "STRIPE_PRICE_ID_EXPORT_SUPERSETE",
        "linkEnv": "STRIPE_LINK_EXPORT_SUPERSETE",
        "defaultPriceId": "price_1Uf1UELbOL7pa0nJ8M1azGUo",
        "defaultLink": "https://buy.stripe.com/aFa28sgwR4Rj87ffADeQM0d",
    },
    "combo_all": {
        "name": "Combo 9 Loterias Completo (XLSX + PDF)",
        "description": "Acesso para exportar todas as 9 loterias oficiais da Caixa e todos os concursos especiais.",
        "amountCents": 2490,
        "unlocks": list(ALL_LOTTERIES),
        "priceEnv": "STRIPE_PRICE_ID_COMBO_ALL",
        "linkEnv": "STRIPE_LINK_COMBO_ALL",
        "defaultPriceId": "price_1UdY0lLbOL7pa0nJk1nYqxgl",
        "defaultLink": "https://buy.stripe.com/00weVe3K583v9bjewzeQM05",
    },
    "kit_bolao_virada": {
        "name": "Kit Bolão Mega da Virada 2026 (Excel + Guia PDF)",
        "description": "Planilha com rateio de cotas, conferidor automático do concurso 3100, histórico da Virada e guia em PDF.",
        "amountCents": 1490,
        "unlocks": ["kit_bolao_virada"],
        "priceEnv": "STRIPE_PRICE_ID_KIT_BOLAO_VIRADA",
        "linkEnv": "STRIPE_LINK_KIT_BOLAO_VIRADA",
        "defaultPriceId": "price_1UdY0nLbOL7pa0nJEJv2AN3m",
        "defaultLink": "https://buy.stripe.com/aFabJ2gwR0B39bj88beQM06",
    },
    "dossie_especiais": {
        "name": "Dossiê Concursos Especiais (XLSX + PDF)",
        "description": "Comparativo histórico em Excel e PDF de Mega da Virada, Independência, Quina de São João, Dupla de Páscoa e Lotomania de Páscoa.",
        "amountCents": 1990,
        "unlocks": ["dossie_especiais"],
        "priceEnv": "STRIPE_PRICE_ID_DOSSIE_ESPECIAIS",
        "linkEnv": "STRIPE_LINK_DOSSIE_ESPECIAIS",
        "defaultPriceId": "price_1UdY0oLbOL7pa0nJiwGingZg",
        "defaultLink": "https://buy.stripe.com/4gM00k94p5VngDLgEHeQM07",
    },
    "super_combo": {
        "name": "Pacote Completo Atlas + Virada (9 Loterias + Kit Bolão + Dossiê)",
        "description": "Todas as 9 planilhas oficiais + Kit Bolão Mega da Virada 2026 + Dossiê Concursos Especiais.",
        "amountCents": 3490,
        "unlocks": [*ALL_LOTTERIES, "kit_bolao_virada", "dossie_especiais"],
        "priceEnv": "STRIPE_PRICE_ID_SUPER_COMBO",
        "linkEnv": "STRIPE_LINK_SUPER_COMBO",
        "defaultPriceId": "price_1UdY0pLbOL7pa0nJFrkhnZIt",
        "defaultLink": "https://buy.stripe.com/eVqeVebcxgA1cnvbkneQM08",
    },
}

ALLOWED_RETURN_PATHS = {
    "/",
    "/index.html",
    "/mega-da-virada",
    "/mega-da-virada.html",
}

SESSION_REGEX = r"^cs_(live|test)_[a-zA-Z0-9_-]{20,120}$"


def sanitize_return_path(candidate):
    if not isinstance(candidate, str) or not candidate:
        return "/"
    clean = candidate.split("?", 1)[0].split("#", 1)[0].strip()
    return clean if clean in ALLOWED_RETURN_PATHS else "/"


def sign_export_token(payload, secret_key):
    raw = json.dumps(payload, separators=(",", ":"), ensure_ascii=False).encode("utf-8")
    payload_b64 = base64.urlsafe_b64encode(raw).decode("ascii").rstrip("=")
    sig = hmac.new(secret_key.encode("utf-8"), payload_b64.encode("utf-8"), hashlib.sha256).hexdigest()
    return f"{payload_b64}.{sig}"


def verify_export_token(token_str, secret_key):
    if not isinstance(token_str, str) or not token_str or not secret_key:
        return None
    parts = token_str.strip().split(".")
    if len(parts) != 2:
        return None
    payload_b64, provided_sig = parts
    if not payload_b64 or not provided_sig or not re.match(r"^[a-fA-F0-9]{64}$", provided_sig):
        return None

    expected_sig = hmac.new(secret_key.encode("utf-8"), payload_b64.encode("utf-8"), hashlib.sha256).hexdigest()
    if not hmac.compare_digest(provided_sig.lower(), expected_sig.lower()):
        return None

    try:
        padding = "=" * ((4 - len(payload_b64) % 4) % 4)
        raw_json = base64.urlsafe_b64decode((payload_b64 + padding).encode("ascii")).decode("utf-8")
        payload = json.loads(raw_json)
        if not isinstance(payload, dict):
            return None
        sid = str(payload.get("sid") or "")
        if not re.match(SESSION_REGEX, sid):
            return None
        unlocks = payload.get("unlocks")
        if not isinstance(unlocks, list) or len(unlocks) == 0:
            return None
        now_ms = int(time.time() * 1000)
        if int(payload.get("exp") or 0) <= now_ms:
            return None
        return payload
    except Exception:
        return None


def is_target_allowed(target, unlocks):
    unlock_set = set(unlocks or [])
    if target in ("status_check", "purchased_bundle", "auto_bundle"):
        return len(unlock_set) > 0
    if target == "all":
        return all(k in unlock_set for k in ALL_LOTTERIES)
    return target in unlock_set


def is_valid_email_address(email):
    if not isinstance(email, str):
        return False
    clean = email.strip().lower()
    if len(clean) < 6 or len(clean) > 254:
        return False
    if not re.match(r"^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,18}$", clean, re.IGNORECASE):
        return False
    domain = clean.split("@", 1)[1]
    if domain.startswith(".") or domain.endswith(".") or ".." in domain:
        return False
    return True


def verify_generic_token(token_str, secret_key):
    if not isinstance(token_str, str) or not token_str or not secret_key:
        return None
    parts = token_str.strip().split(".")
    if len(parts) != 2:
        return None
    payload_b64, provided_sig = parts
    if not payload_b64 or not provided_sig or not re.match(r"^[a-fA-F0-9]{64}$", provided_sig):
        return None
    expected_sig = hmac.new(secret_key.encode("utf-8"), payload_b64.encode("utf-8"), hashlib.sha256).hexdigest()
    if not hmac.compare_digest(provided_sig.lower(), expected_sig.lower()):
        return None
    try:
        padding = "=" * ((4 - len(payload_b64) % 4) % 4)
        raw_json = base64.urlsafe_b64decode((payload_b64 + padding).encode("ascii")).decode("utf-8")
        payload = json.loads(raw_json)
        if not isinstance(payload, dict):
            return None
        if int(payload.get("exp") or 0) <= int(time.time() * 1000):
            return None
        return payload
    except Exception:
        return None


def verify_email_token(token_str, secret_key, expected_email="", expected_product_id=""):
    payload = verify_generic_token(token_str, secret_key)
    if not payload:
        return None
    if payload.get("purpose") != "verified_purchase_email" or payload.get("verified") is not True:
        return None
    if expected_email and str(payload.get("email") or "").lower() != expected_email.lower():
        return None
    if expected_product_id and payload.get("productId") != expected_product_id:
        return None
    return payload


def compute_otp_code(email, product_id, nonce, secret_key):
    msg = f"otp:{email.lower()}:{product_id}:{nonce}".encode("utf-8")
    digest = hmac.new(secret_key.encode("utf-8"), msg, hashlib.sha256).digest()
    num = int.from_bytes(digest[:4], "big") % 900000
    return str(100000 + num)


def build_receipt_html(receipt_number, session_id, product_name, amount_formatted, paid_at_formatted, verified_email, sender_email, attachment_names):
    safe_receipt_number = html.escape(str(receipt_number))
    safe_session_id = html.escape(str(session_id))
    safe_product_name = html.escape(str(product_name))
    safe_amount_formatted = html.escape(str(amount_formatted))
    safe_paid_at_formatted = html.escape(str(paid_at_formatted))
    safe_verified_email = html.escape(str(verified_email))
    safe_sender_email = html.escape(str(sender_email))

    files_li = "".join(
        f'<li style="margin:4px 0;font-family:monospace;font-size:13px;">{html.escape(name)}</li>'
        for name in attachment_names
    )
    return f"""<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>Recibo {safe_receipt_number} - Atlas das Loterias Caixa</title>
</head>
<body style="font-family:system-ui,-apple-system,sans-serif;background:#F7F5F0;color:#14261C;padding:24px;margin:0;">
  <div style="max-width:620px;margin:0 auto;background:#FFFFFF;border:1.5px solid #94A69B;border-radius:8px;padding:24px;">
    <div style="border-bottom:2px solid #0F5C3A;padding-bottom:14px;margin-bottom:18px;">
      <span style="display:inline-block;background:#E5F2EB;color:#0F5C3A;font-weight:700;font-size:11px;padding:3px 8px;border-radius:4px;margin-bottom:6px;">PAGAMENTO CONFIRMADO E ARQUIVOS ENTREGUES</span>
      <h1 style="margin:0;font-size:20px;color:#0F5C3A;">Recibo Oficial de Compra</h1>
      <p style="margin:4px 0 0;font-size:13px;color:#3D5245;">Atlas Estatístico das Loterias Caixa</p>
    </div>
    <p style="margin:0 0 16px;font-size:14px;line-height:1.5;">
      Olá! Confirmamos o seu pagamento via Stripe. Os arquivos adquiridos e este recibo oficial foram enviados para o seu e-mail validado (<strong>{safe_verified_email}</strong>).
    </p>
    <div style="background:#F7F5F0;border:1px solid #C8D4CC;border-radius:6px;padding:16px;margin-bottom:18px;">
      <table style="width:100%;border-collapse:collapse;font-size:13px;">
        <tr><td style="padding:6px 0;color:#3D5245;"><strong>Número do Recibo:</strong></td><td style="padding:6px 0;text-align:right;font-family:monospace;font-weight:700;">{safe_receipt_number}</td></tr>
        <tr><td style="padding:6px 0;color:#3D5245;"><strong>Data / Hora da Confirmação:</strong></td><td style="padding:6px 0;text-align:right;">{safe_paid_at_formatted}</td></tr>
        <tr><td style="padding:6px 0;color:#3D5245;"><strong>Produto Adquirido:</strong></td><td style="padding:6px 0;text-align:right;font-weight:700;">{safe_product_name}</td></tr>
        <tr><td style="padding:6px 0;color:#3D5245;"><strong>Valor Total Pago:</strong></td><td style="padding:6px 0;text-align:right;font-weight:700;color:#0F5C3A;font-size:15px;">{safe_amount_formatted}</td></tr>
        <tr><td style="padding:6px 0;color:#3D5245;"><strong>E-mail Cadastrado e Validado:</strong></td><td style="padding:6px 0;text-align:right;">{safe_verified_email}</td></tr>
        <tr><td style="padding:6px 0;color:#3D5245;"><strong>ID da Transação Stripe:</strong></td><td style="padding:6px 0;text-align:right;font-family:monospace;font-size:12px;">{safe_session_id}</td></tr>
        <tr><td style="padding:6px 0;color:#3D5245;"><strong>Status:</strong></td><td style="padding:6px 0;text-align:right;color:#0F5C3A;font-weight:700;">QUITADO (PAID)</td></tr>
      </table>
    </div>
    <div style="margin-bottom:18px;">
      <strong style="font-size:13px;display:block;margin-bottom:6px;color:#14261C;">Arquivos anexados neste e-mail ({len(attachment_names)}):</strong>
      <ul style="margin:0;padding-left:20px;color:#14261C;">{files_li}</ul>
    </div>
    <div style="border-top:1px solid #C8D4CC;padding-top:12px;font-size:12px;color:#3D5245;">
      <p style="margin:0;">Remetente e suporte oficial: <strong>{safe_sender_email}</strong></p>
      <p style="margin:4px 0 0;">Guarde este recibo para seu controle. Caso precise de reenvio ou suporte, basta responder a este e-mail.</p>
    </div>
  </div>
</body>
</html>"""


def build_base_form(product_id, product, success_url, cancel_url, payment_mode, verified_email=""):
    form_data = {
        "line_items[0][quantity]": "1",
        "mode": "payment",
        "success_url": success_url,
        "cancel_url": cancel_url,
        "metadata[product_id]": product_id,
        "metadata[unlocks]": ",".join(product["unlocks"]),
    }
    if verified_email:
        form_data["customer_email"] = verified_email
        form_data["metadata[verified_email]"] = verified_email
    if payment_mode == "card_pix":
        form_data["payment_method_types[0]"] = "card"
        form_data["payment_method_types[1]"] = "pix"
    elif payment_mode == "card_only":
        form_data["payment_method_types[0]"] = "card"
    return form_data


def post_stripe_session(form_dict):
    encoded = urllib.parse.urlencode(form_dict).encode("utf-8")
    req = urllib.request.Request(
        "https://api.stripe.com/v1/checkout/sessions",
        data=encoded,
        method="POST",
    )
    req.add_header("Authorization", f"Bearer {STRIPE_SECRET_KEY}")
    req.add_header("Content-Type", "application/x-www-form-urlencoded")
    with urllib.request.urlopen(req, timeout=15) as resp:
        return json.loads(resp.read().decode("utf-8"))


def try_create_with_modes(build_dict_fn):
    for mode in ("auto", "card_only", "card_pix"):
        form_dict = build_dict_fn(mode)
        try:
            data = post_stripe_session(form_dict)
            if data and data.get("url"):
                return data
        except urllib.error.HTTPError as e:
            err_body = ""
            try:
                err_body = e.read().decode("utf-8")
            except Exception:
                err_body = ""
            print(f"[Stripe Checkout attempt ({mode})] HTTP {e.code}: {err_body[:240]}", file=sys.stderr)
            low = err_body.lower()
            if e.code == 403 or "permission" in low or "rak_" in low:
                break
        except Exception as e:
            print(f"[Stripe Checkout error ({mode})]: {e}", file=sys.stderr)
            break
    return None


def fetch_product_from_price(price_id):
    if not price_id or not STRIPE_SECRET_KEY:
        return None
    try:
        req = urllib.request.Request(
            f"https://api.stripe.com/v1/prices/{urllib.parse.quote(price_id)}"
        )
        req.add_header("Authorization", f"Bearer {STRIPE_SECRET_KEY}")
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            prod = data.get("product")
            return prod if isinstance(prod, str) else None
    except Exception:
        return None


def fetch_stripe_session(session_id):
    req = urllib.request.Request(
        f"https://api.stripe.com/v1/checkout/sessions/{urllib.parse.quote(session_id)}"
    )
    req.add_header("Authorization", f"Bearer {STRIPE_SECRET_KEY}")
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
                "senderEmail": SMTP_USER,
                "products": public_products,
            })
            return

        if path == "/api/verify-session":
            query = urllib.parse.parse_qs(parsed.query)
            session_id = query.get("session_id", [""])[0].strip()

            if not session_id or not re.match(SESSION_REGEX, session_id):
                self.send_json({"ok": False, "paid": False, "error": "Identificador de sessão inválido ou ausente."}, status=400)
                return

            if not STRIPE_SECRET_KEY:
                self.send_json({"ok": False, "paid": False, "error": "Serviço de pagamento não configurado no servidor."}, status=503)
                return

            try:
                data = fetch_stripe_session(session_id)
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
                    is_correct_amount = amount_cents >= product["amountCents"]
                    product_name = product["name"]
                    unlocks = product["unlocks"]
                elif not meta_product_id and amount_cents == 1500:
                    meta_product_id = "legacy_all_15"
                    product_name = "Pacote 4 Loterias (Compra Anterior)"
                    unlocks = ["megasena", "lotofacil", "quina", "lotomania"]
                    is_correct_amount = True

                verified = is_paid and is_completed and is_correct_amount and is_correct_currency and len(unlocks) > 0
                verified_meta_email = str(metadata.get("verified_email") or "").strip().lower()
                stripe_cust_email = (
                    (data.get("customer_details", {}).get("email") if data.get("customer_details") else "")
                    or data.get("customer_email")
                    or ""
                )
                customer_email = verified_meta_email or str(stripe_cust_email).strip().lower() or None

                clean_sid_tail = re.sub(r"[^a-zA-Z0-9]", "", session_id)[-10:].upper()
                receipt_number = f"REC-ATLAS-{clean_sid_tail}"
                paid_at_iso = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(int(data.get("created") or time.time())))
                amount_formatted = f"R$ {(amount_cents / 100):.2f}".replace(".", ",")

                export_token = None
                receipt = None
                if verified:
                    now_ms = int(time.time() * 1000)
                    receipt = {
                        "receiptNumber": receipt_number,
                        "sessionId": session_id,
                        "paymentIntent": str(data.get("payment_intent") or ""),
                        "productId": meta_product_id,
                        "productName": product_name,
                        "amountCents": amount_cents,
                        "amountFormatted": amount_formatted,
                        "currency": "BRL",
                        "customerEmail": customer_email or "",
                        "paidAtIso": paid_at_iso,
                        "senderEmail": SMTP_USER,
                    }
                    export_token = sign_export_token(
                        {
                            "sid": session_id,
                            "pid": meta_product_id,
                            "productName": product_name,
                            "amountCents": amount_cents,
                            "receiptNumber": receipt_number,
                            "paidAtIso": paid_at_iso,
                            "unlocks": unlocks,
                            "email": customer_email or "",
                            "iat": now_ms,
                            "exp": now_ms + 30 * 24 * 60 * 60 * 1000,
                        },
                        STRIPE_SECRET_KEY,
                    )

                self.send_json({
                    "ok": True,
                    "paid": verified,
                    "exportToken": export_token,
                    "productId": meta_product_id or None,
                    "productName": product_name,
                    "amountCents": amount_cents,
                    "unlocks": unlocks if verified else [],
                    "status": data.get("status"),
                    "customer_email": customer_email,
                    "receipt": receipt,
                })
                return
            except urllib.error.HTTPError as e:
                self.send_json({"ok": False, "paid": False, "error": "Sessão de pagamento não localizada ou expirada."}, status=e.code)
                return
            except Exception:
                self.send_json({"ok": False, "paid": False, "error": "Falha na verificação com o gateway de pagamento."}, status=500)
                return

        if path in ("/mega-da-virada", "/mega-da-virada/"):
            self.path = "/mega-da-virada.html" + (f"?{parsed.query}" if parsed.query else "")

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

        content_len = int(self.headers.get("Content-Length", 0))
        raw_body = self.rfile.read(content_len) if content_len > 0 else b"{}"
        try:
            payload = json.loads(raw_body.decode("utf-8")) if raw_body else {}
        except Exception:
            payload = {}
        if not isinstance(payload, dict):
            payload = {}

        if path == "/api/email-verification":
            if not STRIPE_SECRET_KEY:
                self.send_json({"ok": False, "error": "Serviço de verificação não configurado no servidor."}, status=503)
                return

            action = str(payload.get("action") or "").strip()
            email = str(payload.get("email") or "").strip().lower()
            product_id = str(payload.get("productId") or "").strip()
            product = PRODUCT_CATALOG.get(product_id)

            if not is_valid_email_address(email):
                self.send_json({"ok": False, "error": "Informe um endereço de e-mail válido (exemplo: seuemail@dominio.com)."}, status=400)
                return

            if not product:
                self.send_json({"ok": False, "error": "Produto selecionado inválido."}, status=400)
                return

            if action == "request_code":
                now_ms = int(time.time() * 1000)
                nonce = secrets.token_hex(12)
                otp_code = compute_otp_code(email, product_id, nonce, STRIPE_SECRET_KEY)
                challenge_token = sign_export_token(
                    {
                        "purpose": "email_otp_challenge",
                        "email": email,
                        "productId": product_id,
                        "nonce": nonce,
                        "iat": now_ms,
                        "exp": now_ms + 15 * 60 * 1000,
                    },
                    STRIPE_SECRET_KEY,
                )
                amount_fmt = f"R$ {(product['amountCents'] / 100):.2f}".replace(".", ",")
                product_label = f"{product['name']} ({amount_fmt})"
                email_sent = False
                smtp_notice = None

                if SMTP_PASSWORD:
                    try:
                        msg = EmailMessage()
                        msg["Subject"] = f"[Código {otp_code}] Validação de E-mail - Atlas das Loterias Caixa"
                        msg["From"] = f"Atlas das Loterias Caixa <{SMTP_USER}>"
                        msg["To"] = email
                        msg["Reply-To"] = SMTP_USER
                        msg.set_content(
                            f"Seu código de validação de 6 dígitos é: {otp_code}\n\n"
                            f"Produto selecionado: {product_label}\n"
                            f"Após o pagamento, os arquivos e o recibo serão enviados para {email}.\n"
                        )
                        msg.add_alternative(
                            f"""
                            <div style="font-family:system-ui,-apple-system,sans-serif;max-width:560px;margin:0 auto;color:#14261C;background:#FFFFFF;border:1px solid #C8D4CC;border-radius:8px;padding:24px;">
                              <span style="display:inline-block;background:#E5F2EB;color:#0F5C3A;font-weight:700;font-size:12px;padding:4px 10px;border-radius:4px;margin-bottom:12px;">VALIDAÇÃO DE E-MAIL PARA COMPRA</span>
                              <h2 style="color:#0F5C3A;margin:0 0 8px;font-size:20px;">Código de confirmação do seu e-mail</h2>
                              <p style="margin:0 0 16px;font-size:14px;color:#3D5245;">
                                Use o código de 6 dígitos abaixo para validar seu e-mail e liberar o link de pagamento no Stripe. Após a confirmação do pagamento, seus arquivos e o recibo serão enviados automaticamente para este endereço (<strong>{email}</strong>).
                              </p>
                              <div style="background:#F7F5F0;border:2px solid #0F5C3A;border-radius:8px;padding:16px;text-align:center;margin:18px 0;">
                                <span style="font-size:12px;text-transform:uppercase;letter-spacing:0.08em;color:#3D5245;display:block;margin-bottom:4px;">Código de Validação</span>
                                <strong style="font-family:monospace;font-size:32px;letter-spacing:0.22em;color:#0F5C3A;">{otp_code}</strong>
                              </div>
                              <p style="margin:0 0 8px;font-size:13px;color:#14261C;"><strong>Produto selecionado:</strong> {product_label}</p>
                              <p style="margin:0;font-size:12px;color:#3D5245;">Este código é válido por 15 minutos. Remetente oficial: {SMTP_USER}.</p>
                            </div>
                            """,
                            subtype="html",
                        )
                        ctx = ssl.create_default_context()
                        if SMTP_PORT == 465:
                            with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT, context=ctx, timeout=15) as smtp:
                                smtp.login(SMTP_USER, SMTP_PASSWORD)
                                smtp.send_message(msg)
                        else:
                            with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=15) as smtp:
                                smtp.starttls(context=ctx)
                                smtp.login(SMTP_USER, SMTP_PASSWORD)
                                smtp.send_message(msg)
                        email_sent = True
                    except Exception as e:
                        print(f"[OTP SMTP Error]: {e}", file=sys.stderr)
                        smtp_notice = "Não foi possível conectar ao servidor SMTP no momento. Utilize o código de verificação instantânea exibido na tela."
                else:
                    smtp_notice = f"Envio direto via código de verificação instantânea (configure SMTP_PASSWORD para disparo SMTP via {SMTP_USER})."

                resp_data = {
                    "ok": True,
                    "email": email,
                    "productId": product_id,
                    "challengeToken": challenge_token,
                    "emailSent": email_sent,
                    "senderEmail": SMTP_USER,
                    "message": (
                        f"Enviamos um código de 6 dígitos de {SMTP_USER} para {email}. Digite-o abaixo para validar seu e-mail."
                        if email_sent
                        else smtp_notice
                    ),
                }
                if not email_sent:
                    allow_dev_code = os.getenv("ALLOW_DEV_INSTANT_CODE") == "true" or (not SMTP_PASS and os.getenv("ENVIRONMENT") == "development")
                    if allow_dev_code:
                        resp_data["instantVerificationCode"] = otp_code
                    else:
                        self.send_json({
                            "ok": False,
                            "error": "Não foi possível enviar o código de verificação para o seu e-mail no momento. Por favor, tente novamente em alguns instantes."
                        }, status=500)
                        return
                self.send_json(resp_data, status=200)
                return

            if action == "verify_code":
                code = re.sub(r"\s+", "", str(payload.get("code") or ""))
                challenge_token = str(payload.get("challengeToken") or "").strip()

                if not re.match(r"^\d{6}$", code):
                    self.send_json({"ok": False, "error": "Informe o código numérico de 6 dígitos."}, status=400)
                    return

                challenge = verify_generic_token(challenge_token, STRIPE_SECRET_KEY)
                if (
                    not challenge
                    or challenge.get("purpose") != "email_otp_challenge"
                    or challenge.get("email") != email
                    or challenge.get("productId") != product_id
                ):
                    self.send_json({"ok": False, "error": "Sessão de validação expirada ou inválida. Solicite um novo código."}, status=403)
                    return

                expected_code = compute_otp_code(email, product_id, str(challenge.get("nonce") or ""), STRIPE_SECRET_KEY)
                if not hmac.compare_digest(code, expected_code):
                    self.send_json({"ok": False, "error": "Código de validação incorreto. Confira os 6 dígitos e tente novamente."}, status=403)
                    return

                now_ms = int(time.time() * 1000)
                email_verification_token = sign_export_token(
                    {
                        "purpose": "verified_purchase_email",
                        "email": email,
                        "productId": product_id,
                        "verified": True,
                        "iat": now_ms,
                        "exp": now_ms + 60 * 60 * 1000,
                    },
                    STRIPE_SECRET_KEY,
                )
                self.send_json({
                    "ok": True,
                    "verified": True,
                    "email": email,
                    "productId": product_id,
                    "emailVerificationToken": email_verification_token,
                    "message": f"E-mail {email} validado com sucesso! Gerando seu link de pagamento exclusivo...",
                }, status=200)
                return

            self.send_json({"ok": False, "error": "Ação inválida."}, status=400)
            return

        if path == "/api/create-checkout-session":
            product_id = str(payload.get("productId") or "").strip()
            product = PRODUCT_CATALOG.get(product_id)
            if not product:
                self.send_json({"ok": False, "error": "Produto selecionado inválido."}, status=400)
                return

            if not STRIPE_SECRET_KEY:
                self.send_json({"ok": False, "error": "Serviço de pagamento não configurado no servidor."}, status=503)
                return

            email = str(payload.get("email") or "").strip().lower()
            email_verification_token = str(payload.get("emailVerificationToken") or "").strip()
            verified_email_payload = verify_email_token(email_verification_token, STRIPE_SECRET_KEY, email)
            if not verified_email_payload or not verified_email_payload.get("email"):
                self.send_json({
                    "ok": False,
                    "error": "Valide seu endereço de e-mail antes de gerar o link de pagamento.",
                }, status=403)
                return
            verified_email = str(verified_email_payload["email"]).strip().lower()

            host_header = self.headers.get("Host", f"localhost:{PORT}")
            scheme = "https" if self.headers.get("X-Forwarded-Proto") == "https" else "http"
            default_origin = f"{scheme}://{host_header}"

            candidate_origin = payload.get("origin") or default_origin
            origin = default_origin
            try:
                u = urllib.parse.urlparse(candidate_origin)
                norm = f"{u.scheme}://{u.netloc}"
                if (
                    norm == default_origin
                    or norm == "https://lotery-statistics.netlify.app"
                    or (u.scheme == "https" and u.netloc.endswith(".netlify.app"))
                    or u.hostname in ("localhost", "127.0.0.1")
                ):
                    origin = norm
            except Exception:
                pass

            safe_return_path = sanitize_return_path(payload.get("returnPath"))
            success_url = f"{origin}{safe_return_path}?payment=success&session_id={{CHECKOUT_SESSION_ID}}"
            cancel_url = f"{origin}{safe_return_path}?payment=canceled&product={urllib.parse.quote(product_id)}"

            configured_price = (os.environ.get(product["priceEnv"], "").strip() if product.get("priceEnv") else "") or product.get("defaultPriceId", "")
            product_link = (os.environ.get(product["linkEnv"], "").strip() if product.get("linkEnv") else "") or product.get("defaultLink", "")

            def decorate_link(url):
                if not url or not verified_email:
                    return url
                sep = "&" if "?" in url else "?"
                return f"{url}{sep}prefilled_email={urllib.parse.quote(verified_email)}"

            # Etapa 1: Price ID dedicado configurado para este produto
            if configured_price:
                res1 = try_create_with_modes(lambda mode: {
                    **build_base_form(product_id, product, success_url, cancel_url, mode, verified_email),
                    "line_items[0][price]": configured_price,
                })
                if res1 and res1.get("url"):
                    self.send_json({"ok": True, "url": res1["url"], "sessionId": res1.get("id"), "productId": product_id, "verifiedEmail": verified_email})
                    return

            # Etapa 2: price_data dinâmico com product_data inline
            res2 = try_create_with_modes(lambda mode: {
                **build_base_form(product_id, product, success_url, cancel_url, mode, verified_email),
                "line_items[0][price_data][currency]": "brl",
                "line_items[0][price_data][unit_amount]": str(product["amountCents"]),
                "line_items[0][price_data][product_data][name]": product["name"],
                "line_items[0][price_data][product_data][description]": product["description"],
            })
            if res2 and res2.get("url"):
                self.send_json({"ok": True, "url": res2["url"], "sessionId": res2.get("id"), "productId": product_id, "verifiedEmail": verified_email})
                return

            # Etapa 3: se rk_live_ não tiver Products:Write, reutiliza o Product ID de STRIPE_PRICE_ID
            existing_prod_id = fetch_product_from_price(STRIPE_PRICE_ID)
            if existing_prod_id:
                res3 = try_create_with_modes(lambda mode: {
                    **build_base_form(product_id, product, success_url, cancel_url, mode, verified_email),
                    "line_items[0][price_data][currency]": "brl",
                    "line_items[0][price_data][unit_amount]": str(product["amountCents"]),
                    "line_items[0][price_data][product]": existing_prod_id,
                })
                if res3 and res3.get("url"):
                    self.send_json({"ok": True, "url": res3["url"], "sessionId": res3.get("id"), "productId": product_id, "verifiedEmail": verified_email})
                    return

            # Etapa 4: se rk_live_ só tiver Checkout Sessions:Write com STRIPE_PRICE_ID pré-cadastrado
            if STRIPE_PRICE_ID:
                res4 = try_create_with_modes(lambda mode: {
                    **build_base_form(product_id, product, success_url, cancel_url, mode, verified_email),
                    "line_items[0][price]": STRIPE_PRICE_ID,
                    "metadata[used_base_price]": "true",
                })
                if res4 and res4.get("url"):
                    self.send_json({"ok": True, "url": res4["url"], "sessionId": res4.get("id"), "productId": product_id, "verifiedEmail": verified_email})
                    return

            if product_link:
                self.send_json({"ok": True, "url": decorate_link(product_link), "fallback": True, "productId": product_id, "verifiedEmail": verified_email})
                return

            self.send_json({
                "ok": False,
                "error": "Não foi possível iniciar o checkout Stripe no momento. Tente novamente em instantes.",
            }, status=502)
            return

        if path == "/api/authorize-export":
            if not STRIPE_SECRET_KEY:
                self.send_json({"ok": False, "authorized": False, "error": "Serviço de verificação não configurado."}, status=503)
                return

            token_str = str(payload.get("token") or "").strip()
            target = str(payload.get("target") or "").strip()

            token_payload = verify_export_token(token_str, STRIPE_SECRET_KEY)
            if not token_payload:
                self.send_json({
                    "ok": False,
                    "authorized": False,
                    "error": "Token de pagamento ausente, expirado ou inválido. Realize o pagamento para desbloquear.",
                }, status=403)
                return

            if not is_target_allowed(target, token_payload.get("unlocks")):
                self.send_json({
                    "ok": False,
                    "authorized": False,
                    "error": "Seu pagamento atual não inclui esta modalidade ou pacote.",
                }, status=403)
                return

            try:
                s_data = fetch_stripe_session(token_payload["sid"])
                if s_data.get("payment_status") != "paid" or s_data.get("status") != "complete":
                    self.send_json({
                        "ok": False,
                        "authorized": False,
                        "error": "O pagamento desta sessão não consta como quitado no Stripe.",
                    }, status=403)
                    return
            except urllib.error.HTTPError:
                self.send_json({
                    "ok": False,
                    "authorized": False,
                    "error": "Sessão Stripe não localizada ou inválida.",
                }, status=403)
                return
            except Exception:
                self.send_json({
                    "ok": False,
                    "authorized": False,
                    "error": "Não foi possível confirmar o status do pagamento com o Stripe.",
                }, status=502)
                return

            self.send_json({
                "ok": True,
                "authorized": True,
                "sid": token_payload["sid"],
                "productId": token_payload.get("pid"),
                "unlocks": token_payload.get("unlocks"),
                "customerEmail": token_payload.get("email") or "",
                "target": target,
                "nonce": secrets.token_hex(16),
            })
            return

        if path == "/api/send-export-email":
            if not STRIPE_SECRET_KEY:
                self.send_json({"ok": False, "error": "Serviço de verificação não configurado."}, status=503)
                return

            token_str = str(payload.get("token") or "").strip()
            target = str(payload.get("target") or "purchased_bundle").strip()
            requested_email = str(payload.get("recipientEmail") or "").strip().lower()

            token_payload = verify_export_token(token_str, STRIPE_SECRET_KEY)
            if not token_payload or not is_target_allowed(target, token_payload.get("unlocks")):
                self.send_json({
                    "ok": False,
                    "error": "Acesso negado: pagamento não confirmado para envio desta planilha.",
                }, status=403)
                return

            verified_token_email = str(token_payload.get("email") or "").strip().lower()
            if verified_token_email and requested_email and requested_email != verified_token_email:
                self.send_json({
                    "ok": False,
                    "error": f"O e-mail de destino informado ({requested_email}) não corresponde ao e-mail validado no momento da compra ({verified_token_email}).",
                }, status=403)
                return

            recipient_email = verified_token_email or requested_email
            if not is_valid_email_address(recipient_email):
                self.send_json({"ok": False, "error": "Informe um endereço de e-mail válido para receber os arquivos e o recibo."}, status=400)
                return

            raw_attachments = payload.get("attachments")
            if not isinstance(raw_attachments, list) or len(raw_attachments) == 0:
                if payload.get("fileBase64"):
                    raw_attachments = [{
                        "filename": payload.get("filename") or "Planilha_Atlas_Loterias.xlsx",
                        "fileBase64": payload.get("fileBase64"),
                        "mimeType": payload.get("mimeType") or "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    }]
                else:
                    raw_attachments = []

            if len(raw_attachments) == 0:
                self.send_json({"ok": False, "error": "Nenhum arquivo anexado para envio."}, status=400)
                return

            decoded_attachments = []
            for att in raw_attachments:
                if not isinstance(att, dict):
                    self.send_json({"ok": False, "error": "Formato de anexo inválido."}, status=400)
                    return
                fb64 = str(att.get("fileBase64") or "").strip()
                if len(fb64) < 64 or len(fb64) > 15 * 1024 * 1024:
                    self.send_json({"ok": False, "error": "Arquivo de planilha ou relatório inválido."}, status=400)
                    return
                try:
                    fbytes = base64.b64decode(fb64)
                except Exception:
                    self.send_json({"ok": False, "error": "Falha ao decodificar arquivo."}, status=400)
                    return
                fname = re.sub(r"[^a-zA-Z0-9._-]", "_", str(att.get("filename") or "Arquivo_Atlas.xlsx").strip())
                lower_fname = fname.lower()
                if lower_fname.endswith((".xlsx", ".zip")):
                    if len(fbytes) < 4 or fbytes[:4] != b"\x50\x4b\x03\x04":
                        self.send_json({"ok": False, "error": f"Arquivo {fname} possui formato inválido ou corrompido."}, status=400)
                        return
                elif lower_fname.endswith(".pdf"):
                    if len(fbytes) < 4 or fbytes[:4] != b"%PDF":
                        self.send_json({"ok": False, "error": f"Arquivo {fname} não possui cabeçalho PDF válido."}, status=400)
                        return
                elif not lower_fname.endswith((".html", ".txt")):
                    self.send_json({"ok": False, "error": f"Extensão de arquivo não permitida para {fname}."}, status=400)
                    return
                mtype = str(att.get("mimeType") or "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet").strip()
                decoded_attachments.append((fname, fbytes, mtype))

            try:
                s_data = fetch_stripe_session(token_payload["sid"])
                if s_data.get("payment_status") != "paid" or s_data.get("status") != "complete":
                    self.send_json({"ok": False, "error": "O pagamento não consta como quitado no Stripe."}, status=403)
                    return
            except Exception:
                self.send_json({"ok": False, "error": "Falha ao validar pagamento com o Stripe."}, status=502)
                return

            clean_sid_tail = re.sub(r"[^a-zA-Z0-9]", "", str(token_payload["sid"]))[-10:].upper()
            receipt_number = str(token_payload.get("receiptNumber") or f"REC-ATLAS-{clean_sid_tail}")
            product_name = str(token_payload.get("productName") or "Planilha e Relatório Oficial - Atlas das Loterias Caixa")
            amount_cents = int(token_payload.get("amountCents") or s_data.get("amount_total") or 1000)
            amount_formatted = f"R$ {(amount_cents / 100):.2f}".replace(".", ",")
            paid_at_formatted = time.strftime("%d/%m/%Y %H:%M:%S BRT")
            attachment_names = [a[0] for a in decoded_attachments] + [f"{receipt_number}.html"]

            receipt_html = build_receipt_html(
                receipt_number,
                token_payload["sid"],
                product_name,
                amount_formatted,
                paid_at_formatted,
                recipient_email,
                SMTP_USER,
                attachment_names,
            )

            receipt_summary = {
                "receiptNumber": receipt_number,
                "sessionId": token_payload["sid"],
                "productName": product_name,
                "amountCents": amount_cents,
                "amountFormatted": amount_formatted,
                "paidAtFormatted": paid_at_formatted,
                "recipientEmail": recipient_email,
                "senderEmail": SMTP_USER,
                "filesDelivered": attachment_names,
            }

            if not SMTP_PASSWORD:
                self.send_json({
                    "ok": False,
                    "receipt": receipt_summary,
                    "error": f"Para envio automático por e-mail ({SMTP_USER}), configure a variável SMTP_PASSWORD (Senha de App do Gmail) no arquivo .env.",
                }, status=503)
                return

            msg = EmailMessage()
            msg["Subject"] = f"[Recibo {receipt_number}] Seus Arquivos Oficiais - {product_name}"
            msg["From"] = f"Atlas das Loterias Caixa <{SMTP_USER}>"
            msg["To"] = recipient_email
            msg["Reply-To"] = SMTP_USER
            if recipient_email.lower() != SMTP_USER.lower():
                msg["Bcc"] = SMTP_USER

            msg.set_content(
                f"Olá!\n\nSeu pagamento foi confirmado (Recibo: {receipt_number} | Sessão Stripe: {token_payload['sid']}).\n"
                f"Produto: {product_name} ({amount_formatted})\n"
                f"Seus arquivos oficiais ({', '.join(attachment_names)}) seguem anexados neste e-mail.\n\n"
                f"Canal oficial de suporte e entrega: {SMTP_USER}\n"
            )
            msg.add_alternative(receipt_html, subtype="html")

            for fname, fbytes, mtype in decoded_attachments:
                maintype, subtype = (mtype.split("/", 1) + ["octet-stream"])[:2] if "/" in mtype else ("application", "octet-stream")
                msg.add_attachment(fbytes, maintype=maintype, subtype=subtype, filename=fname)

            msg.add_attachment(
                receipt_html.encode("utf-8"),
                maintype="text",
                subtype="html",
                filename=f"{receipt_number}.html",
            )

            try:
                ctx = ssl.create_default_context()
                if SMTP_PORT == 465:
                    with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT, context=ctx, timeout=20) as smtp:
                        smtp.login(SMTP_USER, SMTP_PASSWORD)
                        smtp.send_message(msg)
                else:
                    with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=20) as smtp:
                        smtp.starttls(context=ctx)
                        smtp.login(SMTP_USER, SMTP_PASSWORD)
                        smtp.send_message(msg)

                self.send_json({
                    "ok": True,
                    "sent": True,
                    "senderEmail": SMTP_USER,
                    "recipientEmail": recipient_email,
                    "receipt": receipt_summary,
                    "message": f"Arquivos ({', '.join(a[0] for a in decoded_attachments)}) e Recibo {receipt_number} enviados com sucesso para {recipient_email}!",
                })
                return
            except Exception as e:
                print(f"[SMTP Error]: {e}", file=sys.stderr)
                self.send_json({
                    "ok": False,
                    "receipt": receipt_summary,
                    "error": f"Não foi possível enviar o e-mail via {SMTP_USER}. Verifique a Senha de App do Gmail (SMTP_PASSWORD).",
                }, status=502)
                return

        self.send_response(404)
        self.end_headers()

    def send_json(self, data, status=200):
        body = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)


def main():
    root_dir = Path(__file__).resolve().parent
    os.chdir(root_dir)

    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), LotteryRequestHandler) as httpd:
        print(f"Servidor Atlas das Loterias ativo em http://localhost:{PORT}")
        print(f"Landing page Mega da Virada: http://localhost:{PORT}/mega-da-virada")
        print(f"Gateway Stripe seguro com token HMAC-SHA256 | Canal de e-mail: {SMTP_USER}")
        print("Pressione Ctrl+C para encerrar.")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nServidor encerrado.")


if __name__ == "__main__":
    main()
