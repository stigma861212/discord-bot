import { ChatInputCommandInteraction } from "discord.js";
import { createSlashCommand } from "../../command";
import { SlashCommand, CommandOption, CommandOptionType, OptionDataType } from "../../type";
import { Database, GuildFields, YoutuberSubscribeFields } from "../../database";
import { getUsernameId } from "../../youTubeDataAPIv3";

/**Init Command info */
const initCommandInfo: Readonly<SlashCommand> = {
    name: "subscribe",
    description: "Subscribe to a YouTuber to get notified of new video posts every hour."
}

/**Init Command option group info in order */
const initOptionInfoGroup: Readonly<Array<CommandOption>> = [
    {
        name: 'url',
        description: 'Youtuber profile url',
        required: true,
        type: CommandOptionType.STRING
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

        data.reply(result ? `訂閱 ${ytID} 成功 \n${options[0]}` : `已經訂閱過${ytID}了，是不是在搞??? \n${options[0]}`);
    }
    else {
        data.reply(`你確定網址沒錯?`);
    }
};

/**Get all `setName` string in the command in order  */
export const actionOption = getOptionsName();