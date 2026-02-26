import { ChatInputCommandInteraction, Client, Collection, ContextMenuCommandBuilder, MessageContextMenuCommandInteraction, REST, Routes, SlashCommandBuilder } from "discord.js";
import path from "path";
import { promises as fs } from 'fs';
import ClientDataManager from "./clientDataManager";

/**Register slash commands */
const registerCommands = async (commands: Array<SlashCommandBuilder | ContextMenuCommandBuilder>) => {
    const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN as string);
    try {
        await rest.put(
            Routes.applicationCommands(
                process.env.APPLICATION_ID as string,
            ),
            { body: commands }
        );
    } catch (error) {
        console.error("Error registering commands:", error);
    }
}

/**Load events files to register action events*/
export const loadEvents = async (client: Client) => {
    const fileExtension = path.extname(__filename);
    const baseDir = (process as { pkg?: unknown }).pkg
        ? path.join(path.dirname(process.execPath), 'dist')
        : __dirname;
    const eventsDir = path.join(baseDir, 'events');
    try {
        const items = await fs.readdir(eventsDir, { withFileTypes: true });
        const folders = items.filter(item => item.isDirectory());
        const indexFiles: string[] = [];
        for (const folder of folders) {
            const indexPath = path.join(eventsDir, folder.name, `index${fileExtension}`);
            await fs.access(indexPath)
                .then(() => indexFiles.push(indexPath))
                .catch(() => console.warn(`Index file not found: ${indexPath}`));
        }
        for (const file of indexFiles) {
            const eventFile = await import(file);
            if (eventFile.event.once) {
                client.once(eventFile.event.name, eventFile.action);
            } else {
                client.on(eventFile.event.name, eventFile.action);
            }
        }
    } catch (error) {
        console.error('Error reading events directory:', error);
    }
}

/**Load commands files to register SlashCommands*/
export const loadSlashCommands = async (): Promise<SlashCommandBuilder[]> => {
    const commands: SlashCommandBuilder[] = [];
    const actions: Collection<string, (data: ChatInputCommandInteraction | MessageContextMenuCommandInteraction) => Promise<void>> = new Collection();
    const fileExtension = path.extname(__filename);
    const baseDir = (process as { pkg?: unknown }).pkg
        ? path.join(path.dirname(process.execPath), 'dist')
        : __dirname;
    const commandsDir = path.join(baseDir, 'slashCommands');
    try {
        const items = await fs.readdir(commandsDir, { withFileTypes: true });
        const folders = items.filter(item => item.isDirectory());
        const indexFiles: string[] = [];
        for (const folder of folders) {
            const indexPath = path.join(commandsDir, folder.name, `index${fileExtension}`);
            await fs.access(indexPath)
                .then(() => indexFiles.push(indexPath))
                .catch(() => console.warn(`Index file not found: ${indexPath}`));
        }
        for (const file of indexFiles) {
            const command = await import(file);
            commands.push(command.command);
            actions.set(command.command.name, command.action);
        }
        ClientDataManager.getInstance().setActions(actions);
    } catch (error) {
        console.error('Error reading slash commands directory:', error);
    }
    return commands;
};

/**Load commands files to register ContextMenuCommands */
export const loadContextMenuCommands = async (): Promise<ContextMenuCommandBuilder[]> => {
    const commands: ContextMenuCommandBuilder[] = [];
    const actions: Collection<string, (data: ChatInputCommandInteraction | MessageContextMenuCommandInteraction) => Promise<void>> = new Collection();
    const fileExtension = path.extname(__filename);
    const baseDir = (process as { pkg?: unknown }).pkg
        ? path.join(path.dirname(process.execPath), 'dist')
        : __dirname;
    const commandsDir = path.join(baseDir, 'contextMenuCommands');
    try {
        const items = await fs.readdir(commandsDir, { withFileTypes: true });
        const folders = items.filter(item => item.isDirectory());
        const indexFiles: string[] = [];
        for (const folder of folders) {
            const indexPath = path.join(commandsDir, folder.name, `index${fileExtension}`);
            await fs.access(indexPath)
                .then(() => indexFiles.push(indexPath))
                .catch(() => console.warn(`Index file not found: ${indexPath}`));
        }
        for (const file of indexFiles) {
            const command = await import(file);
            commands.push(command.command);
            actions.set(command.command.name, command.action);
        }
        ClientDataManager.getInstance().setActions(actions);
    } catch (error) {
        console.error('Error reading context menu commands directory:', error);
    }
    return commands;
};

/**Load both Slash Commands and Context Menu Commands and register them */
export const loadAllCommands = async () => {
    try {
        const slashCommands = await loadSlashCommands();
        const contextMenuCommands = await loadContextMenuCommands();
        const allCommands: Array<SlashCommandBuilder | ContextMenuCommandBuilder> = [...slashCommands, ...contextMenuCommands];
        await registerCommands(allCommands);
    } catch (error) {
        console.error('Error loading all commands:', error);
    }
};
