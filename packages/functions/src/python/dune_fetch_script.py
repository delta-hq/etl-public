import argparse
import datetime
import logging
import time
from dataclasses import dataclass, field
from itertools import product
from typing import List, Optional

import psycopg2
from psycopg2 import sql
from requests import get, post



@dataclass
class DuneQueryExecution:
    execution_id: str
    state: str
    params: dict

    @property
    def duration(self):
        return self.params["Duration"]


@dataclass
class DuneQuery:
    query_id: str
    table_name: str
    columns: List[str]
    query_params: Optional[dict] = field(default_factory=lambda: {})
    executions: Optional[List[DuneQueryExecution]] = field(default_factory=lambda: [])

    def param_combinations(self):
        list_of_params = []
        for parameter, values in self.query_params.items():
            list_of_params.append([(parameter, value) for value in values])

        return product(*list_of_params)





def make_api_url(module, action, ID):
    """
    We shall use this function to generate a URL to call the API.
    """
    url = BASE_URL + module + "/" + ID + "/" + action
    return url


def execute_query(query_id, engine="medium"):
    """
    Takes in the query ID and engine size.
    Specifying the engine size will change how quickly your query runs.
    The default is "medium" which spends 10 credits, while "large" spends 20 credits.
    Calls the API to execute the query.
    Returns the execution ID of the instance which is executing the query.
    """
    url = make_api_url("query", "execute", query_id)
    params = {
        "performance": engine,
    }
    response = post(url, headers=HEADER, params=params)
    execution_id = response.json()["execution_id"]
    return execution_id


def execute_query_with_params(query_id, param_dict, engine="medium"):
    """
    Takes in the query ID. And a dictionary containing parameter values.
    Calls the API to execute the query.
    Returns the execution ID of the instance which is executing the query.
    """
    url = make_api_url("query", "execute", query_id)
    for attempt in range(5):
        try:
            response = post(
                url,
                headers=HEADER,
                json={
                    "query_parameters": param_dict,
                    "performance": engine,
                },
            )
            response_json = response.json()
            execution_id = response_json["execution_id"]
        except Exception:
            if response_json == {"error": "too many requests"}:
                time_to_sleep = 2**attempt
                LOGGER.info(
                    f"too many requests, sleeping for {time_to_sleep} second then retrying"
                )
                time.sleep(time_to_sleep)
            else:
                LOGGER.exception("something went wrong")
                raise
        else:
            break
    return execution_id


def get_query_status(execution_id):
    """
    Takes in an execution ID.
    Fetches the status of query execution using the API
    Returns the status response object
    """

    url = make_api_url("execution", "status", execution_id)
    response = get(url, headers=HEADER)

    return response


def get_query_results(execution_id):
    """
    Takes in an execution ID.
    Fetches the results returned from the query using the API
    Returns the results response object
    """

    url = make_api_url("execution", "results", execution_id)
    response = get(url, headers=HEADER)

    return response


def cancel_query_execution(execution_id):
    """
    Takes in an execution ID.
    Cancels the ongoing execution of the query.
    Returns the response object.
    """

    url = make_api_url("execution", "cancel", execution_id)
    response = get(url, headers=HEADER)

    return response


def generate_insert_statement(dune_query: DuneQuery):
    """
    Generates a postgres insert statement for a DuneQuery object.
    """
    columns = dune_query.columns
    ex_list = ["excluded"] * len(columns)
    return sql.SQL(
        "INSERT INTO {} ({}) VALUES ({}) ON CONFLICT ON CONSTRAINT {} DO UPDATE SET ({}) = ({})"
    ).format(
        sql.Identifier(dune_query.table_name),
        sql.SQL(", ").join(map(sql.Identifier, columns)),
        sql.SQL(", ").join(map(sql.Placeholder, columns)),
        sql.Identifier(f"{dune_query.table_name}_pkey"),
        sql.SQL(", ").join(map(sql.Identifier, columns)),
        sql.SQL(", ").join(map(sql.Identifier, ex_list, columns)),
    )


def all_queries_completed(dune_queries: List[DuneQuery]):
    """
    Takes in a list of DuneQuery objects.
    Checks if all executions of the DuneQuery objects are completed.
    """
    for dune_query in dune_queries:
        for execution in dune_query.executions:
            if execution.state != "QUERY_STATE_COMPLETED":
                return False
    return True


def upsert_into_db(dune_query, execution, curs):
    response = get_query_results(execution.execution_id)
    result_json = response.json()["result"]
    rows = result_json["rows"]

    query_param_cols = {key.lower(): value for key, value in execution.params.items()}
    for row in rows:
        row.update(query_param_cols)

    curs.executemany(
        generate_insert_statement(dune_query),
        rows,
    )
    LOGGER.info(f"upserted {len(rows)} rows for params {execution.params}")


