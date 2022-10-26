import knex, { Knex } from 'knex';

import { DbError, dbErrors } from '../../errors';
import { IClientDatabase, IDocumentSchema } from '../../types';

export type MySQLSession = Knex;

// Config object for mysql
export interface MySQLConnectionConfig {
  host?: string;
  port?: number;
  localAddress?: string;
  socketPath?: string;
  user?: string;
  password?: string;
  database?: string;
  charset?: string;
  timezone?: string;
  connectTimeout?: number;
  stringifyObjects?: boolean;
  insecureAuth?: boolean;
  typeCast?: any;
  queryFormat?: (query: string, values: any) => string;
  supportBigNumbers?: boolean;
  bigNumberStrings?: boolean;
  dateStrings?: boolean;
  debug?: boolean;
  trace?: boolean;
  multipleStatements?: boolean;
  flags?: string;
  ssl?: string;
  decimalNumbers?: boolean;
  expirationChecker?(): boolean;
}

/**
 * @class MySQL
 */
export class MySQL implements IClientDatabase<Knex, MySQLSession> {
  private provider: Knex | null;

  private connection: MySQLConnectionConfig;

  private settings: { ciCollation: string };

  constructor(connection: MySQLConnectionConfig, settings: { ciCollation: string }) {
    this.connection = connection;
    this.provider = null;
    this.settings = settings;
  }

  get Provider(): Knex | null {
    return this.provider;
  }

  get ciCollation(): string {
    return this.settings.ciCollation;
  }

  /**
   * Check database connection status
   */
  healthcheck = async (): Promise<void> => {
    if (!this.provider) {
      throw new DbError(dbErrors.errorConnectionNotOpen());
    }
    await this.provider.raw('SELECT 1');
  };

  async connect(): Promise<void> {
    const { timezone } = this.connection;
    this.provider = knex({
      client: 'mysql2',
      version: '8.0',
      connection: this.connection,
      pool: {
        afterCreate(conn: Knex.Client, done: (error: Error | undefined, client: Knex.Client) => void) {
          if (!timezone) {
            done(undefined, conn);
            return;
          }
          conn.query(`SET time_zone="${timezone}";`, (error: Error): void => {
            done(error, conn);
          });
        },
      },
    });
    await this.healthcheck();
  }

  async disconnect(): Promise<void> {
    if (this.provider) {
      await this.provider.destroy();
    }
  }

  usingSession = async <T>(callback: (session: Knex) => Promise<T>, transacted = false): Promise<T> => {
    if (!this.provider) {
      throw new DbError(dbErrors.errorConnectionNotOpen());
    }
    let trx;
    try {
      if (transacted) {
        trx = await this.provider.transaction();
        const result: T = await callback(trx);
        await trx.commit();
        return result;
      } else {
        const result: T = await callback(this.provider);
        return result;
      }
    } catch (error) {
      if (trx) {
        await trx.rollback();
      }
      throw new DbError(error as DbError);
    }
  };

  /**
   * Retrieve the instance of a given collection.
   * @param {{name}} param name of collection.
   */
  getCollection = <S extends string>(session: Knex, table: IDocumentSchema<S>): Knex.QueryBuilder => {
    const collection = session(table.name);
    return collection;
  };
}
