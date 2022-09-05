---
description: Create a document.
---

# createDocument

**Signature**

{% tabs %}
{% tab title="MySQL" %}
```javascript
createDocument(session: Knex, values: Partial<IDocument<S>>): Promise<IDocument<S>>;
```
{% endtab %}

{% tab title="MySQLX" %}
```javascript
createDocument(session: mysqlx.Session, values: Partial<IDocument<S>>): Promise<IDocument<S>>;
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
const transacted = true;
const employeeController = new CRUDMySQL(db, employeeSchema);

await db.usingSession(async (session) => {
  const payload = {
    email: 'leslie46@24mailin.com',
    firstName: 'Leslie',
    lastName: 'Brett',
  };
  const data = await employeeController.createDocument(session, payload);
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
const transacted = true;
const employeeController = new CRUDMySQLX(db, employeeSchema);

await db.usingSession(async (session) => {
  const payload = {
    email: 'leslie46@24mailin.com',
    firstName: 'Leslie',
    lastName: 'Brett',
  };
  const data = await employeeController.createDocument(session, payload);
  return data;
}, transacted);
```
{% endtab %}
{% endtabs %}
