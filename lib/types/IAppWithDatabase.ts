export interface IAppWithDatabase<Database> {
  db: Database;
  connectDb: () => Promise<void>;
}
