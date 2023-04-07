import { MySQLX, MySQLXConnectionConfig, MySQLXPoolingOptions } from '../../clients';
import { IAppWithDatabase } from '../../types';

export const withMySQLX = <Application>(
  app: Application,
  connection: MySQLXConnectionConfig,
  settings: { ciCollation: string },
  pooling: MySQLXPoolingOptions,
): Application & IAppWithDatabase<MySQLX> => {
  const appWithDatabase = app as Application & IAppWithDatabase<MySQLX>;
  if (!appWithDatabase.db) {
    appWithDatabase.db = new MySQLX(connection, { pooling }, settings);
  }

  appWithDatabase.connectDb = async (): Promise<void> => {
    await appWithDatabase.db.connect();
  };

  return appWithDatabase;
};
