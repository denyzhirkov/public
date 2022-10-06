--name: ordersByCountryA
--connection: northwind
--input: string country
select customerid, sum(freight)
from public.orders
where shipcountry = @country
group by customerid
--end