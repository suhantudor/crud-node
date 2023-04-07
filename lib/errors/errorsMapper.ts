import { IDbErrorConfig } from './IDbErrorConfig';
import { DbError } from './dbError';

export type ErrorsMapperKey = Error | DbError | IDbErrorConfig | string;

export interface IErrorsMapper {
  register: (error: ErrorsMapperKey, userFriendlyError: IDbErrorConfig) => void;
  unregister: (error: ErrorsMapperKey) => void;
  setDefaultMessage: (userFriendlyError: IDbErrorConfig) => void;
  getMessage: (error: ErrorsMapperKey) => DbError;
}

const defaultKey = '_default_';

const factory = new Map<ErrorsMapperKey, DbError>();

export const ErrorsMapper: IErrorsMapper = {
  /**
   *
   * @param {Error | String} error Error without mapping
   * @param {IDbErrorConfig} userFriendlyError A user-friendly error message
   */
  register: (error: ErrorsMapperKey, userFriendlyError: IDbErrorConfig): void => {
    factory.set(error, new DbError(userFriendlyError));
  },

  /**
   *
   * @param {Error | String} error Error without mapping
   */
  unregister: (error: ErrorsMapperKey): void => {
    factory.delete(error);
  },

  /**
   *
   * @param {DbError} userFriendlyError A user-friendly error message
   */
  setDefaultMessage: (userFriendlyError: IDbErrorConfig): void => {
    factory.set(defaultKey, new DbError(userFriendlyError));
  },

  /**
   *
   * @param {Error | String} error Error without mapping
   * @returns {DbError} A user-friendly error message
   */
  getMessage: (error: ErrorsMapperKey): DbError => {
    const message = (typeof error === 'object' && 'message' in error ? error.message : '') || error.toString();
    if (error) {
      const searchErrorMessage = message.toLowerCase();
      if (factory.has(searchErrorMessage)) {
        const res = factory.get(searchErrorMessage);
        if (res) return res;
      }
      // eslint-disable-next-line no-restricted-syntax
      for (const key of factory.keys()) {
        if (searchErrorMessage.includes(key.toString().toLowerCase())) {
          const res = factory.get(key);
          if (res) return res;
        }
      }
    }
    const defaultError = factory.get(defaultKey);
    if (defaultError) {
      return defaultError;
    }
    if (error instanceof DbError) {
      return error;
    }
    if (typeof error === 'object' && 'code' in error) {
      return new DbError({ code: error.code || '', message });
    }
    const customError = new DbError({ code: '', message });
    return customError;
  },
};
