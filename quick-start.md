# ☄ Quick Start

{% hint style="info" %}
**Good to know:** Before running the example make sure you have installed minimum Nodejs 14, npm 6, and have created a simple express application.
{% endhint %}

{% hint style="info" %}
Please, check `examples` directory as well.
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
