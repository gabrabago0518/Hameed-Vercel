import crypto from "node:crypto";

const PAYMONGO_API_BASE = "https://api.paymongo.com/v1";

function authHeader() {
  const secretKey = process.env.PAYMONGO_SECRET_KEY;
  if (!secretKey) {
    throw new Error(
      "PAYMONGO_SECRET_KEY is not set. Add it to .env before accepting payments."
    );
  }
  // PayMongo uses HTTP Basic auth: secret key as the username, blank password.
  return `Basic ${Buffer.from(`${secretKey}:`).toString("base64")}`;
}

async function paymongoRequest(path, { method = "GET", body } = {}) {
  const response = await fetch(`${PAYMONGO_API_BASE}${path}`, {
    method,
    headers: {
      Authorization: authHeader(),
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const json = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      json?.errors?.[0]?.detail || `PayMongo request failed (${response.status})`;
    throw new Error(message);
  }

  return json;
}

// Creates a Payment Intent for the order total, then immediately attaches a
// payment method of the chosen type (GCash or QRPh) to it. PayMongo expects
// this as two steps even though the customer experiences it as one.
//
// `method` is our own PaymentMethod enum value ("GCASH" or "QR_CODE").
// `amountPesos` is a plain number in pesos (e.g. 65.5) — PayMongo wants the
// amount as an integer number of centavos, converted here so callers never
// have to think about that unit.
export async function createAndAttachPaymentIntent({
  amountPesos,
  method,
  orderId,
  returnUrl,
}) {
  const amountCentavos = Math.round(amountPesos * 100);
  // TEMPORARY: real QRPh isn't wired up yet (it needs its own separate
  // enablement on the PayMongo account, not yet done) — until then, "Pay via
  // QR code" also goes through PayMongo's GCash flow under the hood, same as
  // our own GCASH method. Our own PaymentMethod enum value on the order/
  // payment rows still records QR_CODE either way; this only changes which
  // PayMongo payment method type gets attached. Revert this to
  // `method === "GCASH" ? "gcash" : "qrph"` once real QRPh is ready — nothing
  // else needs to change, since the confirmation screens already branch on
  // whether a checkoutUrl or qrCodeData came back, not on our own method value.
  const paymongoType = "gcash";

  const intent = await paymongoRequest("/payment_intents", {
    method: "POST",
    body: {
      data: {
        attributes: {
          amount: amountCentavos,
          currency: "PHP",
          capture_type: "automatic",
          payment_method_allowed: ["gcash", "qrph"],
          description: `Order ${orderId}`,
          metadata: { orderId },
        },
      },
    },
  });

  const paymentIntentId = intent.data.id;
  const clientKey = intent.data.attributes.client_key;

  const paymentMethod = await paymongoRequest("/payment_methods", {
    method: "POST",
    body: {
      data: {
        attributes: { type: paymongoType },
      },
    },
  });

  const attached = await paymongoRequest(
    `/payment_intents/${paymentIntentId}/attach`,
    {
      method: "POST",
      body: {
        data: {
          attributes: {
            payment_method: paymentMethod.data.id,
            client_key: clientKey,
            return_url: returnUrl,
          },
        },
      },
    }
  );

  // TEMPORARY DEBUG LOGGING — remove once you've grabbed what you need from
  // this. Full attach response, since that's where PayMongo's next_action
  // (including the test-mode "simulate payment" URL) lives.
  console.log(
    `[paymongo debug] attach response for order ${orderId}:`,
    JSON.stringify(attached, null, 2)
  );

  const attributes = attached.data.attributes;
  const nextAction = attributes.next_action;

  return {
    paymentIntentId,
    status: attributes.status,
    // GCash/Maya: redirect the customer here to authenticate in-app.
    checkoutUrl: nextAction?.redirect?.url ?? null,
    // QRPh: PayMongo hands back the QR to render directly, no redirect.
    qrCodeData: nextAction?.code?.image_url ?? nextAction?.code?.qr_code_data ?? null,
  };
}

export async function retrievePaymentIntent(paymentIntentId) {
  const response = await paymongoRequest(`/payment_intents/${paymentIntentId}`);
  return response.data;
}

// Refunds a completed Payment (`pay_...` — the resource that results once a
// Payment Intent succeeds, not the intent id itself; see Payment.
// paymongoPaymentId in schema.prisma for why the two are stored separately).
// Always refunds the exact full amount the order was charged — there's no
// partial-refund UI in this project, matching the "one order, one payment,
// one outcome" shape everything else here already assumes. `reason` is one
// of PayMongo's own enum values; "requested_by_customer" covers the
// dashboard's only refund button, so it's the only one used here — not yet
// verified against a real PayMongo refund response, same standing caveat as
// the rest of this file's not-yet-live-tested integration.
export async function createRefund({ paymentId, amountCentavos, reason = "requested_by_customer" }) {
  const refund = await paymongoRequest("/refunds", {
    method: "POST",
    body: {
      data: {
        attributes: {
          amount: amountCentavos,
          payment_id: paymentId,
          reason,
          notes: "Refund issued via the Hameed the Love Recipe admin dashboard",
        },
      },
    },
  });

  return {
    refundId: refund.data.id,
    status: refund.data.attributes.status,
  };
}

// PayMongo signs webhooks with a header shaped like:
//   "t=<timestamp>,te=<test-mode signature>,li=<live-mode signature>"
// The signature is HMAC-SHA256 of "<timestamp>.<raw request body>" using the
// webhook's signing secret. Always verify against the RAW body string, not a
// re-serialized JSON.parse(body) — re-serializing can subtly change byte
// content (key order, whitespace) and break the signature check.
export function verifyWebhookSignature(rawBody, signatureHeader) {
  const secret = process.env.PAYMONGO_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error(
      "PAYMONGO_WEBHOOK_SECRET is not set. Add it to .env before trusting webhooks."
    );
  }
  if (!signatureHeader) return false;

  const parts = Object.fromEntries(
    signatureHeader.split(",").map((part) => part.split("="))
  );
  const timestamp = parts.t;
  // "li" (live) takes priority if present; otherwise fall back to "te" (test).
  const providedSignature = parts.li || parts.te;
  if (!timestamp || !providedSignature) return false;

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(`${timestamp}.${rawBody}`)
    .digest("hex");

  const expectedBuffer = Buffer.from(expectedSignature, "hex");
  const providedBuffer = Buffer.from(providedSignature, "hex");
  if (expectedBuffer.length !== providedBuffer.length) return false;

  return crypto.timingSafeEqual(expectedBuffer, providedBuffer);
}
