---
description: This is an adapter for MySQL databases.
---

# MySQL

{% hint style="info" %}
**Good to know:** Before running the example make sure you have installed minimum Nodejs 14, npm 6, and have created a simple express application.
{% endhint %}

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
  return data;
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
  return data;
}, transacted);

// Delete record
await db.usingSession(async (session) => {
  const employeeId = '<_id>';
  const data = await employeeController.deleteDocument(session, employeeId);
  return data;
}, transacted);
```
