import { prisma } from "../lib/prisma.js";
import { restaurantSeedData } from "./seedData.js";

async function main() {
  const restaurant = await prisma.restaurant.create({ data: restaurantSeedData });

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
