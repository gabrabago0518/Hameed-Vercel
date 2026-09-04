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
- [x] "Recent transactions" on `/account` renamed to "Recent Orders" (label only, no
      behavior change).
- [x] Real branch data replaced the placeholder from initial seeding — the restaurant
      has exactly two branches: **Maharlika Branch** (address "Maharlika Village") and
      **New Lower Bicutan Branch** (address "New Lower Bicutan"), both `city: "Taguig
      City"`. **The street addresses are placeholders** (inferred from the branch
      names, both are real Taguig City barangays) — correct them in the `branches`
      table / `prisma/seed.js` if they're not exact. Old placeholder branch ("Hameed
      the Love Recipe - Quezon City") was deleted from the live DB and from
      `prisma/seed.js`.
- [x] `/cart` as a standalone page was **removed entirely by request** — the floating
      cart panel (bottom-right button) is now the *only* cart UI, and it grew full
      quantity +/- controls (previously only had Remove) since it had to absorb
      everything the page used to do. **Do not re-add a `/cart` route** — if cart
      management needs to change, it goes in `app/components/FloatingCart.jsx`.
      `app/cart/actions.js` (the three server actions) stayed — still used by the
      menu page's Add buttons and by the floating panel.
- [x] The header also has a cart button now (`app/components/HeaderCartButton.jsx`),
      but it opens the *same* floating panel rather than linking anywhere. Since the
      header button and the floating button are different components needing to
      control one shared panel, added `app/components/CartUIContext.jsx` — a small
      client Context (`CartUIProvider`/`useCartUI()`) holding just `{ open, setOpen }`.
      `app/layout.jsx` wraps `<Header />`, `{children}`, and `<FloatingCart />` in
      `<CartUIProvider>`. If anything else ever needs to open/close the cart panel,
      pull `useCartUI()` rather than adding another local `useState`.
- [x] Header's logout moved into a hover dropdown under the account name (was a
      separate "Log out" nav item before) — pure CSS via Tailwind's `group`/
      `group-hover`, no client component needed for this one. The dropdown wrapper
      uses `pt-2` (padding, not margin) between the trigger and the dropdown card so
      there's no gap where the hover would drop — that's a deliberate detail, not
      arbitrary spacing; changing it to a margin will break hover-out-then-back-in.
- [x] First real step of checkout built: `/checkout` (`app/checkout/page.jsx` +
      `app/checkout/actions.js`). Requires login (redirects to `/login` otherwise).
      Shows the order summary (via `getCartDetails()`), then a "Delivery or Pickup"
      choice: Delivery shows the saved address and is disabled if there somehow isn't
      one; Pickup shows a `<select>` of active branches. The choice is stored in a new
      cookie (`lib/fulfillment.js`, mirrors the `cart.js`/`session.js` pattern —
      `{ method: "DELIVERY" }` or `{ method: "PICKUP", branchId }`), not the database,
      since there's no `Order` row to attach it to until checkout actually completes
      payment (still a disabled "Continue to payment (coming soon)" button — payment
      itself is not built). `setFulfillmentAction` re-checks `isProfileComplete()` on
      the delivery path as a defensive backstop, even though in practice nobody
      reaches checkout with a cart otherwise (add-to-cart already gates on it).
      Verified for real: logged in as the (temporarily profile-completed) admin
      account, added an item, confirmed both branches list on `/checkout`, selected
      Delivery and saw the saved address confirm, then switched to Pickup at Maharlika
      Branch and saw that confirm too — then reset the admin account back to empty
      phone/no-address afterward.
- [x] Added two more menu categories via a one-off script against the live DB (and
      mirrored into `prisma/seed.js` for future fresh seeds): **Silog Meals** (Tapsilog,
      Chicksilog, Longsilog, Spicy Pastil Silog, Hotsilog, Chicken Wings) and **Also
      Available** (Chicken Sisig, Bulalo (Regular), Bulalo (Special), Pares).
      **Every price on these ten items is a placeholder guess** (typical Philippine
      carinderia pricing, ₱69–199) — none were given by the user. Flag this clearly if
      asked about menu pricing; these need real numbers before this is a real menu.
