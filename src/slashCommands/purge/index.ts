import { ChatInputCommandInteraction, MessageFlags, TextChannel, User } from "discord.js";
import { createSlashCommand } from "../../command";
import { SlashCommand, CommandOption, CommandOptionType, OptionDataType } from "../../type";
import { purgeError, purgeSuccess } from "../../announcement";

/**Init Command info */
const initCommandInfo: Readonly<SlashCommand> = {
    name: "purge",
    description: "Delete a specified number of messages, up to 100.",
    nameLocalizations: {
        'zh-TW': '刪除頻道訊息',
    },
    descriptionLocalizations: {
        'zh-TW': '刪除當前頻道最新訊息',
    }
}

/**Init Command option group info in order */
const initOptionInfoGroup: Readonly<Array<CommandOption>> = [
    {
        name: 'amount',
        description: 'Specified number of messages, up to 100.',
        required: true,
        type: CommandOptionType.INTEGER,
        minValue: 1,
        maxValue: 100,
        nameLocalizations: {
            'zh-TW': '數量',
        },
        descriptionLocalizations: {
            'zh-TW': '刪除最新訊息數量，最小為1最大為100',
        }
    },
    {
        name: 'member',
        description: 'witch member.',
        required: false,
        type: CommandOptionType.USER,
        nameLocalizations: {
            'zh-TW': '成員',
        },
        descriptionLocalizations: {
            'zh-TW': '僅刪除選擇成員的最新訊息',
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
    const channel = data.channel;
    const [deleteAmount, user] = options as [number, User];
    await data.deferReply({ flags: MessageFlags.Ephemeral });
    if (channel instanceof TextChannel) {
        if (user != undefined) {
            const userId = user.id;
            const getMessages = await channel.messages.fetch({ limit: 100 });
            const messagesDelete = getMessages.filter((msg) => {
                const isFromTargetUser = msg.author.id === userId;
                const isRecentEnough = (Date.now() - msg.createdTimestamp) < 14 * 24 * 60 * 60 * 1000;
                return isFromTargetUser && isRecentEnough;
            }).first(deleteAmount);

            const deleteMessage = await channel.bulkDelete(messagesDelete, true);
            const mention = `<@${userId}>`;
            await data.followUp({ content: purgeSuccess(deleteMessage.size, mention) });
            setTimeout(async () => {
                await data.deleteReply();
            }, 5000);
        }
        else {
            const deleteMessage = await channel.bulkDelete(deleteAmount, true)
            await data.followUp({ content: purgeSuccess(deleteMessage.size) });
            setTimeout(async () => {
                await data.deleteReply();
            }, 5000);
        }
    }
    else {
        await data.editReply({ content: purgeError });
        setTimeout(async () => {
            await data.deleteReply();
        }, 10000);
    }
};

/**Get all `setName` string in the command in order  */
export const actionOption = getOptionsName();