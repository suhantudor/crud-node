---
description: Retrieve documents filtered/sorted by statement.
---

# getCount

**Signature**

{% tabs %}
{% tab title="MySQL" %}
```javascript
getCount(session: MySQLSession, props: Partial<IDocument<S>>, join?: 'OR' | 'AND'): Promise<number>;
```
{% endtab %}

{% tab title="MySQLX" %}
```javascript
getCount(session: MySQLXSession, props: Partial<IDocument<S>>, join?: 'OR' | 'AND'): Promise<number>;
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
  const officeId = '<_id>';

  const data = await this.employeeController.getCount(session, {
    [EmployeeProps.officeId]: officeId,
  });
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
  const officeId = '<_id>';

  const data = await this.employeeController.getCount(session, {
    [EmployeeProps.officeId]: officeId,
  });
  return data;
}, transacted);
```
{% endtab %}
{% endtabs %}
