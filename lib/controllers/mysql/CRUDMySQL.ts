import { MySQL, MySQLSession } from '../../clients';
import { DbError, dbErrors } from '../../errors';
import { ORDER, Sort } from '../../filter';
import { IOffsetPagination, IPaginatedSet, calculateLimit, resultSet } from '../../pagination';
import { IDocumentSchema, IDocument } from '../../types';

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
    if (!document) return 'unknown';
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
   * Checks if exists a document with provided unique props values
   *
   * Throws `errorNoCriteriaProvided` if props are empty.
   * Throws `errorDuplicatedDocument` if document with provided props already exists.
   * @param {Object} session Current session with opened connection
   * @param {Object} props The collection of bindings for the filter statement.
   */
  async existsDocument(session: MySQLSession, props: Partial<IDocument<S>>): Promise<void> {
    if (!props) {
      throw new DbError(dbErrors.errorNoCriteriaProvided());
    }
    const collection = this.db.getCollection(session, this.schema);
    const bindings = this.getBindings(props);
    const criteria = this.getWhereRawStatement(props, 'AND');

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
}
