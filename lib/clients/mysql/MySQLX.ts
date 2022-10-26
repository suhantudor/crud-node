import * as mysqlx from '@mysql/xdevapi';

import { DbError, dbErrors } from '../../errors';
import { IClientDatabase, IDocumentSchema } from '../../types';

export type MySQLXSession = mysqlx.Session;

export interface ConnectionOptions {
  /**
   * The MySQL user to authenticate as
   */
  user?: string;

  /**
   * The password of that MySQL user
   */
  password?: string;

  /**
   * Name of the database to use for this connection
   */
  schema: string;
}

// host, port, schema, user, password, timezone, connectTimeout,
export interface MySQLXConnectionConfig extends ConnectionOptions {
  /**
   * The hostname of the database you are connecting to. (Default: localhost)
   */
  host?: string;

  /**
   * The port number to connect to. (Default: 3306)
   */
  port?: number;

  /**
   * The timezone used to store local dates.
   */
  timezone?: string;
}

export interface MySQLXPoolingOptions {
  /**
   * Enable/Disable pooling
   */
  enabled: boolean;

  /**
   * Maximum number of connections supported by the pool
   */
  maxSize?: number;

  /**
   * Maximum number of milliseconds to allow a connection to be idle (0 = infinite)
   */
  maxIdleTime?: number;

  /**
   * Maximum number of milliseconds to wait for a connection to become available (0 = infinite)
   */
  queueTimeout?: number;
}

export interface MySQLXPoolingConfig {
  pooling: MySQLXPoolingOptions;
}

export class MySQLX implements IClientDatabase<mysqlx.Client, MySQLXSession> {
  private schema: string;

  private connection: MySQLXConnectionConfig;

  private pooling: MySQLXPoolingConfig;

  private client: mysqlx.Client | null;

  private settings: { ciCollation: string };

  constructor(connection: MySQLXConnectionConfig, pooling: MySQLXPoolingConfig, settings: { ciCollation: string }) {
    const { schema } = connection;
    this.schema = schema;
    this.connection = connection;
    this.pooling = pooling;
    this.client = null;
    this.settings = settings;
  }

  get Provider(): mysqlx.Client | null {
    return this.client;
  }

  get ciCollation(): string {
    return this.settings.ciCollation;
  }

  /**
   * Check database connection status
   */
  healthcheck = async (): Promise<void> => {
    if (!this.client) {
      throw new DbError(dbErrors.errorConnectionNotOpen());
    }
    await this.client.getSession();
  };

  /**
   * Connect to schema. Retrieve a connection from the pool if one is available.
   */
  connect = async (): Promise<void> => {
    if (this.client) {
      throw new DbError(dbErrors.errorConnectionAlreadyOpen());
    }
    this.client = mysqlx.getClient(this.connection, this.pooling);
  };

  /**
   * Close and clean up all the connections in the pool.
   */
  disconnect = async (): Promise<void> => {
    if (!this.client) {
      throw new DbError(dbErrors.errorConnectionNotOpen());
    }
    this.client.close();
    this.client = null;
  };

  /**
   * Connecting to a MySQL database via MySQL pool.
   * Each session created from a connection pool includes a close() method which, in this case,
   * releases a connection from the pool and makes it available in subsequent connection requests.
   * @param callback
   * @returns
   */
  usingSession = async <T>(callback: (session: MySQLXSession) => Promise<T>, transacted = false): Promise<T> => {
    if (!this.client) {
      throw new DbError(dbErrors.errorConnectionNotOpen());
    }
    const session = await this.client.getSession();
    try {
      if (transacted) {
        await session.startTransaction();
      }
      const result = await callback(session);
      await session.commit();
      return result;
    } catch (error) {
      if (transacted) {
        await session.rollback();
      }
      throw new DbError(error as DbError);
    } finally {
      session.close();
    }
  };

  /**
   * Create a new collection
   * @param {{name, validation}} param name of collection, validation schema of collection.
   */
  createCollection = async <S extends string>(session: MySQLXSession, table: IDocumentSchema<S>): Promise<void> => {
    if (!this.client) {
      throw new DbError(dbErrors.errorConnectionNotOpen());
    }
    const schema = session.getSchema(this.schema);
    await schema.createCollection(table.name, {
      reuseExisting: true,
      validation: table.validation,
    });
  };

  /**
   * Create a new collection in the schema if not exists. Retrieve the instance of a given collection.
   * @param {{name, validation}} param name of collection, validation schema of collection.
   */
  getCollection = async <S extends string>(
    session: MySQLXSession,
    doc: IDocumentSchema<S>,
  ): Promise<mysqlx.Collection> => {
    const schema = session.getSchema(this.schema);
    return schema.getCollection(doc.name);
  };

  dropCollection = async <S extends string>(session: MySQLXSession, doc: IDocumentSchema<S>): Promise<void> => {
    const schema = session.getSchema(this.schema);
    schema.dropCollection(doc.name);
  };

  /**
   * Gets a table in the schema if exists. Retrieve the instance of a given table.
   * @param {{name}} param name of a table
   */
  getTable = async <S extends string>(session: MySQLXSession, doc: IDocumentSchema<S>): Promise<mysqlx.Table> => {
    const schema = session.getSchema(this.schema);
    return schema.getTable(doc.name);
  };
}
