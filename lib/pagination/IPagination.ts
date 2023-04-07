export interface IPage {
  /** currentPage to get, defaults to 1 */
  page: number;
  /** maximum number of items to return for the current page, defaults to 50 */
  limit: number;
  /** the number of items to skip */
  offset: number;
}

export interface IPaginatedSet<T> {
  /** array of items to paginate */
  data: Array<T>;
  /** currentPage to get, defaults to 1 */
  page: number;
  /** maximum number of items to return for the current page, defaults to 50 */
  pageSize: number;
  /** total count of items */
  total: number;
  /** total amount of pages */
  totalPages: number;
}
