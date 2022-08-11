# ☄ Quick Start

{% hint style="info" %}
**Good to know:** Before running the example make sure you have installed minimum Nodejs 14, npm 6, and have created a simple express application.
{% endhint %}

{% hint style="info" %}
Please, check `examples`&#x20;

* [https://github.com/suhantudor/crud-node/tree/main/examples](https://github.com/suhantudor/crud-node/tree/main/examples).
* [https://github.com/suhantudor/crud-node-realworld-example](https://github.com/suhantudor/crud-node-realworld-example)
{% endhint %}

This example very briefly illustrates the 3 methods available in Crud Node.

{% tabs %}
{% tab title="MySQL" %}
**Config**

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



**Router**

```javascript
// employeeRouter.{ts|js}
import { employeeController } from './employeeController';
import { CRUDMySQL } from 'crud-node';
import { employeeSchema } from './schemas/employee';

// Executes operations in a single transaction
const transacted = true;
const employeeController = new CRUDMySQL(db, employeeSchema);

// Create record
await db.usingSession(async (session) => {
  const payload = {
    email: 'leslie46@24mailin.com',
    firstName: 'Leslie',
    lastName: 'Brett',
  };
  const data = await employeeController.createDocument(session, payload);
}, transacted);

// Update record
await db.usingSession(async (session) => {
  const employeeId = '<_id>';
  const payload = {
    email: 'leslie46@24mailin.com',
    firstName: 'Leslie',
    lastName: 'Brett',
  };
  const data = await employeeController.updateDocument(session, employeeId, payload);
}, transacted);

// Delete record
await db.usingSession(async (session) => {
  const employeeId = '<_id>';
  const data = await employeeController.deleteDocument(session, employeeId);
}, transacted);
```
{% endtab %}

{% tab title="MySQLX" %}
**Config**

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

For defining schema we use [https://json-schema.org/](https://json-schema.org/)

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



**Router**

```javascript
// employeeRouter.{ts|js}
import { employeeController } from './employeeController';
import { CRUDMySQLX } from 'crud-node';
import { employeeSchema } from './schemas/employee';

// Executes operations in a single transaction
const transacted = true;
const employeeController = new CRUDMySQLX(db, employeeSchema);

// Create record
await db.usingSession(async (session) => {
  const payload = {
    email: 'leslie46@24mailin.com',
    firstName: 'Leslie',
    lastName: 'Brett',
  };
  const data = await employeeController.createDocument(session, payload);
}, transacted);

// Update record
await db.usingSession(async (session) => {
  const employeeId = '<_id>';
  const payload = {
    email: 'leslie46@24mailin.com',
    firstName: 'Leslie',
    lastName: 'Brett',
  };
  const data = await employeeController.updateDocument(session, employeeId, payload);
}, transacted);

// Delete record
await db.usingSession(async (session) => {
  const employeeId = '<_id>';
  const data = await employeeController.deleteDocument(session, employeeId);
}, transacted);
```
{% endtab %}
{% endtabs %}

The next sections of the documentation will go over each of these methods in great detail.
