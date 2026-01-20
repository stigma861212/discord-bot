import { ChatInputCommandInteraction, Client, Collection, ContextMenuCommandBuilder, MessageContextMenuCommandInteraction, REST, Routes, SlashCommandBuilder } from "discord.js";
import path from "path";
import { promises as fs } from 'fs';
import ClientDataManager from "./clientDataManager";

/**Register slash commands */
const registerCommands = async (commands: Array<SlashCommandBuilder | ContextMenuCommandBuilder>) => {
    const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN as string);
    try {
        // console.log("Registering commands...");

        const response = await rest.put(
            Routes.applicationCommands(
                process.env.APPLICATION_ID as string,
            ),
            { body: commands }
        );
        // console.log("Successfully registered commands:", response);
    } catch (error) {
        console.error("Error registering commands:", error);
    }
}

/**Load events files to register action events*/
export const loadEvents = async (client: Client) => {
    /**Events directory path */
    const fileExtension = path.extname(__filename);
    const baseDir = (process as { pkg?: unknown }).pkg
        ? path.join(path.dirname(process.execPath), 'dist')
        : __dirname;
    const eventsDir = path.join(baseDir, 'events');
    try {
        /**To read all files and folders under the events directory */
        const items = await fs.readdir(eventsDir, { withFileTypes: true });
        /**Filter folder */
        const folders = items.filter(item => item.isDirectory());
        /**Store `index.ts` files path*/
        const indexFiles: string[] = [];
        for (const folder of folders) {
            /**`index.ts` path */
            const indexPath = path.join(eventsDir, folder.name, `index${fileExtension}`);
            await fs.access(indexPath)
                .then(() => {
                    indexFiles.push(indexPath);
                })
                .catch(() => {
                    console.warn(`Index file not found: ${indexPath}`);
                });
        }
        for (const file of indexFiles) {
            const eventFile = await import(file);
            if (eventFile.event.once) {
                client.once(eventFile.event.name, eventFile.action);
            }
            else {
                client.on(eventFile.event.name, eventFile.action);
            }
            // console.log("Event loading complete:", eventFile.event.name);
        }
    } catch (error) {
        console.error('Error reading commands directory:', error);
    }
}

/**Load commands files to register SlashCommands*/
export const loadSlashCommands = async (): Promise<SlashCommandBuilder[]> => {
    const commands: SlashCommandBuilder[] = [];
    const actions: Collection<string, (data: ChatInputCommandInteraction | MessageContextMenuCommandInteraction) => Promise<void>> = new Collection();
    /**Commands directory path */
    const fileExtension = path.extname(__filename);
    const baseDir = (process as { pkg?: unknown }).pkg
        ? path.join(path.dirname(process.execPath), 'dist')
        : __dirname;
    const commandsDir = path.join(baseDir, 'slashCommands');
    try {
        /**To read all files and folders under the commands directory */
        const items = await fs.readdir(commandsDir, { withFileTypes: true });
        /**Filter folder */
        const folders = items.filter(item => item.isDirectory());
        /**Store `index.ts` files path*/
        const indexFiles: string[] = [];
        for (const folder of folders) {
            /**`index.ts` path */
            const indexPath = path.join(commandsDir, folder.name, `index${fileExtension}`);
            await fs.access(indexPath)
                .then(() => {
                    indexFiles.push(indexPath);
                })
                .catch(() => {
                    console.warn(`Index file not found: ${indexPath}`);
                });
        }
        for (const file of indexFiles) {
            const command = await import(file)
            commands.push(command.command);
            actions.set(command.command.name, command.action);
        }
        ClientDataManager.getInstance().setActions(actions);
    } catch (error) {
        console.error('Error reading commands directory:', error);
    }
    return commands; // 返回命令数组
};

/**Load commands files to register ContextMenuCommands */
export const loadContextMenuCommands = async (): Promise<ContextMenuCommandBuilder[]> => {
    const commands: ContextMenuCommandBuilder[] = [];
    const actions: Collection<string, (data: ChatInputCommandInteraction | MessageContextMenuCommandInteraction) => Promise<void>> = new Collection();
    /**Commands directory path */
    const fileExtension = path.extname(__filename);
    const baseDir = (process as { pkg?: unknown }).pkg
        ? path.join(path.dirname(process.execPath), 'dist')
        : __dirname;
    const commandsDir = path.join(baseDir, 'contextMenuCommands');
    try {
        /**To read all files and folders under the commands directory */
        const items = await fs.readdir(commandsDir, { withFileTypes: true });
        /**Filter folder */
        const folders = items.filter(item => item.isDirectory());
        /**Store `index.ts` files path*/
        const indexFiles: string[] = [];
        for (const folder of folders) {
            /**`index.ts` path */
            const indexPath = path.join(commandsDir, folder.name, `index${fileExtension}`);
            await fs.access(indexPath)
                .then(() => {
                    indexFiles.push(indexPath);
                })
                .catch(() => {
                    console.warn(`Index file not found: ${indexPath}`);
                });
        }
        for (const file of indexFiles) {
            const command = await import(file)
            commands.push(command.command);
            actions.set(command.command.name, command.action);
        }
        ClientDataManager.getInstance().setActions(actions);
    } catch (error) {
        console.error('Error reading commands directory:', error);
    }
    return commands; // 返回命令数组
};

/**Load both Slash Commands and Context Menu Commands and register them */
export const loadAllCommands = async () => {
    // console.log("loadAllCommands");
    try {
        const slashCommands = await loadSlashCommands(); // 加载 Slash Commands
        const contextMenuCommands = await loadContextMenuCommands(); // 加载 Context Menu Commands

        // 合并两个 commands 数组
        const allCommands: Array<SlashCommandBuilder | ContextMenuCommandBuilder> = [...slashCommands, ...contextMenuCommands];

        // 调用 registerCommands 进行注册
        await registerCommands(allCommands);
    } catch (error) {
        console.error('Error loading all commands:', error);
    }
};