import path from "path";
import BetterSqlite3 from 'better-sqlite3';

/**
 * Discord sever db fields name
 */
export enum GuildFields {
    ServerId = 'server_id',
    ServerName = 'server_name',
    CategoryId = 'category_id',
    TextHomeId = 'textHome_id',
    TextNoticeId = 'textNotice_id',
    TextYTNoticeId = 'textYTNotice_id',
}

/**
 * Youtuber db fields name
 */
export enum YoutuberSubscribeFields {
    ServerId = 'server_id',
    YoutuberUrl = 'youtuber_url',
    YoutuberId = 'youtuber_id',
    TextYTNoticeId = 'textYTNotice_id',
}

/**
 * Supports table initialization, querying, conditional selection, and deletion of records.
 * Allowing multiple operations to be performed on a specific table within the same instance.
 */
export class Database {
    private db: BetterSqlite3.Database | null = null;
    private tableName: string = '';
    private fields: string[] = [];
    private conditions: string[] = [];
    private params: any[] = [];
    private isTableInitialized = false;

    // init Guild table
    useGuildTable(): Database {
        const dbPath = path.join(__dirname, "../dataBase/app.db");
        this.db = new BetterSqlite3(dbPath);
        this.tableName = "Guild";
        this.db.exec(`CREATE TABLE IF NOT EXISTS ${this.tableName} (
            server_id TEXT PRIMARY KEY,
            server_name TEXT NOT NULL,
            category_id TEXT NOT NULL,
            textHome_id TEXT NOT NULL,
            textNotice_id TEXT NOT NULL,
            textYTNotice_id TEXT NOT NULL
        )`);
        this.isTableInitialized = true;
        return this;
    }

    // init YoutuberSubscribe table
    useYoutuberSubscribeTable(): Database {
        const dbPath = path.join(__dirname, "../dataBase/app.db");
        this.db = new BetterSqlite3(dbPath);
        this.tableName = "YoutuberSubscribe";
        this.db.exec(`CREATE TABLE IF NOT EXISTS ${this.tableName} (
            server_id TEXT NOT NULL,
            youtuber_url TEXT NOT NULL,
            youtuber_id TEXT NOT NULL,
            textYTNotice_id TEXT NOT NULL,
            FOREIGN KEY (server_id) REFERENCES Guild(server_id) ON DELETE CASCADE,
            UNIQUE (server_id, youtuber_url)
        )`);
        this.isTableInitialized = true;
        return this;
    }

    /**
     * Select field to execute
     * @param field table field
     * @returns Database
     */
    select(field: GuildFields | YoutuberSubscribeFields): Database {
        this.ensureTableInitialized();
        this.fields.push(field);
        return this;
    }

    /**
     * Add condition when use select or delete
     * example: select + select + delete or select + select + execute
     * @param condition Fields condition
     * @param param Search data
     * @returns Database
     */
    where(condition: string, param: any): Database {
        this.ensureTableInitialized();
        this.conditions.push(`${condition} = ?`);
        this.params.push(param);
        return this;
    }

    /**
     * Get result data when use select(and where)
     * @returns 
     */
    execute(): any {
        this.ensureTableInitialized();
        const fieldsToSelect = this.fields.length > 0 ? this.fields.join(", ") : "*";
        const whereClause = this.conditions.length > 0 ? `WHERE ${this.conditions.join(" AND ")}` : "";
        const query = `SELECT ${fieldsToSelect} FROM ${this.tableName} ${whereClause}`;

        return this.db!.prepare(query).all(...this.params);
    }

    /**
     * Insert data to table
     * @param data Insert data
     * @param end Is the end
     * @returns result or this
     */
    insert(data: Record<string, any>, end: boolean = false): boolean | this {
        this.ensureTableInitialized();

        const columns = Object.keys(data).join(", ");
        const placeholders = Object.keys(data).map(() => "?").join(", ");
        const query = `INSERT OR IGNORE INTO ${this.tableName} (${columns}) VALUES (${placeholders})`;

        const result = this.db!.prepare(query).run(...Object.values(data));

        return end ? result.changes != 0 : this;
    }

    /**
     * Delete data
     * @param end Is the end
     * @returns result or this
     */
    delete(end: boolean = false): boolean | this {
        this.ensureTableInitialized();
        const whereClause = this.conditions.length > 0 ? `WHERE ${this.conditions.join(" AND ")}` : "";
        const query = `DELETE FROM ${this.tableName} ${whereClause}`;
        const result = this.db!.prepare(query).run(...this.params);
        return end ? result.changes != 0 : this;
    }

    /**
     * Make sure table is initialized
     */
    private ensureTableInitialized() {
        if (!this.isTableInitialized) {
            throw new Error('Table has not been initialized. Call useGuildTable() or useYoutuberSubscribeTable() first.');
        }
    }
}