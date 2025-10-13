import dotenv from 'dotenv';

const envFile = process.env.NODE_ENV === 'test' ? '.env.test' : '.env';
dotenv.config({ path: envFile });

export const PORT = parseInt(process.env.PORT || '4000', 10);
export const DATABASE_URL = process.env.DATABASE_URL;
export const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key';
export const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';
export const NODE_ENV = process.env.NODE_ENV || 'development';
