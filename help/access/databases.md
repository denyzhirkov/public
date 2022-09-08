# Databases

## Overview

Datagrok provides comprehensive functionality for working with databases:

* Connection:
  * Add new connector
  * Supported connectors
  * Create a connection
* Previewing tables and columns
* Creating queries
* Browsing and previewing queries
* Aggregation
* Managing content
* Sharing access

## Connection

To get data access in a particular data source we use connections. We currently
support over 30 connectors to different databases. You can use a them or if
needed add a new connector to get access to your database.

### Add new connector

Learn the steps to add a new connector.

GIF

### Supported connectors

The supported connectors with their specific parameters are the following:

| Data Source                                            | Server  | Port    | DB      | Cache Schema | Cache Results | SSL     | Connection String | Login   | Password | Other Parameters                                                             |
|--------------------------------------------------------|---------|---------|---------|--------------|---------------|---------|-------------------|---------|----------|------------------------------------------------------------------------------|
| [Access]( connectors/access.md)            |         |         | &check; |              |               |         | &check;           | &check; | &check;  |                                                                              |
| [Athena]( connectors/athena.md)            | &check; | &check; | &check; |              |               |         | &check;           |         |          | [See the list]( connectors/athena.md)                            |
| [BigQuery]( connectors/bigquery.md)        |         |         |         |              |               |         | &check;           | &check; | &check;  | [See the list]( connectors/bigquery.md#connection-parameters)    |
| [Cassandra]( connectors/cassandra.md)      | &check; | &check; | &check; | &check;      | &check;       | &check; | &check;           | &check; | &check;  |                                                                              |
| [DB2]( connectors/db2.md)                  | &check; | &check; | &check; | &check;      | &check;       | &check; | &check;           | &check; | &check;  |                                                                              |
| [Denodo]( connectors/denodo.md)            | &check; | &check; | &check; | &check;      | &check;       | &check; | &check;           | &check; | &check;  |                                                                              |
| [DropBox]( connectors/dropbox.md)          |         |         |         |              |               |         |                   |         | &check;  | [See the list]( connectors/dropbox.md#connection-parameters)     |
| [Files](../../access/connectors/files.md)              |         |         |         |              |               |         |                   | &check; | &check;  | [See the list]( connectors/files.md#connection-parameters)       |
| [Firebird]( connectors/firebird.md)        | &check; | &check; | &check; | &check;      | &check;       |         | &check;           | &check; | &check;  |                                                                              |
| [Git]( connectors/git.md)                  |         |         |         |              |               |         |                   |         |          | [See the list]( connectors/git.md#connection-parameters)         |
| [Google Cloud]( connectors/googlecloud.md) |         |         |         |              |               |         |                   |         |          | [See the list]( connectors/googlecloud.md#connection-parameters) |
| [HBase]( connectors/hbase.md)              | &check; | &check; | &check; | &check;      | &check;       | &check; | &check;           | &check; | &check;  |                                                                              |
| [Hive]( connectors/hive.md)                | &check; | &check; | &check; | &check;      | &check;       | &check; | &check;           | &check; | &check;  |                                                                              |
| [Hive2]( connectors/hive2.md)              | &check; | &check; | &check; | &check;      | &check;       | &check; | &check;           | &check; | &check;  |                                                                              |
| [Impala]( connectors/impala.md)            | &check; | &check; | &check; |              |               |         | &check;           | &check; | &check;  | [See the list]( connectors/impala.md#connection-parameters)      |
| [MariaDB]( connectors/mariadb.md)          | &check; | &check; | &check; | &check;      | &check;       | &check; | &check;           | &check; | &check;  |                                                                              |
| [MongoDB]( connectors/mongodb.md)          | &check; | &check; | &check; | &check;      | &check;       |         | &check;           | &check; | &check;  |                                                                              |
| [MS SQL]( connectors/mssql.md)             | &check; | &check; | &check; | &check;      | &check;       | &check; | &check;           | &check; | &check;  |                                                                              |
| [MySql]( connectors/mysql.md)              | &check; | &check; | &check; | &check;      | &check;       | &check; | &check;           | &check; | &check;  |                                                                              |
| [Neo4j]( connectors/neo4j.md)              | &check; | &check; | &check; | &check;      | &check;       | &check; | &check;           | &check; | &check;  |                                                                              |
| [OData]( connectors/odata.md)              |         |         |         |              |               |         |                   |         |          | [See the list]( connectors/odata.md#connection-parameters)       |
| [Oracle]( connectors/oracle.md)            | &check; | &check; | &check; | &check;      | &check;       | &check; | &check;           | &check; | &check;  |                                                                              |
| [PostgresNet]( connectors/postgres.md)     | &check; | &check; | &check; | &check;      | &check;       | &check; | &check;           | &check; | &check;  |                                                                              |
| [PostgreSQL]( connectors/postgres.md)      | &check; |         | &check; |              | &check;       | &check; |                   | &check; | &check;  |                                                                              |
| [Redshift]( connectors/redshift.md)        | &check; | &check; | &check; | &check;      | &check;       | &check; | &check;           | &check; | &check;  |                                                                              |
| [S3]( connectors/s3.md)                    |         |         |         |              |               |         |                   |         |          | [See the list]( connectors/s3.md#connection-parameters)          |
| [Snowflake]( connectors/snowflake.md)      | &check; | &check; | &check; | &check;      | &check;       | &check; | &check;           | &check; | &check;  |                                                                              |
| [Socrata]( connectors/socrata.md)          |         |         |         |              |               |         |                   |         |          | [See the list]( connectors/socrata.md#connection-parameters)     |
| [Sparql]( connectors/sparql.md)            |         |         |         |              |               |         |                   |         |          | [See the list](. connectors/sparql.md#connection-parameters)      |
| [SQLite]( connectors/sqlite.md)            |         |         | &check; |              |               |         | &check;           | &check; | &check;  |                                                                              |
| [Teradata]( connectors/teradata.md)        | &check; | &check; | &check; | &check;      | &check;       | &check; | &check;           | &check; | &check;  |                                                                              |
| [Twitter]( connectors/twitter.md)          |         |         |         |              |               |         |                   |         |          | [See the list]( connectors/twitter.md#connection-parameters)     |
| [Vertica]( connectors/vertica.md)          | &check; | &check; | &check; | &check;      | &check;       | &check; | &check;           | &check; | &check;  |                                                                              |
| [Virtuoso]( connectors/virtuoso.md)        | &check; | &check; | &check; | &check;      | &check;       | &check; | &check;           | &check; | &check;  |                                                                              |
| [Web]( connectors/web.md)                  |         |         |         |              |               |         |                   |         |          | [See the list]( connectors/web.md#connection-parameters)         |

### Create a connection

Learn the steps to create a new connection. Please pay attention, that after
database connection, not only tables but also their columns are available to
you.

![Create a connection](database-connection.gif)

### JDBC connection

For some cases connection may require custom JDBC connection string. For this
case, JDBC-based data connection has parameter **Conn. string**. If filled, it
is used for connection, and all other parameters are ignored except for
**Login** and **Password**.

## Creating queries

Once a connection is set up, you are ready to start creating queries. There are
multiple ways to do so: manually or programmatically.

### Data query

### DB visual query

### Parameterized queries

### Query Builder

### Query View

### SPARQL query

### Edit Socrata query

## Browsing and previewing

### DB exploration

### Database table

### Database table column

## Aggregation

## Managing content

## Sharing access

### Data connection

### Data connection credentials
