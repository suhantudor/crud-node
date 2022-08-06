---
description: Retrieve a document.
---

# getDocument

{% hint style="info" %}
Throws `errorNoIdProvided` if document id is empty.

Throws `errorDocumentNotFound` if document with specified id does not exist.
{% endhint %}

**Signature**

{% tabs %}
{% tab title="MySQL" %}
```javascript
getDocument(session: Knex, id: string): Promise<IDocument<S>>;
```
{% endtab %}

{% tab title="MySQLX" %}
```javascript
getDocument(session: mysqlx.Session, id: string): Promise<IDocument<S>>;
```
{% endtab %}
{% endtabs %}

**Example**

{% tabs %}
{% tab title="MySQL" %}
```javascript
// employeeRouter.{ts|js}
import { employeeController } from './employeeController';
import { CRUDMySQL } from 'crud-node';
import { employeeSchema } from './schemas/employee';

// Executes operations in a single transaction
const transacted = false;
const employeeController = new CRUDMySQL(db, employeeSchema);

await db.usingSession(async (session) => {
  const employeeId = '<_id>';
  const data = await employeeController.getDocument(session, employeeId);
  return data;
}, transacted);
```
{% endtab %}

{% tab title="MySQLX" %}
```javascript
// employeeRouter.{ts|js}
import { employeeController } from './employeeController';
import { CRUDMySQLX } from 'crud-node';
import { employeeSchema } from './schemas/employee';

// Executes operations in a single transaction
const transacted = false;
const employeeController = new CRUDMySQLX(db, employeeSchema);

await db.usingSession(async (session) => {
  const employeeId = '<_id>';
  const data = await employeeController.getDocument(session, employeeId);
  return data;
}, transacted);
```
{% endtab %}
{% endtabs %}
