/**
 * Minimal ambient types for the built-in `node:sqlite` module.
 *
 * @types/node in this project predates Node's sqlite module, so TypeScript
 * has no declarations for it — this covers only the API surface we use.
 */
declare module "node:sqlite" {
  export class StatementSync {
    run(...params: unknown[]): { lastInsertRowid: number | bigint; changes: number | bigint };
    get(...params: unknown[]): unknown;
    all(...params: unknown[]): unknown[];
  }

  export class DatabaseSync {
    constructor(path: string);
    exec(sql: string): void;
    prepare(sql: string): StatementSync;
    close(): void;
  }
}
