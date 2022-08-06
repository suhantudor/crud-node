---
description: Update a document
---

# updateDocument

**Signature**

```javascript
updateDocument(session: mysqlx.Session, id: string, values: Partial<IDocument>): Promise<IDocument>;
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
  const employeeId = '<_id>';
  const payload = {
    email: 'leslie46@24mailin.com',
    firstName: 'Leslie',
    lastName: 'Brett',
  };
  const data = await employeeController.updateDocument(session, employeeId, payload);
  return data;
}, transacted);
```
