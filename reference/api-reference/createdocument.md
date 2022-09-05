---
description: Create a document.
---

# createDocument

**Signature**

```javascript
createDocument(session: mysqlx.Session, values: Partial<IDocument<S>>): Promise<IDocument<S>>;
```

**Example**

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
