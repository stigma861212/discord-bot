import { ChatInputCommandInteraction, Client, Collection, GatewayIntentBits } from "discord.js";
import { OptionDataType } from "./type";

/**Store client and actions data */
export default class ClientDataManager {
    private static instance: ClientDataManager;
    /**Discord Client */
    private client: Client<boolean>;
    /**Store all actions */
    private actions: Collection<string, (data: ChatInputCommandInteraction) => Promise<void>> = new Collection();
    /**Store all action options */
    private options: Collection<string, Array<string>> = new Collection();

    private constructor() {
        this.client = new Client({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.MessageContent,
                GatewayIntentBits.GuildMembers,
            ],
        });
        this.client.login(process.env.DISCORD_TOKEN);
    }

    public static getInstance(): ClientDataManager {
        if (!ClientDataManager.instance) {
            ClientDataManager.instance = new ClientDataManager();
        }
        return ClientDataManager.instance;
    }
    /**Get client */
    public getClient(): Client<boolean> {
        return this.client;
    }
    /**Set actions */
    public setActions(actions: Collection<string, (data: ChatInputCommandInteraction) => Promise<void>>): void {
        this.actions = actions;
    }
    /**Get actions */
    public getActions(): Collection<string, (data: ChatInputCommandInteraction, options: Array<OptionDataType>) => Promise<void>> {
        return this.actions;
    }
}