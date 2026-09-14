import { PrismaClient } from "@/generated/prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

const globalDb = globalThis as unknown as { prismaInstance?: PrismaClient };

export function getDb(): PrismaClient {
  if (!globalDb.prismaInstance) {
    const dbUrl = process.env.DATABASE_URL || "mysql://root:@127.0.0.1:3306/cscp";
    const url = new URL(dbUrl);

    globalDb.prismaInstance = new PrismaClient({
      adapter: new PrismaMariaDb({
        host: url.hostname,
        port: Number(url.port || 3306),
        user: decodeURIComponent(url.username || "root"),
        password: decodeURIComponent(url.password || ""),
        database: url.pathname.slice(1) || "cscp",
        connectionLimit: 10,
        ...(url.searchParams.get("ssl") === "true"
          ? { ssl: { rejectUnauthorized: true } }
          : {}),
      }),
    });
  }
  return globalDb.prismaInstance;
}

export const prisma = getDb();
