---
description: >-
  crud-node is an agnostic database client for Nodejs that allows you to perform
  CRUD operations to a database or multiple databases.
---

# ⚡ Overview

**Motivation**

Out of the box, database clients such as [pg](https://www.npmjs.com/package/pg), [mysql](https://www.npmjs.com/package/mysql2), [knex, ](http://knexjs.org/)and more **do not** come with an opinionated way of querying or mutating data from your database so developers end up building their own ways of performing CRUD operations.

This usually means that most of the time developer has to build himself the logic for querying a database and also make the implementation reusable across the entire system.

Crud Node is hands down one of the _best_ packages for managing CRUD operations to a database. It works amazingly well **out-of-the-box, with zero-config, and can be extended** to your liking as your application grows.

Crud Node allows you to defeat and overcome the tricky challenges and hurdles of querying a database and controlling your app data before it starts to control you.

**Enough talk, show me some code!**

1. **Config MySQLX**

```javascript
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

2\. **Controller** _(!optional)_

{% hint style="info" %}
_You can use a controller to organize better your application and to easily import/export anywhere you need._
{% endhint %}

```javascript
// employeeController.{ts|js}
import { MySQLX, CRUDMySQLX, IAppWithDatabase } from 'crud-node';
import { employeeSchema, EmployeeProps } from './schemas/employee';

export class EmployeeController extends CRUDMySQLX<EmployeeProps> {
  constructor(app: IAppWithDatabase<MySQLX>) {
    super(app.db, employeeSchema);
  }
}

// This can be placed in a middleware that will leave all the controllers or can be called inside a route where you have access to app object.
export const employeeController = new EmployeeController(app);
```

2\. **Create record**

```javascript
// employeeRouter.{ts|js}
import { employeeController } from './employeeController';
import { CRUDMySQLX } from 'crud-node';
import { employeeSchema } from './schemas/employee';

// Executes operations in a single transaction
const transacted = true;
const employeeController = new CRUDMySQLX(db, employeeSchema);

await db.usingSession(async (session) => {
  const payload = {
    email: 'leslie46@24mailin.com',
    firstName: 'Leslie',
    lastName: 'Brett',
  };
  const data = await employeeController.createDocument(session, payload);
}, transacted);
```

_Congratulations! You successfully created a record in the database._