- [x] Home page rebuilt around a full-bleed product photo carousel — the user
      supplied real product photos in a top-level `materials/` folder (spaces in
      filenames, mixed casing); these were copied into `public/products/` with clean
      kebab-case names (`public/` is what Next.js actually serves as static files,
      `materials/` itself is not served and is just the source folder — don't delete
      `materials/`, future images should be dropped there too and then copied over the
      same way). `app/components/ProductCarousel.jsx` is a client component
      (auto-advances every 4.5s, pauses on hover, has prev/next arrows + dot
      indicators) rendering 9 slides defined inline in `app/page.jsx`. **The carousel
      is intentionally full-viewport-width** (`w-screen` + `relative left-1/2
      -translate-x-1/2`, aspect `32/9` on mobile widening to `42/9` on `sm+` — shrunk
      to about half its original height by request; the ratios were `16/9`/`21/9`
      before) even though the rest of the homepage stays padded/centered — this needed
      `overflow-x: hidden` added to `body` in `globals.css` to stop the 100vw trick
      from creating its own horizontal scrollbar; don't remove that override, it's not
      dead CSS. The old "Hameed the Love Recipe" heading + tagline text block above
      the carousel was deliberately removed by request — the carousel is the hero now,
      don't re-add a text heading above it without being asked. `<main>`'s top padding
      (`py-16`) was also changed to `pb-16` only (no `pt`) so the carousel sits flush
      against the sticky header with zero gap at the top of the page, per request —
      don't add `pt-*` back to that `<main>` without checking this is still wanted.
      **Found while reviewing the supplied photos, not yet acted on**: several of the
      promo graphics show real prices that conflict with the placeholder prices guessed
      above — Bulalo shows ₱150 (not the guessed ₱149 Regular/₱199 Special split),
      Pares shows ₱60 (not the guessed ₱99), and there's a "Chicken Inasal" (₱129,
      served at the Maharlika Main Branch) and two jarred retail products ("Spicy
      Pastil" ₱185/jar, "Original Pastil" ₱175/jar) that aren't in the menu at all yet.
      Flagged to the user; **waiting on confirmation before changing menu prices/items**
      — don't silently apply these without being asked, since the graphics could be
      showing promo/limited-time pricing rather than the current standard price.
- [x] Fonts changed from Space Grotesk + Inter to **Poppins (weights 600/700/800) +
      Inter** — Poppins replaced Space Grotesk as `--font-heading` for a bolder, more
      rounded look per explicit request ("bolder and easier to read"); Inter stayed for
      body copy since it was already chosen for UI legibility. If asked to change
      fonts again, edit the `Poppins`/`Inter` imports in `app/layout.jsx` plus the
      `--font-heading`/`--font-sans` variable mapping in `app/globals.css` — both need
      to change together, the CSS variable name is separate from the imported font.
- [ ] Build remaining pages and API routes: payment, live order tracking (see
      reference demo below) — checkout now exists but stops at fulfillment choice
- [ ] Connect the rest of the frontend to the database via Prisma Client
- [x] **Checkout now actually places real orders** — this is the big one. Payment is
      restricted to exactly two methods by request: `PaymentMethod` enum in
      `schema.prisma` is now just `QR_CODE` and `GCASH` (was `CASH_ON_DELIVERY` /
      `CARD` / `GCASH` / `MAYA`; migration `checkout_payment_methods`, hand-written
      since `prisma migrate dev` refuses to run non-interactively for a
      destructive-looking enum change — payments/orders tables were empty at the time
      so it was safe). **No real payment gateway is wired up and none should be
      fabricated** — a fake-but-plausible QR Ph code would be actively misleading
      (looks payable, isn't), since a genuine one requires being registered with a
      QR-Ph-accredited bank or a provider like PayMongo/Xendit. Every order gets a
      real unique reference (`HM-XXXXXXXX`, `lib` inline in `app/checkout/actions.js`'s
      `generateReference()`) stored on `Payment.transactionRef`, and the order
      confirmation page (`app/orders/[id]/page.jsx`) shows a clearly-labeled "QR code
      coming soon" placeholder box next to it — swap that box for a real QR image once
      a real provider is integrated; the reference-number plumbing underneath doesn't
      need to change.
      Same schema pass also made `Order.addressId` nullable (`String?`, was required)
      since a PICKUP order has no delivery address — and extended the *delivery* path
      to also require choosing a branch (`lib/fulfillment.js`'s cookie now always
      stores `{ method, branchId }`, not just for pickup), since `Order.branchId` is
      still required for every order and there was no principled way to pick one for
      delivery automatically with only two branches.
      `app/checkout/actions.js` has the real `placeOrderAction`: validates cart
      non-empty, fulfillment chosen, payment method chosen, and (for delivery)
      profile-complete again, then creates `Order` + `OrderItem`s + one
      `OrderStatusHistory` row (`PENDING`, "Order placed") + `Payment` in one
      `prisma.order.create()` call, clears the cart and fulfillment cookies, and
      redirects to `/orders/[id]`. **Important Prisma gotcha hit here**: when a
      `create()` call mixes parent relations (user/branch/address) with nested child
      `create`s (items/statusHistory/payment), this generator's validator rejects flat
      scalar FKs (`userId: "..."`) and wants relation-style `{ connect: { id } }` for
      every parent relation instead — `lib/cart.js`'s and `app/account/actions.js`'s
      flat-scalar `create()` calls still work fine (they don't mix in sibling nested
      relations), so this isn't a blanket rule, just something to watch for on any
      future multi-relation `create()`.
      **If a Server Action's behavior doesn't match what you just edited, restart the
      dev server before assuming the code is wrong.** Hit this directly while building
      this feature: identical `prisma.order.create()` code failed through the running
      `npm run dev` (with a *stale* one-edit-behind error each time) but succeeded
      instantly in a standalone script — the long-lived Turbopack dev server was
      serving a cached compiled version of the action across several consecutive
      edits. Restarting (`taskkill` the old PID, `npm run dev` again) fixed it
      immediately. This project's dev server tends to run for a very long time across
      many edits in one sitting, so treat this as a real possibility whenever a fix
      "should have worked" but the live error looks one step behind the current file.
      Verified the entire flow for real, not just that it builds: temporarily gave the
      admin account a phone+address, added Pastil to cart, picked Pickup at Maharlika
      Branch, paid via QR, landed on a real `/orders/[id]` confirmation page with a
      correct reference/total/branch, confirmed the cart cookie was cleared, confirmed
      `/account`'s "Recent Orders" now shows this order instead of "No orders yet" for
      the first time — then deleted the test order (payment, status history, items,
      order rows) and reset the admin account back to empty phone/no-address after.
- [x] **Real PayMongo integration added on top of the QR/GCash scaffold above** — this
      replaces the placeholder QR box with an actual payment flow using PayMongo's
      Payment Intents API (QRPh + GCash). No PayMongo keys were plugged in yet at time
      of writing — `.env`'s `PAYMONGO_SECRET_KEY`/`PAYMONGO_PUBLIC_KEY`/
      `PAYMONGO_WEBHOOK_SECRET` are empty placeholders; get **TEST-mode** keys
      (`sk_test_...`/`pk_test_...`) from the PayMongo dashboard, never live keys, until
      this is genuinely ready to take real money.
  - `lib/paymongo.js`: thin `fetch`-based wrapper, no PayMongo Node SDK installed
    (PayMongo doesn't publish an official one, and a third-party npm package felt
    like the wrong dependency to add sight-unseen — matches this project's general
    minimal-dependency bias). `createAndAttachPaymentIntent()` does PayMongo's
    two-step dance (create Payment Intent → create Payment Method of type
    `gcash`/`qrph` → attach) and returns either a `checkoutUrl` (GCash redirect) or
    `qrCodeData` (QRPh image URL). `verifyWebhookSignature()` implements PayMongo's
    `t=...,te=...,li=...` HMAC-SHA256 scheme — verifies against the **raw** request
    body string, never a re-serialized `JSON.parse` of it (re-serializing can change
    byte content and break a genuinely valid signature).
  - Schema additions (migration `paymongo_integration`, hand-written for the same
    non-interactive-`migrate-dev` reason as before — additive/safe, table was empty):
    `PaymentStatus` gained `EXPIRED`; `Payment` gained `paymongoPaymentIntentId`
    (unique — this is the key webhooks use to find the right order),
    `paymongoCheckoutUrl`, `paymongoQrCodeData`, `expiresAt`; new `WebhookEvent`
    model (`provider` + `providerEventId` unique together) purely to make the
    webhook handler idempotent against redelivery.
  - `lib/orderPayment.js`: `markOrderPaid` / `markOrderPaymentFailed` /
    `markOrderPaymentExpired` are the **single source of truth** for what happens
    to an Order when its payment resolves — both the webhook handler and the
    polling fallback call into these rather than each having their own
    update-the-database logic, and each one re-checks the payment's current status
    before doing anything (so calling `markOrderPaid` twice, or racing a webhook
    against a poll, is safe — verified directly: second call is a no-op, no
    duplicate `OrderStatusHistory` row).
  - `app/checkout/actions.js`'s `placeOrderAction` now calls
    `createAndAttachPaymentIntent` right after creating the Order/Payment rows, and
    **deliberately doesn't let a PayMongo failure lose the order** — wrapped in
    try/catch; on failure the Order/Payment stay `PENDING` with no PayMongo id
    attached, and `/orders/[id]` detects that (no `paymongoPaymentIntentId`) and
    shows a "payment setup failed, contact us" state instead of a broken QR/redirect.
    Verified this exact path for real (with the keys still empty): order creation
    still succeeds, no crash, confirmation page shows the failed-setup message
    correctly.
  - `app/api/webhooks/paymongo/route.js`: verifies signature → checks
    `WebhookEvent` for a duplicate (returns early if so) → matches
    `payment_intent_id` from the event to a `Payment` row → on amount mismatch,
    logs and refuses to auto-confirm rather than trusting it (**no alerting is wired
    up for that log line yet** — needs real ops alerting before this goes live) → on
    match calls `markOrderPaid`/`markOrderPaymentFailed` → records the
    `WebhookEvent` row. **The exact JSON field paths (`data.attributes.data.attributes.payment_intent_id`
    etc.) are from PayMongo's documented shape, not yet verified against a real
    delivered webhook** — the first real test webhook (PayMongo dashboard has a
    "send test webhook" button, or trigger a real sandbox payment) should be
    checked against these paths before trusting this in anger.
  - `app/api/orders/[id]/poll/route.js` + `app/components/OrderPaymentStatusPoller.jsx`:
    the "don't get stuck waiting forever if the webhook never arrives" fallback.
    The confirmation page polls this every 4s while `Payment.status === "PENDING"`;
    the route itself calls PayMongo's retrieve-Payment-Intent endpoint and
    reconciles through the same `lib/orderPayment.js` functions, or expires the
    payment if `expiresAt` (15-minute window, set at creation) has passed. This is
    **on-view lazy reconciliation, not a background job** — there's no
    cron/scheduler in this project, so an order nobody ever reopens just sits
    `PENDING` indefinitely; a real production setup would want an actual scheduled
    sweep for that case. Verified the auth guard (401 signed-out, 404 for another
    user's order) and the no-crash path when `paymongoPaymentIntentId` is null.
  - `/orders` (all of the current user's orders) and `/orders/[id]` (single order,
    now with a real `PaymentSection` that branches on `Payment.status`: `PAID` →
    green success state, `FAILED`/`EXPIRED` → red cancelled state, `PENDING` with no
    PayMongo id → amber setup-failed state, `PENDING` with one → the actual QR image
    or GCash redirect button + the poller). `/account`'s "Recent Orders" now links
    to `/orders` ("View all").
  - **Still not built**: the admin/orders view (showing all customers' paid orders
    with full item lists, for the kitchen/fulfillment side) — deliberately paused
    before starting this since it's a new role-gated section with real UI/UX
    decisions (what actions can an admin take on an order?) that deserves its own
    focused pass rather than being rushed onto the end of this one. Ask before
    building it if it hasn't been discussed yet.
  - **Genuinely cannot be verified without real PayMongo test keys + a public HTTPS
    URL for the webhook** (localhost doesn't work for PayMongo to reach — needs a
    tunnel like `ngrok http 3000` during local development, or a real deployment):
    the actual `createAndAttachPaymentIntent` call succeeding, a real QR image or
    GCash redirect rendering, and a real webhook delivery being verified/matched.
    Structurally these are believed correct against PayMongo's documented API shape,
    but "the code should work per the docs" is not the same as "verified against a
    real response" — treat the first real test transaction as the actual first test
    of this integration, not this session's testing.
  - **Local webhook testing uses ngrok** (`ngrok http 3000`) to expose
    `localhost:3000` to PayMongo. The forwarding URL changes every time the ngrok
    tunnel restarts (free ngrok doesn't give a stable domain) — **the PayMongo
    dashboard webhook URL (`https://<ngrok-id>.ngrok-free.app/api/webhooks/paymongo`)
    must be updated to match every time ngrok is restarted**, or webhooks will
    silently fail to arrive at all (PayMongo will retry against the dead old URL,
    not the new one). If a webhook mysteriously "isn't arriving" during local
    testing, check this first before suspecting the signature/handler code.
- [x] **Cart/fulfillment cookies now only clear once payment is actually confirmed
      PAID — not when the order/payment-intent is first created.** Originally
      `placeOrderAction` cleared them immediately, which meant an abandoned or
      failed payment attempt still emptied the customer's cart. Fixed by request:
  - `placeOrderAction` (`app/checkout/actions.js`) no longer calls `clearCart()`/
    `clearFulfillment()` at all — the Order/Payment rows still get created upfront
    (PENDING) so the webhook has something to attach to, but from the customer's
    point of view nothing about their cart changes yet.
  - **Key constraint that shaped this**: a PayMongo webhook is a server-to-server
    call with no relationship to the customer's browser cookies, so the webhook
    handler *cannot* clear their cart even after marking the order PAID. Clearing
    can only happen in a request that *is* the customer's own browser session.
    `/api/orders/[id]/poll` is that place — it now clears both cookies whenever it
    observes `Payment.status === "PAID"`, regardless of whether the poll itself or
    the webhook (already run, moments or days earlier) is what actually set that
    status. This is idempotent (clearing an already-empty cart is a harmless
    no-op), so it's safe to check on every poll response rather than trying to
    track "did I just cause this transition."
  - `app/components/OrderPaymentStatusPoller.jsx` now fires one poll immediately on
    mount regardless of the page's initial payment status (previously it only ran
    while `PENDING`), and is rendered unconditionally on `/orders/[id]` rather than
    nested inside the PENDING-only branch of `PaymentSection`. This covers the
    "customer closes the tab mid-GCash-flow, payment settles via webhook while
    they're gone, they reopen the confirmation page hours later" case — that one
    immediate poll is what clears their (by-then-stale) cart the first time their
    browser actually observes the PAID status.
  - **Known accepted limitation**: if the customer never reopens `/orders/[id]`
    again after abandoning payment mid-flow, their cart never gets cleared by this
    mechanism (there's no background job to do it any other way — consistent with
    the earlier-documented "no cron/scheduler in this project" limitation for
    expiry). In practice this only matters if they paid successfully via a path
    that never brings them back to that page, which is an unusual flow.
  - Verified all three paths for real: (1) placed an order — cart still had the
    item immediately after redirect to the confirmation page; (2) directly called
    `markOrderPaid` (simulating the webhook) — cart cookie was still present right
    after, confirming the webhook path truly cannot touch it — then hit `/poll` as
    the customer and confirmed the cart cleared only at that point; (3) called
    `markOrderPaymentFailed` on a second test order, hit `/poll`, confirmed the
    cart was untouched (items still present, ready to retry).
- [x] **Reversed the above, by explicit request** — the cart now clears right when
      `placeOrderAction` creates the order again, not when payment is confirmed.
      Reasoning given: once the order exists and shows up under "Your Orders", having
      the same items still sitting in the cart read as a bug, not a safety net —
      retrying a failed/expired payment should happen against that existing order
      (`/orders/[id]`, the poll route), not by re-adding items to a fresh cart.
      Removed the poll route's PAID-triggered `clearCart()`/`clearFulfillment()` call
      entirely rather than leaving it as a redundant no-op — with clearing happening
      at creation time, a *second*, unrelated cart (built up while an older order
      still awaits payment) would otherwise get wiped out the moment that older order
      finally gets confirmed. Also simplified `OrderPaymentStatusPoller.jsx` back to
      only polling while `PENDING` (it briefly always fired once on mount regardless
      of status, purely to catch that now-removed cart-clearing case). Verified with a
      throwaway test customer account (deliberately not the admin account, since real
      PayMongo testing was in progress on it at the time): cart was empty immediately
      after `placeOrderAction` redirected to the confirmation page, before any
      payment step happened at all.
- [x] Account dropdown (the hover menu under the header's account name) gained a
      "View my orders" link above "Log out", pointing to `/orders`.
- [x] **Fixed: customers landed on a 404 after authorizing payment in the PayMongo
      test flow.** Root cause was `app/checkout/actions.js` building the GCash/QRPh
      `return_url` from the static `APP_BASE_URL` env var, which was still
      `http://localhost:3000` — wrong the moment testing happens through the ngrok
      tunnel instead. Fixed by deriving the base URL from the incoming request's own
      `Host`/`X-Forwarded-Host` header instead (new `resolveBaseUrl()` in
      `app/checkout/actions.js`, using `headers()` from `next/headers`) — this
      self-adjusts to whatever URL the customer is actually browsing from
      (`localhost`, the ngrok tunnel, or a real domain later) with nothing to keep in
      sync. `APP_BASE_URL` is now only a last-resort fallback if headers are ever
      unavailable; **the webhook URL registered in the PayMongo dashboard is still a
      separate, manual thing** (external to this codebase) that still needs updating
      by hand whenever the ngrok tunnel restarts.
      **PayMongo's Payment Intent `attach()` call only supports one `return_url`, not
      separate success/cancel URLs** (that's a different, higher-level "Checkout
      Sessions" API PayMongo also offers, not used here) — so there's no separate
      "cancel page" to build. `/orders/[id]` has to correctly reflect whichever
      outcome actually happened, which it already does via `PaymentSection`'s
      PAID/FAILED/EXPIRED/PENDING branches; `OrderPaymentStatusPoller.jsx` now also
      fires one immediate check on mount (not just the 4s interval while PENDING) so
      that correct state shows up as fast as possible right when the customer is
      redirected back, instead of potentially flashing the stale "waiting for
      payment" QR/redirect UI for up to 4 seconds.
      Verified with a real request through the actual ngrok tunnel (not simulated) —
      confirmed via the (still-present, still temporary) PayMongo debug logging that
      `resolveBaseUrl()` correctly resolved to `https://<the-ngrok-host>` for that
      request, that the resulting order confirmation page loads with a real 200 (not
      404) at that same tunnel URL afterward, and that the QR payment section renders
      correctly there. Also incidentally captured a real PayMongo sandbox QRPh
      `next_action.code.test_url` in that debug output — PayMongo's own "simulate
      scanning/paying this QR" link for test mode, at
      `https://secure-authentication.paymongo.com/sources?id=...&code_id=...`.
- [x] Checkout's "How would you like to get your order?" section rebuilt as radio
      buttons instead of two separate always-visible bordered forms with their own
      "Select" button each. New `app/checkout/FulfillmentSelector.jsx` (client
      component — needed real state for "hide the branch dropdown until a method is
      picked", which a plain Server Component can't do) renders one native radio
      group (Delivery/Pickup, `name="method"`), reveals the relevant branch `<select>`
      only once that method is chosen, and has a single "Confirm" submit button
      (shown only once a method is picked) instead of the old per-option "Select"
      button. Still submits to the same `setFulfillmentAction` unchanged — only the
      client-side presentation around it changed, so this didn't need a dev server
      restart. Verified with a real request: radio inputs present on page load, no
      "Select" text left anywhere, and the branch `<select>` genuinely isn't in the
      rendered HTML at all until a method is selected (not just visually hidden).
- [x] Failed and expired payments now both display simply as "Payment failed" to the
      customer — `PaymentSection` in `/orders/[id]` and the status badge on `/orders`
      both collapse `EXPIRED` into the same "Failed" wording. **The database still
      keeps them as distinct `PaymentStatus` values** (`FAILED` vs `EXPIRED`) — this
      was a display-only simplification, not a data model change; don't collapse the
      enum itself without being asked to.
- [x] Fixed: the radio button visually un-selected itself right after pressing
      Confirm in `FulfillmentSelector.jsx`. Cause: `useState(fulfillment?.method ??
      "")` only uses that initial value on mount — when the server action completes
      and Next re-renders the checkout page with a freshly-updated `fulfillment` prop,
      an already-mounted client component's `useState` does **not** pick up the new
      value on its own. Fixed with a `useEffect` that re-syncs `method`/`branchId`
      from the `fulfillment` prop whenever it changes. **Could not be verified via
      curl** — this component's `<form action={action}>` receives the server action
      as a *prop from a Server Component into an already-separate Client Component*,
      which (unlike the plain forms elsewhere in this app, e.g. the menu's Add
      buttons) apparently doesn't render the plain progressive-enhancement
      `$ACTION_ID_...` hidden-field fallback that curl-based testing throughout this
      project has relied on — attempting it just hit "Failed to find Server Action".
      This one genuinely needs a real browser click-through to confirm; the fix
      itself is a standard, well-understood React pattern and `setFulfillmentAction`
      itself is unchanged (already proven correct in earlier testing).
- [x] Poll route (`/api/orders/[id]/poll`) now also detects a **failed** payment, not
      just a succeeded one — previously it only checked
      `intent.attributes.status === "succeeded"`, so a customer who declined/failed
      payment and got redirected straight back to `/orders/[id]` (before any webhook,
      if PayMongo even sends one for a simple decline, had a chance to arrive) would
      see the stale "waiting for payment" QR/redirect UI instead of a "Payment
      failed" result. Now also checks `intent.attributes.last_payment_error` — PayMongo
      populates this the moment an attempt on the intent is declined — and calls
      `markOrderPaymentFailed` when present. Combined with the poller's existing
      "check once immediately on mount" behavior, this is what makes the
      redirect-back-after-declining flow the user asked for actually work. **Not
      verified against a real decline** (would need to actually fail a real sandbox
      payment to trigger PayMongo's real `last_payment_error` shape) — believed
      correct per PayMongo's documented behavior, same caveat as the rest of the
      not-yet-live-tested PayMongo integration.
- [x] **Both `last_payment_error` detection and the radio-persistence `useEffect`
      above were live-tested by the user and found not working.** For the radio bug,
      root cause was almost certainly that the dev server was never restarted after
      that edit — this project's dev server has repeatedly served stale code for
      *Server Action* files specifically after edits (see the note further below), and
      this session incorrectly assumed a plain client-component edit was exempt from
      that and skipped the restart. Restarted the dev server before any further
      conclusions; **if the radio issue persists after a confirmed-fresh restart, the
      `useEffect` fix itself needs to be re-examined, not assumed correct.**
- [x] **Real, confirmed PayMongo platform behavior, not fixable in our code**:
      declining/expiring a GCash Source on PayMongo's own hosted page does **not**
      redirect back to `return_url` at all — PayMongo just shows its own dead-end
      "Source src_... has expired" page with no way back. We don't own that page and
      can't change what it does. **Real mitigation applied**: the "Continue to GCash"
      link on `/orders/[id]` now opens in a new tab (`target="_blank"`) instead of
      navigating the current tab away. This means the original order page stays open
      and keeps polling the whole time — even if the GCash tab dead-ends, the
      original tab will already show "Payment failed" (via the `last_payment_error`
      poll check above) once PayMongo tells us, and the customer just needs to close
      the stuck tab and look at the one they never left. Added a short note under the
      button explaining this. This is the actual fix for "it should return to the
      website with a payment of failed" — PayMongo will never do that redirect
      itself, so the fix is making sure our own tab never leaves in the first place.
- [x] Order date/time on `/orders` and `/account`'s Recent Orders now shows the time
      alongside the date (`toLocaleDateString()` + `toLocaleTimeString([], { hour:
      "numeric", minute: "2-digit" })`) — previously date-only.
- [x] **The `last_payment_error`-only failure check above was still missing real
      Source expiry** (user confirmed live: it "does nothing" even after the payment
      genuinely failed). Reasoning: an abandoned/expired GCash Source likely never
      populates `last_payment_error` at all — that field is for an *active* decline
      — PayMongo instead just resets the Payment Intent's `status` back to
      `"awaiting_payment_method"`. `app/api/orders/[id]/poll/route.js` now also
      treats that status as a failure signal, alongside `last_payment_error`. This
      relies on knowing our own flow never legitimately produces that status after
      the fact: `createAndAttachPaymentIntent` always attaches a payment method
      immediately, so by the time we ever poll, the intent should already be past
      `awaiting_payment_method` — seeing it again later can only mean the attempt
      fell through. **Still not verified against a real expired Source** (would
      need an actual timed-out sandbox transaction — the interactive PayMongo test
      flow isn't something curl can trigger) — if this *still* doesn't catch it,
      the next step is asking the user to paste the actual `retrievePaymentIntent`
      response for an expired order (the existing PayMongo debug logging in
      `lib/paymongo.js` only covers the `attach` call, not `retrieve` — would need
      a similar temporary log added there) rather than guessing at another status
      string blind.
      Also added an actual **"Try another payment" button** (linking to `/menu`) to
      the FAILED/EXPIRED state on `/orders/[id]` — it previously only said "please
      place a new order" as plain text with no actual way to act on it.
- [x] Added a toast popup ("Added Pastil to cart") after clicking Add on the menu
      page. New `app/components/ToastContext.jsx` (`ToastProvider`/`useToast()`) is a
      small global toast — one popup, shared across the whole app, rather than each
      button owning its own — mounted once in `app/layout.jsx` alongside
      `CartUIProvider`. The menu's Add button became its own client component,
      `app/menu/AddToCartButton.jsx`: it calls `addToCartAction` **directly** (via
      `useTransition`, not as a `<form action={...}>`) so it can `await` the result
      and then call `showToast(...)` — a plain form has no way to run code *after*
      a Server Action resolves. **Trade-off worth knowing**: this button no longer
      has a plain-HTML fallback the way every other form-based action in this app
      does — it only works with JS, same caveat as `FulfillmentSelector.jsx`. In
      practice this doesn't matter (JS is on by default everywhere), but it's why
      curl-based testing in this project can no longer exercise this specific
      button — verified the page renders correctly and the button/dropdown text is
      present, but the actual click-and-see-a-toast interaction needs a real browser.
- [x] Account hover dropdown gained an "Account details" link (to `/account`) above
      "View my orders" — previously the only way to reach `/account` from the header
      was clicking the account name/icon itself (the dropdown *trigger*), which
      wasn't obviously a link at a glance.
- [x] **Email verification for signup, using Resend.** `.env.local` holds
      `RESEND_API_KEY` (kept separate from `.env` — that's fine, Next loads both;
      `.env.local` is gitignored via the existing blanket `.env*` rule). Installed the
      official `resend` npm package (no in-house wrapper reinvented beyond a thin
      `lib/resend.js`) — this is a deliberate, requested dependency, unlike this
      project's usual minimal-deps bias.
  - Schema: `User.isVerified` defaults to **`true`** at the column level, not `false`
    — a straight `false` default would have retroactively locked every existing
    account (including the admin account and everyone from PayMongo testing) out of
    login the moment the migration ran. New signups explicitly pass
    `isVerified: false` to override this. New `EmailVerificationToken` model
    (`userId`, `token` unique, `expiresAt`, `usedAt` nullable, `createdAt`). This
    migration ran fine through the normal `prisma migrate dev` path (purely
    additive — no destructive-looking change to trigger the non-interactive-mode
    block seen elsewhere in this project). **Verified directly**: all 5 existing
    accounts still show `isVerified = true` after the migration.
  - `lib/requestUrl.js`: extracted `resolveBaseUrl()` out of `app/checkout/actions.js`
    into a shared helper (same Host-header-detection logic used for PayMongo's
    `return_url`) since verification links need the exact same "match whatever the
    customer is actually browsing from" behavior. `checkout/actions.js` now imports
    it instead of keeping its own copy.
  - `lib/emailVerification.js` is the core: `issueVerificationEmail(user)` (creates a
    token, 24h expiry, emails the link), `consumeVerificationToken(token)` (the
    `/verify-email` logic — returns `verified`/`already_verified`/`expired`/`invalid`),
    `resendVerificationEmail(userId)` (1-per-minute rate limit, checked against the
    most recent token's `createdAt` rather than a separate rate-limit table/store).
    **Check-order matters and is deliberate**: `usedAt` is checked before
    `user.isVerified`, which is checked before `expiresAt` — so if an account has
    multiple outstanding tokens (e.g. they requested a resend) and verifies through
    one of them, clicking any of the *other* unused tokens correctly shows "already
    verified" rather than "expired," even if that other token has also technically
    expired. Hit this exact case while testing (looked like a bug at first — it
    wasn't; the test was reusing one user across scenarios that don't compose).
  - `app/signup/actions.js`: creates the User (with the nested Address, unchanged
    from before) with `isVerified: false`, does **not** call `createSession()`
    anymore, and redirects to `/check-email?email=...` instead of `/account`. If
    `issueVerificationEmail` throws (Resend/network hiccup), the account is *not*
    rolled back — it already exists — instead redirects to `/check-email` with an
    `emailFailed=1` flag so that page immediately offers a resend rather than
    leaving the customer stuck with no working link.
  - `app/login/actions.js`: the `isVerified` check runs **after** the password
    check succeeds, never before — checking it first would let a wrong-password
    guess reveal whether an unverified account exists for that email. A correct
    password on an unverified account gets a specific "please verify your email
    first" message instead of `createSession()`.
  - `/check-email` (`page.jsx` + `ResendForm.jsx` + `actions.js`): the post-signup
    landing page. Its resend form takes a typed-in email (pre-filled from the query
    param) rather than a session, since the customer isn't logged in yet at this
    point. Deliberately returns the **same generic message** regardless of whether
    the email belongs to an account, is already verified, or a link genuinely went
    out — only an actual rate-limit hit gets a different message, since that alone
    doesn't leak anything the customer doesn't already know.
  - `/verify-email` (`page.jsx` + `ResendExpiredForm.jsx` + `actions.js`): a plain
    Server Component page that performs the verification as a side effect of the
    GET request itself (a deliberate, industry-standard pattern for one-shot email
    links, despite GETs "ideally" being side-effect-free) — renders one of four
    states. The `expired` state's resend button carries the `userId` from the
    (expired but genuine) token already looked up — this is *not* a public
    "resend to any account" endpoint; the `invalid` state deliberately shows a
    fully generic message with no resend option at all, since there's nothing
    known/safe to act on.
  - **Testing note for future sessions**: `lib/emailVerification.js` and anything
    importing it (transitively, via `lib/requestUrl.js`'s `next/headers` import)
    **cannot be imported in a plain standalone Node script** — `next/headers` only
    resolves inside Next's own runtime. Hit this directly (`ERR_MODULE_NOT_FOUND:
    next/headers`) trying to unit-test `consumeVerificationToken` standalone. The
    workaround: seed test tokens directly via Prisma (which has no such
    restriction) in a throwaway script, then exercise `/verify-email?token=...` as
    a real HTTP GET against the running dev server — this is what was actually
    done, and it's arguably a *better* test anyway (exercises the real route, not
    just the function in isolation). The same restriction applies to testing
    `loginAction` (transitively imports `next/headers` via `lib/session.js`) — not
    fully exercised via direct import for this reason; verified via code review
    instead that the check-order (password, then `isVerified`) is correct, plus the
    fact that `consumeVerificationToken` genuinely flips `isVerified` (which is what
    that check reads).
  - **Verified for real, end to end**: all four `/verify-email` branches via actual
    HTTP requests (invalid token, expired token — with a properly isolated
    never-verified user, see above — already-verified via a second unused token,
    and a fresh valid token, confirming `isVerified` flips to `true` in the DB and
    the token's `usedAt` gets set); reusing an already-consumed token now correctly
    shows `invalid`; `/check-email` renders in both its normal and `emailFailed`
    states. **The actual Resend send call was verified against the real Resend
    API** — added a temporary debug route (removed after, confirmed via a build
    afterward that it's gone and via a DB check that no leftover test row remained)
    that called `sendVerificationEmail` targeting `delivered@resend.dev`, one of
    Resend's official test addresses that simulates a real successful delivery
    without needing a verified domain or risking spam to a real inbox — got back a
    real `{"ok": true}` from Resend's live API, confirming the API key, sender
    address, and full send pipeline all genuinely work.
  - **Not verified — needs a real browser**: the actual signup form and login form
    submissions themselves, and the `/check-email` and `/verify-email` resend
    button clicks. All of these are `useActionState`-bound client components, which
    (per this project's established pattern — see `FulfillmentSelector.jsx` and
    `AddToCartButton.jsx` above) encode their form submission as a React Flight
    "bound server reference" (`$ACTION_REF_n`/`$ACTION_n:0`/`$ACTION_n:1` hidden
    fields) rather than the simple `$ACTION_ID_hash` fallback plain
    Server-Component forms use — not something this session has found a reliable
    way to hand-construct via curl. The underlying logic each of these calls into
    (`signupAction`, `loginAction`, `resendByEmailAction`,
    `resendForExpiredTokenAction`) was verified as thoroughly as possible short of
    that specific click.
  - **Assumption, not yet confirmed with the user**: admin accounts are exempt from
    this flow entirely (`prisma/create-admin.js` explicitly sets `isVerified: true`
    on both create and update) — reasonable since that script is a trusted,
    deliberately-run local tool, not a public signup path. Employee accounts don't
    exist as a concept yet at all (see the very next task).
- [x] **Admin/staff internal backend built** — role-gated `/admin` (management) and
      `/staff` (kitchen/order-fulfillment) sections, entirely new, sitting alongside
      the existing customer-facing app. Built in the requested order: role field +
      access control first, then `/staff` (simpler, usable fastest), then `/admin`.
      **Checkout/payment/webhook code was not touched at all**, per explicit
      instruction — this feature only *reads* `Order`/`Payment` data and adds a new
      status-advance path that's separate from the payment-driven
      PENDING→CONFIRMED transition in `lib/orderPayment.js`.
  - **Schema**: `UserRole` enum gained `EMPLOYEE` (now `CUSTOMER` / `EMPLOYEE` /
    `ADMIN`) — purely additive, migrated via the normal `prisma migrate dev` path
    (migration `add_employee_role`), no hand-written SQL needed. No new tables —
    everything else (orders, payments, branches, users) already existed and was
    reused as-is.
  - `lib/roleGuard.js`: `requireAdmin()` and `requireStaff()`, called from
    `app/admin/layout.jsx` / `app/staff/layout.jsx` respectively (layouts run on
    every request under that path, so this can't be bypassed by guessing a deeper
    URL). **Assumption**: `requireStaff()` lets both `EMPLOYEE` and `ADMIN` into
    `/staff` (an admin should be able to see the kitchen view too), but
    `requireAdmin()` is `ADMIN`-only — an `EMPLOYEE` hitting `/admin` is redirected
    to their own `/staff` instead of a generic block page; a `CUSTOMER` (or anyone
    logged out) hitting either is redirected to `/login` or `/`. **Verified for
    real** with genuine signed session cookies for all three roles (a throwaway
    `EMPLOYEE` and `CUSTOMER` account, plus the existing admin account): confirmed
    the exact redirect behavior above for every role/route combination, then
    deleted both throwaway accounts afterward.
  - `lib/orderStatus.js`: shared status-flow logic, deliberately separate from
    `lib/orderPayment.js` (that file owns PENDING→CONFIRMED via payment events;
    this one owns the CONFIRMED→…→DELIVERED progression a staff member drives by
    clicking a button). **Assumption, not explicitly specified in the original
    schema**: the existing `OrderStatus` enum has one shared `PREPARING` step but
    separate `READY_FOR_PICKUP`/`OUT_FOR_DELIVERY` steps for pickup vs delivery,
    and *no* separate "picked up by customer" status — so for a pickup order,
    `getNextOrderStatus()` treats `READY_FOR_PICKUP`'s next step as `DELIVERED`
    too (reused to mean "handed off / completed", not literally "delivered to a
    door"). Flagging this in case a distinct "picked up" status is wanted later.
  - **`/staff`** (`app/staff/layout.jsx` + `page.jsx` + `actions.js` +
    `StaffOrdersPoller.jsx`): two tabs via a `?tab=` query param — "Current
    orders" (status in `CONFIRMED`/`PREPARING`/`READY_FOR_PICKUP`/
    `OUT_FOR_DELIVERY` **and** `payment.status === "PAID"`, oldest-first) and
    "Completed today" (status `DELIVERED` with `updatedAt` today — using
    `updatedAt` rather than `createdAt` so an order placed yesterday but delivered
    today still shows up, and rather than a paid orders `deliveredAt` on
    `OrderDelivery` since no rider/delivery-tracking data exists yet). Each
    current-order card has a single "Mark [next status]" button
    (`advanceOrderStatusAction` in `app/staff/actions.js`) — no dropdown, no edit
    form, per the "simple/fast to scan" request. **Data freshness**: reused the
    exact same polling *pattern* as the existing `OrderPaymentStatusPoller`
    (`app/components/`) rather than websockets — `StaffOrdersPoller.jsx` polls a
    new lightweight `/api/staff/orders/poll` route every 5s for a cheap "did
    anything change" signature string (order ids+statuses+today's delivered
    count) and calls `router.refresh()` only when it actually differs.
  - **`/admin`** (`app/admin/layout.jsx` + four pages):
    - **Overview** (`/admin`): today's sales (sum of `Payment.amount` where
      `status: "PAID"` and `paidAt` is today — deliberately keyed off *payment*
      time, not order-placement time, since "sales" should mean money actually
      collected), today's order count (all orders `createdAt` today, regardless
      of outcome — reflects order *volume*, not just paid ones), and live
      pending/preparing/delivered counts. **Assumption**: those three counts are
      scoped to "became that status today" (via `updatedAt`, which only moves
      when status changes and — for `PENDING` — never moves before the first
      status change, making one field work for all three) rather than "all-time
      current count" — flagging this in case an all-time reading was wanted
      instead. Also a 7-day sales bar chart, plain CSS bars (no charting library,
      consistent with this project's minimal-deps bias) driven by the same
      paid/`paidAt` logic per day.
    - **Orders** (`/admin/orders`): all orders, most recent 100, filterable by
      status (`<select>`) and searchable by transaction reference or customer
      name (`OR` query, case-insensitive) — both via plain GET query params
      (`?status=&q=`), no client component needed.
    - **Order detail** (`/admin/orders/[id]`): full item list (with addons),
      delivery address or pickup branch, payment method/status/reference, and
      the full `OrderStatusHistory` timeline.
    - **Accounts** (`/admin/accounts`): every user, with a per-row role-change
      `<select>` + Save button (`changeUserRoleAction` in
      `app/admin/accounts/actions.js`). **Safeguard added, not explicitly
      requested**: an admin cannot change their *own* role through this form (the
      row shows plain text instead) — otherwise a single misclick could lock the
      only admin out of `/admin` with nobody left able to undo it.
    - **Sales** (`/admin/sales`): today/last-7-days/last-30-days totals as three
      summary cards, plus a sales-by-branch breakdown table (both of this
      project's two seeded branches) toggle-able between the two ranges — orders
      aggregated in JS after one query rather than a DB `groupBy`, since there
      are only two branches and it keeps the query simple.
  - **Chrome**: the customer-facing red `Header` and the `FloatingCart` bubble
    (both rendered unconditionally in the root `app/layout.jsx`) don't belong on
    an internal dashboard meant for a shared screen/tablet. Rather than
    restructuring the app to have multiple root layouts (invasive), added
    `app/components/ChromeGate.jsx` — a small client component using
    `usePathname()` that renders its children normally everywhere, but renders
    `null` under `/admin` and `/staff`. `Header`/`FloatingCart` still do their
    (cheap) server-side data fetching either way; this only hides the output.
    Also added conditional "Admin dashboard" / "Staff dashboard" links into the
    existing account hover dropdown in `Header.jsx` (shown only for the matching
    role) so an admin/employee has a real way to reach their section, not just a
    typed-in URL.
  - **Verified for real, end to end, not just that it builds**: role-based
    routing for all three roles via genuine signed session cookies (see above);
    every admin page returns 200 and renders real data (confirmed actual seeded
    orders/branches/users show up correctly — including real order references,
    statuses, and totals from prior testing sessions); and, most importantly, the
    actual staff status-advance button — created a real throwaway order
    (`CONFIRMED` status, `PAID` payment, pickup fulfillment) via a temporary
    script, confirmed it appeared on `/staff`'s current-orders tab, submitted the
    real progressive-enhancement form POST (the same `$ACTION_ID_...` +
    `curl`-based method used throughout this project for plain Server-Component
    forms) against the running dev server, and confirmed in the database
    afterward that the order's status genuinely moved `CONFIRMED` → `PREPARING`
    with a real `OrderStatusHistory` row (`"Updated by staff"`) — then deleted
    that throwaway order and both throwaway test accounts, leaving no test data
    behind.
  - **Not yet built / explicitly paused, per the original request's own
    open item**: no separate manual/simplified account-creation path for
    employees was built. **Judgment call made instead**: since `/admin/accounts`
    already lets an admin promote any existing (already-verified) customer
    account to `EMPLOYEE`, that covers "create an employee account" without a
    second signup flow — an admin just asks the person to sign up normally
    (verifying their email as usual) and then promotes them. Flagging this
    explicitly since the original request said "I may just create those accounts
    manually or via a simpler path — use your judgment" and this is the judgment
    landed on; a dedicated admin-creates-account-directly form is a small,
    separate addition if that's not what's wanted instead.
  - **Not verified — needs a real browser**: the actual role-change `<select>` +
    Save button click on `/admin/accounts`, and the status-filter/search form on
    `/admin/orders`. Both are plain `<form>`s in Server Components (same
    curl-testable pattern used elsewhere), and the *server action* behind the
    role-change form (`changeUserRoleAction`) was exercised as thoroughly as
    reasonably possible short of the actual click — but wasn't separately
    curl-verified this session the way the staff status button was, since it
    mutates real user roles rather than a disposable test row. Recommend testing
    this one first when reviewing: promote a real (non-critical) test account to
    `EMPLOYEE` via the UI, confirm it can reach `/staff` but not `/admin`, then
    demote it back.
- [x] **Admin/employee accounts exempted from the profile-completeness
      requirement**, by request — they're staff, not customers placing delivery
      orders, so there's no reason to force them through phone/address setup.
      `lib/profile.js`'s `isProfileComplete()` now returns `true` immediately for
      any non-`CUSTOMER` role before checking phone/address at all. `/account`'s
      red "Add your contact number and delivery address..." banner (`app/account/
      page.jsx`) is now also skipped for non-`CUSTOMER` roles, computed by gating
      `missingPhone`/`missingAddress` on `user.role === "CUSTOMER"` rather than
      just checking the raw fields — otherwise the banner would still show even
      though nothing was actually blocking the admin from doing anything.
      **Verified directly** against the real admin account (which genuinely has
      `phone: null`): `isProfileComplete()` now returns `true` for it, and the
      banner no longer renders on `/account`.
      Also: **login now redirects by role** instead of always landing on
      `/account` — `app/login/actions.js`'s `loginAction` sends `ADMIN` straight
      to `/admin` and `EMPLOYEE` straight to `/staff`, only falling through to
      `/account` for a plain `CUSTOMER`. **Not verified via curl** (the login
      form is a `useActionState` client component, the same curl limitation
      documented throughout this project) — verified by code review instead;
      the branching is three straightforward `if (role) redirect(...)` checks.

- [x] **Cash on Delivery (COD) added as a third payment method**, alongside
      QR/GCash via PayMongo. The core design challenge: QR/GCash get their
      "payment succeeded" signal from a PayMongo webhook (or the polling
      fallback); COD has no such signal — a human calling the customer is the
      manual equivalent. **PayMongo integration/webhook code was not touched
      at all**, per explicit instruction.
  - **Schema** (migration `add_cod_payment`, additive, normal
    `prisma migrate dev`): `PaymentMethod` gained `CASH_ON_DELIVERY`;
    `OrderStatus` gained `PENDING_CONFIRMATION` — deliberately its own status
    rather than reusing plain `PENDING`, so a COD order awaiting a phone call
    is never confused with a QR/GCash order still mid-payment (matters for
    `/admin`'s dashboard counts and for at-a-glance clarity on `/admin/orders`).
    `Payment` gained `codVerifiedAt`/`codVerifiedByUserId` (+ relation to
    `User`) to record who verified an order and when, as requested.
  - **Checkout** (`app/checkout/page.jsx` + `actions.js`): a third "Pay with
    Cash" button, same bordered-card style as the existing two (copy chosen
    from options presented to the user). `placeOrderAction` now branches on
    `paymentMethod === "CASH_ON_DELIVERY"`: the order is created at
    `PENDING_CONFIRMATION` instead of `PENDING`, and the entire PayMongo
    payment-intent block is skipped outright — no intent, no QR, no redirect
    URL. Payment.status still starts `PENDING` (nothing's been collected yet).
  - **Order confirmation page** (`/orders/[id]`): `PaymentSection` gained a
    COD-specific branch — while `PENDING_CONFIRMATION`, shows exactly the
    requested copy ("Your order has been placed. Our store will call you
    shortly..."); once verified (status moves to `CONFIRMED`+), shows a
    confirmed/preparing message instead. `OrderPaymentStatusPoller` (which
    polls PayMongo's API) is no longer rendered at all for COD orders — there's
    no PayMongo intent to poll, so it would just be a wasted network call every
    4s; verification is a one-time admin action, not something the customer's
    browser needs to watch for.
  - **Admin "Verify" action** (`app/admin/orders/actions.js`,
    `lib/orderPayment.js`): added `verifyCodPayment(orderId, verifiedByUserId)`
    alongside the existing `markOrderPaid`/`markOrderPaymentFailed`/
    `markOrderPaymentExpired` — same file, since it's the same category of
    function ("what happens when a payment resolves"), but kept **separate**
    from `markOrderPaid` rather than reused, since COD has no PayMongo
    payment that "succeeded" and this one additionally records the verifying
    admin. Idempotent like its siblings (checks `payment.status === "PENDING"`
    first). **By explicit request, `verifyCodOrderAction` calls
    `requireAdmin()` directly** rather than relying solely on `/admin`'s own
    layout gate — defense in depth in case `/admin/orders` access rules ever
    change to include employees.
  - **`/admin/orders`** (list + detail): any order with
    `payment.method === "CASH_ON_DELIVERY"` and `status ===
    "PENDING_CONFIRMATION"` gets an amber-highlighted row, an amber "Needs
    confirmation" badge (added to `STATUS_LABELS`/`lib/orderStatus.js`), and a
    "Verify" button. The detail page additionally shows a "Verified by X at Y"
    line once verified, and a `PAYMENT_METHOD_LABELS` map (also added to
    `lib/orderStatus.js`) now renders "Cash on Delivery" correctly instead of
    the old hardcoded GCash/QR-only ternary.
  - **`/staff` deliberately needed no code changes at all** to exclude
    unverified COD orders — its existing filter
    (`status: { in: ACTIVE_ORDER_STATUSES }, payment: { status: "PAID" }`)
    already excludes `PENDING_CONFIRMATION` (not an active status) and
    `PENDING` payments (not `PAID`) for exactly the same reason it excludes an
    unpaid QR/GCash order. Once verified, `CONFIRMED` + `PAID` makes it appear
    exactly like a paid QR order would, with no special-casing needed.
  - **Customer-facing status labels**: `/orders` and `/account`'s Recent
    Orders previously printed the raw `OrderStatus` enum value; both now go
    through `STATUS_LABELS` so the new `PENDING_CONFIRMATION` status (and any
    future one) shows readable text instead of a raw enum string.
  - **Verified for real, end to end, not just that it builds** — the entire
    flow via genuine HTTP requests against a throwaway test order (not real
    customer data): submitted the real checkout form for "Pay with Cash" →
    confirmed in the database the order landed at `PENDING_CONFIRMATION` /
    `CASH_ON_DELIVERY` / `PENDING` → confirmed the customer's `/orders/[id]`
    showed the exact requested "we'll call you" copy → confirmed the order
    was genuinely absent from `/staff` (7 current orders before) → confirmed
    it appeared on `/admin/orders` with the amber row/badge and Verify button
    → submitted the real Verify button POST → confirmed in the database the
    order moved to `CONFIRMED`/`PAID` with `paidAt`/`codVerifiedAt`/
    `codVerifiedBy` all correctly set and a proper `OrderStatusHistory` entry
    → confirmed the order now appeared on `/staff` (8 current orders after) →
    confirmed `/orders/[id]` now showed the "Order confirmed" message — then
    deleted the throwaway order and test customer, leaving no test data behind.

- [x] **Admin can delete a user account** from `/admin/accounts`, added after
      the user needed to free up a personal email address for re-testing
      signup. **Deliberately restricted to accounts with zero orders** —
      `Order.userId` is a required relation, and this app has been careful
      everywhere else to preserve order history (price snapshots, separate
      status-history table, etc.), so a literal delete on an account with real
      orders would either violate that FK or force deleting real transaction
      records. `deleteUserAction` (`app/admin/accounts/actions.js`) checks
      `prisma.order.count({ where: { userId } })` and no-ops if it's non-zero;
      the page (`app/admin/accounts/page.jsx`, now querying
      `_count: { select: { orders: true } }`) only ever *renders* the Delete
      button for zero-order accounts in the first place — for one with orders
      it shows "Has N orders — can't delete" instead, so the backstop check
      should never actually be needed in normal use. An admin can't delete
      their own account (same self-protection pattern as the existing role
      change). Deleting removes the user's `Address` and
      `EmailVerificationToken` rows too (both required relations, zero
      practical loss). Note: `Payment.codVerifiedByUserId` is `ON DELETE SET
      NULL` (added with the COD feature), so deleting an admin/employee who
      verified some COD orders in the past just clears the "verified by"
      attribution on those payments rather than blocking the delete — a minor,
      accepted trade-off.
      **Verified for real**: created two throwaway accounts (one with zero
      orders, one with a real order) — confirmed the accounts page rendered a
      real Delete button for the first and the blocked message for the second;
      submitted the actual Delete POST for the zero-order account and
      confirmed it was gone from the database; then, to specifically test the
      backstop (not just the UI), POSTed directly to `deleteUserAction` for
      the has-order account (bypassing the page, which never offers this
      button for it) and confirmed the account was still present afterward —
      the safety check held even when called directly. Cleaned up both test
      accounts (and the test order) afterward.
      **Also, as a one-off**: deleted the user's own real test account
      (`gabrabago44@gmail.com`, 3 orders) by explicit request, since Resend's
      test sender can currently only deliver to that exact address (see the
      email-verification entry above) and they needed it free to test signup
      again — this was a direct one-off script, not done through the admin UI
      (which would have refused it, correctly, since it had order history).

- [x] **Order tracking for customers + full manual status control for admins.**
      Checked the existing schema first as instructed — the requested
      Preparing/Out for Delivery/Delivered stages and the "order_status_history
      table" both **already existed** (`OrderStatus` enum, `OrderStatusHistory`
      model) from earlier work; only a `changedByUserId` field was missing for
      the audit-trail "who changed it" requirement (migration
      `order_status_history_changed_by`, additive, `ON DELETE SET NULL` — a
      deleted staff/admin account just clears the attribution on old history
      rows rather than blocking deletion, consistent with how
      `Payment.codVerifiedByUserId` already behaves).
  - `lib/orderStatus.js` gained: `isRegularTransition(order, newStatus)` (true
    for a no-op, cancelling, or exactly the next step `getNextOrderStatus`
    would take — false for anything else); `buildOrderTracker(order)` (the
    four customer-facing stages — Confirmed/Preparing/Out for Delivery-or-
    Ready for Pickup/Delivered — with reached/current flags and each stage's
    first-reached timestamp pulled from `statusHistory`; returns `null` before
    `CONFIRMED` or once `CANCELLED`, since those get their own messaging
    instead of an empty/confusing tracker).
  - **Admin status control** (`app/admin/orders/actions.js`'s new
    `setOrderStatusAction`, UI on `app/admin/orders/[id]/page.jsx`): a
    dropdown of every `OrderStatus` value + an "Update status" button, kept
    **entirely separate from `Payment.status`** — this never touches payment
    truth, which stays exclusively owned by the webhook/poll/COD-verify
    functions in `lib/orderPayment.js`, to avoid exactly the kind of
    admin-override-corrupts-payment-state bug this project has been careful
    to avoid elsewhere. A regular transition (next step, cancel, or re-picking
    the current status) applies immediately; anything else (a multi-stage
    jump, reverting, un-cancelling) requires ticking a "confirm this is
    intentional" checkbox first — unchecked, it redirects back with an inline
    warning and **does not apply the change silently**, matching the "don't
    silently block, make correction deliberate" request. Every change this
    creates records `changedByUserId`; the existing status-history section
    now shows "(by {name})" for attributed entries.
  - **`/staff` needed no new status-control** — its existing single "Mark
    [next status]" button (`advanceOrderStatusAction`) already only ever
    advances through exactly Preparing → Out for Delivery/Ready for Pickup →
    Delivered, which **is** the full requested set; it now also records
    `changedByUserId` for the acting staff/admin user. The free-form
    dropdown+override tool stays admin-only, per how the request framed it
    ("ADMIN CONTROL OVER STATUS... let an *admin* manually change") — flagging
    this reading in case staff should get the same override power too.
  - **Customer tracker** (`app/components/OrderTracker.jsx`, new): a
    horizontal stepper — checkmark + filled circle for a reached stage
    (pulsing ring for the *current* one), a hollow gray circle for one not
    reached yet, a timestamp under each reached stage ("since 6:42 PM" for
    the current one). Rendered on `/orders/[id]` right after the existing
    payment section. **This is a first draft, not signed off** — per the
    explicit request to check before finalizing visuals/copy; built it
    end-to-end so there's something concrete to react to rather than
    describing it in the abstract. Ask before treating labels like "Order
    Confirmed" as final.
  - **Polling generalized**: `OrderPaymentStatusPoller.jsx` renamed to
    `OrderStatusPoller.jsx` and broadened — it used to only watch
    `Payment.status` and stop once it left `PENDING`; it now also watches
    `Order.status` and keeps polling until the order reaches a terminal state
    (`DELIVERED` or `CANCELLED`), since a staff/admin fulfillment update can
    happen well after payment is already resolved. **Now also runs for Cash
    on Delivery orders** (previously excluded entirely, since there was no
    PayMongo intent to poll for payment purposes) — needed once payment
    stopped being the only thing this page has to stay current on; the poll
    route already no-ops its PayMongo-specific reconciliation when there's no
    `paymongoPaymentIntentId`, so no route changes were needed, just removing
    the component's COD exclusion.
  - `/orders` (list) already links every row to `/orders/[id]`, which
    satisfies "link to the tracker from order history" — no changes made
    there.
  - **Verified for real, end to end**: created throwaway CONFIRMED/PAID test
    orders (not real customer data) and confirmed, via genuine HTTP
    requests — the tracker rendered correctly for a pickup order (Ready for
    Pickup branch, not Out for Delivery); a regular admin transition
    (Confirmed→Preparing) applied immediately with correct attribution; an
    irregular jump (Confirmed→Delivered) was correctly **blocked** without
    the checkbox (order status confirmed unchanged in the database) and then
    correctly **applied** once resubmitted with `confirmOverride` checked;
    the poll route reflected the new `orderStatus` immediately; a second
    fetch of the tracker page showed the visual update (Confirmed now a
    checked/non-pulsing stage, Preparing now the pulsing current one with its
    own timestamp); and the staff "Mark preparing" button still works and now
    records attribution correctly. All test orders/customers deleted after.

- [x] **Multiple saved delivery addresses, with PSGC-validated city/barangay
      dropdowns (NCR only).** Checked first, per instruction: the `Address`
      model was **already** one-to-many (`User.addresses Address[]`) and
      already had `label`/`isDefault` columns — the app just never exercised
      that, treating it as one-address-per-user everywhere (signup, `/account`,
      checkout). This work made the app actually use the schema it already had,
      plus added the PSGC fields it didn't.
  - **User decisions locked in before building**: max 5 addresses per user;
    signup no longer collects an address at all (moved entirely to a new
    post-verification onboarding step, since asking for one at signup — before
    email verification — conflicted with "onboarding sees zero addresses");
    PSGC data sourced and bundled as a local JSON file rather than a live API.
  - **PSGC data** (`lib/psgc-ncr.json`, `lib/psgc.js`): pulled NCR's
    muncities.json + barangays.json from the `jobuntux/psgc` GitHub repo (PSA's
    official PSGC, 2025 2nd-quarter release) via direct `curl` to
    raw.githubusercontent.com — not manually transcribed, so no copy errors.
    NCR's 17 real LGUs (16 cities + Pateros) plus Manila's 14 separate PSGC
    "district" codes (Ermita, Tondo I/II, Quiapo, etc. — each a distinct
    muncity-level code in the raw data) merged into one "City of Manila" entry,
    since customers think of Manila as one city, not 14. Verified the merge is
    right by checking known trivia figures against the output: Manila → 897
    barangays, Quezon City → 142 — both match well-known official counts
    exactly. Barangay lists are naturally sorted (numeric-aware — "Barangay 2"
    before "Barangay 10", not string-sorted) since several NCR cities number
    theirs. `lib/psgc.js` exports `getNcrCities()`, `getBarangaysForCity()`,
    `isValidCity()`, `isValidBarangay()` — the latter two are what
    `app/account/addresses/actions.js` validates every submission against, so
    a barangay can never be saved unless it's real for that specific city.
  - **Schema** (migration `multi_address_psgc`, additive): `Address` gained
    `barangay String?` and `landmark String?`. `province`/`postalCode` were
    left in place but unused going forward — they were already dead (grepped:
    never read or written anywhere) and NCR doesn't need a province field, but
    removing a column felt like unnecessary migration risk for zero benefit.
    **No DB-level constraint enforces "only one `isDefault` per user"** —
    Postgres partial unique indexes aren't something this Prisma setup does
    without hand-written SQL, so it's enforced by every write path
    (`createAddressAction`, `setDefaultAddressAction`) doing an
    `updateMany({isDefault: true} -> false)` + the new default set, wrapped in
    one `$transaction`.
  - **Signup** (`app/signup/actions.js` + `page.jsx`): the `line1`/`city`
    fields and nested `addresses: { create }` are gone — signup now only
    collects name/email/phone/password, same as it did before addresses were
    ever added to it.
  - **Login redirect** (`app/login/actions.js`): after a successful `CUSTOMER`
    login, checks `prisma.address.count()` — zero sends them to
    `/onboarding/address` instead of `/account`. Since signup no longer creates
    one, every genuinely new signup hits this on their first login. An older
    account that already has an address is unaffected. **Not verified via
    curl** — same standing limitation as every other `useActionState` login
    form in this project — verified by code review; the check itself
    (`lib/profile.js`'s address logic already worked this way) was exercised
    directly.
  - **Onboarding** (`/onboarding/address`): a Server Component that redirects
    away immediately if the account isn't a `CUSTOMER`, or already has ≥1
    address (so it can't be revisited after the fact, and staff never see it
    at all). Renders `AddressForm` with no "set as default" checkbox — the
    first address is unconditionally the default, there being nothing else for
    "default" to mean yet. On success, redirects into `/account` rather than
    back to the addresses list, via a `redirectTo` hidden field the shared
    `createAddressAction` reads.
  - **`AddressForm.jsx`** (new client component, shared by onboarding and
    `/account/addresses`): the one genuinely interactive piece — the barangay
    `<select>` has to repopulate based on whichever city is picked, which a
    plain HTML form can't do alone. Label is a dropdown (Home/Office/Other)
    that reveals a free-text "custom label" field only when "Other" is chosen;
    the two resolve to one final string server-side. Every input has
    `min-h-11` and the form uses a mobile-first `grid-cols-1 sm:grid-cols-2`
    layout, per the responsive requirements.
  - **`/account/addresses`** (list + add/edit, one page toggled by query
    params — `?add=1` / `?edit=<id>` — rather than separate routes, to reuse
    one Server Component instead of three): cards in a
    `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` layout (1/2/3 columns exactly
    as specified), each showing label, formatted address, a "Default" badge,
    and Edit/Delete/Set-as-Default actions (Set-as-Default hidden on the
    already-default card). "+ Add New Address" hides once at the 5-address cap
    with an explanatory message instead. **Deleting the default address does
    not auto-pick a new one** — per the spec's own wording ("prompt them to
    pick a new default"), a plain-forms app has no modal to "prompt" with, so
    instead the list shows an amber "None of your addresses is set as
    default — pick one below" banner until they explicitly click
    Set-as-Default on one. **An address that's actually been used on a real
    order can't be deleted at all** (checked via `prisma.order.count`) — same
    reasoning as the existing admin can't-delete-a-user-with-orders rule:
    `Order.addressId` is a real historical reference, not just a convenience
    pointer.
  - **Checkout integration** (`app/checkout/actions.js`,
    `FulfillmentSelector.jsx`): `lib/fulfillment.js`'s cookie gained an
    `addressId` field alongside `method`/`branchId` — **this is which address
    this specific order goes to, not necessarily the account's default**; a
    customer can pick a different saved address for one order without
    changing what their default is going forward. The Delivery option now
    shows the selected address read-only with a "Change Address" button that
    reveals a radio list of every saved address plus a "+ Add New Address"
    link out to `/account/addresses?add=1&from=checkout` — that `from=checkout`
    round-trips through the address form's `redirectTo`/`errorRedirectTo`
    hidden fields so adding an address mid-checkout lands back on `/checkout`
    (with the new address auto-selected as default, since it'd be their first
    or an explicit choice) instead of stranding them on the account page.
    `placeOrderAction` now resolves the address strictly from
    `fulfillment.addressId` (with an ownership check) instead of an arbitrary
    `findFirst` — the historical "just grab whichever address exists" behavior
    is gone entirely.
  - **`/account`**'s old single embedded address editor
    (`app/components/AddressField.jsx`, `saveAddressAction`) was deleted
    outright rather than kept alongside the new page — it edited "the"
    address in place, a model that no longer exists. `/account` now shows a
    compact default-address summary with a "Manage" link to
    `/account/addresses`.
  - **Responsive design**: every new/touched page uses mobile-first Tailwind
    (bare classes for mobile, `sm:`/`lg:` overrides), `min-h-11` on every
    interactive control (buttons, links styled as buttons, checkboxes) for the
    44px touch-target requirement, and the specified column counts at each
    breakpoint. **Not verified with an actual browser at 375/768/1280px** —
    this project's testing throughout has been real HTTP requests checking
    rendered markup/classes, not visual/viewport rendering; the Tailwind
    classes are believed correct per the spec but a real resize-the-window
    check is worth doing before calling this visually final.
  - **Verified for real, end to end, against a throwaway test account (not
    real customer data)**: submitted the real onboarding form with a
    genuinely-valid NCR city+barangay pair, confirmed the address was created
    with `isDefault: true` and onboarding then redirects away on revisit;
    added a second address and confirmed a deliberately-wrong barangay
    ("Diliman," not an actual Quezon City PSGC barangay name — "U.P. Campus"
    is) was correctly **rejected**, then succeeded with a real one; set the
    second address as default via the real button and confirmed the first
    correctly un-defaulted; padded up to the 5-address cap and confirmed a 6th
    was rejected with the cap message and the "+ Add" button disappeared;
    placed a real order explicitly choosing the *non-default* address and
    confirmed in the database the order actually used that one, not the
    account default — proving "Change Address" genuinely works, not just
    displays; confirmed that address then **could not** be deleted once linked
    to the order; deleted the (unlinked) default address and confirmed the
    "pick a new default" banner appeared instead of a silent auto-pick. All
    test data deleted afterward.

- [x] **Homepage rebuilt with a full set of marketing sections**, on top of the
      existing carousel-only homepage. Checked first: menu seed data (used to
      pick 6 real featured items after confirming with the user, since the
      original request's example items — "Chicken Pastil"/"Beef Pastil" —
      don't exist as separate seeded items), `package.json` (no carousel
      library installed — the existing hand-rolled `ProductCarousel.jsx` was
      upgraded in place, renamed `HeroCarousel.jsx`, rather than adding a
      dependency), and `globals.css`/`layout.jsx`'s font setup.
  - **Font swap, site-wide**: `--font-heading` changed from Poppins to
    **Anton** (`app/layout.jsx`), per explicit brand request — this affects
    every page's headings (menu, admin, checkout, etc.), not just the
    homepage, since `--font-heading` was already a single shared CSS variable.
  - **`HeroCarousel.jsx`**: same auto-advance/pause-on-hover/arrows/dots as
    the old `ProductCarousel`, plus touch-swipe (compares
    `touchstart`/`touchend` X position against a 50px threshold) and optional
    per-slide overlay (`title` + `ctaLabel`/`ctaHref`) — a slide can be a
    plain photo or carry a heading+button, both supported by the same
    component.
  - **`FeaturedMenu.jsx`**: a Server Component querying
    `prisma.menuItem.findMany` for the 6 confirmed real item names — price
    and description come live from the database, not hardcoded, so a menu
    price change is reflected here automatically.
  - **`BlogSection.jsx`**: exports a `blogPosts` array (slug/title/excerpt/
    image) shaped like a real query result specifically so swapping in
    `prisma.blogPost.findMany()` later means changing this one array, not the
    JSX. **"Read More" links to `/blog/[slug]`, which doesn't exist as a route
    yet** — out of scope per "STATIC for now," flagging so it's not mistaken
    for a bug.
  - **`CustomerGallery.jsx`**: Instagram-style grid, 2/3/4/5 columns at
    mobile/tablet/`md`/`lg`, hover caption overlay (`group-hover`, so it's
    naturally desktop-only — no separate mobile/desktop branching needed).
  - **`NewsSection.jsx`**: native `<video controls preload="none"
    poster={...}>` per clip — `preload="none"` means the video file itself
    never downloads until the viewer presses play; the poster image (a
    separate lightweight `.webp`) is what actually loads up front. Browsers
    render their own play-button overlay on a poster automatically when
    `controls` is set, so no custom overlay UI was needed. Horizontal
    snap-scroll on mobile (`overflow-x-auto` + `snap-x`), a plain 2-column
    grid from `sm:` up.
  - **`Footer.jsx`** (new, didn't exist before): added to the root layout
    (site-wide, like `Header`) rather than only the homepage, wrapped in the
    existing `ChromeGate` so it's hidden on `/admin`/`/staff` same as
    `Header`/`FloatingCart`. Contains the requested small "Made by Gab"
    credit line at the very bottom, styled subtly on purpose.
  - **Placeholder content flagged, not fabricated as fact**: the About
    section's brand story, the footer's phone number/hours/social links, and
    all blog post copy are written as plausible placeholders, not real
    Hameed's history or contact details — replace before this goes live.
  - **Image/video folder structure** (created empty, ready for real files):
    ```
    public/images/hero/       pastil.webp, silog-meals.webp, pares.webp,
                               bulalo.webp, chicken-inasal.webp
    public/images/menu/       pastil.webp, spicy-pastil-silog.webp, bulalo.webp,
                               pares.webp, chicken-sisig.webp, iced-tea.webp
    public/images/about/      founder.webp
    public/images/blog/       post-1.webp, post-2.webp, post-3.webp
    public/images/customers/  customer-1.webp … customer-10.webp
    public/images/news/       clip-1-poster.webp, clip-2-poster.webp
    public/videos/news/       clip-1.mp4, clip-2.mp4
    ```
    Confirmed `.mp4` per the request's own suggestion — native `<video>`
    `source type="video/mp4"` is already wired to expect it. Old
    `public/products/*.jpg` files (used by the previous carousel) were left
    alone, not deleted, since nothing in the old `/menu` page references the
    new folders.
  - **Verified for real**: full production build succeeded; fetched the live
    homepage and confirmed every section rendered with real content — the
    Anton font's generated CSS class present in the HTML, `FeaturedMenu`'s
    real Prisma-sourced price (₱65.00 for Pastil) and description, every
    section's heading text, and the Footer's "Made by Gab" line. **Not
    verified**: how it actually looks, since none of the real `.webp`/`.mp4`
    files exist yet (Next Image doesn't error at render time over a missing
    file — the `<img>` tag is constructed correctly regardless — so the page
    builds and serves fine, but every image is currently a broken-image icon
    until real files are dropped into the paths above); the true visual
    layout at 375/768/1280px also hasn't been checked in an actual resized
    browser, same standing limitation as the addresses feature before it.

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
