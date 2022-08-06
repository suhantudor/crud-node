---
description: Creates a collection in the database, if collection does not exist
---

# init

{% hint style="info" %}
This method is available only for `MySQL X Protocol (Document Store)`
{% endhint %}

**Signature**

```javascript
init(session: mysqlx.Session): Promise<void>;
```

**Example**

```javascript
await db.usingSession(async (session) => {
  await employeeController.init(session);
});
```
