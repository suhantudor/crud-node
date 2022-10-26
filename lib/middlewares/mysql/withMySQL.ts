import { MySQL, MySQLConnectionConfig } from '../../clients';
import { IAppWithDatabase } from '../../types';

export const withMySQL = <Application>(
  app: Application,
  connection: MySQLConnectionConfig,
  settings: { ciCollation: string },
): Application & IAppWithDatabase<MySQL> => {
  const appWithDatabase = app as Application & IAppWithDatabase<MySQL>;
  if (!appWithDatabase.db) {
    appWithDatabase.db = new MySQL(connection, settings);
  }
  appWithDatabase.connectDb = async (): Promise<void> => {
    await appWithDatabase.db.connect();
  };
  return appWithDatabase;
};
