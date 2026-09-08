// Format-only checks for signup's name/phone fields, by request ("the name
// and contact number must be real"). Neither of these can actually confirm
// a name belongs to a real person or that a phone number is reachable — that
// second one would need a real SMS OTP provider, which this project doesn't
// have — so this only rejects the obviously-fake cases: junk characters,
// placeholder text, and repeated-digit numbers nobody actually has.

// Letters (incl. accented, e.g. "ñ"), spaces, hyphens, apostrophes, and
// periods only — covers real names ("Mary-Jane", "D'Angelo", "Jr.") while
// rejecting digits and random symbols someone might type to get past a
// required field.
const NAME_PATTERN = /^[\p{L} '.-]{2,50}$/u;

// Common placeholder/junk values people type instead of a real name when a
// form insists on one — not exhaustive, just the obvious ones, so a real
// (if short) name doesn't get caught by accident.
const NAME_BLOCKLIST = new Set([
  "test",
  "testing",
  "asdf",
  "qwerty",
  "abc",
  "xxx",
  "n/a",
  "na",
  "none",
  "unknown",
  "sample",
]);

export function isValidName(name) {
  if (!name) return false;
  const trimmed = name.trim();
  if (!NAME_PATTERN.test(trimmed)) return false;
  if (NAME_BLOCKLIST.has(trimmed.toLowerCase())) return false;

  // Rejects a name that's just one character repeated ("aaaa", "zzzz") once
  // spacing/punctuation is stripped out — real names essentially never look
  // like this.
  const lettersOnly = trimmed.replace(/[\s'.-]/g, "");
  if (lettersOnly.length > 0 && /^(.)\1+$/.test(lettersOnly)) return false;

  return true;
}

// A Philippine mobile number's local part (digits only, no +63 country code
// — see signup/actions.js for where that prefix gets added): exactly 10
// digits, always starting with 9. Format-only — this can't confirm the
// number is actually reachable, just that it's shaped like a genuine PH
// mobile number rather than random or placeholder digits.
export function isValidPhilippineMobile(digits) {
  if (!digits || !/^9\d{9}$/.test(digits)) return false;

  // Rejects "9000000000", "9111111111", etc. — every digit after the
  // leading 9 identical is a common placeholder pattern, not a real number.
  if (/^9(\d)\1{8}$/.test(digits)) return false;

  return true;
}
