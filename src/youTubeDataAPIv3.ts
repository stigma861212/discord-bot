import axios from "axios";

enum V3State {
    CHANNEL = "channels",
    SEARCH = "search"
}
/**Get youtube Username id */
export const getUsernameId = async (username: string) => {
    const channelURL = 'https://www.googleapis.com/youtube/v3/' + V3State.CHANNEL;

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

/**Get youtube video Uploader id */
export const getUploaderId = async (videoId: string) => {
    try {
        const response = await axios.get(`https://www.googleapis.com/youtube/v3/videos`, {
            params: {
                id: videoId,
                key: process.env.YOUTUBE_V3_API,
                part: 'snippet'
            }
        });

        const videoData = response.data.items[0];
        if (videoData) {
            const uploaderId = videoData.snippet.channelId;
            console.log(`Uploader ID: ${uploaderId}`);
            return uploaderId;
        } else {
            console.log('Video not found');
            return undefined;
        }
    } catch (error) {
        console.error('Error fetching video data:', error);
        return undefined;
    }

}

/**
 * Get youtube channel newest video
 * @param id yt channel id 
 * @returns yt video url list
 */
export const getLatestNewVideo = async (id: string) => {
    const channelURL = 'https://www.googleapis.com/youtube/v3/' + V3State.SEARCH;
    /**video last upload time limit */
    const videoThreshold = 60;

    let newVideo: Array<string> = [];

    await axios.get(channelURL, {
        params: {
            part: 'snippet',
            channelId: id,
            order: 'date',
            maxResults: 50,
            key: process.env.YOUTUBE_V3_API
        }
    }).then((response) => {
        const videos = response.data.items;
        if (videos.length < 1) return;
        for (let index = 0; index < videos.length; index++) {
            const nowVideo = videos[index];
            if (nowVideo.snippet.liveBroadcastContent != "none") continue;
            const publishedAt = new Date(nowVideo.snippet.publishedAt);
            const now = new Date();
            const timeDifferenceInMinutes = (now.getTime() - publishedAt.getTime()) / (1000 * 60);
            if (timeDifferenceInMinutes <= videoThreshold) {
                newVideo.push(`https://www.youtube.com/watch?v=${nowVideo.id.videoId}`);
            }
            else {
                break;
            }
        }

        // console.log(`最新影片標題: ${nowVideo.snippet.title}`);
        // console.log(`發布時間: ${nowVideo.snippet.publishedAt}`);
        // console.log(`影片連結: https://www.youtube.com/watch?v=${nowVideo.id.videoId}`);

    }).catch((error) => {
        console.error('錯誤: 無法查詢影片資訊', error);
        return newVideo;
    });
    console.log(new Date(), "- new upload videos:\n", newVideo);
    return newVideo;
}