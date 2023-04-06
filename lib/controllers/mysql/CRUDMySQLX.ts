import * as mysqlx from '@mysql/xdevapi';

import { MySQLX, MySQLXSession } from '../../clients';
import { DbError, dbErrors } from '../../errors';
import { Group, ORDER, Sort } from '../../filter';
import { FilterCriteria } from '../../filter/Filter';
import { IOffsetPagination, IPaginatedSet, calculateLimit, resultSet } from '../../pagination';
import { IDocumentSchema, IDocument, getDocumentFromCursor } from '../../types';
import { generateVarName } from '../../utils';

/**
 * @class CRUD MySQL X
 */
export class CRUDMySQLX<S extends string> {
  protected db: MySQLX;

  protected schema: IDocumentSchema<S>;

  private id: S;

  /**
   * A base controller for a documents collection
   * @param {MySQLX} db Database instance
   * @param {IDocumentSchema<S>} schema A schema of a collection
   */
  constructor(db: MySQLX, schema: IDocumentSchema<S>) {
    this.db = db;
    this.schema = schema;
    this.id = this.schema.id || ('_id' as S);
  }

  toString(document?: IDocument<S>): string {
    if (!document) return 'unknown';
    return this.schema.toString ? this.schema.toString(document) : document[this.id];
  }

  /**
   * Creates a collection in the database, if collection does not exist
   * @param {Object} session Current session with opened connection
   */
  async init(session: MySQLXSession): Promise<void> {
    await this.db.createCollection(session, this.schema);
  }

  /**
   * Create a document
   * @param {Object} session Current session with opened connection
   * @param {Partial<IDocument<S>>} values
   */
  async createDocument(session: MySQLXSession, values: Partial<IDocument<S>>): Promise<IDocument<S>> {
    const newDoc = this.schema.getDocument(values);

    const collection = await this.db.getCollection(session, this.schema);

    if (this.schema.unique) {
      await Promise.all(
        this.schema.unique.map(async (uniqueIndex) => {
          const criteria = uniqueIndex.reduce((props: Partial<IDocument<S>>, prop: S): Partial<IDocument<S>> => {
            // eslint-disable-next-line no-param-reassign
            props[prop] = newDoc[prop];
            return props;
          }, {});
          await this.existsDocument(session, criteria);
        }),
      );
    }

    const result = await collection.add(newDoc).execute();

    let id = '';
    if (this.schema.generatedId) {
      [id] = result.getGeneratedIds();
    } else {
      id = newDoc[this.id];
    }
    return this.getDocument(session, id);
  }

  /**
   * Create a document if not exists
   * @param {Object} session Current session with opened connection
   * @param {Partial<IDocument<S>>} values
   */
  async createDocumentIfNotExists(session: MySQLXSession, values: Partial<IDocument<S>>): Promise<IDocument<S>> {
    const newDoc = this.schema.getDocument(values);

    const collection = await this.db.getCollection(session, this.schema);

    if (this.schema.unique) {
      for (let i = 0; i < this.schema.unique.length; i++) {
        const uniqueIndex = this.schema.unique[i];
        const criteria = uniqueIndex.reduce((props: Partial<IDocument<S>>, prop: S): Partial<IDocument<S>> => {
          // eslint-disable-next-line no-param-reassign
          props[prop] = newDoc[prop];
          return props;
        }, {});
        const existingDocument = await this.findDocument(session, criteria);
        if (existingDocument) {
          return existingDocument;
        }
      }
    }

    const result = await collection.add(newDoc).execute();

    let id = '';
    if (this.schema.generatedId) {
      [id] = result.getGeneratedIds();
    } else {
      id = newDoc[this.id];
    }
    return this.getDocument(session, id);
  }

