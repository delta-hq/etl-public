select
	date_trunc('day', t."timestampMs") as day
	, c."name" as token_name
	, coalesce(sum(b."convertedAmount") filter (where b."convertedAmount" > 0), 0) as token_in_amount
	, coalesce(sum(b."convertedAmount") filter (where b."convertedAmount" < 0), 0) as token_out_amount
	, sum(b."convertedAmount") as token_net_amount
	, sum(b."amountUsd") as value_bridged
from "wormholeBalanceChange" b
left join "wormholeTransfers" t on b."wormholeTransferId" = t."digest"
left join "coinInfo" c on b."coinInfoId" = c."id"
where ("amountUsd" > 0.1 or b."amountUsd" < 0.1)
group by 1,2
order by 1 desc

