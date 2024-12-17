import { ChatInputCommandInteraction } from "discord.js";
import { createSlashCommand } from "../../command";
import { SlashCommand, CommandOption, CommandOptionType, OptionDataType } from "../../type";
import { Database, GuildFields, YoutuberSubscribeFields } from "../../database";
import { getUsernameId } from "../../youTubeDataAPIv3";
import { subscribeErrorUrlFormat, subscribeRepeat, subscribeSuccess } from "../../announcement";

/**Init Command info */
const initCommandInfo: Readonly<SlashCommand> = {
    name: "subscribe",
    description: "Subscribe to a YouTuber to get notified of new video posts every hour.",
    nameLocalizations: {
        'zh-TW': '頻道影片訂閱',
    },
    descriptionLocalizations: {
        'zh-TW': '訂閱指定YouTube頻道，每小時在頻道進行新影片通知',
    }
}

/**Init Command option group info in order */
const initOptionInfoGroup: Readonly<Array<CommandOption>> = [
    {
        name: 'url',
        description: 'Youtuber profile url',
        required: true,
        type: CommandOptionType.STRING,
        nameLocalizations: {
            'zh-TW': 'url',
        },
        descriptionLocalizations: {
            'zh-TW': 'Youtube頻道主頁網址',
        }
    }
];

/**Get OptionInfoGroup each child name */
function getOptionsName(): Array<string> {
    let optionsName: Array<string> = [];
    initOptionInfoGroup.forEach(optionInfo => {
        optionsName.push(optionInfo.name);
    });
    return optionsName
}

/**Create command */
export const command = createSlashCommand(initCommandInfo.name, initCommandInfo.description, initOptionInfoGroup);

if (initCommandInfo.nameLocalizations) {
    command.setNameLocalizations(initCommandInfo.nameLocalizations);
}
if (initCommandInfo.descriptionLocalizations) {
    command.setDescriptionLocalizations(initCommandInfo.descriptionLocalizations);
}

/**Command action */
export const action = async (data: ChatInputCommandInteraction, options: Array<OptionDataType>) => {
    const ytID: string = (options[0] as string).split("@")[1];
    // TODO: 存至DB與監聽yt
    const channelId: string | undefined = await getUsernameId(ytID);
    if (channelId != undefined) {
        const noticeId: Array<{ textYTNotice_id: string }> = new Database().useGuildTable()
            .select(GuildFields.TextYTNoticeId)
            .where(GuildFields.ServerId, data.guildId)
            .execute();

        const result = new Database().useYoutuberSubscribeTable().insert({
            [YoutuberSubscribeFields.ServerId]: data.guildId,
            [YoutuberSubscribeFields.YoutuberUrl]: options[0],
            [YoutuberSubscribeFields.YoutuberId]: channelId,
            [YoutuberSubscribeFields.TextYTNoticeId]: noticeId[0].textYTNotice_id,
        }, true) as boolean;

        data.reply(result ? subscribeSuccess(ytID, options[0] as string) : subscribeRepeat(ytID, options[0] as string));
    }
    else {
        data.reply(subscribeErrorUrlFormat);
    }
};

/**Get all `setName` string in the command in order  */
export const actionOption = getOptionsName();