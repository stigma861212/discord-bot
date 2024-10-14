import { ChatInputCommandInteraction, DMChannel, MediaChannel, TextChannel, VoiceChannel } from "discord.js";
import { createCommand } from "../command";
import { Command, CommandOption, CommandOptionType, OptionDataType } from "../../type";

/**Init Command info */
const initCommandInfo: Readonly<Command> = {
    name: "purge",
    description: "Delete a specified number of messages, up to 100."
}

/**Init Command option group info in order */
const initOptionInfoGroup: Readonly<Array<CommandOption>> = [
    {
        name: 'amount',
        description: 'Specified number of messages, up to 100.',
        required: true,
        type: CommandOptionType.INTEGER,
        minValue: 1,
        maxValue: 100
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
export const command = createCommand(initCommandInfo.name, initCommandInfo.description, initOptionInfoGroup);

/**Command action */
export const action = async (data: ChatInputCommandInteraction, options: Array<OptionDataType>) => {
    const channel = data.channel;
    const deleteAmount = options[0] as number;
    await data.deferReply({ ephemeral: true });
    if (channel instanceof TextChannel) {
        await channel.bulkDelete(deleteAmount, true).then(async (messages) => {
            await data.followUp({ content: `已成功刪除 ${messages.size} 條訊息` }).then(async () => {
                setTimeout(async () => {
                    await data.deleteReply();
                }, 1500);
            });
        });
    }
    else {
        await data.followUp({ content: "該頻道不支持批量刪除訊息，僅支持一般文字頻道。\n如有刪除需求請私訊管理員", ephemeral: true }).then(() => {
            setTimeout(async () => {
                await data.deleteReply();
            }, 10000);
        });
    }
};

/**Get all `setName` string in the command in order  */
export const actionOption = getOptionsName();