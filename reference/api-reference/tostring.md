---
description: Returns a string that represents the current row.
---

# toString

{% hint style="info" %}
toString is the formatting method in the crud-node. It converts a row to its string representation so that it is suitable for display.&#x20;

The default implementation of the toString method returns the id of a document, and \<unknown> if a document is not defined.&#x20;

To override toString formatting, add to document schema toString method.
{% endhint %}

**Signature**

```javascript
toString(document?: IDocument<S>): string;
```

**Example**

<pre class="language-javascript"><code class="lang-javascript">enum EmployeeProps {
  _id = '_id',
  lastName = 'lastName',
  firstName = 'firstName',
  ....
}
<strong>
</strong><strong>...
</strong><strong>
</strong>toString: (data: IDocument&#x3C;EmployeeProps>) => {
    return `${data.firstName} ${data.lastName}`;
},</code></pre>