  /**
   * Update a document
   * @param {Object} session Current session with opened connection
   * @param {string} id
   * @param {Partial<IDocument<S>>} values
   */
  async updateDocument(session: MySQLXSession, id: string, values: Partial<IDocument<S>>): Promise<IDocument<S>> {
    const initialDoc = await this.getDocument(session, id);
    const newDoc = this.schema.getDocument ? this.schema.getDocument({ ...initialDoc, ...values }) : values;

    const collection = await this.db.getCollection(session, this.schema);
    await collection.modify(`${this.id} = :id`).bind({ id }).patch(newDoc).execute();

    return this.getDocument(session, id);
  }

  /**
   * Delete a document.
   *
   * Throws `errorNothingWasDeleted` if document with specified id was not deleted, because document does not exist.
   * @param {Object} session Current session with opened connection
   * @param {string} id
   */
  async deleteDocument(session: MySQLXSession, id: string): Promise<string> {
    const collection = await this.db.getCollection(session, this.schema);
    const result = await collection.remove(`${this.id} = :id`).bind({ id }).execute();
    if (result.getAffectedItemsCount() < 1) {
      throw new DbError(dbErrors.errorNothingWasDeleted());
    }
    return id;
  }

  /**
   * Delete all documents.
   *
   * @param {Object} session Current session with opened connection
   */
  async deleteAll(session: MySQLXSession): Promise<void> {
    const collection = await this.db.getCollection(session, this.schema);
    await collection.remove('true').execute();
  }

  /**
   * Get a document.
   *
   * Throws `errorNoIdProvided` if document id is empty.
   * Throws `errorDocumentNotFound` if document with specified id does not exist.
   * @param {Object} session Current session with opened connection
   * @param {string} id
   */
  async getDocument(session: MySQLXSession, id: string): Promise<IDocument<S>> {
    if (id === null || id === undefined) {
      throw new DbError(dbErrors.errorNoIdProvided());
    }
    const collection = await this.db.getCollection(session, this.schema);
    const cursor = await collection.find(`${this.id} = :id`).bind({ id }).execute();
    const doc = await cursor.fetchOne();
    if (!doc) {
      throw new DbError(dbErrors.errorDocumentNotFound());
    }
    return doc;
  }

  /**
   * Get a document by criteria.
   *
   * Throws `errorNoCriteriaProvided` if props are empty.
   * Throws `errorDocumentNotFound` if document with specified id does not exist.
   * @param {Object} session Current session with opened connection
   * @param {string} id
   */
  async getDocumentByCriteria(
    session: MySQLXSession,
    props: Partial<IDocument<S>>,
    join: 'OR' | 'AND' = 'AND',
  ): Promise<IDocument<S>> {
    if (!props) {
      throw new DbError(dbErrors.errorNoCriteriaProvided());
    }
    const statement = this.getWhereRawStatement(props, join);
    const collection = await this.db.getCollection(session, this.schema);
    const cursor = await collection.find(statement).bind(props).execute();
    const doc = await cursor.fetchOne();
    if (!doc) {
      throw new DbError(dbErrors.errorDocumentNotFound());
    }
    return doc;
  }

  /**
   * Get documents from a collection without filtering.
   * Applies pagination to the result set or uses `DEFAULT_PAGE_SIZE` to limit the result set.
   * @param {Object} session Current session with opened connection
   * @param {Object} [pagination] contains meta data for pagination
   * @param {Object} [sort] contains sorting
   */
  async getDocuments(
    session: MySQLXSession,
    pagination?: IOffsetPagination,
    sort?: Sort,
  ): Promise<IPaginatedSet<IDocument<S>>> {
    const collection = await this.db.getCollection(session, this.schema);
    const paginated = calculateLimit(pagination);
    const cursorSort = await collection.find().sort(this.getSortCriteria(sort));
    const cursorLimit = await cursorSort.limit(paginated.limit, paginated.offset).execute();
    const docs = await cursorLimit.fetchAll();
    const cursorAll = await collection.find().execute();
    const total = cursorAll.toArray().length;
    return resultSet(docs, paginated, total);
  }

