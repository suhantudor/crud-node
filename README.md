# crud-node-client

<img src="https://img.shields.io/badge/crud node-1.0.0-15ACF6?style=for-the-badge&logo=none&logoColor=white" alt="kafka version" />&nbsp;<img src="https://img.shields.io/badge/license-MIT-red?style=for-the-badge&logo=none" alt="license" />&nbsp;<img src="https://img.shields.io/badge/DEVELOPER-Suhan Tudor-purple?style=for-the-badge&logo=none" alt="developer" />

**crud-node-client** is an agnostic database client implementation for node js. The package is written in JavaScript, and supports TypeScript bindings.

## ⚡️ Installation

Install crud-node-client package running the following command:

```
npm install crud-node-client
```

OR

```
yarn add crud-node-client
```

## 👀 Features

- CRUD
- Filtering
- Sorting
- Grouping
- Pagination

> All examples are applicable for any database that we support.

## 📃 Available methods

- `[FREE]` `init()`
- `[FREE]` `toString()`
- `[FREE]` `createDocument()`
- `[FREE]` `updateDocument()`
- `[FREE]` `deleteDocument()`
- `[FREE]` `getDocument()`
- `[FREE]` `getDocuments()`
- `[FREE]` `existsDocument()`
- `[FREE]` `getTotal()`
- `[PREMIUM]` _**`createDocumentIfNotExists()`**_
- `[PREMIUM]` _**`deleteAll()`**_
- `[PREMIUM]` _**`getDocumentByCriteria()`**_
- `[PREMIUM]` _**`getSearchCriteria()`**_
- `[PREMIUM]` _**`searchDocumentsByCriteria()`**_
- `[PREMIUM]` _**`searchDocuments()`**_
- `[PREMIUM]` _**`groupByDocuments()`**_
- `[PREMIUM]` _**`filterDocumentsByCriteria()`**_
- `[PREMIUM]` _**`filterDocuments()`**_
- `[PREMIUM]` _**`filterDocumentsByIds()`**_
- `[PREMIUM]` _**`findDocument()`**_
- `[PREMIUM]` _**`fetchAll()`**_
- `[PREMIUM]` _**`getCount()`**_
- `[PREMIUM]` _**`callStoredProcedure()`**_

**NOTE:** `💲 [PREMIUM]` methods are available on _paid_ package. You can buy it from here and use it on your private project. [crud-node-client](https://selsof.com/products/crud-node-premium-jtqg_f99nox)

## 💨 Examples

> In this examples we will use MySQLX controller to show how the package works and what benefits it brings.

#### Connection config example for MySQL Document Store

A connection with a MySQL server can be established by creating an instance of MySQLX. The connection will be established via call connect.

```js
// config.{ts|js}
import { MySQLX } from 'crud-node-client';

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
import { MySQLX } from 'crud-node-client';
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
import { MySQLX, CRUDMySQLX, IAppWithDatabase } from 'crud-node-client';
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
import { SortBy, OffsetPagination } from 'crud-node-client';
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

- PostgreSQL _**`October 2022`**_
- MongoDB _**`November 2022`**_
- OracleDB _**`December 2022`**_
- Cassandra _**`January 2023`**_
- SQLite _**`February 2023`**_
- CouchDB _**`March 2023`**_

## 📝 Notes

No notes!

## ⚠️ License

UNLICENSED
