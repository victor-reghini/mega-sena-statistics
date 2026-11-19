// Netlify Serverless Function: Validação de E-mail do Comprador Antes de Gerar o Link de Pagamento Stripe
import crypto from "node:crypto";
import tls from "node:tls";

const DEFAULT_SENDER_EMAIL = "reghinidev@gmail.com";

const PRODUCT_NAMES = {
  export_megasena: "Planilha Mega-Sena + Mega da Virada (XLSX + PDF) - R$ 10,00",
  export_lotofacil: "Planilha Lotofácil + Independência (XLSX + PDF) - R$ 10,00",
  export_quina: "Planilha Quina + São João (XLSX + PDF) - R$ 10,00",
  export_lotomania: "Planilha Lotomania + Páscoa (XLSX + PDF) - R$ 10,00",
  combo_all: "Combo 4 Loterias Completo (XLSX + PDF) - R$ 24,90",
  kit_bolao_virada: "Kit Bolão Mega da Virada 2026 (Excel + Guia PDF) - R$ 14,90",
  dossie_especiais: "Dossiê Concursos Especiais (XLSX + PDF) - R$ 19,90",
  super_combo: "Pacote Completo Atlas + Virada (4 Loterias + Kit Bolão + Dossiê) - R$ 34,90"
};

function jsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "no-store"
    }
  });
}

function isValidEmailAddress(email) {
  if (!email || typeof email !== "string") return false;
  const clean = email.trim().toLowerCase();
  if (clean.length < 6 || clean.length > 254) return false;
  if (!/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,18}$/i.test(clean)) return false;
  const domain = clean.split("@")[1] || "";
  if (domain.startsWith(".") || domain.endsWith(".") || domain.includes("..")) return false;
  return true;
}

function signToken(payload, secretKey) {
  const payloadB64 = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const sig = crypto.createHmac("sha256", secretKey).update(payloadB64).digest("hex");
  return `${payloadB64}.${sig}`;
}

function verifyToken(tokenStr, secretKey) {
  if (!tokenStr || typeof tokenStr !== "string" || !secretKey) return null;
  const parts = tokenStr.trim().split(".");
  if (parts.length !== 2) return null;
  const [payloadB64, providedSig] = parts;
  if (!payloadB64 || !providedSig || !/^[a-f0-9]{64}$/i.test(providedSig)) return null;

  const expectedSig = crypto.createHmac("sha256", secretKey).update(payloadB64).digest("hex");
  const bufA = Buffer.from(providedSig.toLowerCase(), "utf8");
  const bufB = Buffer.from(expectedSig.toLowerCase(), "utf8");
  if (bufA.length !== bufB.length || !crypto.timingSafeEqual(bufA, bufB)) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf8"));
    if (!payload || typeof payload !== "object") return null;
    if (Number(payload.exp || 0) <= Date.now()) return null;
    return payload;
  } catch (e) {
    return null;
  }
}

function computeOtpCode(email, productId, nonce, secretKey) {
  const hmac = crypto
    .createHmac("sha256", secretKey)
    .update(`otp:${email.toLowerCase()}:${productId}:${nonce}`)
    .digest();
  const num = hmac.readUInt32BE(0) % 900000;
  return String(100000 + num);
}

function chunkBase64(b64) {
  const clean = b64.replace(/\s+/g, "");
  const lines = [];
  for (let i = 0; i < clean.length; i += 76) {
    lines.push(clean.slice(i, i + 76));
  }
  return lines.join("\r\n");
}

