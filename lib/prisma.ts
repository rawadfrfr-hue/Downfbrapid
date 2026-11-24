import { PrismaClient } from '@prisma/client';

declare global {
  var __savevibePrisma: PrismaClient | undefined;
}

export function isPrismaDatabaseConfigured(): boolean {
  const url = process.env.DATABASE_URL?.trim();
  return Boolean(url && url.length > 0);
}

export function getPrismaClient(): PrismaClient | null {
  if (!isPrismaDatabaseConfigured()) {
    return null;
  }

  if (!globalThis.__savevibePrisma) {
    globalThis.__savevibePrisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    });
  }

  return globalThis.__savevibePrisma;
}
