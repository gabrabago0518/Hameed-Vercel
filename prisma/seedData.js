// The restaurant/branches/menu data used by prisma/seed.js — pulled out into
// its own module so app/api/setup/route.js (which needs the same data, for
// environments like Neon where a plain terminal script can't reach the
// database directly) can reuse it instead of duplicating it.
//
// This is the full menu, corrected against real photos of the in-store menu
// boards (Chicken Atbp./Sizzling Java Rice Menu, Silog Meals/Combo Meals) —
// several prices/items/categories here were placeholder guesses before that
// didn't match what's actually posted in the store. A brand-new database
// seeded from this file starts directly with this real menu — there's no
// order history to preserve on a fresh database, so (unlike the one-off
// migration that corrected the already-seeded live database) nothing here
// needs the retire-instead-of-delete treatment.
const WING_FLAVOR_OPTIONS = [
  { name: "Spicy Buffalo (Best by Hameed)", sortOrder: 0 },
  { name: "Spicy Salted Egg", sortOrder: 1 },
  { name: "Burning Wings", sortOrder: 2 },
  { name: "Soy Garlic", sortOrder: 3 },
  { name: "Hickory BBQ", sortOrder: 4 },
  { name: "Garlic Parmesan", sortOrder: 5 },
  { name: "Teriyaki", sortOrder: 6 },
];

// Applies to every Silog Meals item — turns any silog into a "pastil silog".
// ₱35, matching the in-store board (was guessed at ₱20 before that photo).
const ADDITION_PASTIL_ADDON = { name: "Addition Pastil", price: 35.0 };
const ICED_TEA_COMBO_ADDON = { name: "Make it a Combo (+ Iced Tea)", price: 35.0 };

