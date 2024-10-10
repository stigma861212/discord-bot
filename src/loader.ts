import { ChatInputCommandInteraction, Client, Collection, REST, Routes, SlashCommandBuilder } from "discord.js";
import path from "path";
import { promises as fs } from 'fs';
import ClientDataManager from "./clientDataManager";
import { CommandModule } from "./type";

/**Register slash commands */
const registerSlashCommands = async (commands: SlashCommandBuilder[]) => {
    const rest = new REST({ version: "10" }).setToken((process.env.DISCORD_TOKEN) as string);
    await rest.put(
        Routes.applicationCommands(
            process.env.APPLICATION_ID as string
        ),
        {
            body: commands,
        }
    )
}

/**Load commands files*/
export const loadCommands = async () => {
    const commands: SlashCommandBuilder[] = [];
    const actions: Collection<string, (data: ChatInputCommandInteraction) => Promise<void>> = new Collection();
    /**Commands directory path */
    const commandsDir = path.join(__dirname, '../src/commands');
    try {
        /**To read all files and folders under the commands directory */
        const items = await fs.readdir(commandsDir, { withFileTypes: true });
        /**Filter folder */
        const folders = items.filter(item => item.isDirectory());
        /**Store `index.ts` files path*/
        const indexFiles: string[] = [];
        for (const folder of folders) {
            /**`index.ts` path */
            const indexPath = path.join(commandsDir, folder.name, 'index.ts');
            await fs.access(indexPath)
                .then(() => {
                    indexFiles.push(indexPath);
                })
                .catch(() => {
                    console.warn(`index.ts not found in folder: ${folder.name}`);
                });
        }
        for (const file of indexFiles) {
            const command: CommandModule = await import(file)
            commands.push(command.command);
            actions.set(command.command.name, command.action);
        }
        await registerSlashCommands(commands);
        ClientDataManager.getInstance().setActions(actions);
    } catch (error) {
        console.error('Error reading commands directory:', error);
    }
};

/**Load events files*/
export const loadEvents = async (client: Client) => {
    /**Events directory path */
    const eventsDir = path.join(__dirname, '../src/events');
    try {
        /**To read all files and folders under the events directory */
        const items = await fs.readdir(eventsDir, { withFileTypes: true });
        /**Filter folder */
        const folders = items.filter(item => item.isDirectory());
        /**Store `index.ts` files path*/
        const indexFiles: string[] = [];
        for (const folder of folders) {
            /**`index.ts` path */
            const indexPath = path.join(eventsDir, folder.name, 'index.ts');
            await fs.access(indexPath)
                .then(() => {
                    indexFiles.push(indexPath);
                })
                .catch(() => {
                    console.warn(`index.ts not found in folder: ${folder.name}`);
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
        }
    } catch (error) {
        console.error('Error reading commands directory:', error);
    }
}