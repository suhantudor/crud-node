---
description: Retrieve documents from a collection without filtering.
---

# getDocuments

{% hint style="info" %}
Applies pagination to the result set or uses `DEFAULT_PAGE_SIZE` to limit the result set.
{% endhint %}

**Signature**

{% tabs %}
{% tab title="MySQL" %}
```javascript
getDocuments(session: Knex, pagination?: IOffsetPagination, sort?: Sort): Promise<IPaginatedSet<IDocument<S>>>;
```
{% endtab %}

{% tab title="MySQLX" %}
```javascript
getDocuments(session: mysqlx.Session, pagination?: IOffsetPagination, sort?: Sort): Promise<IPaginatedSet<IDocument<S>>>;
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
  const pagination = OffsetPagination(1, 10);
  const sort = SortBy().asc(EmployeeProps.lastName).toCriteria();

  const data = await employeeController.getDocuments(session, pagination, sort);
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
  const pagination = OffsetPagination(1, 10);
  const sort = SortBy().asc(EmployeeProps.lastName).toCriteria();

  const data = await employeeController.getDocuments(session, pagination, sort);
  return data;
}, transacted);
```
{% endtab %}
{% endtabs %}
