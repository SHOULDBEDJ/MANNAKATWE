import { createClient } from '@libsql/client';
import dotenv from 'dotenv';
dotenv.config();

export const db = createClient(
  process.env.NODE_ENV !== 'production'
    ? { url: 'file:local.db' }
    : { url: process.env.TURSO_URL, authToken: process.env.TURSO_AUTH_TOKEN }
);
