import * as SQLite from 'expo-sqlite';
import { CategoryId, MonthlySummary, Transaction, TransactionFilter } from '../types';

const db = SQLite.openDatabaseSync('moneypal.db');

function hasColumn(table: string, column: string): boolean {
  const result = db.getAllSync<{ name: string }>(`PRAGMA table_info(${table})`);
  return result.some(item => item.name === column);
}

/** 初始化数据库表 */
export function initDB(): void {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS transactions (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      amount    INTEGER NOT NULL,
      category  TEXT    NOT NULL DEFAULT 'other',
      note      TEXT    NOT NULL DEFAULT '',
      source    TEXT    NOT NULL DEFAULT 'manual',
      raw       TEXT    NOT NULL DEFAULT '',
      externalId TEXT   NOT NULL DEFAULT '',
      createdAt TEXT    NOT NULL
    );
  `);

  if (!hasColumn('transactions', 'externalId')) {
    db.execSync(`ALTER TABLE transactions ADD COLUMN externalId TEXT NOT NULL DEFAULT '';`);
  }

  db.execSync(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_transactions_external_id
    ON transactions (externalId)
    WHERE externalId != '';
  `);
}

/** 插入一条消费记录 */
export function insertTransaction(
  tx: Omit<Transaction, 'id'>
): number {
  const result = db.runSync(
    `INSERT OR IGNORE INTO transactions (amount, category, note, source, raw, externalId, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    tx.amount,
    tx.category,
    tx.note,
    tx.source,
    tx.raw,
    tx.externalId,
    tx.createdAt
  );
  return result.lastInsertRowId;
}

/** 查询消费记录，支持按分类和日期过滤 */
export function queryTransactions(filter?: TransactionFilter): Transaction[] {
  const conditions: string[] = [];
  const params: (string | number)[] = [];

  if (filter?.categoryId) {
    conditions.push('category = ?');
    params.push(filter.categoryId);
  }
  if (filter?.startDate) {
    conditions.push('createdAt >= ?');
    params.push(filter.startDate);
  }
  if (filter?.endDate) {
    conditions.push('createdAt <= ?');
    params.push(filter.endDate);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  return db.getAllSync<Transaction>(
    `SELECT * FROM transactions ${where} ORDER BY createdAt DESC`,
    ...params
  );
}

/** 删除指定 id 的记录 */
export function deleteTransaction(id: number): void {
  db.runSync('DELETE FROM transactions WHERE id = ?', id);
}

/** 批量删除 */
export function deleteTransactions(ids: number[]): void {
  const placeholders = ids.map(() => '?').join(',');
  db.runSync(`DELETE FROM transactions WHERE id IN (${placeholders})`, ...ids);
}

export function updateTransactionCategory(id: number, category: CategoryId): void {
  db.runSync('UPDATE transactions SET category = ? WHERE id = ?', category, id);
}

/** 按分类统计本月总消费（返回分为单位） */
export function getMonthlySummary(): MonthlySummary[] {
  const start = new Date();
  start.setDate(1);
  start.setHours(0, 0, 0, 0);
  return db.getAllSync<MonthlySummary>(
    `SELECT category, SUM(amount) as total
     FROM transactions
     WHERE createdAt >= ?
     GROUP BY category`,
    start.toISOString()
  );
}
