// Netlify Serverless Function: Envio Automático dos Arquivos Comprados + Recibo Oficial por E-mail (reghinidev@gmail.com)
import crypto from "node:crypto";
import tls from "node:tls";

const DEFAULT_SENDER_EMAIL = "reghinidev@gmail.com";
const ALL_LOTTERIES = ["megasena", "lotofacil", "quina", "lotomania"];

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

function verifyExportToken(tokenStr, secretKey) {
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
    const rawJson = Buffer.from(payloadB64, "base64url").toString("utf8");
    const payload = JSON.parse(rawJson);
    if (!payload || typeof payload !== "object") return null;
    if (!payload.sid || !/^cs_(live|test)_[a-zA-Z0-9_-]{20,120}$/.test(payload.sid)) return null;
    if (!Array.isArray(payload.unlocks) || payload.unlocks.length === 0) return null;
    if (Number(payload.exp || 0) <= Date.now()) return null;
    return payload;
  } catch (e) {
    return null;
  }
}

function isTargetAllowed(target, unlocks) {
  const set = new Set(unlocks || []);
  if (target === "purchased_bundle" || target === "auto_bundle") return set.size > 0;
  if (target === "all") return ALL_LOTTERIES.every((k) => set.has(k));
  return set.has(target);
}

function chunkBase64(b64) {
  const clean = b64.replace(/\s+/g, "");
  const lines = [];
  for (let i = 0; i < clean.length; i += 76) {
    lines.push(clean.slice(i, i + 76));
  }
  return lines.join("\r\n");
}