function sendOtpViaGmailSmtp({ smtpHost, smtpPort, smtpUser, smtpPass, toEmail, subject, htmlBody }) {
  return new Promise((resolve, reject) => {
    const mimeMessage = [
      `From: "Atlas das Loterias Caixa" <${smtpUser}>`,
      `To: <${toEmail}>`,
      `Reply-To: <${smtpUser}>`,
      `Subject: =?UTF-8?B?${Buffer.from(subject, "utf8").toString("base64")}?=`,
      "MIME-Version: 1.0",
      'Content-Type: text/html; charset="UTF-8"',
      "Content-Transfer-Encoding: base64",
      "",
      chunkBase64(Buffer.from(htmlBody, "utf8").toString("base64")),
      ""
    ].join("\r\n");

    const socket = tls.connect(
      { host: smtpHost, port: smtpPort, servername: smtpHost, timeout: 12000 },
      () => {}
    );

    const commands = [
      "EHLO atlas-loterias.local",
      "AUTH LOGIN",
      Buffer.from(smtpUser, "utf8").toString("base64"),
      Buffer.from(smtpPass, "utf8").toString("base64"),
      `MAIL FROM:<${smtpUser}>`,
      `RCPT TO:<${toEmail}>`,
      "DATA",
      `${mimeMessage}\r\n.`,
      "QUIT"
    ];

    let step = -1;
    let buffer = "";
    let finished = false;

    const fail = (err) => {
      if (finished) return;
      finished = true;
      try { socket.destroy(); } catch (e) {}
      reject(err);
    };

    socket.on("timeout", () => fail(new Error("Tempo esgotado ao conectar no servidor SMTP.")));
    socket.on("error", (err) => fail(err));

    socket.on("data", (chunk) => {
      buffer += chunk.toString("utf8");
      const lines = buffer.split("\r\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (!line || line.length < 3) continue;
        if (line[3] === "-") continue;
        const code = Number(line.slice(0, 3));
        if (code >= 400) {
          return fail(new Error(`Erro SMTP (${code}): ${line}`));
        }
        step++;
        if (step < commands.length) {
          socket.write(commands[step] + "\r\n");
        } else if (!finished) {
          finished = true;
          try { socket.end(); } catch (e) {}
          resolve(true);
        }
      }
    });
  });
}

