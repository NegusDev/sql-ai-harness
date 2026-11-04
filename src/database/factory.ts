import type { DatabaseAdapter, DatabaseSslMode } from '../core/types/index.js';
import { MySqlAdapter } from './mysql/adapter.js';
import { PostgresAdapter } from './postgres/adapter.js';

export interface DatabaseConnectionConfig {
  driver: 'mysql' | 'postgres' | 'sqlite';
  host: string;
  port: number;
  name: string;
  user: string;
  password: string;
  ssl?: DatabaseSslMode;
}

/** Drivers that have an adapter. */
export const SUPPORTED_DRIVERS = ['mysql', 'postgres'] as const;

export function isSupportedDriver(driver: string): boolean {
  return (SUPPORTED_DRIVERS as readonly string[]).includes(driver);
}

/** Creates the adapter for `config.driver`. Throws for drivers without one. */
export function createDatabaseAdapter(config: DatabaseConnectionConfig): DatabaseAdapter {
  const connection = {
    host: config.host,
    port: config.port,
    database: config.name,
    user: config.user,
    password: config.password,
    ssl: config.ssl,
  };

  switch (config.driver) {
    case 'mysql':
      return new MySqlAdapter(connection);
    case 'postgres':
      return new PostgresAdapter(connection);
    default:
      throw new Error(
        `Database driver "${config.driver}" is not implemented yet. Supported: ${SUPPORTED_DRIVERS.join(', ')}.`,
      );
  }
}
