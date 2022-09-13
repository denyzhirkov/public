# Databases

In this article:

* [Data access](databases.md/#accessing-databases)
* [Queries](databases.md/#queries)
* Database Manager
* [Managing database connections](databases.md/#managing-database-connections)
* [Managing content within a database
  connection](databases.md/#managing-file-shares)
* [Sharing content](databases.md/#sharing-content)

## Accessing databases

Datagrok lets you access databases in a secure and manageable way.

> Key concept: _database connection_
>
> _Database connection_ is a named connection to the database you access with
> Datagrok. The platform can create a _database connection_ to all the popular
> databases, including PostgreSQL, MySQL, MS SQL, Maria DB, Oracle, and others.
> A _database connection_ allows authorized users to access and query databases.
>
>_Connections_ are Datagrok [entities](../datagrok/objects.md), which means they
>can also be used for sharing data with others and for enabling discovery by
>other Datagrok users.

### Supported connectors

Out-of-the-box, Datagrok provides 30+ connectors to the common databases. For
the full list of supported connectors and required parameters, see [Supported
connectors]( connectors/supported-connectors.md).

> Developers: You can also extend the platform by [creating custom
> connectors](https://github.com/datagrok-ai/public/tree/master/connectors).

### Connect a database

To connect a database, follow these steps:

1. From the main menu on the left, click **Data** > **Databases**.
1. Open the **Add new connection** dialog by either: (1) expanding the
   **Actions** panel and clicking **Add new connection…**, or (2) Right-clicking
   the appropriate connector in the tree, and choosing **Add connection…**.
1. From the **Data Source** dropdown list, select the desired database when
   prompted. This updates the dialog with connection-specific parameter fields.
1. Fill in all dialog fields displayed.

>Notes:
>
> If the connection requires a custom JDBC connection string, fill in the
> parameter **Conn. string**. In this case, you don’t need to fill in other
> parameters except for **Login** and **Password**.
>
>You can enter _credentials_ (typically, login/password) manually. When entered
>manually, Datagrok stores secrets in a secure [privilege management
>system](/govern/security.md/#credentials). You can also set up a connection
>using Datagrok's integration with the AWS Secrets Manager (see [Secrets
>Managers](/access/data-connection-credentials.md/#secrets-managers) for
>details).
>
>To define who can change the connection credentials, make a selection from the
>**Credential owner** dropdown.

1. Click **TEST** to the connection, then click **OK** to save it.

![Create a connection](database-connection.gif)

## Queries

* [Query a database](databases.md/#query-a-database):
  * [Write a SQL query](databases.md/#write-a-sql-query)
  * [Create an aggregation query](databases.md/#create-an-aggregation-query)
  * [Build a query for multiple
    tables](databases.md/#build-a-query-for-multiple-tables)
* [Parametrize query](databases.md/#parameterize-a-query)
* [Postprocess query results](databases.md/#postprocess-query-results)

### Query a database

When the database connection is set, you can start querying the database. You
can find all actions to get queries under the table in:

* The context menu of this table
* The **Actions** info panel of the **Property pane**
* The context menu of this table on the **Property pane**

To retrieve all the data from the table, select **Get All** from the table
context menu.
 >Note: Depending on the table size, it might take a lot of time and memory.

To retrieve the first 100 rows of the table, select **Get TOP 100** from the
table context menu.

#### Write a SQL query

To write a SQL query for the table, follow these steps:

1. Select **New SQL Query…** from the table context menu.
1. Write SQL query in the opened window.

To save a query to the Datagrok server, enter the query name and press the
**Save** button on the **Menu Ribbon**.

#### Create an aggregation query

To create an aggregation query against the particular table, follow these steps:

1. Select the **Visual Query…** from the table context menu. This action opens
   the **Visual Query** form.
1. Fill in the fields.

>Note: The result of the query appears instantaneously, which is an efficient
>way to query large databases that, for example, may not fit into the memory.
>Also, you can view query results in advance.

To calculate an aggregate value of the column, add it to the **Measures**
section:

1. Click plus behind the **Measures**. This opens the context menu.
1. In the first row of the context menu, choose the aggregation type.
1. Choose the column you want to be aggregated.

>Note: the list of aggregation types contains the Datagrok standard types of
>aggregation and may contain custom aggregation functions exposed by the
>database provider.

To change the aggregation parameter, right-click it and select the new
aggregation type and column.

To define a column to be used as a key, add it to the **Rows** section:

1. Click plus behind the **Rows**. This opens the list of columns.
1. Select the column.

You can use more than one column as a key.

Datagrok supports the ability to pivot data. To put values in the columns, add
them to the **Columns** section:

1. Click plus behind the **Columns**. This opens the list of columns.
1. Select the column whose values should appear in the query result columns.

To save a query to the Datagrok server, enter the query name and press the
**Save** button on the **Menu Ribbon**.

GIF

#### Build a query for multiple tables

To build a query for multiple tables using a visual interface, follow these
steps:

1. Click the table
1. Select the **Build Query…** from the table context menu. This opens the
   **Query builder** form.
1. Select columns of the tables and combine them with the other tables' columns.

>Note: The platform figures out the schema of the database and, starting from
>the selected table, adds all the tables that could be reached by following the
>foreign keys.

The result of the query appears instantaneously. And at any stage of building
the query, you can add the results to the workspace. To do that, follow these
steps:

1. At the bottom of the **Query builder** window, click the context menu icon.
1. Select **Add results to workspace**. The results appear in the dataframe in
   the workspace.

To save a query to the Datagrok server, follow these steps:

1. At the bottom of the **Query builder** window, click the context menu icon.
1. Select **Save as query**. This opens a query view window.
1. Enter the query name.
1. Press the **Save** button on the **Menu Ribbon**.

GIF

### Parameterize a query

### Postprocess query results

## Database Manager

## Managing database connections

## Managing content within a database connection

## Sharing content

See also:

## Resources
