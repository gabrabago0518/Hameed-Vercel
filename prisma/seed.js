import { prisma } from "../lib/prisma.js";

async function main() {
  const restaurant = await prisma.restaurant.create({
    data: {
      name: "Hameed the Love Recipe",
      description: "Filipino-style fast food, delivered fast.",
      branches: {
        create: [
          {
            name: "Hameed the Love Recipe - Quezon City",
            address: "123 Commonwealth Ave",
            city: "Quezon City",
            phone: "0917-000-0001",
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
        ],
      },
    },
  });

  console.log(`Seeded restaurant "${restaurant.name}" with branches, categories, and menu items.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
