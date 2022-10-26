import { IDbError } from './IDbError';
import { IDbErrorConfig } from './IDbErrorConfig';

export class DbError extends Error implements IDbError {
  code: string;

  constructor({ code, message }: IDbErrorConfig) {
    super(message);
    this.name = 'DbError';
    this.code = code;
  }

  static makeError(code: string, message: string): IDbErrorConfig {
    return {
      code,
      message,
    };
  }

  toJSON(): IDbErrorConfig {
    return {
      code: this.code,
      message: this.message,
    };
  }

  toString(): string {
    return `${this.name} ${this.code} ${this.message}`;
  }
}
