# crud-node

<img src="https://img.shields.io/badge/crud node-1.1.8-15ACF6?style=for-the-badge&logo=none&logoColor=white" alt="kafka version" />&nbsp;<img src="https://img.shields.io/badge/license-MIT-red?style=for-the-badge&logo=none" alt="license" />&nbsp;<img src="https://img.shields.io/badge/DEVELOPER-Suhan Tudor-purple?style=for-the-badge&logo=none" alt="developer" />

**crud-node** is an agnostic database client implementation for node js. The package is written in JavaScript, and supports TypeScript bindings.

- [example](https://github.com/suhantudor/crud-node-realworld-example)
- [documentation](https://suhantudor.gitbook.io/crud-node/)

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
- Pagination

## 📃 Available methods

- `init()`
- `toString()`
- `createDocument()`
- `updateDocument()`
- `deleteDocument()`
- `getDocument()`
- `getDocuments()`
- `existsDocument()`
- `getCount()` 🆕
- `getTotal()`

**NOTE:** `💲 You can buy _premium_ version and use it on your private project from here: [crud-node](https://selsof.com/products/crud-node-premium-jtqg_f99nox)

## ❗ Schemas

To ensure consistency of implementation across multiple databases we use [json schema](https://json-schema.org/) to valiate data types.

## 💨 Examples

> In this examples we will use MySQLX controller to show how the package works and what benefits it brings.

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

## 👽 Supported databases

- MySQL
- MySQL Document Store
- Percona MySQL
- Percona MySQL Document Store

## 🔜 Roadmap

- MongoDB _**`March 2023`**_
- PostgreSQL _**`April 2023`**_
- Cassandra _**`May 2023`**_
- OracleDB _**`June 2023`**_
- SQLite _**`July 2023`**_
- CouchDB _**`August 2023`**_

## 📝 Notes

No notes!

## ⚠️ License

MIT
