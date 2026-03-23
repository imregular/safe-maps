const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  console.log('Testing Prisma connection...');
  const count = await prisma.safetyReport.count();
  console.log('Database connection successful. SafetyReport count:', count);
}
main()
  .catch(err => {
    console.error('Prisma Error:');
    console.error(err);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
