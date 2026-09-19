import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

export function openStore(path = process.env.DATABASE_PATH || './data/lets-link.sqlite') {
  if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path);
  db.exec(`PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL;
    CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL, username TEXT UNIQUE NOT NULL, full_name TEXT NOT NULL, password_hash TEXT NOT NULL, salt TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS sessions(token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), expires INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS profiles(user_id TEXT PRIMARY KEY REFERENCES users(id), data TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS parties(id TEXT PRIMARY KEY, host_id TEXT NOT NULL REFERENCES users(id), join_code TEXT UNIQUE NOT NULL, data TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS members(id TEXT PRIMARY KEY, party_id TEXT NOT NULL REFERENCES parties(id), user_id TEXT NOT NULL REFERENCES users(id), location_lat REAL, location_lng REAL, location_name TEXT, UNIQUE(party_id,user_id));`);
  return db;
}
