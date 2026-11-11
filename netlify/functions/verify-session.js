// Netlify Serverless Function: Verificação de Sessão Stripe
export default async (req) => {
  const url = new URL(req.url);
  const sessionId = url.searchParams.get("session_id");

  if (!sessionId) {
    return new Response(JSON.stringify({ ok: false, error: "session_id ausente" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY || "";

  try {
    const res = await fetch(`https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`, {
      headers: {
        "Authorization": `Bearer ${stripeKey}`
      }
    });

    const data = await res.json();
    const paid = (data.payment_status === "paid");

    return new Response(JSON.stringify({
      ok: true,
      paid,
      status: data.status,
      customer_email: data.customer_details ? data.customer_details.email : null
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: e.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }
};

