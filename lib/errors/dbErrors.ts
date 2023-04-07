import { IDbErrorConfig } from './IDbErrorConfig';
import { DbError } from './dbError';
import { IErrorsMapper } from './errorsMapper';

export const dbErrors = {
  forbidden: (): IDbErrorConfig => DbError.makeError('ERRDB001', 'Forbidden'),
  notFound: (): IDbErrorConfig => DbError.makeError('ERRDB002', 'Not Found'),
  internalServerError: (): IDbErrorConfig => DbError.makeError('ERRDB003', 'Sorry, something went wrong'),
  notImplemented: (): IDbErrorConfig => DbError.makeError('ERRDB004', 'Not impemented'),
  errorConnectionNotOpen: (): IDbErrorConfig => DbError.makeError('ERRDB005', 'Database connection is not opened'),
  errorConnectionAlreadyOpen: (): IDbErrorConfig =>
    DbError.makeError('ERRDB006', 'Database connection is already opened'),
  errorDuplicatedDocument: (): IDbErrorConfig => DbError.makeError('ERRDB007', 'Duplicated document'),
  errorNothingWasDeleted: (): IDbErrorConfig => DbError.makeError('ERRDB008', 'Nothing was deleted'),
  errorNoIdProvided: (): IDbErrorConfig => DbError.makeError('ERRDB009', 'Cannot get document without [id]'),
  errorNoCriteriaProvided: (): IDbErrorConfig => DbError.makeError('ERRDB010', 'Cannot get document without criteria'),
  errorDocumentNotFound: (): IDbErrorConfig => DbError.makeError('ERRDB011', 'Document not found'),
  errorDbInstruction: (): IDbErrorConfig => DbError.makeError('ERRDB012', 'Fail to receive data'),
  unsupportedFilterOperation: (): IDbErrorConfig => DbError.makeError('ERRDB013', 'Unsupported filter operation'),
  duplicatedSortingCondition: (): IDbErrorConfig => DbError.makeError('ERRDB014', 'Duplicated sorting condition'),
  dbAnyError: (): IDbErrorConfig => DbError.makeError('ERRDB015', 'Something went wrong!'),
};

export const registerDbUserFriendlyExceptions = (errorsMapper: IErrorsMapper): void => {
  errorsMapper.register(
    'Document contains a field value that is not unique but required to be',
    dbErrors.errorDuplicatedDocument(),
  );
  errorsMapper.register('Duplicate entry', dbErrors.errorDuplicatedDocument());
  errorsMapper.register('You have an error in your SQL syntax', dbErrors.errorDbInstruction());
  errorsMapper.register('PARSING FAILED', dbErrors.errorDbInstruction());
};
