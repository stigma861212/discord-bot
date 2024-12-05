import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, CacheType, ChatInputCommandInteraction, EmbedBuilder, EmbedFooterOptions, GuildMember, TextChannel } from "discord.js";
import { AudioPlayerStatus, createAudioPlayer, createAudioResource, joinVoiceChannel } from "@discordjs/voice";
import { createSlashCommand } from "../../command";
import { SlashCommand, CommandOption, OptionDataType, CommandOptionType } from "../../type";
import ytpl from "ytpl";
import ytdl from "@distube/ytdl-core";
import { musicPanel } from "../../announcement";
import { music_previousButton, music_playButton, music_pauseButton, music_nextButton, music_exitButton } from "../../button";
import { EventEmitter } from 'events';

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
    // const url = options[0] as string;

    // const playlist = await ytpl(options[0] as string);
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

            // const colorApi = `https://www.thecolorapi.com/id?image=${encodeURIComponent(bestThumbnail)}`;
            // const response = await fetch(colorApi);
            // if (!response.ok) throw new Error('無法取得色彩分析結果，改用預設色');
            // const colorData = await response.json();
            // const rgb = colorData.rgb;
            // console.log("rgb:", rgb);

            /**新音樂資料 */
            const newPanelEmbeds = new EmbedBuilder()
                .setTitle(trackName)
                .setThumbnail(bestThumbnail)
                .addFields(
                    { name: "Duration", value: trackDuration, inline: true },
                )
                .setFooter({ text: authorName, iconURL: authorUrl })
            // .setColor([rgb.r, rgb.g, rgb.b])

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

            const resource = createAudioResource(stream);
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
        if (newState.status === AudioPlayerStatus.Idle) {
            currentTrackIndex++;
            playNext(currentTrackIndex);
        }
    });

    playerEventEmitter.on("music_play", async (interaction: ButtonInteraction<CacheType>) => {
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

    playerEventEmitter.on('music_exit', async (interaction: ButtonInteraction<CacheType>) => {
        connection.destroy();
        await data.deleteReply();
        await panel.delete();
        await interaction.reply({
            content: 'exit 操作成功，小精靈連一刻都沒有為結束的歌單哀悼，立刻趕到後台繼續原本該做的工作',
        });
        setTimeout(async () => {
            await interaction.deleteReply();
            playerEventEmitter.removeAllListeners();
        }, 5000);
    });
};

/**Get all `setName` string in the command in order  */
export const actionOption = getOptionsName();

export const playerEventEmitter = new EventEmitter();
