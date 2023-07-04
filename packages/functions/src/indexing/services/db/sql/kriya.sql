CREATE TABLE "kriyaPool" (
  "txDigest" varchar(100) ,
  "poolId" VARCHAR(255) PRIMARY KEY,
  "coinTypeA" INT REFERENCES "coinInfo" (id),
  "coinTypeB" INT REFERENCES "coinInfo" (id),
  "creator" VARCHAR(255),
  "isStable" BOOLEAN,
  "lpFeePercent" VARCHAR(255),
  "protocolFeePercent" VARCHAR(255),
  "scaleA" VARCHAR(255),
  "scaleB" VARCHAR(255),
  "timestampMs" TIMESTAMP,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "kriyaLiquidity" (
  "txDigest" varchar(100) PRIMARY KEY,
  "liquidityProviderAddress" varchar(100),
  "lspMinted" varchar(100),
  "lspBurned" varchar(100),
  "amountA" varchar(255),
  "amountB" varchar(255),
  "convertedAmountA" float,
  "convertedAmountB" float,
  "amountAUsd" float,
  "amountBUsd" float,
  "pool" varchar(255) REFERENCES "kriyaPool" ("poolId"),
  "timestampMs" TIMESTAMP,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE "kriyaSwap" (
  "txDigest" varchar(100),
  "poolId" VARCHAR(250) REFERENCES "kriyaPool" ("poolId"),
  "volumeUsd" float,
  "coinIn" INT REFERENCES "coinInfo" (id),
  "coinOut" INT REFERENCES "coinInfo" (id),
  "amountIn" float,
  "amountOut" float,
  "amountInUsd" float,
  "amountOutUsd" float,
  "reserveA" varchar(255),
  "reserveB" varchar(255),
  "timestampMs" TIMESTAMP,
  "swapperAddress" varchar(100),
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
