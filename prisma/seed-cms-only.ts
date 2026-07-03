import prisma from "../lib/prisma.ts";
import { seedCmsContenido } from "./seeders/cms-contenido.seed.ts";

async function main() {
  const count = await seedCmsContenido(prisma);
  console.log(`✅ CMS dinámico (${count} campos) seeded`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
