import { ApiHandler } from "sst/node/api";
import { Connection } from "postgresql-client";
import { createError, createResponse } from "./utils";
import { start } from "repl";

const getConnection = async (): Promise<Connection> => {
  const connection = new Connection();
  await connection.connect();

  return connection;
};

interface DataRequestBody {
  table: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

const getStartAndEndDateQueries = ({
  table,
  startDate,
  queryParams,
  endDate,
}: {
  table: string;
  startDate: string;
  queryParams: string;
  endDate: string;
}): [string, string] => {
  const timeClause =
    table === "lido_pool_specific_breakdown_tvl" ? "day" : "time";

  const startDateClause = startDate
    ? `${queryParams ? "AND" : "WHERE"} ${timeClause} >= '${startDate}'`
    : "";

  const endDateAndOrWere = startDate || queryParams ? "AND" : "WHERE";
  const endDateClause = endDate
    ? `${endDateAndOrWere} ${timeClause} <= '${endDate}'`
    : "";

  return [startDateClause, endDateClause];
};

export const data = ApiHandler(async (_evt) => {
  const connection = await getConnection();
  const body = JSON.parse(_evt.body ?? "{}");

  try {
    const { table, limit, offset, startDate, endDate, ...query } =
      body as DataRequestBody;

    const queryParams = Object.entries(query)
      .filter(([q, value]) => !!value)
      .map(([q, value]) => `${q}='${value}'`)
      .join(" AND ");

    const whereClause = queryParams ? `WHERE ${queryParams}` : "";
    const [startDateClause, endDateClause] = getStartAndEndDateQueries({
      table,
      startDate: startDate ?? "",
      endDate: endDate ?? "",
      queryParams,
    });

    const offsetClause = offset ? `offset ${offset}` : "";
    const limitClause = limit ? `limit ${limit}` : "";
    const finalQuery = `SELECT * FROM ${table} ${whereClause} ${startDateClause} ${endDateClause} ${offsetClause} ${limitClause}`;

    console.log(finalQuery);

    const result = await connection.query(finalQuery);

    return createResponse(result);
  } catch (err) {
    return createError(body, err);
  } finally {
    await connection.close();
  }
});

interface DistinctRequestBody {
  table: string;
  duration?: string;
  column: string;
}

export const distinct = ApiHandler(async (_evt) => {
  const connection = await getConnection();
  const body = JSON.parse(_evt.body ?? "{}") as DistinctRequestBody;

  try {
    const { table, duration, column } = body;

    const result = await connection.query(
      `SELECT DISTINCT ${column} from ${table} ${
        duration ? `where duration='${duration}'` : ``
      };`
    );

    return createResponse(result);
  } catch (err) {
    return createError(body, err);
  } finally {
    await connection.close();
  }
});
