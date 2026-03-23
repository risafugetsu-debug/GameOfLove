import { drizzle } from 'drizzle-orm/expo-sqlite';
import * as SQLite from 'expo-sqlite';
import * as schema from './schema';

const sqlite = SQLite.openDatabaseSync('game-of-love.db');
sqlite.execSync('PRAGMA foreign_keys = ON;');
export const db = drizzle(sqlite, { schema });
