import { Client } from "pg";
import { DataSource } from "typeorm";
import {
  CoinGeckoPriceAtDate,
  CoinGeckoToken,
  CoinInfo,
  EventStates,
  TurbosLiquidity,
  TurbosPool,
  WormholeBalanceChange,
  WormholeTransfer,
  CetusLiquidity,
  CetusSwap,
  CetusPool,
} from "./models";

const isDev = process.env.isDev === "true";

let client: Client | undefined;

export const getClient = async (): Promise<Client> => {
  if (client !== undefined) return client;

  console.log("creating new client");

  client = new Client({
    host,
    user,
    database,
    password,
  });

  await client.connect();

  return client;
};

let typeOrmClient: DataSource | undefined;

export const getTypeOrmClient = async (): Promise<DataSource> => {
  if (typeOrmClient !== undefined) return typeOrmClient;

  console.log("creating new typeorm client");

  const AppDataSource = new DataSource({
    type: "postgres",
    host,
    port: 5432,
    username: user,
    password,
    database,
    entities: [
      CoinInfo,
      EventStates,
      TurbosLiquidity,
      TurbosPool,
      WormholeTransfer,
      WormholeBalanceChange,
      CoinGeckoToken,
      CoinGeckoPriceAtDate,
      CetusPool,
      CetusLiquidity,
      CetusSwap,
    ],
    synchronize: true,
  });

  typeOrmClient = await AppDataSource.initialize();

  return typeOrmClient;
};
