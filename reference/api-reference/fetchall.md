---
description: Retrieve documents filtered/sorted by statement.
---

# fetchAll

**Signature**

```javascript
fetctAll(session: mysqlx.Session, sort?: Sort, filter?: {
    props: Partial<IDocument<S>>;
    join: 'OR' | 'AND';
}): Promise<Array<IDocument<S>>>;
```

**Example**

```javascript
// employeeRouter.{ts|js}
import { CRUDMySQLX, SortBy, OffsetPagination } from 'crud-node';
import { employeeSchema, EmployeeProps } from './schemas/employee';

// Executes operations in a single transaction
const transacted = false;
const employeeController = new CRUDMySQLX(db, employeeSchema);

await db.usingSession(async (session) => {
  const data = await employeeController.fetchAll(session);
  return data;
}, transacted);
```
