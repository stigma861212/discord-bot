import { EmbedBuilder } from "discord.js";

/**Current version */
const announcementVersion: string = "測試";

/**
 * Update info content
 */
export const announcementInfo: EmbedBuilder = new EmbedBuilder()
    .setColor([255, 51, 51])
    .setTitle("小精靈更新資訊")
    .addFields(
        { name: `當前版本`, value: `${announcementVersion} 版` },
        { name: `1. **機器人本地化**`, value: `根據discord語言版本修改語言` },
        { name: `2. **音樂功能修正**`, value: `修正同伺服器語音頻道搶奪小精靈控制權` },
        { name: `3. **系統內部通知整合**`, value: `整合所有訊息通知設定` },
        { name: `4. **專案套件更新**`, value: `更新套件對YT相關功能穩定度` },
    )
    .setTimestamp(Date.now())

/**
 * Explain how to get roles
 */
export const getRolesInfo: EmbedBuilder = new EmbedBuilder()
    .setColor([255, 51, 51])
    .setTitle("領取身分組")
    .setDescription(`如需要訂閱影片通知請點擊下方🎟️來領取身分組`);

/**
 * Music bot message panel content
 */
export const musicPanel: EmbedBuilder = new EmbedBuilder()
    .setColor([255, 51, 51])
    .setTitle("音樂名稱")
    .setDescription("test text");


//#region subscribe reply
/**
 * Subscribe success message
 * @param id youtuber id
 * @param url youtuber url
 * @returns message
 */
export const subscribeSuccess = (id: string, url: string): string => {
    return `訂閱 ${id} 成功 \n${url}`
}
/**
 * Already subscribe before message
 * @param id youtuber id
 * @param url youtuber url
 * @returns message
 */
export const subscribeRepeat = (id: string, url: string): string => {
    return `已經訂閱過${id}了 \n${url}`
}

export const subscribeErrorUrlFormat: string = '網址格式有誤'
//#endregion

//#region unsubscribe reply
export const unsubscribeNoticeError: string = '此功能僅可對小精靈傳送的訂閱訊息使用';

export const unsubscribeCheckUrlFormat: string = '小精靈查詢不到此youtube影片資料，請確認影片格式是否正確';

export const unsubscribeSuccess: string = '小精靈成功刪除訂閱資料';

export const unsubscribeError: string = '小精靈找不到伺服器有訂閱此頻道資料或訂閱資料格式有誤';
//#endregion

//#region addmusicbot reply
export const addmusicbotErrorURLFormat: string = '❌ 無法辨識此YT播放清單，網址是否有照格式?';

export const addmusicbotUserExist: string = '⚠️ 請先加入語音頻道再使用此指令！';

export const addmusicbotSuccess: string = '✅ 已準備建立頻道放置音樂面板！';

export const addmusicbotUsed: string = '⚠️ 已在語音頻道中使用！';
//#endregion

//#region deletebotchannel reply
export const deleteBotChannelError: string = '刪除頻道時發生錯誤';

export const deleteBotChannelSuccess: string = '已刪除小精靈相關頻道，現在小精靈失業中';
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
        return `已成功刪除 ${amount} 條來自 ${user} 的最新訊息`;
    }
    else {
        return `已成功刪除 ${amount} 條訊息`;
    }
}

export const purgeError: string = '該頻道不支持批量刪除訊息，僅支持一般文字頻道。\n如有刪除需求請私訊管理員'
//#endregion