export interface IClientDatabase<P, S> {
  get Provider(): P | null;
  get ciCollation(): string;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  healthcheck: () => Promise<void>;
  usingSession: <P>(callback: (session?: S) => Promise<P>, transacted?: boolean) => Promise<P>;
}
