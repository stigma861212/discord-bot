import { ColorResolvable, EmbedBuilder } from "discord.js";
import * as fs from 'fs';
import * as path from 'path';

const filePath = path.resolve(__dirname, '../text/data.json');
const rawData = fs.readFileSync(filePath, 'utf-8');
const data = JSON.parse(rawData);

/**Open send announcement */
export const needAnnouncement: boolean = data.needAnnouncement;

/**
 * Update info content
 */
export const announcementInfo: EmbedBuilder = new EmbedBuilder()
    .setColor(data.announcementInfo.color)
    .setTitle(data.announcementInfo.title)
    .addFields(...data.announcementInfo.fields)
    .setTimestamp(Date.now())

/**
 * Explain how to get roles
 */
export const getRolesInfo: EmbedBuilder = new EmbedBuilder()
    .setColor(data.getRolesInfo.color)
    .setTitle(data.getRolesInfo.title)
    .setDescription(data.getRolesInfo.description);

/**
 * Music bot message panel content
 */
export const musicPanel: EmbedBuilder = new EmbedBuilder()
    .setColor(data.musicPanel.color)
    .setTitle(data.musicPanel.title)
    .setDescription(data.musicPanel.description);

//#region subscribe reply
/**
 * Subscribe success message
 * @param id youtuber id
 * @param url youtuber url
 * @returns message
 */
export const subscribeSuccess = (id: string, url: string): string => {
    return `${data.subscribe.success[0]} ${id} ${data.subscribe.success[1]}${url}`
}

/**
 * Already subscribe before message
 * @param id youtuber id
 * @param url youtuber url
 * @returns message
 */
export const subscribeRepeat = (id: string, url: string): string => {
    return `${data.subscribe.repeat[0]}${id}${data.subscribe.repeat[1]}${url}`
}

export const subscribeErrorUrlFormat: string = data.subscribe.errorUrlFormat;
//#endregion

//#region unsubscribe reply
export const unsubscribeNoticeError: string = data.unsubscribe.noticeError;

export const unsubscribeCheckUrlFormat: string = data.unsubscribe.checkUrlFormat;

export const unsubscribeSuccess: string = data.unsubscribe.success;

export const unsubscribeError: string = data.unsubscribe.error;
//#endregion

//#region addmusicbot reply
export const addmusicbotChannel: string = data.addmusicbot.channel;

export const addmusicbotErrorURLFormat: string = data.addmusicbot.errorURLFormat;

export const addmusicbotUserExist: string = data.addmusicbot.userExist;

export const addmusicbotSuccess: string = data.addmusicbot.success;

export const addmusicbotUsed: string = data.addmusicbot.used;
//#endregion

//#region deletebotchannel reply
export const deleteBotChannelError: string = data.deleteBotChannel.error;

export const deleteBotChannelSuccess: string = data.deleteBotChannel.success;
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

//#region role
export const roleName: string = data.role.name;
export const roleReason: string = data.role.reason;
export const roleColor: ColorResolvable = data.role.color;
export const getRoleReact: string = data.role.getRoleReact;

//#endregion

//#region channel
export const categoryName: string = data.channel.categoryName;
export const textHomeName: string = data.channel.textHomeName;
export const textNoticeName: string = data.channel.textNoticeName;
export const textYTNotice: string = data.channel.textYTNotice;
//#endregion