  /**
   * Returns Case Insensitive SQL `LIKE` statement for QB query
   * @param {String} prop The name of document field to make a search by
   * @param {String} [variable] The value to limit a search by the specified field
   * @param ci False - a case-sensitive comparison, True - to be case-insensitive comparison
   */
  getSearchCriteria(prop: string, variable?: string, ci = true): string {
    return ci
      ? `JSON_EXTRACT(doc, "$.${prop}") COLLATE ${this.db.ciCollation} LIKE @${variable || prop}`
      : `JSON_EXTRACT(doc, "$.${prop}") LIKE @${variable || prop}`;
  }

  /**
   * Returns Case Insensitive/Case Sensitive SQL `LIKE` statement for query join by OR | AND operators.
   * @param {Object} props The collection of bindings for the WHERE statement.
   * @param {String} join compare operation. Default 'AND'
   * @param {Boolean} ci False - a case-sensitive comparison, True - to be case-insensitive comparison
   */
  private getSearchRawStatement(props: Partial<IDocument<S>>, join: 'OR' | 'AND', ci: boolean): string {
    return Object.keys(props)
      .map((prop: string) => this.getSearchCriteria(prop, prop, ci))
      .join(` ${join} `);
  }

  /**
   * Returns SQL Where statement for query join equal to statements by OR | AND operators.
   * @param {Object} props The collection of bindings for the WHERE statement.
   * @param {String} join compare operation. Default 'AND'
   */
  private getWhereRawStatement(props: { [key: string]: unknown }, join: 'OR' | 'AND'): string {
    return Object.keys(props)
      .map((name) => `${name} = :${name}`)
      .join(` ${join} `);
  }

  /**
   * Returns array of sorting statement.
   * Sorting applies in array's order
   * @param [sort] contains sorting
   */
  private getSortCriteria(sort?: Sort): Array<string> {
    return sort
      ? sort.map(({ field, order }) => `${field} ${order === ORDER.ASC ? ORDER.ASC : ORDER.DESC}`)
      : [`${this.id} ${ORDER.ASC}`];
  }

  /**
   * Returns string of sorting statement.
   * @param [sort] contains sorting
   */
  private getSortRawStatement(sort?: Sort): string {
    const sortBy = this.getSortCriteria(sort);
    return sortBy.join(', ');
  }

  /**
   * Converts binding to acceptable DB values, replacing undefined with null values.
   * @param {Object} props The collection of bindings.
   */
  private getBindings(props: { [key: string]: unknown }): { [key: string]: any } {
    const bindings = Object.entries(props).reduce((res: { [key: string]: any }, [key, value]) => {
      res[key] = value === undefined ? null : value;
      return res;
    }, {});
    return bindings;
  }

  /**
   * Search documents by SQL `WHERE` statement. Case Insensitive.
   * Makes text search by document.
   * Uses default collation of the database.
   *
   * Throws `errorNoCriteriaProvided` if props are empty.
   * @param {Object} session Current session with opened connection
   * @param {String} criteria SQL WHERE statement.
   * @param {Object} props The collection of bindings for the WHERE statement. Contains values by names of variables, used for the where statement.
   * @param {Object} [pagination] contains meta data for pagination
   * @param {Object} [sort] contains sorting
   */
  async searchDocumentsByCriteria(
    session: MySQLXSession,
    criteria: string,
    props: { [key: string]: unknown },
    pagination?: IOffsetPagination,
    sort?: Sort,
  ): Promise<IPaginatedSet<IDocument<S>>> {
    if (!props) {
      throw new DbError(dbErrors.errorNoCriteriaProvided());
    }
    const paginated = calculateLimit(pagination);
    const selectStmt =
      this.schema.validation && this.schema.validation.schema.properties
        ? Object.keys(this.schema.validation.schema.properties)
            .map((property: string) => `JSON_EXTRACT(doc, "$.${property}") as ${property}`)
            .join(', ')
        : '*';
    const limitStmt = `LIMIT ${paginated.limit} OFFSET ${paginated.offset}`;
    const sortStmt = sort ? `ORDER BY ${this.getSortRawStatement(sort)}` : '';
    const cmdAll = `SELECT ${selectStmt} FROM ${this.schema.name} WHERE ${criteria} ${sortStmt}`;
    const cmd = `${cmdAll} ${limitStmt}`;
    await Promise.all(
      Object.entries(props).map(async ([prop, value]) => {
        await session.sql(`SET @${prop} = ?;`).bind(value).execute();
      }),
    );
    const cursor = await session.sql(cmd).execute();
    const docs = await this.getResultSet(cursor);
    const cursorAll = await session.sql(cmdAll).execute();
    const [total] = cursorAll.toArray();
    return resultSet(docs, paginated, total.length);
  }

