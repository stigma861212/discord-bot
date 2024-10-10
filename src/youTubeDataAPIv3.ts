import axios from "axios";

enum V3State {
    CHANNEL = "channels",
    SEARCH = "search"
}
/**Get youtube channel id */
export const getChannelId = async (username: string) => {
    const channelURL = process.env.YOUTUBE_V3_URL + V3State.CHANNEL;

    return await axios.get(channelURL, {
        params: {
            part: "snippet",
            forHandle: username,
            key: process.env.YOUTUBE_V3_API
        }
    }).then(response => {
        if (response.data.items.length > 0) {
            // console.log(`頻道ID: ${response.data.items[0].id}`);
            return response.data.items[0].id;
        }
        else {
            console.log('找不到對應的頻道。');
            return undefined;
        }
    }).catch((error) => {
        console.error('錯誤: 無法查詢頻道ID', error);
        return undefined;
    })
}

/**Get youtube channel newest video */
export const getLatestNewVideo = async (id: string) => {
    const channelURL = process.env.YOUTUBE_V3_URL + V3State.SEARCH;
    /**video last upload time limit */
    const videoThreshold = 60;
    const url = await axios.get(channelURL, {
        params: {
            part: 'snippet',
            channelId: id,
            order: 'date',
            maxResults: 1,  // 只拿最新的一個影片
            key: process.env.YOUTUBE_V3_API
        }
    }).then((response) => {
        const videos = response.data.items;
        if (videos.length > 0) {
            const latestVideo = videos[0];
            const publishedAt = new Date(latestVideo.snippet.publishedAt);
            const now = new Date();
            /**Count upload to now time length (minute) */
            const timeDifferenceInMinutes = (now.getTime() - publishedAt.getTime()) / (1000 * 60);

            if (timeDifferenceInMinutes <= videoThreshold) {
                console.log("剛上傳影片");
                return `https://www.youtube.com/watch?v=${latestVideo.id.videoId}`;
            }
            else {
                // console.log("不是剛上傳的影片");
                return undefined;
            }

            // console.log(`最新影片標題: ${latestVideo.snippet.title}`);
            // console.log(`發布時間: ${latestVideo.snippet.publishedAt}`);
            // console.log(`影片連結: https://www.youtube.com/watch?v=${latestVideo.id.videoId}`);
            // return `https://www.youtube.com/watch?v=${latestVideo.id.videoId}`;
        } else {
            console.log('這個頻道目前沒有影片。');
            return undefined;
        }
    }).catch((error) => {
        console.error('錯誤: 無法查詢影片資訊', error);
        return undefined;
    });

    return url;
}