export default async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type"
      }
    });
  }

  if (req.method !== "POST") {
    return jsonResponse({ ok: false, error: "Método não permitido." }, 405);
  }

  const secretKey = (process.env.STRIPE_SECRET_KEY || "").trim();
  if (!secretKey) {
    return jsonResponse({ ok: false, error: "Serviço de verificação não configurado no servidor." }, 503);
  }

  let body = {};
  try {
    body = await req.json();
  } catch (e) {
    body = {};
  }

  const action = body && typeof body.action === "string" ? body.action.trim() : "";
  const email = body && typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const productId = body && typeof body.productId === "string" ? body.productId.trim() : "";

  if (!isValidEmailAddress(email)) {
    return jsonResponse({
      ok: false,
      error: "Informe um endereço de e-mail válido (exemplo: seuemail@dominio.com)."
    }, 400);
  }

  if (!PRODUCT_NAMES[productId]) {
    return jsonResponse({ ok: false, error: "Produto selecionado inválido." }, 400);
  }

  const smtpUser = (process.env.SMTP_USER || DEFAULT_SENDER_EMAIL).trim() || DEFAULT_SENDER_EMAIL;
  const smtpPass = (process.env.SMTP_PASSWORD || process.env.GMAIL_APP_PASSWORD || "").trim();
  const smtpHost = (process.env.SMTP_HOST || "smtp.gmail.com").trim() || "smtp.gmail.com";
  const smtpPort = Number(process.env.SMTP_PORT || 465);

  if (action === "request_code") {
    const nowMs = Date.now();
    const nonce = crypto.randomBytes(12).toString("hex");
    const otpCode = computeOtpCode(email, productId, nonce, secretKey);
    const challengeToken = signToken(
      {
        purpose: "email_otp_challenge",
        email,
        productId,
        nonce,
        iat: nowMs,
        exp: nowMs + 15 * 60 * 1000
      },
      secretKey
    );

    const productName = PRODUCT_NAMES[productId];
    let emailSent = false;
    let smtpNotice = null;

    if (smtpPass) {
      const htmlBody = `
        <div style="font-family:system-ui,-apple-system,sans-serif;max-width:560px;margin:0 auto;color:#14261C;background:#FFFFFF;border:1px solid #C8D4CC;border-radius:8px;padding:24px;">
          <span style="display:inline-block;background:#E5F2EB;color:#0F5C3A;font-weight:700;font-size:12px;padding:4px 10px;border-radius:4px;margin-bottom:12px;">VALIDAÇÃO DE E-MAIL PARA COMPRA</span>
          <h2 style="color:#0F5C3A;margin:0 0 8px;font-size:20px;">Código de confirmação do seu e-mail</h2>
          <p style="margin:0 0 16px;font-size:14px;color:#3D5245;">
            Use o código de 6 dígitos abaixo para validar seu e-mail e liberar o link de pagamento no Stripe. Após a confirmação do pagamento, seus arquivos e o recibo serão enviados automaticamente para este endereço (<strong>${email}</strong>).
          </p>
          <div style="background:#F7F5F0;border:2px solid #0F5C3A;border-radius:8px;padding:16px;text-align:center;margin:18px 0;">
            <span style="font-size:12px;text-transform:uppercase;letter-spacing:0.08em;color:#3D5245;display:block;margin-bottom:4px;">Código de Validação</span>
            <strong style="font-family:monospace;font-size:32px;letter-spacing:0.22em;color:#0F5C3A;">${otpCode}</strong>
          </div>
          <p style="margin:0 0 8px;font-size:13px;color:#14261C;"><strong>Produto selecionado:</strong> ${productName}</p>
          <p style="margin:0;font-size:12px;color:#3D5245;">Este código é válido por 15 minutos. Remetente oficial: ${smtpUser}.</p>
        </div>
      `;
      try {
        await sendOtpViaGmailSmtp({
          smtpHost,
          smtpPort,
          smtpUser,
          smtpPass,
          toEmail: email,
          subject: `[Código ${otpCode}] Validação de E-mail - Atlas das Loterias Caixa`,
          htmlBody
        });
        emailSent = true;
      } catch (err) {
        smtpNotice = "Não foi possível conectar ao servidor SMTP no momento. Utilize o código de verificação instantânea exibido na tela.";
      }
    } else {
      smtpNotice = `Envio direto via código de verificação instantânea (configure SMTP_PASSWORD para disparo SMTP via ${smtpUser}).`;
    }

    const responsePayload = {
      ok: true,
      email,
      productId,
      challengeToken,
      emailSent,
      senderEmail: smtpUser,
      message: emailSent
        ? `Enviamos um código de 6 dígitos de ${smtpUser} para ${email}. Digite-o abaixo para validar seu e-mail.`
        : smtpNotice
    };

    if (!emailSent) {
      responsePayload.instantVerificationCode = otpCode;
    }

    return jsonResponse(responsePayload, 200);
  }

  if (action === "verify_code") {
    const code = body && typeof body.code === "string" ? body.code.trim().replace(/\s+/g, "") : "";
    const challengeToken = body && typeof body.challengeToken === "string" ? body.challengeToken.trim() : "";

    if (!/^\d{6}$/.test(code)) {
      return jsonResponse({ ok: false, error: "Informe o código numérico de 6 dígitos." }, 400);
    }

    const challenge = verifyToken(challengeToken, secretKey);
    if (
      !challenge ||
      challenge.purpose !== "email_otp_challenge" ||
      challenge.email !== email ||
      challenge.productId !== productId
    ) {
      return jsonResponse({
        ok: false,
        error: "Sessão de validação expirada ou inválida. Solicite um novo código."
      }, 403);
    }

    const expectedCode = computeOtpCode(email, productId, challenge.nonce, secretKey);
    const bufA = Buffer.from(code, "utf8");
    const bufB = Buffer.from(expectedCode, "utf8");
    if (bufA.length !== bufB.length || !crypto.timingSafeEqual(bufA, bufB)) {
      return jsonResponse({
        ok: false,
        error: "Código de validação incorreto. Confira os 6 dígitos e tente novamente."
      }, 403);
    }

    const nowMs = Date.now();
    const emailVerificationToken = signToken(
      {
        purpose: "verified_purchase_email",
        email,
        productId,
        verified: true,
        iat: nowMs,
        exp: nowMs + 60 * 60 * 1000
      },
      secretKey
    );

    return jsonResponse({
      ok: true,
      verified: true,
      email,
      productId,
      emailVerificationToken,
      message: `E-mail ${email} validado com sucesso! Gerando seu link de pagamento exclusivo...`
    }, 200);
  }

  return jsonResponse({ ok: false, error: "Ação inválida." }, 400);
};
