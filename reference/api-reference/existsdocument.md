---
description: Checks if exists a document with provided unique props values.
---

# existsDocument

{% hint style="info" %}
Throws `errorNoCriteriaProvided` if props are empty.

Throws `errorDuplicatedDocument` if document with provided props already exists.
{% endhint %}

**Signature**

{% tabs %}
{% tab title="MySQL" %}
```javascript
existsDocument(session: Knex, props: Partial<IDocument<S>>): Promise<void>;
```
{% endtab %}

{% tab title="MySQLX" %}
```javascript
existsDocument(session: mysqlx.Session, props: Partial<IDocument<S>>): Promise<void>;
```


{% endtab %}
{% endtabs %}

**Example**

{% tabs %}
{% tab title="MySQL" %}
```javascript
// employeeRouter.{ts|js}
import { CRUDMySQL, SortBy, OffsetPagination } from 'crud-node';
import { employeeSchema, EmployeeProps } from './schemas/employee';

// Executes operations in a single transaction
const transacted = false;
const employeeController = new CRUDMySQL(db, employeeSchema);

await db.usingSession(async (session) => {
  const employeeId = '<_id>';

  const data = await employeeController.existsDocument(session, { employeeId });
  return data;
}, transacted);
```
{% endtab %}

{% tab title="MySQLX" %}
```javascript
// employeeRouter.{ts|js}
import { CRUDMySQLX, SortBy, OffsetPagination } from 'crud-node';
import { employeeSchema, EmployeeProps } from './schemas/employee';

// Executes operations in a single transaction
const transacted = false;
const employeeController = new CRUDMySQLX(db, employeeSchema);

await db.usingSession(async (session) => {
  const employeeId = '<_id>';

  const data = await employeeController.existsDocument(session, { employeeId });
  return data;
}, transacted);
```
{% endtab %}
{% endtabs %}