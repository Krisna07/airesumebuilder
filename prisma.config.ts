import 'dotenv/config';
import { defineConfig, env } from '@prisma/config';

const isProduction = process.env.NODE_ENV === 'production';

export default defineConfig({
  schema: './prisma/schema.prisma',
  datasource: {
    url: env(isProduction
      ? 'DATABASE_URL'
      : (process.env.NEON_DATABASE_DATABASE_URL ? 'NEON_DATABASE_DATABASE_URL' : 'DATABASE_URL')),
  },
});