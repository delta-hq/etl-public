const AWAY_FROM_SUI = `select
	"destinationChain" as destination_chain
	, count("digest") as num_transfers
from "wormholeTransfers"
where "sourceChain" = 'Sui'
group by 1
order by 2 desc`;

const DAILY_AWAY_FROM_SUI = `select
	"destinationChain" as destination_chain
	, date_trunc('day', "timestampMs") as day
	, count(digest) as num_transfers
from "wormholeTransfers"
where "sourceChain" = 'Sui'
group by 1,2
order by 2 desc`;

const TO_SUI = `
select 
	"sourceChain" as source_chain
	, count("digest") as num_transfers
from "wormholeTransfers"
where "destinationChain" = 'Sui'
group by 1
order by 2 desc`;

// source chain daily
const DAILY_TO_SUI = `select
	"sourceChain" as source_chain
	, date_trunc('day', "timestampMs") as day
	, count(digest) as num_transfers
from "wormholeTransfers"
where "destinationChain" = 'Sui'
group by 1,2
order by 2 desc`;

export const getChainCountsQuery = (
  isDaily: boolean,
  isTransferToSui: boolean
) => {
  if (isTransferToSui && isDaily) {
    return DAILY_TO_SUI;
  } else if (isTransferToSui) {
    return TO_SUI;
  } else if (isDaily) {
    return DAILY_AWAY_FROM_SUI;
  }
  return AWAY_FROM_SUI;
};

export const VOLUME_QUERY = `
with coin_info_id as (
	select *
	from "wormholeBalanceChange" b
	left join "coinInfo" i on b."coinInfoId" = i.id
),

preliminary as (
	select
		date_trunc($1, t."timestampMs") as time
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
limit 50
`;

export const WORMHOLE_TOP_ADDRESSES = `
SELECT
    ROW_NUMBER() OVER (ORDER BY netAmountBridged DESC) AS "rowNumber",
    inflows,
    outflows,
    netAmountBridged,
    "ownerAddress"
FROM (
    SELECT
        SUM(b."amountUsd") FILTER (WHERE b."amountUsd" > 0) AS inflows,
        COALESCE(SUM(b."amountUsd") FILTER (WHERE b."amountUsd" < 0), 0) AS outflows,
        SUM(b."amountUsd") AS netAmountBridged,
        b."ownerAddress"
    FROM
        "wormholeBalanceChange" b
    LEFT JOIN
        "wormholeTransfers" t ON b."wormholeTransferId" = t."digest"
    LEFT JOIN
        "coinInfo" c ON b."coinInfoId" = c."id"
    WHERE
        ("amountUsd" > 1 OR b."amountUsd" < 1)
        AND c.verified = true
    GROUP BY
        b."ownerAddress"
) AS subquery
ORDER BY
    netAmountBridged DESC
`;

export const getWormholeTopAddressesQuery = (limit: number = 200) => {
  return `${WORMHOLE_TOP_ADDRESSES} limit ${limit}`;
};

export const WORMHOLE_DAILY_TRANSFERS = `
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
order by 1 desc;
`;

export const WORMHOLE_CUMULATIVE_TRANSFERS = `
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

`;
