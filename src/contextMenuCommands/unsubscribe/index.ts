import { ChatInputCommandInteraction, MessageContextMenuCommandInteraction } from "discord.js";
import { createContextMenuCommand } from "../../command";
import { CommandOption, OptionDataType, ContextMenuCommand } from "../../type";
import { getUploaderId } from "../../youTubeDataAPIv3";
import { deleteYoutuberSubscribe } from "../../database";

/**Init Command info */
const initCommandInfo: Readonly<ContextMenuCommand> = {
    name: "unsubscribe",
    type: 3
}

/**Init Command option group info in order */
const initOptionInfoGroup: Readonly<Array<CommandOption>> = [];

/**Get OptionInfoGroup each child name */
function getOptionsName(): Array<string> {
    let optionsName: Array<string> = [];
    initOptionInfoGroup.forEach(optionInfo => {
        optionsName.push(optionInfo.name);
    });
    return optionsName
}

/**Create command */
export const command = createContextMenuCommand(initCommandInfo.name, initCommandInfo.type);

/**Command action */
export const action = async (data: MessageContextMenuCommandInteraction) => {
    const message = data.targetMessage;
    if (message.author.id != process.env.APPLICATION_ID) {
        data.reply("此功能僅可對小精靈傳送的訂閱訊息使用");
    }
    else if (message.content.includes("https://www.youtube.com")) {
        const videoId = message.content.split("=")[1];
        const channelId = await getUploaderId(videoId);
        if (channelId == undefined) {
            data.reply(`小精靈查詢不到此youtube影片資料，請確認影片格式是否正確`);
        }
        else {
            // TODO:傳送sever id 與 yt id 去刪除 db資料
            const result = deleteYoutuberSubscribe(data.guildId as string, channelId);
            data.reply("小精靈" + result);
        }
    }
    else {
        data.reply("此功能僅可對小精靈傳送的訂閱訊息使用");
    }

};

/**Get all `setName` string in the command in order  */
export const actionOption = getOptionsName();