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
        { name: `1. **新增小精靈唱歌斜線指令**`, value: `從後台挑出會唱歌的小精靈，輸入歌單範例 https://www.youtube.com/watch?v=影片編號&list=影片清單編號` },
        { name: `2. **新增小精靈唱歌控制台**`, value: `控制小精靈唱歌` },
        { name: `3. **內部優化**`, value: `小精靈學唱歌，購買喉糖` }
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