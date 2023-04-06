import { MySQL, MySQLSession } from '../../clients';
import { DbError, dbErrors } from '../../errors';
import { Group, ORDER, Sort } from '../../filter';
import { FilterCriteria } from '../../filter/Filter';
import { IOffsetPagination, IPaginatedSet, calculateLimit, resultSet } from '../../pagination';
import { IDocumentSchema, IDocument } from '../../types';
import { generateVarName } from '../../utils';

/**
 * @class CRUD MySQL
 */
export class CRUDMySQL<S extends string> {
  protected db: MySQL;

  protected schema: IDocumentSchema<S>;

  private id: S;

  /**
   * A base controller for a documents collection
   * @param {MySQL} db Database instance
   * @param {IDocumentSchema<S>} schema A schema of a collection
   */
  constructor(db: MySQL, schema: IDocumentSchema<S>) {
    this.db = db;
    this.schema = schema;
    this.id = this.schema.id || ('_id' as S);
  }

  /**
   * Not implemented
   * @param {Object} session Current session with opened connection
   */
  async init(session: MySQLSession): Promise<void> {
    // Not implemented
  }

  toString(document?: IDocument<S>): string {
    if (!document) return '';
    return this.schema.toString ? this.schema.toString(document) : document[this.id];
  }

  private documentToDb(values: Partial<IDocument<S>>, exclude?: Array<string>): { [key: string]: any } {
    const newDoc: { [key: string]: any } = {};
    Object.entries(values).forEach(([key, value]) => {
      if (exclude && exclude.includes(key)) return;

      if (value === null || value === undefined) {
        newDoc[key] = null;
      } else if (Array.isArray(value)) {
        newDoc[key] = JSON.stringify(value);
      } else if (typeof value === 'object') {
        newDoc[key] = JSON.stringify(value);
      } else {
        newDoc[key] = value;
      }
    });
    return newDoc;
  }

  /**
   * Create a document
   * @param {Object} session Current session with opened connection
   * @param {Partial<IDocument<S>>} values
   */
  async createDocument(session: MySQLSession, values: Partial<IDocument<S>>): Promise<IDocument<S>> {
    const newDoc = this.documentToDb(this.schema.getDocument(values));

    const collection = this.db.getCollection(session, this.schema);
    await collection.insert(newDoc);
    return this.getDocument(session, newDoc[this.id]);
  }

  /**
   * Create a document
   * @param {Object} session Current session with opened connection
   * @param {Partial<IDocument<S>>} values
   */
  async createDocumentInNotExists(session: MySQLSession, values: Partial<IDocument<S>>): Promise<IDocument<S>> {
    const newDoc = this.documentToDb(this.schema.getDocument(values));

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

    const collection = this.db.getCollection(session, this.schema);
    await collection.insert(newDoc);
    return this.getDocument(session, newDoc[this.id]);
  }

  /**
   * Update a document
   * @param {Object} session Current session with opened connection
   * @param {string} id
   * @param {Partial<IDocument<S>>} values
   */
  async updateDocument(session: MySQLSession, id: string, values: Partial<IDocument<S>>): Promise<IDocument<S>> {
    const newDoc = this.documentToDb(values, [this.id]);

    const collection = this.db.getCollection(session, this.schema);
    await collection
      .where({ [this.id]: id })
      .forUpdate()
      .noWait()
      .update(newDoc);

    return this.getDocument(session, id);
  }

  /**
   * Delete a document.
   *
   * Throws `errorNothingWasDeleted` if document with specified id was not deleted, because document does not exist.
   * @param {Object} session Current session with opened connection
   * @param {string} id
   */
  async deleteDocument(session: MySQLSession, id: string): Promise<string> {
    const collection = this.db.getCollection(session, this.schema);
    const affectedItemsCount = await collection.where(this.id, id).del();
    if (affectedItemsCount < 1) {
      throw new DbError(dbErrors.errorNothingWasDeleted());
    }
    return id;
  }

  /**
   * Delete all documents or documents by filter.
   *
   * @param {Object} session Current session with opened connection
   * @param {Object} [filter] SQL WHERE statement and variables binding for the statement
   */
  async deleteAll(session: MySQLSession, filter?: FilterCriteria): Promise<void> {
    const collection = this.db.getCollection(session, this.schema);

    if (filter) {
      const { statement, variables } = filter;
      await collection.whereRaw(statement, variables).del();
    } else {
      await collection.whereRaw('1=1').del();
    }
  }

