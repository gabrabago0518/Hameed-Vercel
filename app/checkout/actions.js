"use server";

import crypto from "node:crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "../../lib/session.js";
import { isProfileComplete } from "../../lib/profile.js";
import { getFulfillment, setFulfillment, clearFulfillment } from "../../lib/fulfillment.js";
import { getCartDetails, clearCart } from "../../lib/cart.js";
import { prisma } from "../../lib/prisma.js";
import { createAndAttachPaymentIntent } from "../../lib/paymongo.js";
import { resolveBaseUrl } from "../../lib/requestUrl.js";

const PAYMENT_WINDOW_MS = 15 * 60 * 1000; // how long a QR/GCash link stays valid

export async function setFulfillmentAction(formData) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const method = formData.get("method")?.toString();
  const branchId = formData.get("branchId")?.toString();
  if (method !== "DELIVERY" && method !== "PICKUP") return;
  if (!branchId) return;

  const branch = await prisma.branch.findUnique({ where: { id: branchId } });
  if (!branch || !branch.isActive) return;

  // Belt-and-suspenders: in practice nobody reaches checkout with items in
  // their cart without a complete profile already (addToCartAction gates on
  // it), but this keeps the delivery option honest either way.
  if (method === "DELIVERY" && !(await isProfileComplete(user))) {
    redirect("/account");
  }

  let addressId = null;
  if (method === "DELIVERY") {
    addressId = formData.get("addressId")?.toString() ?? null;
    const address = addressId ? await prisma.address.findUnique({ where: { id: addressId } }) : null;
    if (!address || address.userId !== user.id) return;
  }

  await setFulfillment({ method, branchId, ...(addressId ? { addressId } : {}) });
  revalidatePath("/checkout");
}

function generateReference() {
  return `HM-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
}

export async function placeOrderAction(formData) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const { items, total } = await getCartDetails();
  if (items.length === 0) {
    redirect("/checkout?error=empty_cart");
  }

  const fulfillment = await getFulfillment();
  if (!fulfillment) {
    redirect("/checkout?error=no_fulfillment");
  }

  const paymentMethod = formData.get("paymentMethod")?.toString();
  if (!["QR_CODE", "GCASH", "CASH_ON_DELIVERY"].includes(paymentMethod)) {
    redirect("/checkout?error=no_payment_method");
  }
  const isCod = paymentMethod === "CASH_ON_DELIVERY";

  let addressId = null;
  if (fulfillment.method === "DELIVERY") {
    if (!(await isProfileComplete(user))) {
      redirect("/account");
    }
    // The specific address chosen in the checkout picker for *this* order —
    // not necessarily the account's default, since a customer can pick a
    // different saved address just for one order without changing which one
    // is their default going forward.
    const address = fulfillment.addressId
      ? await prisma.address.findUnique({ where: { id: fulfillment.addressId } })
      : null;
    if (!address || address.userId !== user.id) {
      redirect("/checkout?error=no_fulfillment");
    }
    addressId = address.id;
  }

  const deliveryFee = 0;
  const orderTotal = total + deliveryFee;

  // COD has no payment to collect online, so it starts at its own status
  // (PENDING_CONFIRMATION) rather than PENDING — a plain PENDING here would
  // make it look, to staff and to /admin/sales, like a QR/GCash order still
  // mid-payment rather than one waiting on a phone call.
  const initialStatus = isCod ? "PENDING_CONFIRMATION" : "PENDING";

  const order = await prisma.order.create({
    data: {
      user: { connect: { id: user.id } },
      branch: { connect: { id: fulfillment.branchId } },
      ...(addressId ? { address: { connect: { id: addressId } } } : {}),
      status: initialStatus,
      subtotal: total,
      deliveryFee,
      total: orderTotal,
      items: {
        create: items.map((item) => ({
          menuItem: { connect: { id: item.id } },
          quantity: item.quantity,
          unitPrice: item.price,
        })),
      },
      statusHistory: {
        create: {
          status: initialStatus,
          note: isCod ? "Order placed — cash on delivery" : "Order placed",
        },
      },
      payment: {
        create: {
          method: paymentMethod,
          status: "PENDING",
          amount: orderTotal,
          transactionRef: generateReference(),
        },
      },
    },
  });

  // COD skips PayMongo entirely — no payment intent is created, no QR/redirect
  // to show. The order just sits at PENDING_CONFIRMATION until an admin
  // verifies it (see verifyCodPayment / app/admin/orders/actions.js).
  if (!isCod) {
    const baseUrl = await resolveBaseUrl();

    try {
      const paymongo = await createAndAttachPaymentIntent({
        amountPesos: orderTotal,
        method: paymentMethod,
        orderId: order.id,
        returnUrl: `${baseUrl}/orders/${order.id}`,
      });

      await prisma.payment.update({
        where: { orderId: order.id },
        data: {
          paymongoPaymentIntentId: paymongo.paymentIntentId,
          paymongoCheckoutUrl: paymongo.checkoutUrl,
          paymongoQrCodeData: paymongo.qrCodeData,
          expiresAt: new Date(Date.now() + PAYMENT_WINDOW_MS),
        },
      });
    } catch (error) {
      // The order/payment rows stay PENDING with no PayMongo id attached. The
      // confirmation page detects this (no paymongoPaymentIntentId) and shows a
      // "payment setup failed, contact us" state instead of a broken QR/redirect
      // — the order itself isn't lost, just stuck awaiting a manual retry.
      console.error("PayMongo Payment Intent creation failed:", error.message);
    }
  }

  // The order now exists and shows up under "Your Orders" — clear the cart
  // here rather than waiting for payment to actually succeed. Retrying a
  // failed/expired payment happens against this same order (see /orders/[id]
  // and the poll route), not by re-adding items to a cart.
  await clearCart();
  await clearFulfillment();

  redirect(`/orders/${order.id}`);
}
