# crud-node

<img src="https://img.shields.io/badge/crud node-1.1.9-15ACF6?style=for-the-badge&logo=none&logoColor=white" alt="kafka version" />&nbsp;<img src="https://img.shields.io/badge/license-MIT-red?style=for-the-badge&logo=none" alt="license" />&nbsp;<img src="https://img.shields.io/badge/DEVELOPER-Suhan Tudor-purple?style=for-the-badge&logo=none" alt="developer" />

**crud-node** is an agnostic database client implementation for node js. The package is written in JavaScript, and supports TypeScript bindings.

- [example](https://github.com/suhantudor/crud-node-realworld-example)
- [documentation](https://suhantudor.gitbook.io/crud-node/)

## 🤡 Goal

The motivation behind the `crud-node` is to provide a uniform interface to perform CRUD operation for many databases such as MySQL, MySQLX, Mongo, Cassandra, etc.

## ⚡️ Installation

Install crud-node package running the following command:

```
npm install crud-node
```

OR

```
yarn add crud-node
```

## 👀 Features

- CRUD
- Sorting
- Filtering
- Grouping
- Pagination

## 📃 Available methods

- `init()`
- `toString()`
- `createDocument()`
- `createDocumentIfNotExists()` 🆕
- `updateDocument()`
- `deleteDocument()`
- `getDocument()`
- `getDocuments()`
- `getDocumentByCriteria()` 🆕
- `searchDocumentsByCriteria()` 🆕
- `searchDocuments()` 🆕
- `groupByDocuments()` 🆕
- `filterDocumentsByCriteria()` 🆕
- `filterDocuments()` 🆕
- `filterDocumentsByIds()` 🆕
- `existsDocument()`
- `findDocument()` 🆕
- `fetchAll()` 🆕
- `getCount()` 🆕
- `getTotal()`
- `deleteAll()`
- `callStoredProcedure()` 🆕

## ❗ Schemas

To ensure consistency of implementation across multiple databases we use [json schema](https://json-schema.org/) to valiate data types.

## 💨 Examples

> In this examples we will use MySQLX controller to show how the package works and what benefits it brings. For MySQL check the examples directory.

#### Connection config example for MySQL Document Store

A connection with a MySQL server can be established by creating an instance of MySQLX. The connection will be established via call connect. Check also `examples` directory.

```js
// config.{ts|js}
import { MySQLX } from 'crud-node';

// Connection configuration object
export const connection = {
  host: 'localhost',
  port: 33060,
  schema: 'db',
  password: 'user',
  user: 'user',
};

// Automated connection pool
export const pooling = {
  enabled: true,
  maxSize: 25,
  maxIdleTime: 0,
  queueTimeout: 0,
};

export const settings = {
  ciCollation: 'utf8mb4_0900_ai_ci',
};

export const db = new MySQLX(connection, { pooling }, settings);
await db.connect();
```

#### Define schema

You have to define a schema like in the example bellow for you data that you want to insert in the database.

The package use schema approach to help user understand what data will insert in database. Doesn't matter if we speak about MySQL adapter or MySQLX adapter you have to define a schema. Each adapter has is own schema definition. Check `examples` for a better understanding.

```typescript
// employeeSchema.{ts|js}
import { IDocumentSchema, IDocumentValidation, IDocument, getDocument, generateId } from 'crud-node';

export enum EmployeeProps {
  _id = '_id',
  createdAt = 'createdAt',
  email = 'email',
  lastName = 'lastName',
  firstName = 'firstName',
  responsibilities = 'responsibilities',
  officeId = 'officeId',
  fired = 'fired',
}

export const validation: IDocumentValidation<EmployeeProps> = {
  level: 'strict',
  schema: {
    type: 'object',
    description: 'Employee',
    properties: {
      _id: { type: 'string' },
      createdAt: { type: 'string', description: 'Timestamp when the record was created' },
      email: {
        type: 'string',
        description: 'The email of an employee, used as unique identifier for account registration',
      },
      lastName: { type: 'string', description: 'Last name of an employee' },
      firstName: { type: 'string', description: 'First name of an employee' },
      responsibilities: {
        type: 'array',
        items: { type: 'string' },
        uniqueItems: true,
        description: 'The responsibilities of an employee',
      },
      officeId: { type: 'string', description: 'The id of office, employee works at' },
      fired: { type: 'boolean', description: '' },
    },
    required: [EmployeeProps._id, EmployeeProps.email],
  },
};

export const employeeSchema: IDocumentSchema<EmployeeProps> = {
  name: 'employee',
  alias: 'emp',
  validation,
  generatedId: false,
  unique: [[EmployeeProps.email]],
  getDocument: (data: Partial<IDocument<EmployeeProps>>): IDocument<EmployeeProps> => {
    const createdAt = Date.now().toString();
    const defaults: Partial<IDocument<EmployeeProps>> = {
      _id: generateId(employeeSchema.alias),
      createdAt,
    };
    return getDocument(EmployeeProps, data, defaults);
  },
  toString: (data: IDocument<EmployeeProps>) => {
    return `${data.firstName} ${data.lastName}`;
  },
};
```

#### Create schema on the fly

A schema in a database can be created by using `.init()` function of a controller. If a schema already exists, it will not be recreated!

> This method is available only for `MySQL X Protocol (Document Store)`

```typescript
await db.usingSession(async (session) => {
  await employeeController.init(session);
});
```

#### Access schema

For a clean architecture, you can create a controller responsible for accessing the desired schema (table) or simply you can use it inside a route.

```typescript
// employeeRouter.{ts|js}
import { MySQLX } from 'crud-node';
import { employeeSchema } from './schemas/employee';

...

const db = new MySQLX(connection, pooling, settings);
db.connect().then(() => {
  const employeeController = new CRUDMySQLX(db, employeeSchema);
});
```

Use the power of JavaScript inheritance and extend CRUD Controller with custom logic:

```typescript
// employeeController.{ts|js}
import { MySQLX, CRUDMySQLX, IAppWithDatabase } from 'crud-node';
import { employeeSchema, EmployeeProps } from './schemas/employee';

export class EmployeeController extends CRUDMySQLX<EmployeeProps> {
  constructor(app: IAppWithDatabase<MySQLX>) {
    super(app.db, employeeSchema);
  }
}

// This can be placed in a middleware where will leave all the controllers or can be called inside a route where you have access to app object.
export const employeeController = new EmployeeController(app);
```

#### Create record with transaction

```typescript
// employeeRouter.{ts|js}
import { employeeController } from './employeeController';

// Executes operations in a single transaction
const transacted = true;

await db.usingSession(async (session) => {
  const payload = {
    email: 'leslie46@24mailin.com',
    firstName: 'Leslie',
    lastName: 'Brett',
  };
  const data = await employeeController.createDocument(session, payload);
}, transacted);
```

#### Create record, if not exists

```typescript
// employeeRouter.{ts|js}

import { employeeController } from './employeeController';

const payload = {
  email: 'leslie46@24mailin.com',
  firstName: 'Leslie',
  lastName: 'Brett',
};
const data = await employeeController.createDocumentIfNotExists(session, payload);
```

#### Update record

```typescript
// employeeRouter.{ts|js}
import { employeeController } from './employeeController';

const employeeId = '<_id>';
const payload = {
  email: 'leslie46@24mailin.com',
  firstName: 'Leslie',
  lastName: 'Brett',
};

const data = await employeeController.updateDocument(session, employeeId, payload);
```

#### Delete record

```typescript
// employeeRouter.{ts|js}
import { employeeController } from './employeeController';

const employeeId = '<_id>';

const data = await employeeController.deleteDocument(session, employeeId, payload);
```

#### Delete all records

```typescript
// employeeRouter.{ts|js}
! WARNING This deletes all rows from a table

import { employeeController } from './employeeController';

await employeeController.deleteAll(session);
```

#### Retrieve record

```typescript
// employeeRouter.{ts|js}
import { employeeController } from './employeeController';

const employeeId = '<_id>';

const data = await employeeController.getDocument(session, employeeId);
```

#### List records

```typescript
// officeRouter.{ts|js}
import { SortBy, OffsetPagination } from 'crud-node';
import { officeController } from './officeController';
import { OfficeProps } from './schemas/office';

const pagination = OffsetPagination(1, 10);
const sort = SortBy().asc(OfficeProps.places).toCriteria();

const data = await officeController.getDocuments(session, pagination, sort);
```

#### Retrieve record by criteria

```typescript
// employeeRouter.{ts|js}

import { employeeController } from './employeeController';
import { EmployeeProps } from './schemas/employee';

const officeId = '<_id>';

const data = await employeeController.getDocumentByCriteria(session, { [EmployeeProps.officeId]: officeId });
```

#### Search records by criteria (Case-insensitive)

```typescript
// officeRouter.{ts|js}

import { officeController } from './officeController';
import { OfficeProps } from './schemas/office';

const data = await officeController.searchDocumentsByCriteria(
  session,
  `${officeController.getSearchCriteria(OfficeProps.name, 'keyword1')}
      OR ${officeController.getSearchCriteria(OfficeProps.name, 'keyword2')}
      OR ${officeController.getSearchCriteria(OfficeProps.name, 'keyword3')}`,
  {
    keyword1: '%coworking%',
    keyword2: '%flexible workspace%',
    keyword3: '%serviced office space%',
  },
);
```

#### Search records (Case-insensitive)

```typescript
// officeRouter.{ts|js}

import { officeController } from './officeController';

const data = await officeController.searchDocuments(
  session,
  {
    name: '%coworking%',
    officeCode: '%coworking%',
  },
  'OR',
);
```

#### Filter records by criteria

```typescript
// officeRouter.{ts|js}

import { Condition, Filter, OffsetPagination, SortBy } from 'crud-node';
import { officeController } from './officeController';
import { OfficeProps } from './schemas/office';

const filterOfficesInNYC = Filter.toCriteria(
  Filter.and(Condition.like('address.city', '%New York%'), Condition.gre(OfficeProps.places, 1)),
);
const sortOfficesByAvailablePlaces = SortBy().asc(OfficeProps.places).toCriteria();
const pagination = OffsetPagination(1, 10);

const data = await officeController.filterDocumentsByCriteria(
  session,
  filterOfficesInNYC,
  pagination,
  sortOfficesByAvailablePlaces,
);
```

#### Group records

```typescript
// employeeRouter.{ts|js}

import { GroupBy } from 'crud-node';
import { employeeController } from './employeeController';
import { EmployeeProps } from './schemas/employee';

const data = await employeeController.groupByDocuments<'fired' | EmployeeProps.createdAt>(
  session,
  GroupBy<EmployeeProps, 'fired' | EmployeeProps.createdAt>()
    .fields(EmployeeProps.createdAt)
    .aggregate(EmployeeProps._id, 'fired', AGG.COUNT)
    .toCriteria(),
);
```

#### Filter records

```typescript
// employeeRouter.{ts|js}

import { OffsetPagination } from 'crud-node';
import { employeeController } from './employeeController';

const pagination = OffsetPagination(1, 10);

const data = await employeeController.filterDocuments(session, { fired: true }, 'AND', pagination);
```

#### Filter records by ids

```typescript
// officeRouter.{ts|js}

import { officeController } from './officeController';

const officeIds = ['<id1>', '<id2>'];

const data = await officeController.filterDocumentsByIds(session, officeIds);
```

#### Retrieve all records

```typescript
// employeeRouter.{ts|js}

import { employeeController } from './employeeController';

const data = await employeeController.fetchAll(session);
```

#### Find record

```typescript
// employeeRouter.{ts|js}

import { employeeController } from './employeeController';

const employeeId = '<_id>';

const data = await employeeController.findDocument(session, { employeeId });
```

#### Exists record

```typescript
// employeeRouter.{ts|js}
import { employeeController } from './employeeController';

const employeeId = '<_id>';

const data = await employeeController.existsDocument(session, { employeeId });
```

#### Count records by filter

```typescript
// employeeRouter.{ts|js}
import { EmployeeProps } from './schemas/employee';

const officeId = '<_id>';

const employeesByOffice = await this.employeeController.getCount(session, {
  [EmployeeProps.officeId]: officeId,
});
```

#### Retrieve total records

```typescript
// employeeRouter.{ts|js}
import { employeeController } from './employeeController';

const data = await employeeController.getTotal(session);
```

#### Call store procedure

```typescript
// employeeRouter.{ts|js}

import { employeeController } from './employeeController';

const data = await employeeController.callStoredProcedure(session, '<sp_name>', ['<parameter>']);
```

## 🔨 Issues

If you identify any errors in this module, or have an idea for an improvement, please [open an issue](https://github.com/suhantudor/crud-node/issues). We're excited to see what the community thinks of this project, and we would love your input!

## 📖 API Documentation

In addition to the above getting-started guide, we have [API documentation](https://suhantudor.gitbook.io/crud-node/).

## 👉🏻 Contributing

We welcome contributions large and small.

## 👽 Supported databases

- MySQL
- MySQL Document Store
- Percona MySQL
- Percona MySQL Document Store

## 🔜 Roadmap

- MongoDB `October 2023`
- PostgreSQL `October 2023`
- Cassandra `November 2023`
- OracleDB `November 2023`
- SQLite `December 2023`
- CouchDB `December 2023`

## 📝 Notes

No notes!

## 🔝 Used in production by

[Delimia](https://delimia.com) - On-demand courier delivery service

## ⚠️ License

MIT
