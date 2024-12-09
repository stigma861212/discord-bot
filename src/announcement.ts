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
        { name: `1. **音樂功能修正超時訊息時無法刪除錯誤問題**`, value: `音樂面板超過15分鐘刪除互動已正常運作` },
        { name: `2. **音樂監聽**`, value: `開啟對Stream監測，規劃AudioResource預加載方式` },
        { name: `3. **音樂面板功能簡化**`, value: `刪除互動訊息以簡化流程` },
        { name: `4. **音樂面板按鈕新增**`, value: `新增清單隨機與清單網址按鈕` },
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