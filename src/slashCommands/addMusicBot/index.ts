import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, CacheType, ChatInputCommandInteraction, EmbedBuilder, EmbedFooterOptions, GuildMember, TextChannel } from "discord.js";
import { AudioPlayerStatus, createAudioPlayer, createAudioResource, joinVoiceChannel } from "@discordjs/voice";
import { createSlashCommand } from "../../command";
import { SlashCommand, CommandOption, OptionDataType, CommandOptionType } from "../../type";
import ytpl from "ytpl";
import ytdl from "@distube/ytdl-core";
import { musicPanel } from "../../announcement";
import { music_previousButton, music_playButton, music_pauseButton, music_nextButton, music_exitButton } from "../../button";
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
    try {
        playlist = await ytpl(options[0] as string);
        console.log('Playlist fetched successfully');
    } catch (error) {
        console.error('Failed to fetch playlist');
        return;
    }

    const voiceChannel = (data.member as GuildMember).voice?.channel;
    if (!voiceChannel) {
        await data.reply({
            content: '⚠️ 請先加入語音頻道再使用此指令！',
            ephemeral: true,
        });
        return;
    }

    await data.reply({
        content: '已送單，稍等後台會抓一隻會唱不會跳的小精靈進來語音唱歌',
    });

    await new Promise(resolve => setTimeout(resolve, 3000));

    const buttonRow = new ActionRowBuilder<ButtonBuilder>();

    buttonRow.addComponents(
        music_previousButton,
        music_playButton,
        music_pauseButton,
        music_nextButton,
        music_exitButton
    );

    const panel = await data.followUp({
        embeds: [musicPanel],
        components: [buttonRow]
    })

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
    playNext(currentTrackIndex);

    /**
     * To play next track with index number
     * @param index order number of the current track
     */
    async function playNext(index: number) {
        if (index < playlist.items.length) {
            const url = playlist.items[index].url;
            const trackName = playlist.items[index].title;
            const authorName = playlist.items[index].author.name;
            const authorUrl = playlist.items[index].author.url;
            const trackDuration = playlist.items[index].duration as string;
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
            const newPanelEmbeds = new EmbedBuilder()
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
                embeds: [newPanelEmbeds],
                components: [buttonRow]
            })

            const stream = ytdl(url, {
                filter: 'audioonly' as const,
                quality: 'highestaudio',
                highWaterMark: 1 << 25,
                requestOptions: {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3',
                    },
                },
            }).on('error', (err) => {
                console.error('Error downloading the stream:', err);
            });

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
            await data.deleteReply();
            await panel.delete();
            const endMessage = await (data.channel as TextChannel).send({
                content: '歌單已經結束，是時候讓小精靈回到後台繼續原本該做的工作了',
            })
            setTimeout(async () => {
                endMessage.delete();
                playerEventEmitter.removeAllListeners();
            }, 5000);
        }
    }

    // 設置當前音樂播放結束後的回調
    player.on('stateChange', (oldState, newState) => {
        console.log("stateChange");
        if (newState.status === AudioPlayerStatus.Idle) {
            currentTrackIndex++;
            playNext(currentTrackIndex);
        }
    });

    playerEventEmitter.on("music_play", async (interaction: ButtonInteraction<CacheType>) => {
        console.log("music_play");
        if (player.state.status === AudioPlayerStatus.Paused) {
            player.unpause();
            await interaction.reply({
                content: 'play 操作成功，接著唱！',
                ephemeral: true,
            });
        }
        else if (player.state.status === AudioPlayerStatus.Playing) {
            await interaction.reply({
                content: '就已經在唱歌了，專心聽！',
                ephemeral: true,
            });
        }
        setTimeout(async () => {
            await interaction.deleteReply();
        }, 5000);
    })

    playerEventEmitter.on('music_pause', async (interaction: ButtonInteraction<CacheType>) => {
        console.log("music_pause");
        if (player.state.status === AudioPlayerStatus.Playing) {
            player.pause();
            await interaction.reply({
                content: 'pause 操作成功，靜悄悄！',
                ephemeral: true,
            });
        }
        else if (player.state.status === AudioPlayerStatus.Paused) {
            await interaction.reply({
                content: '已經沒在唱歌了，是要小精靈滾蛋嗎?',
                ephemeral: true,
            });
        }
        setTimeout(async () => {
            await interaction.deleteReply();
        }, 5000);
    });

    playerEventEmitter.on('music_next', async (interaction: ButtonInteraction<CacheType>) => {
        console.log("music_next");
        if (currentTrackIndex + 1 < playlist.items.length) {
            currentTrackIndex++;
            playNext(currentTrackIndex);
            await interaction.reply({
                content: 'next 操作成功，小精靈不會再唱這首破歌了...',
                ephemeral: true,
            });
        }
        else {
            await interaction.reply({
                content: '這是最後的一曲了...',
                ephemeral: true,
            });
        }
        setTimeout(async () => {
            await interaction.deleteReply();
        }, 5000);
    });

    playerEventEmitter.on('music_previous', async (interaction: ButtonInteraction<CacheType>) => {
        console.log("music_previous");
        if (currentTrackIndex > 0) {
            currentTrackIndex--;
            playNext(currentTrackIndex);
            await interaction.reply({
                content: 'previous 操作成功，小精靈準備重唱',
                ephemeral: true,
            });
        }
        else {
            await interaction.reply({
                content: '沒有前一首歌耶',
                ephemeral: true,
            });
        }
        setTimeout(async () => {
            await interaction.deleteReply();
        }, 5000);
    });

    playerEventEmitter.once('music_exit', async (interaction: ButtonInteraction<CacheType>) => {
        console.log("music_exit");
        playerEventEmitter.removeAllListeners();
        connection.destroy();
        await data.deleteReply();
        await panel.delete();
        await interaction.reply({
            content: 'exit 操作成功，小精靈連一刻都沒有為結束的歌單哀悼，立刻趕到後台繼續原本該做的工作',
        });
        setTimeout(async () => {
            await interaction.deleteReply();
            console.log("now removeAll");
        }, 5000);
    });

    async function getDominantColor(url: string) {
        return new Promise((resolve, reject) => {
            // 創建 Image 元素
            const img = new Image();
            img.crossOrigin = 'Anonymous'; // 允許跨域圖像加載
            img.src = url;

            img.onload = () => {
                // 創建 canvas 元素
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                if (!ctx) {
                    reject('Failed to get canvas context');
                    return;
                }

                // 設定 canvas 尺寸為圖片尺寸
                canvas.width = img.width;
                canvas.height = img.height;

                // 將圖片繪製到 canvas 上
                ctx.drawImage(img, 0, 0, img.width, img.height);

                // 獲取圖片的像素數據
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const pixels = imageData.data;

                // 計算顏色的頻率
                const colorMap: { [key: string]: number } = {};
                for (let i = 0; i < pixels.length; i += 4) {
                    const r = pixels[i];
                    const g = pixels[i + 1];
                    const b = pixels[i + 2];

                    // 我們將顏色組合成字符串進行統計
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

                // 返回主要顏色
                resolve(`rgb(${dominantColor})`);
            };

            img.onerror = (error) => {
                reject(error);
            };
        });
    }
};

/**Get all `setName` string in the command in order  */
export const actionOption = getOptionsName();

export const playerEventEmitter = new EventEmitter();
