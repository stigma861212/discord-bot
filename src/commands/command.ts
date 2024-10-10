import { SlashCommandBuilder, SlashCommandIntegerOption, SlashCommandOptionsOnlyBuilder } from "discord.js";
import { CommandOption, CommandOptionType } from "../type";

/**
 * Create command rules
 * @param name command name
 * @param description command description
 * @param optionsData each options name group
 * @returns command
 */
export const createCommand = (name: Readonly<string>, description: Readonly<string>, optionsData: Readonly<CommandOption[]>) => {
    const command = new SlashCommandBuilder()
        .setName(name)
        .setDescription(description);

    // console.log("optionsData:", optionsData);
    optionsData.forEach(data => {
        switch (data.type) {
            case CommandOptionType.STRING:
                command.addStringOption(option =>
                    option
                        .setName(data.name)
                        .setDescription(data.description)
                        .setRequired(data.required)
                );
                break;
            case CommandOptionType.INTEGER:
                command.addIntegerOption(option => {
                    option
                        .setName(data.name)
                        .setDescription(data.description)
                        .setRequired(data.required)
                    if (data.maxValue) option.setMaxValue(data.maxValue);
                    if (data.minValue) option.setMaxValue(data.minValue);
                    return option;
                });
                break;
            case CommandOptionType.BOOLEAN:
                command.addBooleanOption(option =>
                    option
                        .setName(data.name)
                        .setDescription(data.description)
                        .setRequired(data.required)
                );
                break;
            case CommandOptionType.CHANNEL:
                command.addChannelOption(option =>
                    option
                        .setName(data.name)
                        .setDescription(data.description)
                        .setRequired(data.required)
                );
                break;
            case CommandOptionType.MENTIONABLE:
                command.addMentionableOption(option =>
                    option
                        .setName(data.name)
                        .setDescription(data.description)
                        .setRequired(data.required)
                );
                break;
            case CommandOptionType.ROLE:
                command.addRoleOption(option =>
                    option
                        .setName(data.name)
                        .setDescription(data.description)
                        .setRequired(data.required)
                );
                break;
            case CommandOptionType.USER:
                command.addUserOption(option =>
                    option
                        .setName(data.name)
                        .setDescription(data.description)
                        .setRequired(data.required)
                );
                break;
        }
    });

    return command;
}