def fetch_data_and_upsert(dune_queries, engine_size: str):
    total = 0
    for dune_query in dune_queries:
        for params in dune_query.param_combinations():
            query_params = dict(params)
            execution_id = execute_query_with_params(
                dune_query.query_id, query_params, engine=engine_size
            )
            LOGGER.info(
                f"query_id: {dune_query.query_id}, query_params: {query_params}, execution_id: {execution_id}"
            )

            dune_query.executions.append(
                DuneQueryExecution(
                    execution_id=execution_id,
                    state="QUERY_STATE_PENDING",
                    params=query_params,
                )
            )
            total += 1

    queries_running = True
    counter = 0
    LOGGER.info(dune_queries)
    while queries_running:
        with get_db_conn() as conn:
            with conn.cursor() as curs:
                for dune_query in dune_queries:
                    for execution in dune_query.executions:
                        if execution.state not in [
                            "QUERY_STATE_COMPLETED",
                            "QUERY_STATE_FAILED",
                        ]:
                            query_status = get_query_status(execution.execution_id)
                            query_status_json = query_status.json()
                            query_status_state = query_status_json["state"]
                            execution.state = query_status_state
                            if query_status_state == "QUERY_STATE_COMPLETED":
                                LOGGER.info(
                                    f"execution_id {execution.execution_id} and params {execution.params} finished executing"
                                )
                                upsert_into_db(dune_query, execution, curs)
                                conn.commit()
                                counter += 1
                                LOGGER.info(f"finished {counter} out of {total}")
                            elif query_status_state == "QUERY_STATE_FAILED":
                                execution.state = "QUERY_STATE_FAILED"
                                LOGGER.info(
                                    f"execution_id {execution.execution_id} and params {execution.params} failed"
                                )
                            else:
                                LOGGER.info(
                                    f"current state for execution_id {execution.execution_id}: {execution.state}"
                                )

        if all_queries_completed(dune_queries):
            queries_running = False
        else:
            LOGGER.info("sleeping for 15 seconds")
            time.sleep(15)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="script for fetching and updating dune data"
    )
    parser.add_argument(
        "query", type=int, help="index for which query to run, starts with 0"
    )
    parser.add_argument(
        "size", type=str, help="engine size for query", nargs="?", default="medium"
    )
    args = parser.parse_args()

    dune_queries = [
        DuneQuery(
            query_id="2605618",
            table_name="lido_overview_data",
            columns=[
                "platform",
                "network",
                "pair",
                "fee",
                "fee_per_tvl",
                "volume",
                "volume_per_tvl",
                "tvl",
                "duration",
            ],
            # query_params={
            #     "Duration": [
            #         "24h",
            #         "7d",
            #         "30d",
            #         "12m",
            #         "All",
            #     ],
            # },
        ),
        DuneQuery(
            query_id="2508935",
            table_name="lido_volume_per_venue",
            columns=[
                "project_network",
                "project",
                "network",
                "duration",
                "weth_volume",
                "weth_fee",
                "weth_tvl",
                "wsteth_volume",
                "wsteth_fee",
                "wsteth_tvl",
                "volume_diff_per_tvl_diff",
                "fee_diff_per_tvl_diff",
            ],
            # query_params={
            #     "Duration": [
            #         "24h",
            #         "7d",
            #         "30d",
            #         "12m",
            #         "All",
            #     ],
            # },
        ),
        DuneQuery(
            query_id="2508936",
            table_name="lido_dex_breakdown",
            columns=[
                "quote_asset_symbol",
                "project",
                "network",
                "duration",
                "wsteth_volume",
                "wsteth_fee",
                "wsteth_tvl",
                "weth_volume",
                "weth_fee",
                "weth_tvl",
                "volume_diff_per_tvl_diff",
                "fee_diff_per_tvl_diff",
            ],
            # query_params={
            #     "Duration": [
            #         "24h",
            #         "7d",
            #         "30d",
            #         "12m",
            #         "All",
            #     ],
            #     "Chain": [
            #         "ethereum",
            #         "optimism",
            #         "arbitrum",
            #     ],
            #     "DEX": [
            #         "uniswap",
            #         "curve",
            #         "velodrome",
            #     ],
            # },
        ),
        DuneQuery(
            query_id="2511629",
            table_name="lido_pool_specific_breakdown_volume_fee",
            columns=[
                "duration",
                "time",
                "network",
                "project",
                "pool_fee",
                "wsteth_volume",
                "wsteth_fee",
                "weth_volume",
                "weth_fee",
            ],
            # query_params={
            #     "Duration": [
            #         "24h",
            #         "7d",
            #         "30d",
            #         "12m",
            #         "All",
            #     ],
            #     "Chain": [
            #         "ethereum",
            #         "optimism",
            #         "arbitrum",
            #     ],
            #     "DEX": [
            #         "uniswap",
            #         "curve",
            #         "velodrome",
            #     ],
            #     "Pool": [
            #         "USDC 0.05%",
            #         "USDT 0.05%",
            #         "USDC 0.01%",
            #         "USDT 0.3%",
            #         "USDC 0.02%",
            #         "USDT 0.04%",
            #         "USDC 0.3%",
            #     ],
            # },
        ),
        DuneQuery(
            query_id="2511721",
            table_name="lido_pool_specific_breakdown_trades",
            columns=[
                "pool_fee",
                "network",
                "project",
                "duration",
                "user_type",
                "wsteth_volume",
                "weth_volume",
            ],
            # query_params={
            #     "Duration": [
            #         "24h",
            #         "7d",
            #         "30d",
            #         "12m",
            #         "All",
            #     ],
            #     "Chain": [
            #         "ethereum",
            #         "optimism",
            #         "arbitrum",
            #     ],
            #     "DEX": [
            #         "uniswap",
            #         "curve",
            #         "velodrome",
            #     ],
            #     "Pool": [
            #         "USDC 0.05%",
            #         "USDT 0.05%",
            #         "USDC 0.01%",
            #         "USDT 0.3%",
            #         "USDC 0.02%",
            #         "USDT 0.04%",
            #         "USDC 0.3%",
            #     ],
            # },
        ),
        DuneQuery(
            query_id="2511730",
            table_name="lido_pool_specific_breakdown_tvl",
            columns=[
                "duration",
                "day",
                "project",
                "network",
                "pool_fee",
                "weth_tvl",
                "wsteth_tvl",
            ],
        ),
    ]

    start = time.time()
    fetch_data_and_upsert([dune_queries[args.query]], engine_size=args.size)
    finished = time.time()
    LOGGER.info(str(datetime.timedelta(seconds=(finished - start))))
