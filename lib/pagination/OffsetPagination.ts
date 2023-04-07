import { IPage, IPaginatedSet } from './IPagination';

export interface IOffsetPagination {
  /** page index */
  page: number;
  /** maximum number of items to return for the current page */
  pageSize: number;
}

export const OffsetPagination = (page: number, pageSize: number): IOffsetPagination => {
  return {
    page,
    pageSize,
  };
};

export const DEFAULT_PAGE_SIZE = 50;

/**
 * Calculates limit and offset mets for pagination.
 * Page numeration starts from 1.
 * @param [pagination] contains meta data for pagination
 * @returns
 */
export const calculateLimit = (pagination?: IOffsetPagination): IPage => {
  let page = pagination && pagination.page;
  if (!page || page < 1) {
    page = 1;
  }
  let pageSize = pagination && pagination.pageSize;
  if (!pageSize || pageSize < 0) {
    pageSize = DEFAULT_PAGE_SIZE;
  }
  const offset = (page - 1) * pageSize;
  return { page, limit: pageSize, offset };
};

/**
 * Returns total pages count
 * @param total total count of data
 * @param pageSize maximum number of items to return for the current page
 * @returns
 */
export const calculateTotalPages = (total: number, pageSize: number): number =>
  total && pageSize ? Math.ceil(total / pageSize) : 0;

/**
 * Returns meta data for pagination of data array
 * @param data array of items to paginate
 * @param paginated limit and offset meta for pagination
 * @param total total count of data
 * @returns
 */
export const resultSet = <T>(data: Array<T>, paginated: IPage, total: number): IPaginatedSet<T> => {
  const totalPages = calculateTotalPages(total, paginated.limit);
  return {
    data,
    page: paginated.page,
    pageSize: paginated.limit,
    total,
    totalPages,
  };
};

/**
 * Returns a certain number of results after a certain number of elements
 * @param data array of items to paginate
 * @param paginated limit and offset meta for pagination
 * @returns
 */
export const limitOffset = <T>(data: Array<T>, paginated: IPage): Array<T> =>
  data.slice(paginated.offset, paginated.page * paginated.limit);
