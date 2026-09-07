// For a redirect target that arrives as a plain (and therefore tamperable)
// form field — see app/account/addresses/actions.js's redirectTo/
// errorRedirectTo — rather than something the server itself always controls.
// redirect() must never be handed one of these unchecked: an absolute URL or
// a protocol-relative "//evil.com" would send the customer's browser off-site
// right after a legitimate, successful action.
//
// Requires a path starting with exactly one "/" — also rejects the
// "/\evil.com" backslash variant some browsers normalize into "//evil.com".
const SAFE_REDIRECT_PATH = /^\/(?!\/|\\)/;

export function safeRedirectPath(path, fallback) {
  return typeof path === "string" && SAFE_REDIRECT_PATH.test(path) ? path : fallback;
}