  /**
   * Get a document.
   *
   * Throws `errorNoIdProvided` if document id is empty.
   * Throws `errorDocumentNotFound` if document with specified id does not exist.
   * @param {Object} session Current session with opened connection
   * @param {string} id
   */
  async getDocument(session: MySQLSession, id: string): Promise<IDocument<S>> {
    if (id === null || id === undefined) {
      throw new DbError(dbErrors.errorNoIdProvided());
    }
    const collection = this.db.getCollection(session, this.schema);
    const doc = await collection.first('*').where(this.id, id);
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
    session: MySQLSession,
    props: Partial<IDocument<S>>,
    join: 'OR' | 'AND' = 'AND',
  ): Promise<IDocument<S>> {
    if (!props) {
      throw new DbError(dbErrors.errorNoCriteriaProvided());
    }
    const bindings = this.getBindings(props);
    const statement = this.getWhereRawStatement(props, join);

    const collection = this.db.getCollection(session, this.schema);
    const doc = await collection.first('*').whereRaw(statement, bindings);
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
    session: MySQLSession,
    pagination?: IOffsetPagination,
    sort?: Sort,
  ): Promise<IPaginatedSet<IDocument<S>>> {
    const collection = this.db.getCollection(session, this.schema);
    const paginated = calculateLimit(pagination);
    const docs = await collection
      .select('*')
      .orderByRaw(this.getSortRawStatement(sort))
      .offset(paginated.offset)
      .limit(paginated.limit);
    const total = await this.getTotal(session);
    return resultSet(docs, paginated, total);
  }

  private quote(name: string): string {
    return `${'`'}${name}${'`'}`;
  }

