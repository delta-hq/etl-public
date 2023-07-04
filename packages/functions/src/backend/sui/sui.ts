import { getTypeOrmClient } from "src/indexing/services/db";
import { ApiHandler } from "sst/node/api";
import { createError, createResponse } from "../utils";
import {
  getChainCountsQuery,
  VOLUME_QUERY,
  WORMHOLE_TOP_ADDRESSES,
  WORMHOLE_DAILY_TRANSFERS,
  WORMHOLE_CUMULATIVE_TRANSFERS,
  getWormholeTopAddressesQuery,
} from "./suiQueries";
import { SA_EMAIL, SA_PKEY, SA_SCOPES, SPREADSHEET_ID, SHEET_NAME } from "./google";
import { google } from "googleapis"

// /sui/wormhole/chain-counts  query inflow/outflow and optional date,

// destination chain daily transfers
// destination chain transfers
// source chain daily
// source chain transfers

// /sui/wormhole/volume  optional timeframe
// worm hole daily usd
// worm hole weekly usd value transfers
// wormhole monthly usd values

// sui/wormhole/addresses
// worm hole top address transfers

// sui/wormhole/transfer-counts
// wormhole daily transfers
// wormhole cumulative transfers

interface ChainCountQueryParams {
  isDaily?: string;
  isTransferToSui?: string;
}

export const getWormholeChainCounts = ApiHandler(async (_evt) => {
  try {
    const client = await getTypeOrmClient();
    const params =
      _evt.queryStringParameters as unknown as ChainCountQueryParams;

    const isDaily = params?.isDaily?.toLowerCase() === "true";
    const isTransferToSui = params?.isTransferToSui?.toLowerCase() === "true";

    const query = getChainCountsQuery(isDaily, isTransferToSui);
    const result = await client.query(query);

    return createResponse(result);
  } catch (err) {
    return createError(_evt.queryStringParameters, err);
  }
});

interface WormholeVolumeQueryParams {
  timeFrame: "day" | "week" | "month";
}

export const getWormholeVolume = ApiHandler(async (_evt) => {
  try {
    const client = await getTypeOrmClient();
    const params =
      _evt.queryStringParameters as unknown as WormholeVolumeQueryParams;
    const result = await client.query(VOLUME_QUERY, [params.timeFrame]);

    return createResponse(result);
  } catch (err) {
    return createError(_evt.queryStringParameters, err);
  }
});

export const getTopWormholeAddresses = ApiHandler(async (_evt) => {
  try {
    const client = await getTypeOrmClient();
    const query = await getWormholeTopAddressesQuery(100);
    const result = await client.query(query);

    return createResponse(result);
  } catch (err) {
    return createError({}, err);
  }
});

interface WormholeTransferQueryParams {
  isDaily: boolean;
}

export const getWormholeTransferCounts = ApiHandler(async (_evt) => {
  try {
    const client = await getTypeOrmClient();
    const params =
      _evt.queryStringParameters as unknown as WormholeTransferQueryParams;
    const query = params.isDaily
      ? WORMHOLE_DAILY_TRANSFERS
      : WORMHOLE_CUMULATIVE_TRANSFERS;

    const result = await client.query(query);

    return createResponse(result);
  } catch (err) {
    return createError({}, err);
  }
});

export const getSpreadsheet = ApiHandler(async (_evt) => {
  try {
    const authClient = new google.auth.JWT({
      email: SA_EMAIL,
      key: SA_PKEY,
      scopes: SA_SCOPES,
    });
    const sheets = google.sheets({ version: 'v4', auth: authClient });
    let sheet = await sheets.spreadsheets.values.get(
      {
        spreadsheetId: SPREADSHEET_ID,
        range: SHEET_NAME,
      }
    );
    const sheet_data = sheet.data.values!
    const headers = [];
    const rows = [];
    for (let i = 0; i < sheet_data[0].length; i++) {
      headers.push(sheet_data[0][i]);
    }
    for (let i = 1; i < sheet_data.length; i++) {
      const row = sheet_data[i];
      const rowData: { [key: string]: string } = {};
      for (let j = 0; j < sheet_data[i].length; j++) {
        rowData[headers[j]] = sheet_data[i][j]
      }
      rows.push(rowData);
    }
    return createResponse(rows);
  } catch (err) {
    return createError(_evt.queryStringParameters, err);
  }
});
