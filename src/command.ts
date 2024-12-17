import { ContextMenuCommandBuilder, LocalizationMap, SlashCommandBuilder, SlashCommandIntegerOption, SlashCommandOptionsOnlyBuilder } from "discord.js";
import { CommandOption, CommandOptionType } from "./type";
import ClientDataManager from "./clientDataManager";

/**
 * Create slash command rules
 * @param name command name
 * @param description command description
 * @param optionsData each options name group
 * @returns command
 */
export const createSlashCommand = (name: Readonly<string>, description: Readonly<string>, optionsData: Readonly<CommandOption[]>) => {
    const command = new SlashCommandBuilder()
        .setName(name)
        .setDescription(description);

    // console.log("optionsData:", optionsData);
    optionsData.forEach(data => {
        switch (data.type) {
            case CommandOptionType.STRING:
                command.addStringOption(option => {
                    option
                        .setName(data.name)
                        .setDescription(data.description)
                        .setRequired(data.required);
                    if (data.nameLocalizations) option.setNameLocalizations(data.nameLocalizations);
                    if (data.descriptionLocalizations) option.setDescriptionLocalizations(data.descriptionLocalizations);
                    return option;
                }
                );
                break;
            case CommandOptionType.INTEGER:
                command.addIntegerOption(option => {
                    option
                        .setName(data.name)
                        .setDescription(data.description)
                        .setRequired(data.required)
                    if (data.maxValue) option.setMaxValue(data.maxValue);
                    if (data.minValue) option.setMinValue(data.minValue);
                    if (data.nameLocalizations) option.setNameLocalizations(data.nameLocalizations);
                    if (data.descriptionLocalizations) option.setDescriptionLocalizations(data.descriptionLocalizations);
                    return option;
                });
                break;
            case CommandOptionType.BOOLEAN:
                command.addBooleanOption(option => {
                    option
                        .setName(data.name)
                        .setDescription(data.description)
                        .setRequired(data.required)
                    if (data.nameLocalizations) option.setNameLocalizations(data.nameLocalizations);
                    if (data.descriptionLocalizations) option.setDescriptionLocalizations(data.descriptionLocalizations);
                    return option;
                });
                break;
            case CommandOptionType.CHANNEL:
                command.addChannelOption(option => {
                    option
                        .setName(data.name)
                        .setDescription(data.description)
                        .setRequired(data.required)
                    if (data.nameLocalizations) option.setNameLocalizations(data.nameLocalizations);
                    if (data.descriptionLocalizations) option.setDescriptionLocalizations(data.descriptionLocalizations);
                    return option;
                });
                break;
            case CommandOptionType.MENTIONABLE:
                command.addMentionableOption(option => {
                    option
                        .setName(data.name)
                        .setDescription(data.description)
                        .setRequired(data.required)
                    if (data.nameLocalizations) option.setNameLocalizations(data.nameLocalizations);
                    if (data.descriptionLocalizations) option.setDescriptionLocalizations(data.descriptionLocalizations);
                    return option;
                });
                break;
            case CommandOptionType.ROLE:
                command.addRoleOption(option => {
                    option
                        .setName(data.name)
                        .setDescription(data.description)
                        .setRequired(data.required)
                    if (data.nameLocalizations) option.setNameLocalizations(data.nameLocalizations);
                    if (data.descriptionLocalizations) option.setDescriptionLocalizations(data.descriptionLocalizations);
                    return option;
                });
                break;
            case CommandOptionType.USER:
                command.addUserOption(option => {
                    option
                        .setName(data.name)
                        .setDescription(data.description)
                        .setRequired(data.required)
                    if (data.nameLocalizations) option.setNameLocalizations(data.nameLocalizations);
                    if (data.descriptionLocalizations) option.setDescriptionLocalizations(data.descriptionLocalizations);
                    return option;
                });
                break;
        }
    });

    return command;
}

export const createContextMenuCommand = (name: Readonly<string>, type: number, nameLocalizations?: LocalizationMap) => {
    const command = new ContextMenuCommandBuilder()
        .setName(name)
        .setType(type);  // 3 代表 'MESSAGE' 型的上下文菜單命令
    if (nameLocalizations) command.setNameLocalizations(nameLocalizations);

    return command;
}

export const deletetemp = async () => {
    const commands = await ClientDataManager.getInstance().getClient().application?.commands.fetch();
    console.log("deletetemp", commands);
    // commands?.forEach(async command => {
    //     await ClientDataManager.getInstance().getClient().application?.commands.delete(command.id);
    // });
    // console.log("deletetemp done");
}