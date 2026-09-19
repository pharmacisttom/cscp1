import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany();
  console.log("Users:", users.map(u => ({ id: u.id, email: u.email, role: u.role })));

  const officers = await prisma.officer.findMany();
  console.log("Officers:", officers.map(o => ({ id: o.id, userId: o.userId, org: o.organizationId, name: o.fullName })));
}

main().catch(console.error).finally(() => prisma.$disconnect());
