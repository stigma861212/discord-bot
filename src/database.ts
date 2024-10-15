import path from "path";
import { DiscordData, YoutuberSubscribeData } from "./type";
import BetterSqlite3 from 'better-sqlite3';

export const initDB = () => {
    startGuildDB();
    // consoleDB();
}

/**Insert id data */
export const insertDB = (server_id: string, server_name: string, channel_id: string) => {
    const db = startGuildDB();

    const insertStmt = db.prepare("INSERT OR IGNORE INTO Guild (server_id, server_name, channel_id) VALUES (?, ?, ?)");
    insertStmt.run(server_id, server_name, channel_id);

    // consoleDB();
};

/**Delete id data*/
export const deleteDB = (server_id: string) => {
    const db = startGuildDB();
};

/**Close DB*/
export const closeDB = () => {
    const db = startGuildDB();
    // 關閉數據庫
    db.close();
    const db2 = startYoutuberSubscribeDB();
    db2.close();
}

/**Dev */
const consoleDB = () => {
    const db = startGuildDB();
    const rows = db.prepare("SELECT server_id, server_name, channel_id FROM Guild").all() as DiscordData[];
    rows.forEach(row => {
        console.log(`${row.server_id}, ${row.server_name}, ${row.channel_id}`);
    });
    db.close();
};

/**Create and exec GuildDB */
function startGuildDB(): BetterSqlite3.Database {
    const dbPath = path.join(__dirname, "../dataBase/app.db");
    const db = new BetterSqlite3(dbPath);
    db.exec(`CREATE TABLE IF NOT EXISTS Guild (
        server_id TEXT PRIMARY KEY,
        server_name TEXT NOT NULL,
        channel_id TEXT NOT NULL
    )`);

    return db
}

export const setYoutuberSubscribeDB = (server_id: string, url: string, yt_id: string, channel_id: string): boolean => {
    const db = startYoutuberSubscribeDB();

    const insertStmt = db.prepare("INSERT OR IGNORE INTO YoutuberSubscribe (server_id, youtuber_url, youtuber_id, channel_id) VALUES (?, ?, ?, ?)");
    const result = insertStmt.run(server_id, url, yt_id, channel_id);
    return result.changes !== 0;
}

function startYoutuberSubscribeDB(): BetterSqlite3.Database {
    const tableName = "YoutuberSubscribe";
    const dbPath = path.join(__dirname, "../dataBase/app.db");
    const db = new BetterSqlite3(dbPath);
    db.exec(`CREATE TABLE IF NOT EXISTS ${tableName} (
        server_id TEXT NOT NULL,
        youtuber_url TEXT NOT NULL,
        youtuber_id TEXT NOT NULL,
        channel_id TEXT NOT NULL,
        FOREIGN KEY (server_id) REFERENCES Guild(server_id) ON DELETE CASCADE,
        UNIQUE (server_id, youtuber_url)
    )`);

    return db
}

export function getNowYoutuberSubscribeData(): Array<YoutuberSubscribeData> {
    const tableName = "YoutuberSubscribe";
    return isTableExists(tableName) ? startYoutuberSubscribeDB().prepare(`SELECT * FROM ${tableName}`).all() as Array<YoutuberSubscribeData> : [];
}

/**
 * Check table exists
 * @param tableName table name
 * @returns exists or not
 */
function isTableExists(tableName: string) {
    const db = startYoutuberSubscribeDB();
    const statement = db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name = ?`);
    const result = statement.get(tableName);
    return !!result;
}