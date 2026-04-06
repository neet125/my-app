declare module "pg" {
  export type QueryResultRow = Record<string, unknown>;

  export interface QueryResult<T extends QueryResultRow = QueryResultRow> {
    rows: T[];
  }

  export interface PoolClient {
    query<T extends QueryResultRow = QueryResultRow>(
      text: string,
      values?: readonly unknown[]
    ): Promise<QueryResult<T>>;
    release(): void;
  }

  export interface PoolConfig {
    connectionString?: string;
  }

  export class Pool {
    constructor(config?: PoolConfig);
    connect(): Promise<PoolClient>;
    query<T extends QueryResultRow = QueryResultRow>(
      text: string,
      values?: readonly unknown[]
    ): Promise<QueryResult<T>>;
  }
}
