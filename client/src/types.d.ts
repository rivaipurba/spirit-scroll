declare module "bun:sqlite" {
    export class Database {
        constructor(filename: string, options?: any);
        query(sql: string): any;
        prepare(sql: string): any;
        transaction(fn: Function): any;
        close(): void;
    }
}
