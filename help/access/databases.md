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

Out-of-the-box, Datagrok provides 30+ connectors to the major databases. For the
full list of supported connectors and required parameters, see [Supported
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
   prompted. This action updates the dialog with connection-specific parameter
   fields.
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

### Query a database

Once you create a connection to the database, you can start querying it. To see
a full list of available options, follow these steps:

1. From the main menu on the left, click **Data** > **Databases**. This action
   opens the tree of the connectors.
1. Expand the appropriate connector and the database connection you need.
1. To access database’s tables, depending on connector expand  **Schemas** or
   **Schemas** > **public**.
1. Right-click the table. Alternatively, on the **Property pane**, either click
   the drop-down arrow next to the table name or expand the **Actions** info
   panel.

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

1. From the main menu on the left, click **Data** > **Databases**. This action
   opens the tree of the connectors.
1. Expand the appropriate connector and the database connection you need.
1. To access database’s tables, depending on connector expand  **Schemas** or
   **Schemas** > **public**.
1. From the table's context menu, click **New SQL Query…**. The **Query View**
   opens.
1. In the **Query View**, write the SQL query.
1. When finished, optionally edit the query name. Then on the **Menu Ribbon**,
   click **Save** to save the query to the Datagrok server.

#### Aggregate data via query

To aggregate a table data, follow these steps:

1. From the main menu on the left, click **Data** > **Databases**. This action
   opens the tree of the connectors.
1. Expand the appropriate connector and the database connection you need.
1. To access database’s tables, depending on connector expand  **Schemas** or
   **Schemas** > **public**.
1. From the table's context menu, click **Visual Query…**. This action opens the
   **Visual Query** form.
1. To aggregate values of the column, add this column to the **Measures**
   section:

   * Click the **Add an aggregation** icon next to **Measures**. This action
     opens the context menu.
   * In the first row of the context menu, choose the aggregation type.
     >Note: out-of-the-box, the list of aggregation types contains the Datagrok
     >standard aggregation functions and may include custom aggregation
     >functions exposed by the database provider. For example, Datagrok exposes
     >Postrges database GIS (Geo Information System) functions.
   * Choose the column to aggregate. Datagrok automatically shows the result of
     the query in the dataframe below.
      > Note: You can change the aggregation parameter by right-clicking it and
      > selecting the new aggregation type and column.

1. To summarize data by categories and subcategories, group query results by
   corresponding columns’ values. Add these columns to the **Rows** section by
   clicking the **Add column to group the rows on** icon next to  **Rows**.
1. To turn the unique values from one column into multiple columns in the
   output, add this column to the **Columns** section by clicking the **Add
   column to pivot on** icon next to **Columns**.
1. To filter the results, add the column to the **Filters** section by clicking
   the **Add a filter** icon next to **Filters** and define the condition for
   filtering. To write conditions use [Search
   Patterns](../explore/data-search-patterns.md), for example: '>4' or '=US'.
   The result of multiple filtering is an intersection of all conditions'
   results.
1. When finished, optionally edit the query name. Then on the **Menu Ribbon**,
   click **Save** to save the query to the Datagrok server.

![Visual Qiery](databases-visual-query.gif)

#### Join tables

Datagrok detects the schema of the database. When you open a table in **Query
builder**, the platform automatically displays all the tables connected to it by
the foreign keys.

To join tables, follow these steps:

1. From the main menu on the left, click **Data** > **Databases**. This action
   opens the tree of the connectors.
1. Expand the appropriate connector and the database connection you need.
1. To access database’s tables, depending on connector expand  **Schemas** or
   **Schemas** > **public**.
1. From the table's context menu, click the **Build Query…**. This action opens
    a **Query builder** dialog.
1. On the right side of the dialog, select required columns from tables that the
   platform automatically presents for joining. On the left side of the dialog,
   the platform immediately generates a SQL query, which you can edit. Datagrok
   instantaneously shows the results of the query in the dataframe below.

At any stage of building the query, you can continue interrogating its results
by adding them to the workspace. To add the results of the query to the
workspace, follow these steps:

1. At the bottom of the **Query builder** window, click the context menu icon.
1. Click **Add results to workspace**. The results appear in the dataframe in
   the workspace.

To save a query to the Datagrok server, follow these steps:

1. At the bottom of the **Query builder** window, click the context menu icon.
1. Click **Save as query**. This action opens a **Query View** window.
1. Optionally, you can edit the SQL query or the query name.
1. On the **Menu Ribbon**, click **Save**.

GIF

>Developers: You can create queries across multiple data sources by creating
>separate queries, which then should be used in a data job.

### Parameterize a query

Queries are Datagrok [functions](../overview/functions/function.md), which means
they can also be parametrized. For details, see [Function parameters
enhancement](../overview/functions/func-params-enhancement.md).

To create a parametrized query, follow these steps:

1. From the main menu on the left, click **Data** > **Databases**. This action
   opens the tree of the connectors.
1. Expand the appropriate connector and the database connection you need.
1. To access database’s tables, depending on connector expand  **Schemas** or
   **Schemas** > **public**.
1. From the table's context menu, click **New SQL Query…**. Alternatively, from
   the database's context menu, click **Add query…**. A **Query View** opens.
1. Annotate parameters in the query header using SQL/Sparql comments:

* `--` for SQL
* `#` for Sparql

>Note: The syntax for defining query parameters is based on
>[scripting](../compute/scripting.md) with additions specific to queries.

To parametrize a query you can annotate:

* [input parameters](databases.md/#input-parameters)
* [output parameters](databases.md/#output-parameters)

#### Input parameters

Using input parameters in Datagrok, you can:

* [Set default value for a
  parameter](databases.md/#set-default-value-for-a-parameter)
* Specify a filtering criteria as input ([use parameter
  patterns](databases.md/#specify-parameter-pattern))
* [Use lists as inputs](databases.md/#use-lists-as-inputs)
* [Predefine choices and
  suggestions](databases.md/#predefine-choices-and-suggestions) for a parameter
  value
* [Re-use input parameters](databases.md/#re-use-input-parameters)

Use the following format for query `input` parameters:

```sql
--input: <type> <name> = <value> {<option>: <value>; ...} [<description>]
```

For the parameters' supported types, see [supported
types](parameterized-queries.md/#supported-types).

For example, to parametrize argument `freight` in the following query applicable
to the "Northwind" database

```sql
select * from Orders where freight>=10
```

annotate the parameter `freight` as follows:

```sql
--input: double freight  
select * from Orders where freight>=@freight
```

##### Set default value for a parameter

To set default value for a parameter, set `<value>` after `<name>`. In the
following example, `10.0` is the default value for parameter ` freight `:

```sql
--input: double freight = 10.0 
select * from Orders where freight>=@freight
```

##### Specify parameter pattern

To use filtering criteria as free text in a parameter input, specify a pattern
for this parameter. The Datagrok server parses such a query and safely
transforms it into a proper SQL clause. For details about using filtering
criteria, see [search patterns](../explore/data-search-patterns.md).

To specify parameter pattern, follow these steps:

1. After `--input:`, specify the input type as `string`. The `string` type of
   the input lets the user enter free-text filtering criteria.
1. In the `pattern` option after the default value, specify the actual data
   type.
1. In the dependent query, use the reference `@<patternName>(columnName)` to
   specify a pattern that the server evaluates against the specified column.

In the following example, `@freightValue(freight)` transforms into `freight >
200.0` when a value for `freightValue` is specified as `> 200.0`:

```sql
--input: string freightValue = >= 10.0 {pattern: double}
select * from Orders where @freightValue(freight)
```

GIF

Datagrok  supports `datetime` type as well:

```sql
--input: string orderDate = "after 1/1/1995" {pattern: datetime}
select * from orders where @orderDate(orderDate)
```

See [patterns summary](parameterized-queries.md/#patterns-summary) for the
details.

Learn more about parameter patterns from this video: [Parameterized database
queries](https://www.youtube.com/watch?v=sSJp5CXcYKQ).

##### Use lists as inputs

To use lists as inputs to the queries, consider the following transformation:

1. After `--input:`, specify `list<T>` as a type of a parameter.
    >Note: `T` is the type of list elements.
2. Inside the SQL query before `@<parameter name>`, use `= ANY` operator: `=
   ANY(@<parameter name>)`, or a similar operator with an alternative selection
   of the comparison type, such as `>= ANY` or `< ANY`.

For example, you can transform a query applicable to the "Northwind" database
taking a single `string` parameter for a country:

```sql
--input: string country
select * from customers where country = @country
```

into a query taking a comma-separated list of countries:

```sql
--input: list<string> countries
select * from customers where country = ANY(@countries)
```

Learn more about using the lists feature form this video: [Lists in
parameterized queries](https://www.youtube.com/watch?v=meRAEF7ogtw).

##### Predefine choices and suggestions

Options for supported types are described in the
[Scripting](../compute/scripting.md) section.

| Option        | Description                                                                       |
|---------------|-----------------------------------------------------------------------------------|
| `choices`     | A comma-separated list of values, a name of the query, or the actual SQL query    |
| `suggestions` | Name of the query to be called to generate suggestion as the user types the value |

Examples of the `choices` and `suggestions` usage for the parameter
`shipCountry` are the following:

```sql
--input: string shipCountry = "France" {choices: ['France', 'Italy', 'Germany']}
--input: string shipCountry = "France" {choices: Query("SELECT DISTINCT shipCountry FROM Orders")}
--input: string shipCountry = "France" {choices: Demo:northwind:countries}
--input: string shipCountry = "France" {suggestions: Demo:northwind:countries}
```

##### Re-use input parameters

It's possible to re-use one or more existing input parameters as values inside
parameters' `choices` queries, for example:

```sql
--input: string firstLetter = "F"
--input: string shipCountry = "France" {choices: Query("SELECT DISTINCT shipCountry FROM Orders WHERE shipCountry LIKE @firstLetter || '%')} 
SELECT * FROM Orders WHERE (shipCountry = @shipCountry)
```

This is handy for queries with hierarchical choices, where each following
parameter depends on the previous.

#### Output parameters

By default, the platform returns a query result as a dataframe. If you plan to
obtain a value of a different data type (for instance, in your JavaScript code),
you can explicitly specify it in the output parameter.

For example, in
[Chembl](https://github.com/datagrok-ai/public/tree/master/packages/Chembl)
package, the following query outputs a string of the semantic type `Molecule`:

```sql
--output: string smiles {semType: Molecule}
```

#### Examples

```sql
--input: int employeeId = 5
--input: string shipVia = = 3 {pattern: int}
--input: double freight = 10.0
--input: string shipCountry = "France" {choices: Query("SELECT DISTINCT shipCountry FROM Orders")}
--input: string shipCity = "starts with r" {pattern: string}
--input: bool freightLess1000 = true
--input: datetime requiredDate = "1/1/1995"
--input: string orderDate = "after 1/1/1995" {pattern: datetime}
SELECT * FROM Orders WHERE (employeeId = @employeeId)
    AND (freight >= @freight)
    AND @shipVia(shipVia)
    AND ((freight < 1000) OR NOT @freightLess1000)
    AND (shipCountry = @shipCountry)
    AND @shipCity(shipCity)
    AND @orderDate(orderDate)
    AND (requiredDate >= @requiredDate)
```

GIF

### Postprocess query results

## Database Manager

## Managing database connections

## Managing content within a database connection

## Sharing content

## Resources

## Videos

[![Parameterized queries](../uploads/youtube/data_access.png "Open on
Youtube")](https://www.youtube.com/watch?v=dKrCk38A1m8&t=1980s)

[YouTube: Datagrok database parameterized
queries](https://www.youtube.com/watch?v=sSJp5CXcYKQ&ab_channel=Datagrok)

See also:

* [Search patterns](../explore/data-search-patterns.md)
* [Function](../datagrok/functions/function.md)
* [Scripting](../compute/scripting.md)
* [JavaScript API
  Samples](https://public.datagrok.ai/js/samples/data-access/parameterized-query)
