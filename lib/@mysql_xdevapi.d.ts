declare module '@mysql/xdevapi' {
  export interface PoolingOptions {
    enabled: boolean;
    maxSize?: number;
  }

  export interface PoolingConfig {
    pooling: PoolingOptions;
  }

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
  export interface ConnectionConfig extends ConnectionOptions {
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

  export type Document = { [key: string]: unknown };

  export type Row = unknown[];

  export interface Column {
    getColumnLabel: () => string;
  }

  export interface Collection {
    add: (documents: Document | Document[]) => any;
    modify: (expr: string) => any;
    remove: (expr: string) => any;
    find: (expr?: string) => any;
  }

  export interface Table {
    select: (expr: any) => any;
  }

  export interface Schema {
    createCollection: (name: string, options?: { [key: string]: any }) => Promise<Collection>;
    dropCollection: (name: string) => Promise<boolean>;
    getCollection: (name: string) => Promise<Collection>;
    getTable: (name: string) => Promise<Table>;
    modifyCollection: (name: string, options: { [key: string]: any }) => Promise<Collection>;
    existsInDatabase: () => Promise<boolean>;
    getName: () => string;
  }

  export interface SqlResult {
    hasData: () => boolean;
    fetchAll: () => Promise<Row[]>;
    getColumns: () => Column[];
  }

  export interface Session {
    getSchema: (name: string) => Schema;
    close: () => void;
    startTransaction: () => Promise<boolean>;
    commit: () => Promise<boolean>;
    rollback: () => Promise<boolean>;
    sql: (cmd: string) => any;
  }

  export interface Client {
    close: () => void;
    getSession: () => Promise<Session>;
  }

  export function getClient(connection: ConnectionConfig, options: PoolingConfig): Client;
}
