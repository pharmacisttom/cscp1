import { prisma } from '../src/lib/prisma';
import * as argon2 from "argon2";

async function main() {
  const user = await prisma.user.findFirst({ where: { email: 'admin@cscp.local' } });
  if (user) {
    console.log("Admin password hash:", user.passwordHash);
    const newHash = await argon2.hash("password"); // Default fallback password
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newHash }
    });
    console.log("Password reset to 'password' for admin@cscp.local");
  } else {
    console.log("Admin not found.");
  }
}

main().catch(console.error);
