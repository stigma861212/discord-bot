import { Channel, Events, LocalizationMap, Role, User } from "discord.js";

export type EventMoudle = {
    /**event name */
    name: Events;
    /**trigger once or not */
    once?: boolean
}

export enum CommandOptionType {
    STRING = 'string',
    INTEGER = 'integer',
    BOOLEAN = 'boolean',
    USER = 'user',
    CHANNEL = 'channel',
    ROLE = 'role',
    MENTIONABLE = 'mentionable'
}

export enum OptionType {
    SUB_COMMAND = 1,
    SUB_COMMAND_GROUP = 2,
    STRING = 3,
    INTEGER = 4,
    BOOLEAN = 5,
    USER = 6,
    CHANNEL = 7,
    ROLE = 8,
    MENTIONABLE = 9,
}

export type ContextMenuCommand = {
    name: string;
    type: number;
    nameLocalizations?: LocalizationMap;
};

export type OptionDataType = string | number | boolean | Channel | Role | User;

export type SlashCommand = {
    name: string;
    description: string;
    nameLocalizations?: LocalizationMap;
    descriptionLocalizations?: LocalizationMap;
};

export type CommandOption = SlashCommand & {
    required: boolean;
    type: CommandOptionType
    maxValue?: number;
    minValue?: number;
};

export type OptionData = {
    name: string,
    type: number,
    value: string | number | boolean | undefined
}