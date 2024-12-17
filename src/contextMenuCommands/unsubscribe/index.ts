import { ChatInputCommandInteraction, MessageContextMenuCommandInteraction } from "discord.js";
import { createContextMenuCommand } from "../../command";
import { CommandOption, ContextMenuCommand } from "../../type";
import { getUploaderId } from "../../youTubeDataAPIv3";
import { Database, YoutuberSubscribeFields } from "../../database";
import { unsubscribeCheckUrlFormat, unsubscribeError, unsubscribeNoticeError, unsubscribeSuccess } from "../../announcement";

/**Init Command info */
const initCommandInfo: Readonly<ContextMenuCommand> = {
    name: "unsubscribe",
    type: 3,
    nameLocalizations: {
        'zh-TW': '取消Youtube頻道影片訂閱',
    },
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
export const command = createContextMenuCommand(initCommandInfo.name, initCommandInfo.type, initCommandInfo.nameLocalizations);

/**Command action */
export const action = async (data: MessageContextMenuCommandInteraction) => {
    const message = data.targetMessage;
    if (message.author.id != process.env.APPLICATION_ID) {
        data.reply(unsubscribeNoticeError);
    }
    else if (message.content.includes("https://www.youtube.com")) {
        const videoId = message.content.split("=")[1];
        const ytId = await getUploaderId(videoId);
        if (ytId == undefined) {
            data.reply(unsubscribeCheckUrlFormat);
        }
        else {
            const result = new Database().useYoutuberSubscribeTable()
                .where(YoutuberSubscribeFields.ServerId, data.guildId as string)
                .where(YoutuberSubscribeFields.YoutuberId, ytId)
                .delete(true);

            if (result) {
                data.reply(unsubscribeSuccess);
            } else {
                data.reply(unsubscribeError);
            }
        }
    }
    else {
        data.reply(unsubscribeNoticeError);
    }
};

/**Get all `setName` string in the command in order  */
export const actionOption = getOptionsName();