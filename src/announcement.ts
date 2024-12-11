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
        { name: `1. **音樂面板改由放入創建的頻道使用**`, value: `避免訊息洗掉音樂面板` },
        { name: `2. **/addmusicbot指令防呆**`, value: `網址錯誤訊息提示` },
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