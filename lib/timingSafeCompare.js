import crypto from "node:crypto";

// A plain `===`/`!==` on two secret-derived strings (a session signature, a
// bearer token) leaks how many leading characters matched via how long the
// comparison takes — usually not practically exploitable over a real
// network, but it costs nothing to close off, and this project already gets
// it right for the PayMongo webhook signature (see lib/paymongo.js). This is
// that same pattern, shared, so every secret comparison in the app uses it.
//
// crypto.timingSafeEqual requires equal-length buffers and throws otherwise,
// so a length mismatch is checked first and short-circuits to false — the
// values compared here are always a fixed format (a hex HMAC digest, an env
// secret), so leaking "the lengths differed" isn't itself a meaningful signal
// the way leaking "the first N characters matched" would be.
export function timingSafeEqual(a, b, encoding = "utf8") {
  if (typeof a !== "string" || typeof b !== "string") return false;

  const bufferA = Buffer.from(a, encoding);
  const bufferB = Buffer.from(b, encoding);
  if (bufferA.length !== bufferB.length) return false;

  return crypto.timingSafeEqual(bufferA, bufferB);
}
