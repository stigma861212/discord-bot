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
        { name: `1. **音樂清單目前會自動跳過需驗證的歌**`, value: `等待各套件更新youtube issue 3bb1f723` },
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