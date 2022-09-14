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
  * Write a SQL query
  * Create an aggregation query
  * Build a query for multiple tables
* [Parametrize query](databases.md/#parameterize-a-query)
* [Postprocess query results](databases.md/#postprocess-query-results)

> Key concept: _query_, _parametrized query_
>
>_Queries_ are Datagrok [entities](../datagrok/objects.md), which means they can
>also be used for sharing data with others and for enabling discovery by other
>Datagrok users.
>
> _Queries_ are Datagrok [functions](../overview/functions/function.md), which
> means they can also be parametrized. For details, see [Function parameters
> enhancement](../overview/functions/func-params-enhancement.md).

### Query a database

Once you connected a database, you can start querying it. To see a full list of
available options, right-click the table. Alternatively on the **Property
pane**, either click the drop-down arrow next to the table name or expand the
**Actions** info panel.

GIF

Subject to your permissions, you can choose to:

* Retrieve all data (**Get All**).
* Retrieve the first 100 rows (**Get TOP 100**).
* [Write a SQL query](databases.md/#write-a-sql-query) (**New SQL Query…**).
* [Aggregate data via query](databases.md/#aggregate-data-via-query) (**Visual
  Query…**).
* [Join tables](databases.md/#join-tables) (**Build Query…**).

#### Write a SQL query

To query a table manually, follow these steps:

1. From the table's context menu, click **New SQL Query…**. The **Query View**
   opens.
1. In the **Query View**, write the SQL query.
1. When finished, enter the query name. Then on the **Menu Ribbon**, click
   **Save** to save the query to the Datagrok server.

#### Aggregate data via query

To aggregate a table data, follow these steps:

1. From the table's context menu, click **Visual Query…**. This action opens the
   **Visual Query** form.
1. To aggregate values of the column, add this column to the **Measures**
   section:

   * Click the **Add an aggregation** icon next to **Measures**. This opens the
     context menu.
   * In the first row of the context menu, choose the aggregation type.
     >Note: out-of-the-box the list of aggregation types contains the Datagrok
     >standard aggregation functions and may contain custom aggregation
     >functions exposed by the database provider. For exapmle, Datagrok exposes
     >Postrges database GIS (Geo Information System) functions.
   * Choose the column to aggregate. Datagrok automaticaly shows the result of
     the query in the dataframe below.
      > Note: You can change the aggregation parameter by right-clicking it and
      > selecting the new aggregation type and column.

1. To summarize data by categories and subcategories, group query results by
   corresponding columns’ values. Add these columns to the **Rows** section by
   clicking the **Add column to group the rows on** icon next to  **Rows**.
1. To see different summaries of the source data, move rows to columns. Add a
   column to pivot on to the **Columns** section by clicking the corresponding
   icon next to **Columns**.
1. To filter the results, add column to the **Filters** section by clicking the
   **Add a filter** icon next to  **Filters** and define the condition for
   filtering. To write conditions use [Search
   Patterns](../explore/data-search-patterns.md), for example: '>4' or '=US'.
   The result of multiple filtering is an intersection of all conditions'
   results.
1. When finished, optionally edit the query name. Then on the **Menu Ribbon**,
   click **Save** to save the query to the Datagrok server.

![Visual Qiery](databases-visual-query.gif)

#### Join tables

Datagrok detects the schema of the database. When you open a table in **Query
builder**, the platform automaticaly displays all the tables connected to it by
the foreign keys.

To join tables, follow these steps:

1. From the table's context menu, click the **Build Query…**. This action opens
   a **Query builder** dialog.
1. On the right side of the dialog, select required columns from tables that the
   platform automatically presented for joining. On the left side, the platform
   immediately generates a SQL query, which you can edit. Datagrok
   instantaneously shows the result of the query in the dataframe below.

At any stage of building the query, you can continue interrogating its results
by adding them to the workspace. To add the results of the query to the
workspace, follow these steps:

1. At the bottom of the **Query builder** window, click the context menu icon.
1. Click **Add results to workspace**. The results appear in the dataframe in
   the workspace.

To save a query to the Datagrok server, follow these steps:

1. At the bottom of the **Query builder** window, click the context menu icon.
1. Click **Save as query**. This opens a **Query View** window.
1. Optionally you can edit the SQL query or the query name.
1. On the **Menu Ribbon**, click **Save**.

GIF

>Developers: You can create queries across multiple data sources by creating
>separate queries which then should be used in a data job.

### Parameterize a query

To start writing a new parametrized query, open **Query View** either: (1) from
the table's context menu, by clicking **New SQL Query…** or (2) from the
database's context menu, by clicking **Add query…**

#### User case

### Postprocess query results

## Database Manager

## Managing database connections

## Managing content within a database connection

## Sharing content

See also:

## Resources