  /**
   * Search documents by prop and pattern. Case Insensitive.
   * Makes text search by document.
   * Uses default collation of the database.
   *
   * Throws `errorNoCriteriaProvided` if props are empty.
   * @param {Object} session Current session with opened connection
   * @param {Object} props The collection of bindings for the WHERE statement.
   * @param {String} join compare operation. Default 'AND'
   * @param {Object} [pagination] contains meta data for pagination
   */
  async searchDocuments(
    session: MySQLXSession,
    props: Partial<IDocument<S>>,
    join: 'OR' | 'AND' = 'AND',
    pagination?: IOffsetPagination,
  ): Promise<IPaginatedSet<IDocument<S>>> {
    if (!props) {
      throw new DbError(dbErrors.errorNoCriteriaProvided());
    }
    const criteria = this.getSearchRawStatement(props, join, true);
    return this.searchDocumentsByCriteria(session, criteria, props, pagination);
  }
  /**
   * Add GROUP BY clause (set the grouping options of the result set).
   *
   * @param {Object} session Current session with opened connection
   * @param {Object} groupBy contains grouping parameters
   */
  async groupByDocuments<T extends string>(session: MySQLXSession, groupBy: Group<S, T>): Promise<Array<IDocument<T>>> {
    const selectStmt = groupBy
      .map(
        ({ alias, field, aggregate }) =>
          `${aggregate ? `${aggregate}(${`JSON_EXTRACT(doc, "$.${field}")`})` : `JSON_EXTRACT(doc, "$.${field}")`} as ${
            alias || field
          }`,
      )
      .join(', ');
    const groupByStmt = groupBy
      .filter(({ aggregate }) => !aggregate)
      .map(({ field }) => `JSON_EXTRACT(doc, "$.${field}")`);
    const props = groupBy.map(({ alias }) => alias);
    const cmd = `SELECT ${selectStmt} FROM ${this.schema.name} GROUP BY ${groupByStmt}`;

    const cursor = await session.sql(cmd).execute();
    const docs = await this.getResultSetCustom<T>(cursor, props);
    return docs;
  }

  /**
   * Filter documents by SQL WHERE statement. Case Sensitive.
   *
   * Throws `errorNoCriteriaProvided` if props are empty.
   * @param {Object} session Current session with opened connection
   * @param {Object} filter SQL WHERE statement and variables binding for the statement
   * @param {Object} [pagination] contains meta data for pagination
   * @param {Object} [sort] contains sorting
   */
  async filterDocumentsByCriteria(
    session: MySQLXSession,
    filter: FilterCriteria,
    pagination?: IOffsetPagination,
    sort?: Sort,
  ): Promise<IPaginatedSet<IDocument<S>>> {
    const { statement, variables } = filter;
    const collection = await this.db.getCollection(session, this.schema);
    const paginated = calculateLimit(pagination);
    const cursorSort = await collection.find(statement || undefined).sort(this.getSortCriteria(sort));
    const cursorLimit = await cursorSort.limit(paginated.limit, paginated.offset).bind(variables).execute();
    const docs = await cursorLimit.fetchAll();
    const cursorAll = await collection
      .find(statement || undefined)
      .bind(variables)
      .execute();
    const total = cursorAll.toArray().length;
    return resultSet(docs, paginated, total);
  }