  /**
   * Returns array of sorting statement.
   * Sorting applies in array's order
   * @param [sort] contains sorting
   */
  private getSortCriteria(sort?: Sort): Array<string> {
    return sort
      ? sort.map(({ field, order }) => `${this.quote(field)} ${order === ORDER.ASC ? ORDER.ASC : ORDER.DESC}`)
      : [`${this.quote(this.id)} ${ORDER.ASC}`];
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
   * Returns Case Insensitive SQL `LIKE` statement for QB query
   * @param {String} prop The name of document field to make a search by
   * @param {String} [variable] The value to limit a search by the specified field
   * @param ci False - a case-sensitive comparison, True - to be case-insensitive comparison
   */
  getSearchCriteria(prop: string, variable?: string, ci = true): string {
    return ci
      ? `${this.quote(prop)} COLLATE ${this.db.ciCollation} LIKE :${variable || prop}`
      : `${this.quote(prop)} LIKE @${variable || prop}`;
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
      .map((name) => `${this.quote(name)} = :${name}`)
      .join(` ${join} `);
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
    session: MySQLSession,
    criteria: string,
    props: { [key: string]: unknown },
    pagination?: IOffsetPagination,
    sort?: Sort,
  ): Promise<IPaginatedSet<IDocument<S>>> {
    if (!props) {
      throw new DbError(dbErrors.errorNoCriteriaProvided());
    }
    const paginated = calculateLimit(pagination);
    const bindings = this.getBindings(props);

    const query = this.db.getCollection(session, this.schema).select('*').whereRaw(criteria, bindings);
    if (sort) {
      query.orderByRaw(this.getSortRawStatement(sort));
    }
    const docs = await query.offset(paginated.offset).limit(paginated.limit);
    const { total } = await this.db
      .getCollection(session, this.schema)
      .whereRaw(criteria, bindings)
      .first()
      .count(this.id, { as: 'total' });
    return resultSet(docs, paginated, total);
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
   * @param {Object} [sort] contains sorting
   */
  async searchDocuments(
    session: MySQLSession,
    props: Partial<IDocument<S>>,
    join: 'OR' | 'AND' = 'AND',
    pagination?: IOffsetPagination,
    sort?: Sort,
  ): Promise<IPaginatedSet<IDocument<S>>> {
    if (!props) {
      throw new DbError(dbErrors.errorNoCriteriaProvided());
    }
    const criteria = this.getSearchRawStatement(props, join, true);
    return this.searchDocumentsByCriteria(session, criteria, props, pagination, sort);
  }
  /**
   * Add GROUP BY clause (set the grouping options of the result set).
   *
   * @param {Object} session Current session with opened connection
   * @param {Object} groupBy contains grouping parameters
   */
  async groupByDocuments<T extends string>(session: MySQLSession, groupBy: Group<S, T>): Promise<Array<IDocument<T>>> {
    const selects: Array<string> = [];
    const aggs: Array<string> = [];
    const groups: Array<string> = [];
    groupBy.forEach(({ alias, field, aggregate }) => {
      if (aggregate) {
        aggs.push(`${aggregate}(${field}) as ${alias || field}`);
      } else {
        selects.push(`${field} as ${alias || field}`);
        groups.push(field);
      }
    });
    const collection = this.db.getCollection(session, this.schema);
    const docs = await collection.select(selects.join(','), session.raw(aggs.join(', '))).groupByRaw(groups.join(', '));
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
    session: MySQLSession,
    filter: FilterCriteria,
    pagination?: IOffsetPagination,
    sort?: Sort,
  ): Promise<IPaginatedSet<IDocument<S>>> {
    const { statement, variables } = filter;
    const paginated = calculateLimit(pagination);
    const query = this.db.getCollection(session, this.schema).select('*').whereRaw(statement, variables);
    if (sort) {
      query.orderByRaw(this.getSortRawStatement(sort));
    }
    const docs = await query.offset(paginated.offset).limit(paginated.limit);
    const { total } = await this.db
      .getCollection(session, this.schema)
      .whereRaw(statement, variables)
      .first()
      .count(this.id, { as: 'total' });
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
    session: MySQLSession,
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
    session: MySQLSession,
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
   * @param {Object} [filter] props - the collection of bindings for the filter statement, join - compare operation. Default 'AND'
   * @param {Object} [filterCriteria] SQL WHERE statement and variables binding for the statement
   */
  async fetchAll(
    session: MySQLSession,
    sort?: Sort,
    filter?: { props: Partial<IDocument<S>>; join: 'OR' | 'AND' },
    filterCriteria?: FilterCriteria,
  ): Promise<Array<IDocument<S>>> {
    const query = this.db.getCollection(session, this.schema);
    if (filter) {
      const statement = this.getWhereRawStatement(filter.props, filter.join);
      const bindings = this.getBindings(filter.props);
      query.whereRaw(statement, bindings);
    } else if (filterCriteria) {
      query.whereRaw(filterCriteria.statement, filterCriteria.variables);
    }
    if (sort) {
      query.orderByRaw(this.getSortRawStatement(sort));
    }
    const docs = await query.select('*');
    return docs;
  }

  /**
   * Find documents by props. Case Insensitive. Returns undefined, if document was not found.
   *
   * Throws `errorNoCriteriaProvided` if props are empty.
   * @param {Object} session Current session with opened connection
   * @param {Object} props The collection of bindings for the filter statement.
   */
  async findDocument(session: MySQLSession, props: Partial<IDocument<S>>): Promise<IDocument<S> | undefined> {
    if (!props) {
      throw new DbError(dbErrors.errorNoCriteriaProvided());
    }
    const collection = this.db.getCollection(session, this.schema);
    const bindings = this.getBindings(props);
    const statement = this.getWhereRawStatement(props, 'AND');
    const doc = await collection.first('*').whereRaw(statement, bindings);
    return doc;
  }

  /**
   * Checks if exists a document with provided unique props values
   *
   * Throws `errorNoCriteriaProvided` if props are empty.
   * Throws `errorDuplicatedDocument` if document with provided props already exists.
   * @param {Object} session Current session with opened connection
   * @param {Object} props The collection of bindings for the filter statement.
   * @param {String} join compare operation. Default 'AND'
   * @param {Object} [filterCriteria] SQL WHERE statement and variables binding for the statement
   */
  async existsDocument(
    session: MySQLSession,
    props: Partial<IDocument<S>>,
    join: 'OR' | 'AND' = 'AND',
    filterCriteria?: FilterCriteria,
  ): Promise<void> {
    if (!props && !filterCriteria) {
      throw new DbError(dbErrors.errorNoCriteriaProvided());
    }
    const collection = this.db.getCollection(session, this.schema);
    const criteria = filterCriteria ? filterCriteria.statement : this.getWhereRawStatement(props, join);
    const bindings = filterCriteria ? filterCriteria.variables : this.getBindings(props);
    const { count } = await collection.whereRaw(criteria, bindings).first().count(this.id, { as: 'count' });
    if (count > 0) {
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
  async getCount(session: MySQLSession, props: Partial<IDocument<S>>, join: 'OR' | 'AND' = 'AND'): Promise<number> {
    if (!props) {
      throw new DbError(dbErrors.errorNoCriteriaProvided());
    }
    const statement = this.getWhereRawStatement(props, join);
    const bindings = this.getBindings(props);
    const { total } = await this.db
      .getCollection(session, this.schema)
      .whereRaw(statement, bindings)
      .first()
      .count(this.id, { as: 'total' });
    return total;
  }

  async getTotal(session: MySQLSession): Promise<number> {
    const { total } = await this.db.getCollection(session, this.schema).first().count(this.id, { as: 'total' });
    return total;
  }

  /**
   * Calling a stored procedure with parameters
   * @param session
   * @param procedureName The name of an existing procedure you need to call
   * @param {variables} the list of parameters accepted by the procedure (if it accepts any)
   */
  async callStoredProcedure<T>(session: MySQLSession, procedureName: string, variables?: Array<any>): Promise<T> {
    let params: { [key: string]: any } = {};
    if (variables) {
      params = variables.reduce((res, value) => {
        const name = `${generateVarName(5)}`;
        res[name] = value;
        return res;
      }, {});
    }
    const paramsStmt = Object.keys(params)
      .map((name) => `:${name}`)
      .join(',');
    const result = await session.raw(`CALL ${procedureName}(${paramsStmt});`, params);
    return result;
  }
}
