-- Queriries related to wormhole

-- this represents a single transfer of tokens from one chain to another
CREATE TABLE "wormholeTransfers" (
    "digest" varchar(60) primary key,
    "sourceChainId" INT,
    "sourceChain" varchar(100),
    "destinationChainId" INT,
    "destinationChain" varchar(100),
    "timestampMs" varchar(40),
	"checkpoint" varchar(80),
	"createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	"updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- this represents a single balance change in a wormhole transfer.  For example, if they imported weth, 
-- then this would show the increase in weth
CREATE TABLE "wormholeBalanceChange" (
    id SERIAL PRIMARY KEY,
    "ownerAddress" VARCHAR(100),
    "amount" varchar(50),
    "convertedAmount" float, -- this is converted based on their coin info (amount * 10^decimals) for easy processing
    "convertedAmountGasAdjusted" float,
    "amountUsd" float,
    "wormholeTransferId" VARCHAR(66),
    "coinInfoId" INT,
    FOREIGN KEY ("wormholeTransferId") REFERENCES "wormholeTransfers" ("digest"),
    FOREIGN KEY ("coinInfoId") REFERENCES "coinInfo" ("id"),
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	"updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


TRUNCATE TABLE "wormholeBalanceChange", "wormholeTransfers" CASCADE;