  /**
   * Filter documents by props. Case Sensitive.
   *
   * Throws `errorNoCriteriaProvided` if props are empty.
   * @param {Object} session Current session with opened connection
   * @param {Object} props The collection of bindings for the filter statement.
   * @param {String} join compare operation. Default 'AND'
   * @param {Object} [pagination] contains meta data for pagination
   * @param {Object} [sort] contains sorting
   */
  async filterDocuments(
    session: MySQLXSession,
    props: Partial<IDocument<S>>,
    join: 'OR' | 'AND' = 'AND',
    pagination?: IOffsetPagination,
    sort?: Sort,
  ): Promise<IPaginatedSet<IDocument<S>>> {
    if (!props) {
      throw new DbError(dbErrors.errorNoCriteriaProvided());
    }
    const statement = this.getWhereRawStatement(props, join);
    return this.filterDocumentsByCriteria(session, { statement, variables: props }, pagination, sort);
  }

  /**
   * Filter documents by ids. Case Insensitive.
   *
   * Throws `errorNoCriteriaProvided` if props are empty.
   * @param {Object} session Current session with opened connection
   * @param {Array} ids The array of documents ids for the filter statement.
   * @param {Object} [pagination] contains meta data for pagination
   * @param {Object} [sort] contains sorting
   * @param {Object} [filter] SQL WHERE statement and variables binding for the statement
   */
  async filterDocumentsByIds(
    session: MySQLXSession,
    ids: Array<string>,
    pagination?: IOffsetPagination,
    sort?: Sort,
    filter?: FilterCriteria,
  ): Promise<IPaginatedSet<IDocument<S>>> {
    if (!ids) {
      throw new DbError(dbErrors.errorNoCriteriaProvided());
    }
    if (ids.length === 0) {
      const paginated = calculateLimit(pagination);
      return resultSet([], paginated, 0);
    }
    const criteria: string[] = [];
    const props: { [key: string]: unknown } = {};
    ids.forEach((id: string, i: number) => {
      const varName = `${this.id}${i}`;
      criteria.push(`${this.id} = :${varName}`);
      props[varName] = id;
    });
    const filterIds = criteria.join(' OR ');

    if (filter && filter.statement) {
      return this.filterDocumentsByCriteria(
        session,
        { statement: `(${filterIds}) AND ${filter.statement}`, variables: { ...props, ...filter.variables } },
        pagination,
        sort,
      );
    }

    return this.filterDocumentsByCriteria(session, { statement: filterIds, variables: props }, pagination, sort);
  }

  /**
   * Fetch document filtered by statement
   * @param {Object} session Current session with opened connection
   * @param {Object} [sort] contains sorting
   * @param {Object} [filter] SQL WHERE statement and variables binding for the statement
   */
  async fetchAll(
    session: MySQLXSession,
    sort?: Sort,
    filter?: { props: Partial<IDocument<S>>; join: 'OR' | 'AND' },
  ): Promise<Array<IDocument<S>>> {
    const pagination: IOffsetPagination = {
      page: 1,
      pageSize: 100,
    };
    let result: Array<IDocument<S>> = [];
    let page = 1;
    let totalPages = 1;
    do {
      let data: IPaginatedSet<IDocument<S>>;
      if (filter) {
        data = await this.filterDocuments(session, filter.props, filter.join, pagination, sort);
      } else {
        data = await this.getDocuments(session, pagination, sort);
      }
      totalPages = data.totalPages;
      page = page + 1;
      result = [...result, ...data.data];
    } while (page <= totalPages);
    return result;
  }

  /**
   * Find documents by props. Case Insensitive. Returns undefined, if document was not found.
   *
   * Throws `errorNoCriteriaProvided` if props are empty.
   * @param {Object} session Current session with opened connection
   * @param {Object} props The collection of bindings for the filter statement.
   */
  async findDocument(session: MySQLXSession, props: Partial<IDocument<S>>): Promise<IDocument<S> | undefined> {
    if (!props) {
      throw new DbError(dbErrors.errorNoCriteriaProvided());
    }
    const collection = await this.db.getCollection(session, this.schema);
    const values = this.getBindings(props);
    const criteria = Object.keys(props)
      .map((name) => `${name} = :${name}`)
      .join(' AND ');
    const cursor = await collection.find(criteria).bind(values).execute();
    const doc = await cursor.fetchOne();
    return doc;
  }

