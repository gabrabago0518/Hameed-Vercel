// The restaurant/branches/menu data used by prisma/seed.js — pulled out into
// its own module so app/api/setup/route.js (which needs the same data, for
// environments like Neon where a plain terminal script can't reach the
// database directly) can reuse it instead of duplicating it.
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
        name: "Signature",
        sortOrder: 0,
        menuItems: {
          create: [
            {
              name: "Pastil",
              description:
                "Steamed rice topped with savory shredded chicken, wrapped in banana leaf — our most-loved dish.",
              price: 65.0,
            },
          ],
        },
      },
      {
        name: "Rice Meals",
        sortOrder: 1,
        menuItems: {
          create: [
            {
              name: "Crispy Fried Chicken Meal",
              description: "One-piece crispy fried chicken with rice and gravy.",
              price: 129.0,
              addons: {
                create: [
                  { name: "Extra Rice", price: 25.0 },
                  { name: "Extra Gravy", price: 15.0 },
                ],
              },
            },
            {
              name: "Beef Tapa Meal",
              description: "Sweet and savory beef tapa with garlic rice and egg.",
              price: 139.0,
            },
          ],
        },
      },
      {
        name: "Burgers",
        sortOrder: 2,
        menuItems: {
          create: [
            {
              name: "Classic Cheeseburger",
              description: "Beef patty, melted cheese, and special sauce.",
              price: 89.0,
              addons: {
                create: [{ name: "Extra Cheese", price: 20.0 }],
              },
            },
          ],
        },
      },
      {
        name: "Drinks",
        sortOrder: 3,
        menuItems: {
          create: [
            { name: "Iced Tea", price: 45.0 },
            { name: "Bottled Water", price: 25.0 },
          ],
        },
      },
      {
        name: "Silog Meals",
        sortOrder: 4,
        menuItems: {
          create: [
            {
              name: "Tapsilog",
              description: "Beef tapa with garlic rice and a fried egg.",
              price: 79.0,
            },
            {
              name: "Chicksilog",
              description: "Fried chicken with garlic rice and a fried egg.",
              price: 79.0,
            },
            {
              name: "Longsilog",
              description: "Sweet Filipino sausage with garlic rice and a fried egg.",
              price: 69.0,
            },
            {
              name: "Spicy Pastil Silog",
              description: "Our signature pastil with a spicy kick, garlic rice, and a fried egg.",
              price: 75.0,
            },
            {
              name: "Hotsilog",
              description: "Spicy hotdog with garlic rice and a fried egg.",
              price: 69.0,
            },
            {
              name: "Chicken Wings",
              description: "Crispy fried chicken wings.",
              price: 99.0,
            },
          ],
        },
      },
      {
        name: "Also Available",
        sortOrder: 5,
        menuItems: {
          create: [
            {
              name: "Chicken Sisig",
              description: "Sizzling chopped chicken sisig.",
              price: 129.0,
            },
            {
              name: "Bulalo (Regular)",
              description: "Beef bone marrow soup, regular size.",
              price: 149.0,
            },
            {
              name: "Bulalo (Special)",
              description: "Beef bone marrow soup, special size with extra meat.",
              price: 199.0,
            },
            {
              name: "Pares",
              description: "Braised beef stew served with garlic rice.",
              price: 99.0,
            },
          ],
        },
      },
    ],
  },
};
