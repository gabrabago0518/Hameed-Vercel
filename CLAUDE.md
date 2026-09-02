# Project: Hameed the Love Recipe (food delivery website)

A food delivery website inspired by McDo/Jollibee-style delivery apps — browsing a menu,
account creation, cart, checkout, payment, and live order tracking.

## Tech stack (decided, don't change without asking)
- Next.js (App Router), JavaScript (not TypeScript)
- Tailwind CSS for styling
- Prisma ORM — **stable v7** (not v8/beta — an earlier install accidentally grabbed the
  v8 early-access CLI via npm's "latest" tag, which caused several errors; it was
  uninstalled and replaced with `prisma@7 @prisma/client@7`)
- PostgreSQL, running locally on the user's own machine (not Prisma's built-in
  "local Prisma Postgres" proxy — that got auto-configured once by mistake and was
  replaced with a direct connection string)

## Current progress
- [x] Node.js, Git, GitHub, VS Code installed
- [x] Next.js app created — folder name is `hameeds` (not "sarap-express", user kept
      the auto-generated name)
- [x] PostgreSQL installed locally on Windows, default user `postgres`
- [x] Prisma (stable v7) installed and initialized
- [x] `prisma/schema.prisma` filled in with the full schema (see below) — note: the
      `datasource` block must NOT contain a `url` line; the URL lives only in
      `prisma.config.ts` (checked in as `prisma7.config.ts` — nonstandard name, but
      Prisma's CLI still auto-detects it) / `.env` (Prisma 7+ requirement)
- [x] `.env` contains: `DATABASE_URL="postgresql://postgres:admin@localhost:5432/food_delivery"`
- [x] `npx prisma migrate dev --name init` was run — verified directly with psql that
      all 14 tables exist in the `food_delivery` database (plus Prisma's own
      `_prisma_migrations` bookkeeping table)
- [x] Prisma Client wired up at `lib/prisma.js`. Prisma 7's `prisma-client` generator
      requires a driver adapter now (no more built-in engine) — `@prisma/adapter-pg`
      and `pg` are installed, and `lib/prisma.js` passes a `PrismaPg` adapter built
      from `DATABASE_URL` into `new PrismaClient({ adapter })`.
- [x] `prisma/seed.js` adds one sample restaurant/branch/category/menu-item set
      ("Hameed the Love Recipe" — Rice Meals, Burgers, Drinks). Run with `npm run db:seed`.
- [x] First real page built: `app/menu/page.jsx` — a server component that queries
      the restaurant + categories + items straight from Prisma and renders them.
      Verified in the browser (dev server + curl) that seeded items actually show up.
- [x] Home page (`app/page.jsx`) redesigned: shop name, a featured "Pastil" bestseller
      card, and a "Start Ordering" button linking to `/menu`. Pastil also exists as a
      real menu item (new "Signature" category, sortOrder 0) so the promise on the
      home page leads somewhere real.
- [x] Theme locked to strict red/white (not the demo's red/amber/emerald) — white
      backgrounds throughout, red as the single accent color for buttons/links/prices.
      `app/globals.css`'s old auto-dark-mode media query was removed since it fought
      with this light-only brand.
- [x] Shared `Header` component (`app/components/Header.jsx`) added to the root layout
      with Menu/Cart/Account nav links (lucide-react icons). `/cart` and `/account`
      exist as "coming soon" placeholder pages so the links don't 404.
- [x] `User` model got a `role` field (`CUSTOMER` | `ADMIN`, default `CUSTOMER`) via
      migration `add_user_role`. Password hashing uses **bcryptjs** (pure JS, no native
      build step — plain `bcrypt` needs node-gyp/a C++ toolchain, which is more likely
      to break on the user's Windows machine).
- [x] `prisma/create-admin.js` (run via `npm run db:create-admin`) reads
      `ADMIN_EMAIL`/`ADMIN_PASSWORD`/`ADMIN_NAME` from `.env`, hashes the password, and
      upserts that user as `role: "ADMIN"`. Deliberately reads credentials from `.env`
      rather than having Claude type/see the password directly, and it's an upsert so
      re-running it (e.g. to change the password) is safe.
- [x] Login/signup built with no auth library — a hand-rolled signed cookie instead
      of NextAuth/iron-session, to keep dependencies minimal like the rest of the
      project. `lib/session.js` signs `userId.expiryTimestamp` with HMAC-SHA256 using
      `SESSION_SECRET` (auto-generated into `.env`, keep it secret) and stores it in an
      httpOnly cookie named `session`. `createSession`/`destroySession`/`getCurrentUser`
      are the only three functions; `getCurrentUser` re-reads the user from Postgres on
      every call (no separate sessions table).
- [x] `app/login/actions.js` and `app/signup/actions.js` are Server Actions (`"use
      server"`) driving `app/login/page.jsx` / `app/signup/page.jsx`, both client
      components using React 19's `useActionState` to show validation errors inline.
      `app/logout/actions.js` clears the cookie and redirects home.
- [x] `Header` (now an async server component) and `/account` both call
      `getCurrentUser()` to show either a "Log in" link or the signed-in user's name +
      a working logout button. Because they read the `session` cookie, **every page is
      now dynamically rendered** (`ƒ` in `next build` output, not `○`) — that's expected,
      not a regression.
- [x] Header restyled to a solid red bar (`bg-red-600`) with the brand name in plain
      white (no more red/white split) so it blends into the bar; nav links are
      white/90 with a white pill for the "Log in" button.
- [x] Cart built: `lib/cart.js` stores `[{ menuItemId, quantity }]` as plain JSON in a
      (non-signed, unlike the session cookie) `cart` cookie — no `carts`/`cart_items`
      table. **Decision reversed since first building this**: the cart now *requires*
      being logged in (originally it deliberately didn't). All three actions in
      `app/cart/actions.js` (`addToCartAction`, `updateCartQuantityAction`,
      `removeFromCartAction`) call `getCurrentUser()` first and `redirect("/login")`
      if there's no session — enforced server-side, not just hidden in the UI (verified
      by POSTing directly to the action as a guest and confirming the redirect + no
      cart cookie gets set). `app/menu/page.jsx` also checks the user and shows a
      "Log in to order" link instead of the Add button/form when logged out, so guests
      aren't surprised by a redirect after clicking. `app/logout/actions.js` calls
      `clearCart()` (in `lib/cart.js`) alongside `destroySession()`, so logging out
      empties the cart — verified with a real session cookie (signed the same way
      `lib/session.js` does, using `SESSION_SECRET` from `.env`) that both the
      `session` and `cart` cookies are gone after logout.
      The menu page's "Add" buttons and the real
      `app/cart/page.jsx` (quantity +/-, remove, computed total, disabled "Checkout
      (coming soon)" button) both call into these. Verified the whole round-trip with
      curl by replicating the browser's real POST (Server Actions progressively
      enhance to a plain multipart form POST carrying a `$ACTION_ID_...` field), not
      just that it builds. `Header` now also shows a live "Cart (n)" count.
- [x] Floating cart added: `lib/cart.js` got `getCartDetails()`, a shared helper that
      joins the cart cookie with live menu item data and returns plain numbers (not
      Prisma `Decimal` instances — those don't survive being passed as props from a
      server component to a client component). `app/cart/page.jsx` was refactored to
      use it instead of querying Prisma itself. `app/components/FloatingCart.jsx` (a
      client component) renders a fixed bottom-right bubble with a live count badge;
      clicking it opens a slide-over panel (mini cart with per-line Remove + a "View
      full cart" link to `/cart`) without navigating away. It's rendered once in
      `app/layout.jsx` (now async, calls `getCartDetails()` and passes `items`/`total`
      down) so it appears on every page. Confirmed via the RSC payload embedded in a
      real page fetch that live cart data reaches the component; the actual
      click-to-open interaction is client-side React state and needs a real browser to
      verify, not curl.
- [x] Menu page's "Add" button always renders identically (solid red "Add") whether
      logged in or out — **do not swap its label/style for a "Log in to order" state**,
      that was tried and explicitly reverted. When logged out it's a `<Link
      href="/login">` instead of a form-submit button; when logged in it's the real
      `addToCartAction` form. Both look the same on purpose.
- [x] Signup now collects a contact number (`phone`, required) alongside name/email/
      password, stored on `User.phone` (the column already existed from the earlier
      role migration, just wasn't wired into the signup form/action until now).
- [x] `/account` expanded beyond just login/logout — now three sections: **Account
      details** (name, email, phone, role-if-admin, straight from `getCurrentUser()`),
      **Delivery address** (a form backed by the new `saveAddressAction` in
      `app/account/actions.js` — deliberately just *one* address per user for now, not
      a full address book, even though the `Address` model supports many; it
      creates-or-updates via `prisma.address.findFirst({ where: { userId } })` rather
      than tracking an addressId in the form), and **Recent transactions** (last 5
      `Order`s for the user, newest first, with items/total/status — currently always
      shows "No orders yet" for every account since checkout doesn't exist yet and
      nothing has ever written to the `orders` table; this is expected, not a bug, and
      will start populating once checkout is built). Verified all of this with a real
      signed session cookie (not just that it builds): confirmed the sections render,
      saved a test address through the real form-post flow, saw it come back on
      reload, then deleted that test row directly from the database afterward.
- [x] Fixed "Missing `origin` header from a forwarded Server Actions request." —
      Next's CSRF check for Server Actions rejects requests that look proxied
      (mismatched Host/X-Forwarded-Host) but carry no `Origin` header. Added
      `experimental.serverActions.allowedOrigins` in `next.config.mjs` listing
      `localhost:3000`, `127.0.0.1:3000`, and `192.168.1.39:3000` (the LAN address
      Next's own dev server output showed earlier in this project). **This requires
      restarting `npm run dev`** — Next does not hot-reload `next.config.mjs`. If the
      error comes back, it means the site is being reached through some other
      address/proxy than the three listed — add whatever address the browser bar
      actually shows to that array.
- [x] Signup now requires a delivery address (street + city), not just phone —
      `app/signup/actions.js` creates it as a nested `addresses: { create: { ... } }`
      alongside the `User` in one `prisma.user.create` call, `isDefault: true`. Every
      *new* account is guaranteed to have both a phone and an address from here on.
- [x] Ordering is gated on having a complete profile, not just being logged in.
      `lib/profile.js` has the single `isProfileComplete(user)` check (phone set +
      at least one address row exists) used by `addToCartAction` in
      `app/cart/actions.js` — incomplete profile redirects to `/account` (only the
      add action is gated; updating/removing existing cart lines isn't, since there's
      no reason to block someone from emptying a cart they already have). This exists
      because accounts created *before* the phone/address requirements above can still
      be missing either one — the admin account created earlier in this project is a
      real example, since it predates both requirements.
      `/account` now shows a red banner naming exactly what's missing ("Add your
      contact number and delivery address below..."), and — new — the contact number
      became actually editable there via `savePhoneAction` (`app/account/actions.js`);
      before this it was display-only, so an account missing a phone had no way to add
      one. Verified the whole gate for real using the admin account (which had neither
      phone nor address): confirmed add-to-cart redirects to `/account` while either
      is missing, saved phone then address one at a time via the real form-post flow
      confirming the block only lifts once *both* are present, then restored the admin
      account to its original phone:null/no-address state afterward.
- [x] Phone and address on `/account` now lock once filled — this needed genuine
      client-side state (show text + a "Change number"/"Change address" button, click
      to reveal the edit form), which a plain Server Component can't do, so two small
      client components were added: `app/components/PhoneField.jsx` and
      `app/components/AddressField.jsx`. Both start in edit mode when the value is
      empty (nothing to lock yet) and switch to locked after a save. Pattern worth
      remembering: each wraps the imported server action in a client-side async
      function (`action={async (formData) => { await action(formData); setEditing(false); }}`)
      so it can flip back to locked view right after the save resolves — calling a
      `"use server"` action from client code like this is supported as long as the
      action itself doesn't call `redirect()` on the success path (`savePhoneAction`/
      `saveAddressAction` only redirect on the no-session edge case, so this is safe).
      Verified the locked view renders correctly with real data (temporarily set the
      admin account's phone/address directly via SQL, confirmed "Change number"/
      "Change address" + the saved values appear and the incomplete-profile banner
      disappears, then reset the account back to empty). The actual click-to-reveal
      interaction is client-side React state, same caveat as the floating cart — needs
      a real browser to verify, not curl.
- [ ] Build remaining pages and API routes: checkout, payment, live order tracking
      (see reference demo below)
- [ ] Connect the rest of the frontend to the database via Prisma Client

### Prisma generator config note
`prisma/schema.prisma`'s `generator client` block has `importFileExtension = "ts"` set
explicitly. Without it, a plain `npx prisma generate` produced internal imports like
`from "./enums"` (no extension), which Node's ESM loader can't resolve (it needs the
literal `.ts`) — this broke `npm run db:seed` / `db:create-admin` with
`ERR_MODULE_NOT_FOUND` even though `npx next build` still worked fine (Next's own
bundler doesn't care about the extension). Keep this setting; don't remove it even if
a future regenerate "looks fine" without it.

### Notes from converting the app to plain JavaScript
The app was originally created with TypeScript (`.tsx`, `tsconfig.json`) despite the
decided stack being JS — this got fixed by converting `app/page.tsx`/`layout.tsx` to
`.jsx`, deleting `tsconfig.json`/`next-env.d.ts`, and uninstalling `typescript`/`@types/*`.
Two things fell out of that worth knowing about:
- **`package.json` now has `"type": "module"`** so `.js` files (like `prisma/seed.js`)
  run as ES modules — needed because Prisma 7's generated client is ESM.
- **Prisma 7's `prisma-client` generator always emits `.ts` files** into
  `app/generated/prisma/` (even though the generator itself and our app code are not
  TypeScript). Node can run them directly (they only use erasable type syntax), but
  **Next.js detects those `.ts` files and silently regenerates a bare `tsconfig.json`
  on every `build`/`dev`** — that tsconfig has no path aliases, so a `@/*` import alias
  would silently break. Resolution: no `jsconfig.json`/path aliases in this project —
  always use relative imports (e.g. `../../lib/prisma.js`). The auto-created
  `tsconfig.json` is expected and harmless; don't try to delete it permanently or
  "fix" this — it comes back on the next build regardless.

## Database schema
Tables: users, addresses, restaurants, branches, menu_categories, menu_items,
item_addons, orders, order_items, order_item_addons, order_status_history, payments,
riders, order_deliveries.

Key design decisions to preserve:
- Prices on `order_items` are snapshotted at order time (`unit_price`), so later menu
  price changes never affect historical orders.
- `order_status_history` exists separately from `orders.status` so the tracking UI can
  show a full timeline, not just the current state.
- Restaurant/branch structure supports multiple brands and multiple physical locations
  per brand, not just a single restaurant.

## Reference demo
A fully working front-end-only demo (React/JSX, Tailwind, lucide-react icons) exists
showing the intended user flow: menu → cart → login/signup → checkout → payment →
live order tracking. It uses mock in-memory data, not a real backend. The demo itself
was originally branded "Sarap Express" with a red/amber/emerald palette, but the real
site being built here is branded **"Hameed the Love Recipe"** with a **strict red/white
theme** instead (see Current progress) — Space Grotesk + Inter fonts carry over
unchanged. Use the demo as the reference for page structure and flow, converting the
mock functions into real API calls against the Prisma schema above, but use the new
brand name and red/white colors in all real pages/seed data.

## Working style
- The user is a beginner with JavaScript and with the terminal in general — explain
  what generated code does in plain terms, avoid unexplained jargon, and prefer small
  incremental steps over large unexplained changes.
- The user is on Windows using PowerShell — give PowerShell-compatible commands, not
  bash/cmd syntax, unless they say otherwise.
- Ask before running destructive commands (e.g. resetting the database).
- Double-check `.env` and `prisma/schema.prisma` before assuming Prisma commands will
  work — this project has already hit config-related errors twice.
