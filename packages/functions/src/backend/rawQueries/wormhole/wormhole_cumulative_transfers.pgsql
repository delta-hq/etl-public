with count as (
	SELECT
		"sourceChain" as source_chain
		, date_trunc('day', "timestampMs") as day
		, count(digest) as num_transfers
	from "wormholeTransfers"
	group by 1,2
	order by 1,2 desc
) 

select
	source_chain
	, day
	, sum(sum(num_transfers)) over (partition by source_chain order by day) as total_transfers
from count
group by 1,2
order by 1,2 desc

