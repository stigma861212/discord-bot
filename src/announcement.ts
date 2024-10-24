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
        { name: `1. **新增小精靈領土功能**`, value: `小精靈進到伺服器後會自動霸佔部分空間，創建頻道、分類來處理通知。這些頻道與分類可以更改位置與更換名稱，但更換名稱並不會改變頻道作用，刪除將會無法接收頻道對應消息` },
        { name: `2. **內部優化**`, value: `捕捉更多小精靈` }
    )
    .setTimestamp(Date.now())
