/**
 * Prisma singleton with PrismaMariaDb adapter.
 *
 * Parses DATABASE_URL manually so the adapter receives explicit host/port/user
 * instead of a connection string — this avoids the P2039 "connection string
 * not supported" error that occurs when the adapter is initialised with a URL.
 *
 * Production VPS fix: connectionLimit + connectTimeout prevent pool exhaustion
 * on a long-running Node process.
 */

import { PrismaClient } from "@/generated/prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

const globalDb = globalThis as unknown as { prismaInstance?: PrismaClient };

export function getDb(): PrismaClient {
  if (!globalDb.prismaInstance) {
    const dbUrl = process.env.DATABASE_URL || "mysql://root:@127.0.0.1:3306/cscp";
    const url = new URL(dbUrl);

    const adapter = new PrismaMariaDb({
      host: url.hostname,
      port: Number(url.port || 3306),
      user: decodeURIComponent(url.username || "root"),
      password: decodeURIComponent(url.password || ""),
      database: url.pathname.slice(1) || "cscp",
      connectionLimit: 10,
      connectTimeout: 5000,
      ...(url.searchParams.get("ssl") === "true"
        ? { ssl: { rejectUnauthorized: true } }
        : {}),
    });

    globalDb.prismaInstance = new PrismaClient({ adapter });
  }
  return globalDb.prismaInstance;
}

export const prisma = getDb();
