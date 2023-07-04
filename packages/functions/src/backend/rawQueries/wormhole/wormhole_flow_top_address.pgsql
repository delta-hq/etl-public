select
	sum(b."amountUsd") filter (where b."amountUsd" > 0) as inflows
	, coalesce(sum(b."amountUsd") filter (where b."amountUsd" < 0), 0) as outflows
	, sum(b."amountUsd") as netAmountBridged
	, b."ownerAddress"
from "wormholeBalanceChange" b
left join "wormholeTransfers" t on b."wormholeTransferId" = t."digest"
left join "coinInfo" c on b."coinInfoId" = c."id"
where ("amountUsd" > 1 or b."amountUsd" < 1)
group by b."ownerAddress"
order by netAmountBridged desc
