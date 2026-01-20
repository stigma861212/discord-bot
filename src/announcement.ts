import { EmbedBuilder } from "discord.js";
import * as fs from 'fs';
import * as path from 'path';

const baseDir = (process as { pkg?: unknown }).pkg
    ? path.dirname(process.execPath)
    : path.resolve(__dirname, '..');
const filePath = path.join(baseDir, 'text', 'data.json');
const rawData = fs.readFileSync(filePath, 'utf-8');
const data = JSON.parse(rawData);

/**
 * Music bot message panel content
 */
export const musicPanel: EmbedBuilder = new EmbedBuilder()
    .setColor(data.musicPanel.color)
    .setTitle(data.musicPanel.title)
    .setDescription(data.musicPanel.description);

//#region addmusicbot reply
export const addmusicbotChannel: string = data.addmusicbot.channel;

export const addmusicbotErrorURLFormat: string = data.addmusicbot.errorURLFormat;

export const addmusicbotUserExist: string = data.addmusicbot.userExist;

export const addmusicbotSuccess: string = data.addmusicbot.success;

export const addmusicbotUsed: string = data.addmusicbot.used;
//#endregion

//#region purge reply
/**
 * purgeSuccess message
 * @param amount delete message amount
 * @param user message user
 * @returns message string
 */
export const purgeSuccess = (amount: number, user?: string): string => {
    if (user) {
        return `${data.purge.success.user[0]} ${amount} ${data.purge.success.user[1]} ${user} ${data.purge.success.user[2]}`;
    }
    else {
        return `${data.purge.success.nouser[0]} ${amount} ${data.purge.success.nouser[1]}`;
    }
}

export const purgeError: string = data.purge.error
//#endregion