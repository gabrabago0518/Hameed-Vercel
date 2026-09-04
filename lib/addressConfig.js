// Kept out of app/account/addresses/actions.js on purpose — a "use server"
// file may only export async functions, so a plain constant can't live there
// (it silently breaks every export in that file, not just this one).
export const MAX_ADDRESSES_PER_USER = 5;
