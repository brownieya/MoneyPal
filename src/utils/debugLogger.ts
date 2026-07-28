import { clearDebugLogs as clearDebugLogsFromDb, insertDebugLog } from '../database/db';
import { DebugLogLevel } from '../types';

export function writeDebugLog(
  source: string,
  message: string,
  level: DebugLogLevel = 'info'
): void {
  try {
    insertDebugLog({
      timestamp: new Date().toISOString(),
      source,
      level,
      message,
    });
  } catch (error) {
    console.warn('[MoneyPal debug log failed]', error);
  }
}

export function clearPersistedDebugLogs(): void {
  try {
    clearDebugLogsFromDb();
  } catch (error) {
    console.warn('[MoneyPal debug log clear failed]', error);
  }
}
