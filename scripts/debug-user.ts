import { prisma } from '../src/lib/prisma';

async function main() {
  const users = await prisma.user.findMany({ include: { roles: { include: { role: true } } }});
  console.log("Users:", users.map((u: any) => ({ id: u.id, email: u.email, role: u.roles[0]?.role?.name })));

  const officers = await prisma.officer.findMany();
  console.log("Officers:", officers.map((o: any) => ({ id: o.id, userId: o.userId, org: o.organizationId, name: o.fullName })));
}

main().catch(console.error);
