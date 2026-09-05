// Shared across every page that lists an order's line items (/orders,
// /orders/[id], /staff/orders, /admin/orders/[id]) so the "what did this
// line actually cost, and what choices did the customer make" logic exists
// in exactly one place. Callers must include { addons: { include: { addon:
// true } }, variantSelections: { include: { variantOption: { include: {
// group: true } } } } } on each OrderItem query.

// OrderItem.unitPrice is just the bare menu item price — addon/variant costs
// are itemized separately (see checkout/actions.js), so the real per-unit
// cost for display/total purposes has to add them back in here.
export function getOrderItemLineTotal(item) {
  const addonsTotal = item.addons.reduce((sum, a) => sum + Number(a.unitPrice), 0);
  const variantTotal = item.variantSelections.reduce((sum, v) => sum + Number(v.priceDelta), 0);
  return (Number(item.unitPrice) + addonsTotal + variantTotal) * item.quantity;
}

// A short, human-readable list of the choices made on this line — e.g.
// ["Spicy", "+ Extra Rice"] — for showing next to the item name. Empty for
// a plain item with no addons/variant chosen.
export function getOrderItemChoiceLabels(item) {
  const labels = item.variantSelections.map((v) => v.variantOption.name);
  for (const a of item.addons) {
    labels.push(`+ ${a.addon.name}`);
  }
  return labels;
}
