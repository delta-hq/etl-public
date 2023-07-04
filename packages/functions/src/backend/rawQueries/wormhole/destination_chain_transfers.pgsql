select 
	"destinationChain" as destination_chain
-- 	, "timestampMs"
	, count("digest") as num_transfers
from "wormholeTransfers"
where "sourceChain" = 'Sui'
group by 1
order by 2 desc
