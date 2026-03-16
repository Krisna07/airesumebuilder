import 'dotenv/config';
import { defineConfig } from '@prisma/config';

export default defineConfig({
  schema: './prisma/schema.prisma',
  datasource: {
    // Prefer the Neon URL (production/preview), fall back to local DATABASE_URL
    url: process.env.NEON_DATABASE_DATABASE_URL || process.env.DATABASE_URL,
  },
});