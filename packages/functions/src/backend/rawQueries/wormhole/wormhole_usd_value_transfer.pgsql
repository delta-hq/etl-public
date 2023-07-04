with coin_info_id as (
	select *
	from "wormholeBalanceChange" b
	left join "coinInfo" i on b."coinInfoId" = i.id
),

preliminary as (
	select
		date_trunc('week', t."timestampMs") as time
		, name
		, coalesce(sum(b."amountUsd") filter (where b."amountUsd" > 0), 0) as inflows
		, coalesce(sum(b."amountUsd") filter (where b."amountUsd" < 0), 0) as outflows
		, sum(b."amountUsd") as netAmountBridged
		, t."sourceChain"
	from coin_info_id b
	left join "wormholeTransfers" t on b."wormholeTransferId" = t."digest"
	where ("amountUsd" > 1 or b."amountUsd" < 1)
	group by 1,2,6
	order by 1 desc,5 desc
)

select 
	time
	, "sourceChain"
	, "name"
	, inflows
	, outflows
	, netAmountBridged
	, (case
		when (inflows = 0 and lag(inflows, 1) over (order by time) = 0) then 0
		when (inflows = 0) then -1
		when (lag(inflows, 1) over (order by time) = 0) then 99999
		else inflows/lag(inflows, 1) over (order by time) - 1 end) as prev_inflows_percent
	, (case
		when (outflows = 0 and lag(outflows, 1) over (order by time) = 0) then 0
		when (outflows = 0) then -1
		when (lag(outflows, 1) over (order by time) = 0) then 99999
		else outflows/lag(outflows, 1) over (order by time) - 1 end) as prev_outflows_percent
	, (case
		when (netAmountBridged = 0 and lag(netAmountBridged, 1) over (order by time) = 0) then 0
		when (netAmountBridged = 0) then -1
		when (lag(netAmountBridged, 1) over (order by time) = 0) then 99999
		else greatest(cast(netAmountBridged/lag(netAmountBridged, 1) over (order by time) - 1 as numeric), -1) end) as prev_netflows_percent
from preliminary
order by time desc


