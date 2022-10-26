import { MySQLX, MySQLXSession } from '../../clients';
import { DbError, dbErrors } from '../../errors';
import { ORDER, Sort } from '../../filter';
import { IOffsetPagination, IPaginatedSet, calculateLimit, resultSet } from '../../pagination';
import { IDocumentSchema, IDocument } from '../../types';

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
}