function buildReceiptHtml({ receiptNumber, sessionId, productName, amountFormatted, paidAtFormatted, verifiedEmail, senderEmail, attachmentNames }) {
  const filesListHtml = attachmentNames
    .map((name) => `<li style="margin:4px 0;font-family:monospace;font-size:13px;">${name}</li>`)
    .join("");

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>Recibo ${receiptNumber} - Atlas das Loterias Caixa</title>
</head>
<body style="font-family:system-ui,-apple-system,sans-serif;background:#F7F5F0;color:#14261C;padding:24px;margin:0;">
  <div style="max-width:620px;margin:0 auto;background:#FFFFFF;border:1.5px solid #94A69B;border-radius:8px;padding:24px;">
    <div style="border-bottom:2px solid #0F5C3A;padding-bottom:14px;margin-bottom:18px;display:flex;justify-content:space-between;align-items:flex-start;">
      <div>
        <span style="display:inline-block;background:#E5F2EB;color:#0F5C3A;font-weight:700;font-size:11px;padding:3px 8px;border-radius:4px;margin-bottom:6px;">PAGAMENTO CONFIRMADO E ARQUIVOS ENTREGUES</span>
        <h1 style="margin:0;font-size:20px;color:#0F5C3A;">Recibo Oficial de Compra</h1>
        <p style="margin:4px 0 0;font-size:13px;color:#3D5245;">Atlas Estatístico das Loterias Caixa</p>
      </div>
    </div>

    <p style="margin:0 0 16px;font-size:14px;line-height:1.5;">
      Olá! Confirmamos o seu pagamento via Stripe. Os arquivos adquiridos e este recibo oficial foram enviados para o seu e-mail validado (<strong>${verifiedEmail}</strong>).
    </p>

    <div style="background:#F7F5F0;border:1px solid #C8D4CC;border-radius:6px;padding:16px;margin-bottom:18px;">
      <table style="width:100%;border-collapse:collapse;font-size:13px;">
        <tr>
          <td style="padding:6px 0;color:#3D5245;"><strong>Número do Recibo:</strong></td>
          <td style="padding:6px 0;text-align:right;font-family:monospace;font-weight:700;">${receiptNumber}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;color:#3D5245;"><strong>Data / Hora da Confirmação:</strong></td>
          <td style="padding:6px 0;text-align:right;">${paidAtFormatted}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;color:#3D5245;"><strong>Produto Adquirido:</strong></td>
          <td style="padding:6px 0;text-align:right;font-weight:700;">${productName}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;color:#3D5245;"><strong>Valor Total Pago:</strong></td>
          <td style="padding:6px 0;text-align:right;font-weight:700;color:#0F5C3A;font-size:15px;">${amountFormatted}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;color:#3D5245;"><strong>E-mail Cadastrado e Validado:</strong></td>
          <td style="padding:6px 0;text-align:right;">${verifiedEmail}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;color:#3D5245;"><strong>ID da Transação Stripe:</strong></td>
          <td style="padding:6px 0;text-align:right;font-family:monospace;font-size:12px;">${sessionId}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;color:#3D5245;"><strong>Status:</strong></td>
          <td style="padding:6px 0;text-align:right;color:#0F5C3A;font-weight:700;">QUITADO (PAID)</td>
        </tr>
      </table>
    </div>

    <div style="margin-bottom:18px;">
      <strong style="font-size:13px;display:block;margin-bottom:6px;color:#14261C;">Arquivos anexados neste e-mail (${attachmentNames.length}):</strong>
      <ul style="margin:0;padding-left:20px;color:#14261C;">
        ${filesListHtml}
      </ul>
    </div>

    <div style="border-top:1px solid #C8D4CC;padding-top:12px;font-size:12px;color:#3D5245;">
      <p style="margin:0;">Remetente e suporte oficial: <strong>${senderEmail}</strong></p>
      <p style="margin:4px 0 0;">Guarde este recibo para seu controle. Caso precise de reenvio ou suporte, basta responder a este e-mail.</p>
    </div>
  </div>
</body>
</html>`;
}

function sendViaGmailSmtp({ smtpHost, smtpPort, smtpUser, smtpPass, toEmail, subject, htmlBody, attachments }) {
  return new Promise((resolve, reject) => {
    const boundary = "----AtlasLoteriasBoundary" + crypto.randomBytes(8).toString("hex");

    const mimeParts = [
      `From: "Atlas das Loterias Caixa" <${smtpUser}>`,
      `To: <${toEmail}>`,
      `Reply-To: <${smtpUser}>`,
      `Subject: =?UTF-8?B?${Buffer.from(subject, "utf8").toString("base64")}?=`,
      "MIME-Version: 1.0",
      `Content-Type: multipart/mixed; boundary="${boundary}"`,
      "",
      `--${boundary}`,
      'Content-Type: text/html; charset="UTF-8"',
      "Content-Transfer-Encoding: base64",
      "",
      chunkBase64(Buffer.from(htmlBody, "utf8").toString("base64")),
      ""
    ];

    for (const att of attachments) {
      const safeFilename = String(att.filename || "Planilha_Atlas_Loterias.xlsx").replace(/[^a-zA-Z0-9._-]/g, "_");
      const safeMime = att.mimeType || "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
      mimeParts.push(
        `--${boundary}`,
        `Content-Type: ${safeMime}; name="${safeFilename}"`,
        "Content-Transfer-Encoding: base64",
        `Content-Disposition: attachment; filename="${safeFilename}"`,
        "",
        chunkBase64(att.fileBase64),
        ""
      );
    }

    mimeParts.push(`--${boundary}--`, "");
    const mimeMessage = mimeParts.join("\r\n");

    const socket = tls.connect(
      { host: smtpHost, port: smtpPort, servername: smtpHost, timeout: 20000 },
      () => {}
    );

    const recipients = toEmail.toLowerCase() === smtpUser.toLowerCase()
      ? [toEmail]
      : [toEmail, smtpUser];

    const commands = [
      "EHLO atlas-loterias.local",
      "AUTH LOGIN",
      Buffer.from(smtpUser, "utf8").toString("base64"),
      Buffer.from(smtpPass, "utf8").toString("base64"),
      `MAIL FROM:<${smtpUser}>`,
      ...recipients.map((rcpt) => `RCPT TO:<${rcpt}>`),
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

  const stripeKey = (process.env.STRIPE_SECRET_KEY || "").trim();
  if (!stripeKey) {
    return jsonResponse({ ok: false, error: "Serviço de verificação não configurado." }, 503);
  }

  let body = {};
  try {
    body = await req.json();
  } catch (e) {
    body = {};
  }

  const token = body && typeof body.token === "string" ? body.token.trim() : "";
  const target = body && typeof body.target === "string" ? body.target.trim() : "purchased_bundle";
  const requestedEmail = body && typeof body.recipientEmail === "string" ? body.recipientEmail.trim().toLowerCase() : "";

  const payload = verifyExportToken(token, stripeKey);
  if (!payload || !isTargetAllowed(target, payload.unlocks)) {
    return jsonResponse({
      ok: false,
      error: "Acesso negado: pagamento não confirmado para envio desta planilha."
    }, 403);
  }

  const verifiedTokenEmail = typeof payload.email === "string" ? payload.email.trim().toLowerCase() : "";
  const recipientEmail = verifiedTokenEmail || requestedEmail;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail)) {
    return jsonResponse({ ok: false, error: "Informe um endereço de e-mail válido para receber os arquivos e o recibo." }, 400);
  }

  // Normaliza lista de anexos (suporta array attachments[] ou campos únicos filename + fileBase64)
  const rawAttachments = Array.isArray(body.attachments) && body.attachments.length > 0
    ? body.attachments
    : body.fileBase64
    ? [{ filename: body.filename || "Planilha_Atlas_Loterias.xlsx", fileBase64: body.fileBase64, mimeType: body.mimeType }]
    : [];

  if (rawAttachments.length === 0) {
    return jsonResponse({ ok: false, error: "Nenhum arquivo anexado para envio." }, 400);
  }

  const validAttachments = [];
  for (const att of rawAttachments) {
    if (!att || typeof att.fileBase64 !== "string" || att.fileBase64.length < 64 || att.fileBase64.length > 15 * 1024 * 1024) {
      return jsonResponse({ ok: false, error: "Arquivo de planilha ou relatório inválido." }, 400);
    }
    validAttachments.push({
      filename: String(att.filename || "Arquivo_Atlas.xlsx").trim(),
      fileBase64: att.fileBase64.trim(),
      mimeType: String(att.mimeType || "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet").trim()
    });
  }

  // Confirma no Stripe que a sessão continua paga
  let stripeSessionData = null;
  try {
    const res = await fetch(`https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(payload.sid)}`, {
      headers: { "Authorization": `Bearer ${stripeKey}` }
    });
    if (!res.ok) {
      return jsonResponse({ ok: false, error: "Sessão de pagamento não localizada no Stripe." }, 403);
    }
    stripeSessionData = await res.json();
    if (stripeSessionData.payment_status !== "paid" || stripeSessionData.status !== "complete") {
      return jsonResponse({ ok: false, error: "O pagamento não consta como quitado no Stripe." }, 403);
    }
  } catch (err) {
    return jsonResponse({ ok: false, error: "Falha ao validar pagamento com o Stripe." }, 502);
  }

  const smtpUser = (process.env.SMTP_USER || DEFAULT_SENDER_EMAIL).trim() || DEFAULT_SENDER_EMAIL;
  const smtpPass = (process.env.SMTP_PASSWORD || process.env.GMAIL_APP_PASSWORD || "").trim();
  const smtpHost = (process.env.SMTP_HOST || "smtp.gmail.com").trim() || "smtp.gmail.com";
  const smtpPort = Number(process.env.SMTP_PORT || 465);

  const receiptNumber =
    payload.receiptNumber ||
    `REC-ATLAS-${String(payload.sid).replace(/[^a-zA-Z0-9]/g, "").slice(-10).toUpperCase()}`;
  const productName = payload.productName || "Planilha e Relatório Oficial - Atlas das Loterias Caixa";
  const amountCents = Number(payload.amountCents || stripeSessionData.amount_total || 1000);
  const amountFormatted = `R$ ${(amountCents / 100).toFixed(2).replace(".", ",")}`;
  const paidDate = new Date(payload.paidAtIso || Date.now());
  const paidAtFormatted = paidDate.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });

  const receiptHtml = buildReceiptHtml({
    receiptNumber,
    sessionId: payload.sid,
    productName,
    amountFormatted,
    paidAtFormatted,
    verifiedEmail: recipientEmail,
    senderEmail: smtpUser,
    attachmentNames: [...validAttachments.map((a) => a.filename), `${receiptNumber}.html`]
  });

  // Anexa também o arquivo HTML do Recibo Oficial junto aos arquivos comprados
  const allAttachments = [
    ...validAttachments,
    {
      filename: `${receiptNumber}.html`,
      fileBase64: Buffer.from(receiptHtml, "utf8").toString("base64"),
      mimeType: "text/html; charset=UTF-8"
    }
  ];

  const receiptSummary = {
    receiptNumber,
    sessionId: payload.sid,
    productName,
    amountCents,
    amountFormatted,
    paidAtFormatted,
    recipientEmail,
    senderEmail: smtpUser,
    filesDelivered: allAttachments.map((a) => a.filename)
  };

  if (!smtpPass) {
    return jsonResponse({
      ok: false,
      receipt: receiptSummary,
      error: `Para envio automático por e-mail (${smtpUser}), configure a variável SMTP_PASSWORD (Senha de App do Gmail) no arquivo .env.`
    }, 503);
  }

  try {
    await sendViaGmailSmtp({
      smtpHost,
      smtpPort,
      smtpUser,
      smtpPass,
      toEmail: recipientEmail,
      subject: `[Recibo ${receiptNumber}] Seus Arquivos Oficiais - ${productName}`,
      htmlBody: receiptHtml,
      attachments: allAttachments
    });

    return jsonResponse({
      ok: true,
      sent: true,
      recipientEmail,
      senderEmail: smtpUser,
      receipt: receiptSummary,
      message: `Arquivos (${validAttachments.map((a) => a.filename).join(", ")}) e Recibo ${receiptNumber} enviados com sucesso para ${recipientEmail}!`
    }, 200);
  } catch (err) {
    return jsonResponse({
      ok: false,
      receipt: receiptSummary,
      error: "Não foi possível concluir o envio via servidor SMTP: " + (err.message || "erro de conexão.")
    }, 502);
  }
};
