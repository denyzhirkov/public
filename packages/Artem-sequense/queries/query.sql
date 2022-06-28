--name: ordersByCountry
--input: string country
--connection: artem
select customerid, sum(freight)
from public.orders
where shipcountry = @country
group by customerid
--end