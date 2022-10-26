# crud-node Examples for MySQL

<img src="https://img.shields.io/badge/crud node-1.0.0-15ACF6?style=for-the-badge&logo=none&logoColor=white" alt="kafka version" />&nbsp;<img src="https://img.shields.io/badge/license-MIT-red?style=for-the-badge&logo=none" alt="license" />&nbsp;<img src="https://img.shields.io/badge/DEVELOPER-Selsof-purple?style=for-the-badge&logo=none" alt="developer" />

**crud-node** can be used as an SQL query builder in Node.JS.

## ⚡️ How to run examples

Establish a connection to a database running in [docker container](https://www.docker.com/resources/what-container/#:~:text=A%20Docker%20container%20image%20is,tools%2C%20system%20libraries%20and%20settings.) crud_node_mysql. To create crud_node_mysql container, run a command:

```
yarn run up-db
```

Build crud-node package. Suppose, crud-node is located here [C:/node-crud](C:/node-crud), install the required packages:

```
yarn install

yarn add file:C:/node-crud
```

To execute examples, run a command:

```
yarn run test
```
