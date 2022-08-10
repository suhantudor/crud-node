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

{% tabs %}
{% tab title="MySQL" %}
**Config**&#x20;

```javascript
// config.{ts|js}
import { MySQL } from 'crud-node';

// Connection configuration object
export const connection = {
  host: 'localhost',
  port: 3306,
  schema: 'db',
  password: 'user',
  user: 'user',
  timezone: '+00:00',
};

export const settings = {
  ciCollation: 'utf8mb4_0900_ai_ci',
};

export const db = new MySQL(connection, settings);
await db.connect();
```



**Schema**

```javascript
// employeeSchema.{ts|js}
import { IDocumentSchema, IDocument, getDocument, generateId } from 'crud-node';

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

export const employeeSchema: IDocumentSchema<EmployeeProps> = {
  name: 'employee',
  alias: 'emp',
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

****

**Controller** _(!optional)_

{% hint style="info" %}
_You can use a controller to organize better your application and to easily import/export anywhere you need._
{% endhint %}

```javascript
// employeeController.{ts|js}
import { MySQL, CRUDMySQL, IAppWithDatabase } from 'crud-node';
import { employeeSchema, EmployeeProps } from './schemas/employee';

export class EmployeeController extends CRUDMySQL<EmployeeProps> {
  constructor(app: IAppWithDatabase<MySQL>) {
    super(app.db, employeeSchema);
  }
}

// This can be placed in a middleware that will leave all the controllers or can be called inside a route where you have access to app object.
export const employeeController = new EmployeeController(app);
```



**Create record**

```javascript
// employeeRouter.{ts|js}
import { CRUDMySQL } from 'crud-node';
import { employeeSchema } from './schemas/employee';

// Executes operations in a single transaction
const transacted = true;
const employeeController = new CRUDMySQL(db, employeeSchema);

await db.usingSession(async (session) => {
  const payload = {
    email: 'leslie46@24mailin.com',
    firstName: 'Leslie',
    lastName: 'Brett',
  };
  const data = await employeeController.createDocument(session, payload);
}, transacted);
```
{% endtab %}

{% tab title="MySQLX" %}
**Config**&#x20;

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



**Schema**

```javascript
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



**Controller** _(!optional)_

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

****

**Create record**

```javascript
// employeeRouter.{ts|js}
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
{% endtab %}
{% endtabs %}

_Congratulations! You successfully created a record in the database._
