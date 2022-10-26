import { nanoid } from 'nanoid';

export const generateId = (alias?: string, length?: number): string =>
  alias ? `${alias}_${nanoid(length)}` : nanoid(length);
