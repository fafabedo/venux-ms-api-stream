const fs = require('fs');
const path = require('path')
const VideoOrm = require('@vx-orm/Video')
const StreamHelper = require("@vx-utils/Stream/Manager");

class VideoStream {
    constructor() {
        this.app = null;
        VideoOrm.setUserServiceRole()
    }
    async download(req, res) {
        const { uuid, key} = req.params;
        const { range } = req.query;
        if (!uuid || !key) {
            res.status(400);
            res.send({message: "Missing arguments in request"});
            return res;
        }
        const video = await VideoOrm.retrieveVideoByUuid(uuid);
        const videoDetail = await VideoOrm.retrieveVideoDetailByVideoIdAndUuid(video.id, key);
        try {
            let file = videoDetail.file;
            if (!fs.existsSync(file)) {
                throw "File does not exist"
            }
            const videoPath = file
            const fileSize = videoDetail.size;
            const range = req.headers.range;
            if (range) {
                const parts = range.replace(/bytes=/, '').split('-');
                const start = parseInt(parts[0], 10);
                const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
                const chunkSize = end - start + 1;
                const file = fs.createReadStream(videoPath, { start, end });
                const headers = {
                    'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                    'Accept-Ranges': 'bytes',
                    'Content-Length': chunkSize,
                    'Content-Type': 'video/mp4',
                };

                res.writeHead(206, headers);
                file.pipe(res);
                return res;
            } else {
                const headers = {
                    'Content-Length': fileSize,
                    'Content-Type': 'video/mp4',
                };
                res.writeHead(200, headers);
                fs.createReadStream(videoPath).pipe(res);
                return res;
            }
        } catch (err) {
            res.status(404);
            res.send(err);
            return res;
        }
    }
    async get(req, res) {
        const { id, range } = req.query;
        VideoOrm.setUserServiceRole()
        const videoItem = await VideoOrm.retrieveVideoByUuid(id)
        if (videoItem) {
            try {
                return StreamHelper.server(videoFile)

            } catch (err) {
                res.status(404);
                res.send(err);
                return res;
            }
        }

    }

}

module.exports = new VideoStream();