  /**
   * Checks if exists a document with provided unique props values
   *
   * Throws `errorNoCriteriaProvided` if props are empty.
   * Throws `errorDuplicatedDocument` if document with provided props already exists.
   * @param {Object} session Current session with opened connection
   * @param {Object} props The collection of bindings for the filter statement.
   */
  async existsDocument(session: MySQLXSession, props: Partial<IDocument<S>>): Promise<void> {
    if (!props) {
      throw new DbError(dbErrors.errorNoCriteriaProvided());
    }
    const collection = await this.db.getCollection(session, this.schema);
    const criteria = this.getWhereRawStatement(props, 'AND');
    const cursor = await collection.find(criteria).bind(props).execute();
    const doc = await cursor.fetchOne();
    if (doc) {
      throw new DbError(dbErrors.errorDuplicatedDocument());
    }
  }

  /**
   * Get documents count fit to filter. Case Sensitive.
   *
   * Throws `errorNoCriteriaProvided` if props are empty.
   * @param {Object} session Current session with opened connection
   * @param {Object} props The collection of bindings for the filter statement.
   * @param {String} join compare operation. Default 'AND'
   */
  async getCount(session: MySQLXSession, props: Partial<IDocument<S>>, join: 'OR' | 'AND' = 'AND'): Promise<number> {
    if (!props) {
      throw new DbError(dbErrors.errorNoCriteriaProvided());
    }
    const statement = this.getWhereRawStatement(props, join);
    const collection = await this.db.getCollection(session, this.schema);
    const cursorAll = await collection.find(statement).bind(props).execute();
    const total = cursorAll.toArray().length;
    return total;
  }

  async getTotal(session: MySQLXSession): Promise<number> {
    const collection = await this.db.getCollection(session, this.schema);
    const cursorAll = await collection.find().execute();
    const total = cursorAll.toArray().length;
    return total;
  }

  /**
   * Converts fetch results to array of documents
   * @param {mysqlx.SqlResult} cursor
   */
  private async getResultSetCustom<T extends string>(
    cursor: mysqlx.SqlResult,
    props: Array<T>,
  ): Promise<IDocument<T>[]> {
    if (!cursor.hasData()) {
      return [];
    }
    const records = await cursor.fetchAll();
    return records.map((record: mysqlx.Row): IDocument<T> => getDocumentFromCursor<T>(props, record));
  }

  /**
   * Converts fetch results to array of documents
   * @param {mysqlx.SqlResult} cursor
   */
  private async getResultSet(cursor: mysqlx.SqlResult): Promise<IDocument<S>[]> {
    if (!cursor.hasData()) {
      return [];
    }
    const columns: Array<mysqlx.Column> = cursor.getColumns();
    const props: Array<S> = columns.reduce((obj: Array<S>, column: mysqlx.Column): Array<S> => {
      const name = column.getColumnLabel();
      if (
        this.schema.validation &&
        Object.prototype.hasOwnProperty.call(this.schema.validation.schema.properties, name)
      ) {
        obj.push(name as S);
      }
      return obj;
    }, []);
    return this.getResultSetCustom(cursor, props);
  }

  /**
   * Calling a stored procedure with parameters
   * @param session
   * @param procedureName The name of an existing procedure you need to call
   * @param {variables} the list of parameters accepted by the procedure (if it accepts any)
   */
  async callStoredProcedure<T>(session: MySQLXSession, procedureName: string, variables?: Array<any>): Promise<T> {
    const params: Array<string> = [];
    if (variables) {
      await Promise.all(
        variables.map(async (value) => {
          const name = `@${generateVarName(5)}`;
          params.push(name);
          await session.sql(`SET ${name} = ?;`).bind(value).execute();
        }),
      );
    }
    const paramsStmt = variables ? `(${params.join(', ')})` : '';
    const result = await session.sql(`CALL ${procedureName}${paramsStmt};`).execute();
    return result;
  }
}
