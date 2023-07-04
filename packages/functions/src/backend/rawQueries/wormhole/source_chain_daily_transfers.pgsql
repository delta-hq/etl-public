select 
	"sourceChain" as source_chain
	, date_trunc('day', "timestampMs") as day
	, count(digest) as num_transfers
from "wormholeTransfers"
where "destinationChain" = 'Sui'
group by 1,2
order by 2 desc
