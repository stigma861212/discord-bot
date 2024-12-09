import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, CacheType, ChatInputCommandInteraction, EmbedBuilder, EmbedFooterOptions, GuildMember, TextChannel } from "discord.js";
import { AudioPlayerStatus, createAudioPlayer, createAudioResource, joinVoiceChannel } from "@discordjs/voice";
import { createSlashCommand } from "../../command";
import { SlashCommand, CommandOption, OptionDataType, CommandOptionType } from "../../type";
import ytpl from "ytpl";
import ytdl from "@distube/ytdl-core";
import { musicPanel } from "../../announcement";
import { music_previousButton, music_playButton, music_pauseButton, music_nextButton, music_exitButton, music_randomButton, music_urlButton } from "../../button";
import { EventEmitter } from 'events';
import sharp from "sharp";
import axios from "axios";

/**Init Command info */
const initCommandInfo: Readonly<SlashCommand> = {
    name: "addmusicbot",
    description: "add music bot into your voice channel"
}

/**Init Command option group info in order */
const initOptionInfoGroup: Readonly<Array<CommandOption>> = [
    {
        name: 'url',
        description: 'Youtube playlist url.',
        required: true,
        type: CommandOptionType.STRING,
    },
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
    let playlist: ytpl.Result;
    let playlistURL: string = options[0] as string;
    try {
        playlist = await ytpl(playlistURL);
    } catch (error) {
        console.error('Failed to fetch playlist');
        return;
    }

    music_urlButton.setURL(playlistURL);

    const voiceChannel = (data.member as GuildMember).voice?.channel;
    if (!voiceChannel) {
        await data.reply({
            content: '⚠️ 請先加入語音頻道再使用此指令！',
            ephemeral: true,
        });
        return;
    }

    const buttonRowPlayState = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
            music_previousButton,
            music_pauseButton,
            music_nextButton,
            music_exitButton,
            music_randomButton
        );

    const buttonRowStopState = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
            music_previousButton,
            music_playButton,
            music_nextButton,
            music_exitButton,
            music_randomButton
        );

    const buttonRowLink = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
            music_urlButton
        );

    // 然後將這兩行放在 components 陣列中
    const panel = await data.reply({
        embeds: [musicPanel],
        components: [buttonRowPlayState, buttonRowLink]
    });

    let embeds: EmbedBuilder;

    /**
     * Add bot to user voice channel
     */
    const connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: voiceChannel.guild.id,
        adapterCreator: voiceChannel.guild.voiceAdapterCreator,
    });
    const player = createAudioPlayer();
    connection.subscribe(player);

    let currentTrackIndex: number = 0;

    updatePanel(currentTrackIndex);
    playNext(currentTrackIndex);

    /**
     * To play next track with index number
     * @param index order number of the current track
     */
    async function playNext(index: number) {
        if (index < playlist.items.length) {
            const url = playlist.items[index].url;
            const stream = ytdl(url, {
                filter: 'audioonly' as const,
                quality: 'lowestaudio',
                highWaterMark: 1 << 25,
                requestOptions: {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3',
                    },
                },
            }).on('error', (err) => {
                console.error('Error downloading the stream:', err);
            });

            stream.on('end', () => console.log('Stream ended'));
            stream.on('error', (err) => {
                console.error('Stream error:', err);
            });

            const resource = createAudioResource(stream, {
                inlineVolume: true,
            });
            resource.volume?.setVolume(0.1);
            player.play(resource);
        }
        else {
            connection.destroy();
            await panel.delete();
            playerEventEmitter.removeAllListeners();
        }
    }

    async function updatePanel(index: number) {
        if (index < playlist.items.length) {
            const url = playlist.items[index].url;
            const trackName = playlist.items[index].title;
            const authorName = playlist.items[index].author.name;
            const bestThumbnail = playlist.items[index].bestThumbnail.url as string;
            const color = await getDominantColorFromUrl(bestThumbnail);

            /**
             * Get DominantColor frome URL
             * @param imageUrl url
             * @returns rgb color data
             */
            async function getDominantColorFromUrl(imageUrl: string): Promise<[number, number, number]> {
                try {
                    // 使用 axios 下載圖片
                    const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });

                    // 確保圖片下載成功
                    if (response.status !== 200) {
                        throw new Error(`Failed to fetch image: ${response.statusText}`);
                    }

                    // 直接使用 axios 返回的 Buffer 來處理圖片
                    const buffer = Buffer.from(response.data);

                    // 使用 sharp 處理圖片並獲取像素數據
                    const imageBuffer = await sharp(buffer)
                        .resize(100, 100)  // 可選，調整圖片大小以提高處理速度
                        .raw()
                        .toBuffer();

                    // 取得圖片的像素數據
                    const pixels = new Uint8Array(imageBuffer);

                    // 顏色統計
                    const colorMap: { [key: string]: number } = {};
                    for (let i = 0; i < pixels.length; i += 3) {  // 假設圖片是 RGB 格式
                        const r = pixels[i];
                        const g = pixels[i + 1];
                        const b = pixels[i + 2];

                        const colorKey = `${r},${g},${b}`;
                        if (colorMap[colorKey]) {
                            colorMap[colorKey]++;
                        } else {
                            colorMap[colorKey] = 1;
                        }
                    }

                    // 找出出現最多的顏色
                    let dominantColor = '';
                    let maxCount = 0;

                    for (const colorKey in colorMap) {
                        if (colorMap[colorKey] > maxCount) {
                            maxCount = colorMap[colorKey];
                            dominantColor = colorKey;
                        }
                    }
                    return dominantColor.split(",").map(Number) as [number, number, number];

                } catch (error) {
                    console.error('Error processing the image:', error);
                    throw error;
                }
            }

            /**新音樂資料 */
            embeds = new EmbedBuilder()
                .setTitle(trackName)
                // .setThumbnail(bestThumbnail)
                .addFields(
                    { name: " ", value: " ", inline: true },
                    { name: " ", value: " ", inline: true },
                    { name: " ", value: " ", inline: true },
                )
                .setFooter({ text: "Author: " + authorName })
                .setColor(color)
                .setImage(bestThumbnail)

            // 修改當前的音樂面板
            await panel.edit({
                embeds: [embeds],
                components: [buttonRowPlayState, buttonRowLink]
            })
        }
    }

    // 設置當前音樂播放結束後的回調
    player.on('stateChange', (oldState, newState) => {
        if (newState.status === AudioPlayerStatus.Idle) {
            currentTrackIndex++;
            playNext(currentTrackIndex);
            updatePanel(currentTrackIndex);
        }
    });

    playerEventEmitter.on("music_play", async (interaction: ButtonInteraction<CacheType>) => {
        const mes = await interaction.deferReply({ ephemeral: true });
        if (player.state.status === AudioPlayerStatus.Paused) {
            player.unpause();
        }
        await panel.edit({
            embeds: [embeds],
            components: [buttonRowPlayState, buttonRowLink]
        })
        setTimeout(() => { mes.delete() }, 500);
    })

    playerEventEmitter.on('music_pause', async (interaction: ButtonInteraction<CacheType>) => {
        const mes = await interaction.deferReply({ ephemeral: true });
        if (player.state.status === AudioPlayerStatus.Playing) {
            player.pause();
        }
        await panel.edit({
            embeds: [embeds],
            components: [buttonRowStopState, buttonRowLink]
        })
        setTimeout(() => { mes.delete() }, 500);
    });

    playerEventEmitter.on('music_next', async (interaction: ButtonInteraction<CacheType>) => {
        const mes = await interaction.deferReply({ ephemeral: true });
        if (currentTrackIndex + 1 < playlist.items.length) {
            currentTrackIndex++;
            playNext(currentTrackIndex);
            updatePanel(currentTrackIndex);
        }
        setTimeout(() => { mes.delete() }, 500);
    });

    playerEventEmitter.on('music_previous', async (interaction: ButtonInteraction<CacheType>) => {
        const mes = await interaction.deferReply({ ephemeral: true });
        if (currentTrackIndex > 0) {
            currentTrackIndex--;
            playNext(currentTrackIndex);
            updatePanel(currentTrackIndex);
        }
        setTimeout(() => { mes.delete() }, 500);
    });

    playerEventEmitter.on('music_random', async (interaction: ButtonInteraction<CacheType>) => {
        const mes = await interaction.deferReply({ ephemeral: true });
        currentTrackIndex = 0;
        playlist.items.sort(() => Math.random() - 0.5);
        playNext(currentTrackIndex);
        updatePanel(currentTrackIndex);
        setTimeout(() => { mes.delete() }, 500);
    });

    playerEventEmitter.once('music_exit', async (interaction: ButtonInteraction<CacheType>) => {
        const mes = await interaction.deferReply({ ephemeral: true });
        playerEventEmitter.removeAllListeners();
        connection.destroy();
        await panel.delete();
        setTimeout(() => { mes.delete() }, 500);
    });
};

/**Get all `setName` string in the command in order  */
export const actionOption = getOptionsName();

export const playerEventEmitter = new EventEmitter();