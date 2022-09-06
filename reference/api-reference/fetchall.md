---
description: Retrieve documents filtered/sorted by statement.
---

# getTotal

**Signature**

{% tabs %}
{% tab title="MySQL" %}
```javascript
getTotal(session: Knex): Promise<number>;
```
{% endtab %}

{% tab title="MySQLX" %}
```javascript
getTotal(session: mysqlx.Session): Promise<number>;
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
  const data = await employeeController.getTotal(session);
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
  const data = await employeeController.getTotal(session);
  return data;
}, transacted);
```
{% endtab %}
{% endtabs %}
