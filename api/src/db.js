import mysql from 'mysql2/promise';
import { fail } from './domain.js';
export function createPool(env = process.env) {
  return mysql.createPool({ host: env.DB_HOST, port: Number(env.DB_PORT || 3306), user: env.DB_USERNAME, password: env.DB_PASSWORD, database: env.DB_DATABASE, timezone: 'Z', dateStrings: true, waitForConnections: true, connectionLimit: 10, multipleStatements: false });
}
export async function transaction(pool, work, actor) {
  const db = await pool.getConnection();
  try {
    await db.query("SET time_zone = '+00:00'"); await db.beginTransaction();
    if (actor) {
      const [users] = await db.execute('SELECT id, activo, rol FROM users WHERE id = ? FOR UPDATE', [actor]);
      if (!users[0]?.activo || users[0].rol !== 'vendedor') fail(401, 'Su sesión ya no es válida.');
    }
    const result = await work(db); await db.commit(); return result;
  } catch (error) { await db.rollback(); throw error; }
  finally { db.release(); }
}
