import { defineConfig } from 'drizzle-kit';
import dotenv from 'dotenv';
import path from 'path';

// Load .env from root directory
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const DATABASE_URL = process.env.DATABASE_URL ||
    `postgresql://${process.env.POSTGRES_USER}:${process.env.POSTGRES_PASSWORD}@${process.env.POSTGRES_HOST}:${process.env.POSTGRES_PORT}/${process.env.POSTGRES_DB}`;

export default defineConfig({
    schema: './src/features/auth/auth.schema.ts',
    out: './drizzle',
    dialect: 'postgresql',
    dbCredentials: {
        url: DATABASE_URL!,
    },
});
