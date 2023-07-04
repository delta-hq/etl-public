import { findAndUpdateEventState, getEventState } from "../eventState";
import { getSuiKit } from "../sui";

let startTime = new Date();

export const logCurrentRunTime = (): void => {
  let endTime = new Date();
  // @ts-ignore
  let timeDiff = Math.round((endTime - startTime) / 1000);

  console.log(timeDiff + " seconds");
};

export const convertToNegative = (amount: string): string => {
  if (amount.trim() === "0") return amount;
  return "-" + amount;
};

export const convertAmount = (amount: string, decimals: number): number => {
  const value = Number(amount) / Math.pow(10, decimals);

  return value;
};

// this creates an insertion query with the object keys as the columns and the object values as the values
// so you simply need a type that matches the table you're inserting into
export const generateInsertionQuery = (
  tableName: string,
  data: Record<string, any>
): string => {
  const columns = Object.keys(data)
    .map((key) => `"${key}"`)
    .join(", ");
  const values = Object.values(data)
    .map((value) => {
      if (typeof value === "string") {
        return `'${value}'`;
      } else if (value instanceof Date) {
        return `'${value.toISOString()}'`;
      } else {
        return String(value);
      }
    })
    .join(", ");

  return `INSERT INTO "${tableName}" (${columns}) VALUES (${values})`;
};

export const generateExistsQuery = (
  tableName: string,
  data: Record<string, any>
): string => {
  const conditions = Object.entries(data)
    .map(([key, value]) => {
      if (typeof value === "string") {
        return `"${key}" = '${value}'`;
      } else if (value instanceof Date) {
        return `"${key}" = '${value.toISOString()}'`;
      } else {
        return `"${key}" = ${value}`;
      }
    })
    .join(" AND ");

  return `SELECT EXISTS(SELECT 1 FROM "${tableName}" WHERE ${conditions})`;
};

// generic processor function
export const processor = async (
  event: string,
  process: Function,
  limit: number = 50,
  devMode: boolean = false
) => {
  const suiKit = getSuiKit();
  let cursor = {};
  let hasNext = true;

  while (hasNext) {
    if (JSON.stringify(cursor) === "{}" && devMode === false) {
      const eventState = await getEventState(event);

      if (eventState) {
        cursor = {
          cursor: {
            txDigest: eventState.nextCursorTxDigest,
            eventSeq: eventState.nextCursorEventSeq,
          },
        };
      }
    }

    const results = await suiKit.rpcProvider.provider.queryEvents({
      query: {
        MoveEventType: event,
      },
      ...cursor,
      limit,
      order: "ascending",
    });

    if (results.data.length === 0 && devMode === true) {
      console.log("no results returned");
      console.log(event);
    }

    for (const result of results.data) {
      await process(result);
    }

    if (
      results.nextCursor?.txDigest !== undefined &&
      results.nextCursor.eventSeq !== undefined &&
      devMode === false
    ) {
      await findAndUpdateEventState(
        event,
        results.nextCursor.txDigest,
        results.nextCursor.eventSeq
      );

      cursor = {
        cursor: {
          txDigest: results.nextCursor.txDigest,
          eventSeq: results.nextCursor.eventSeq,
        },
      };
    }

    hasNext = devMode ? false : results.hasNextPage;
  }
};

export const convertTimestampToDate = (timestamp: string): Date =>
  new Date(parseInt(timestamp));
