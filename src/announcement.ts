import { ButtonBuilder, ButtonStyle, ComponentEmojiResolvable, EmbedBuilder } from "discord.js";

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
        { name: `1. **優化唱歌斜線指令**`, value: `使用者輸入錯誤url不會讓小精靈休克` },
        { name: `2. **小精靈唱歌控制台簡易畫面**`, value: `控制台會顯示歌曲資訊了` },
        { name: `3. **內部優化**`, value: `小精靈合唱團報名中` }
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