export const restaurantSeedData = {
  name: "Hameed the Love Recipe",
  description: "Filipino-style fast food, delivered fast.",
  branches: {
    create: [
      {
        name: "Maharlika Branch",
        address: "Maharlika Village",
        city: "Taguig City",
      },
      {
        name: "New Lower Bicutan Branch",
        address: "New Lower Bicutan",
        city: "Taguig City",
      },
    ],
  },
  menuCategories: {
    create: [
      {
        name: "Sizzling Platter",
        sortOrder: 0,
        menuItems: {
          create: [
            { name: "Sizzling T-Bone Steak", price: 205.0 },
            { name: "Sipo Egg", price: 139.0 },
            { name: "Sizzling Beef Burger Steak", price: 139.0 },
            { name: "Sizzling Beef Shawarma", price: 139.0 },
            { name: "Sizzling Garlic Pepper Beef", price: 139.0 },
            { name: "Sweet & Sour", price: 139.0 },
            { name: "Sizzling Chicken Fillet", price: 139.0 },
            { name: "Sizzling Chicken Poppers", price: 139.0 },
            { name: "Sizzling Hungarian Sausage", price: 139.0 },
          ],
        },
      },
      {
        name: "Silog Meals",
        sortOrder: 1,
        menuItems: {
          create: [
            {
              name: "Tapsilog",
              description: "Beef tapa with garlic rice and a fried egg.",
              price: 85.0,
              addons: { create: [ICED_TEA_COMBO_ADDON, ADDITION_PASTIL_ADDON] },
            },
            {
              name: "Chicsilog",
              description: "Fried chicken with garlic rice and a fried egg.",
              price: 85.0,
              addons: { create: [ICED_TEA_COMBO_ADDON, ADDITION_PASTIL_ADDON] },
            },
            {
              name: "Bangsilog",
              description: "Fried milkfish (bangus) with garlic rice and a fried egg.",
              price: 90.0,
              addons: { create: [ICED_TEA_COMBO_ADDON, ADDITION_PASTIL_ADDON] },
            },
            {
              name: "Longsilog",
              description: "Sweet Filipino sausage with garlic rice and a fried egg.",
              price: 85.0,
              addons: { create: [ICED_TEA_COMBO_ADDON, ADDITION_PASTIL_ADDON] },
            },
            {
              name: "Hotsilog",
              description: "Spicy hotdog with garlic rice and a fried egg.",
              price: 85.0,
              addons: { create: [ICED_TEA_COMBO_ADDON, ADDITION_PASTIL_ADDON] },
            },
            {
              name: "Spamsilog",
              description: "Fried SPAM with garlic rice and a fried egg.",
              price: 80.0,
              addons: { create: [ICED_TEA_COMBO_ADDON, ADDITION_PASTIL_ADDON] },
            },
            {
              name: "Siomaisilog",
              description: "Steamed siomai with garlic rice and a fried egg.",
              price: 75.0,
              addons: { create: [ICED_TEA_COMBO_ADDON, ADDITION_PASTIL_ADDON] },
            },
            {
              name: "Shanghaisilog",
              description: "Crispy Shanghai lumpia with garlic rice and a fried egg.",
              price: 75.0,
              addons: { create: [ICED_TEA_COMBO_ADDON, ADDITION_PASTIL_ADDON] },
            },
            {
              name: "Embotidosilog",
              description: "Embotido (Filipino meatloaf) with garlic rice and a fried egg.",
              price: 75.0,
              addons: { create: [ICED_TEA_COMBO_ADDON, ADDITION_PASTIL_ADDON] },
            },
          ],
        },
      },
      {
        name: "Chicken Atbp.",
        sortOrder: 2,
        menuItems: {
          create: [
            {
              name: "Chicken Sisig",
              description: "Sizzling chopped chicken sisig.",
              // Base price is the Ala Carte price; the "Serving" variant
              // below adds the difference for W/ Rice.
              price: 120.0,
              variantGroups: {
                create: [
                  {
                    name: "Spice Level",
                    sortOrder: 0,
                    options: {
                      create: [
                        { name: "Original", sortOrder: 0 },
                        { name: "Spicy", sortOrder: 1 },
                      ],
                    },
                  },
                  {
                    name: "Serving",
                    sortOrder: 1,
                    options: {
                      create: [
                        { name: "Ala Carte", sortOrder: 0 },
                        { name: "W/ Rice", priceDelta: 10.0, sortOrder: 1 },
                      ],
                    },
                  },
                ],
              },
            },
            {
              name: "Chicken Wings",
              description: "Crispy fried chicken wings.",
              // Base price is the Ala Carte price (₱160); W/ Rice is priced
              // lower (₱105) — confirmed intentional, despite being the
              // reverse of Chicken Sisig's own pattern.
              price: 160.0,
              variantGroups: {
                create: [
                  {
                    name: "Flavor",
                    sortOrder: 0,
                    options: { create: WING_FLAVOR_OPTIONS },
                  },
                  {
                    name: "Serving",
                    sortOrder: 1,
                    options: {
                      create: [
                        { name: "Ala Carte", sortOrder: 0 },
                        { name: "W/ Rice", priceDelta: -55.0, sortOrder: 1 },
                      ],
                    },
                  },
                ],
              },
            },
          ],
        },
      },
      {
        name: "Special Fillet Series",
        sortOrder: 3,
        menuItems: {
          create: [
            { name: "Chicken Fillet", price: 139.0 },
            { name: "Ala King", price: 139.0 },
            { name: "Cheesy Fillet", price: 139.0 },
          ],
        },
      },
      {
        name: "Combo Meals",
        sortOrder: 4,
        menuItems: {
          create: [
            {
              name: "Pastilog Combo",
              description: "Hameed's best seller! Two cups of rice with pastil.",
              price: 45.0,
            },
            { name: "Tapsilog Combo", price: 100.0 },
            { name: "Chicsilog Combo", price: 100.0 },
            { name: "Bangsilog Combo", price: 105.0 },
            { name: "Longsilog Combo", price: 100.0 },
            { name: "Hotsilog Combo", price: 95.0 },
            { name: "Spamsilog Combo", price: 95.0 },
            { name: "Siomaisilog Combo", price: 85.0 },
            { name: "Shanghaisilog Combo", price: 85.0 },
            { name: "Embotidosilog Combo", price: 85.0 },
          ],
        },
      },
      {
        name: "Soup",
        sortOrder: 5,
        menuItems: {
          create: [
            {
              name: "Beef Pares",
              description: "Braised beef stew served with garlic rice.",
              price: 60.0,
            },
            {
              name: "Beef Bulalo",
              description: "Beef bone marrow soup.",
              price: 150.0,
            },
          ],
        },
      },
    ],
  },
};
