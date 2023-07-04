select 
	"sourceChain" as source_chain
-- 	, "timestampMs"
	, count("digest") as num_transfers
from "wormholeTransfers"
where "destinationChain" = 'Sui'
group by 1
order by 2 desc
