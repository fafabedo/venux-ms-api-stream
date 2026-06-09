const fs = require('fs');
const path = require('path')
const { Client } = require('ssh2');
const VideoOrm = require('@vx-orm/Video')
const StreamHelper = require("@vx-utils/Stream/Manager");

function parseSshConfig(prefix) {
    const match = prefix.match(/^([^@]+)@([^:]+)(?::(\d+))?$/);
    if (!match) throw new Error(`Invalid REMOTE_SSH_PREFIX format — expected user@host or user@host:port`);
    return {
        username: match[1],
        host: match[2],
        port: match[3] ? parseInt(match[3]) : 22,
        privateKey: fs.readFileSync(process.env.REMOTE_SSH_KEY || `${process.env.HOME}/.ssh/id_rsa`),
    };
}

// Returns SFTP stats object on success, null if not found or on error
function remoteFileStat(sshConfig, remotePath) {
    return new Promise((resolve) => {
        const conn = new Client();
        conn.on('ready', () => {
            conn.sftp((err, sftp) => {
                if (err) { conn.end(); console.error('[ssh] sftp subsystem error:', err.message); return resolve(null); }
                sftp.stat(remotePath, (err, stats) => {
                    conn.end();
                    if (err) console.error('[ssh] stat error:', err.message, '| path:', remotePath);
                    resolve(err ? null : stats);
                });
            });
        }).on('error', (err) => { console.error('[ssh] connection error:', err.message); resolve(null); }).connect(sshConfig);
    });
}

function remoteReadStream(sshConfig, remotePath, opts = {}) {
    return new Promise((resolve, reject) => {
        const conn = new Client();
        conn.on('ready', () => {
            conn.sftp((err, sftp) => {
                if (err) { conn.end(); return reject(err); }
                const stream = sftp.createReadStream(remotePath, opts);
                stream.on('close', () => conn.end());
                stream.on('error', () => conn.end());
                resolve(stream);
            });
        }).on('error', reject).connect(sshConfig);
    });
}

const sshConfig = process.env.REMOTE_SSH_PREFIX ? parseSshConfig(process.env.REMOTE_SSH_PREFIX) : null;

class VideoStream {
    constructor() {
        this.app = null;
        VideoOrm.setUserServiceRole()
    }
    // async retrieveVideoFile(uuid) {
    //     return new Promise(async (resolve, reject) => {
    //         try {
    //             await VideoOrm.retrieveVideoByUuid(uuid)
    //         }
    //     });
    // }
    async stream(req, res) {
        const { uuid} = req.params;
        if (!uuid) {
            res.status(400);
            res.send({message: "Missing arguments in request"});
            return res;
        }
        const videoDetail = await VideoOrm.retrieveVideoDetailByVideoUuid(uuid);
        try {
            let videoPath = videoDetail.file;
            const remoteStats = sshConfig ? await remoteFileStat(sshConfig, videoPath) : null;
            const exists = sshConfig ? remoteStats !== null : fs.existsSync(videoPath);
            if (!exists) {
                res.status(500);
                res.send({message: "Missing file"});
                return res;
            }
            const fileSize = remoteStats ? remoteStats.size : fs.statSync(videoPath).size;
            const range = req.headers.range;
            if (range) {
                const parts = range.replace(/bytes=/, '').split('-');
                const start = parseInt(parts[0], 10);
                const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
                const chunkSize = end - start + 1;
                const file = sshConfig
                    ? await remoteReadStream(sshConfig, videoPath, { start, end })
                    : fs.createReadStream(videoPath, { start, end });
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
                    'Accept-Ranges': 'bytes',
                };
                const file = sshConfig
                    ? await remoteReadStream(sshConfig, videoPath)
                    : fs.createReadStream(videoPath);
                res.writeHead(200, headers);
                file.pipe(res);
                return res;
            }
        } catch (err) {
            res.status(404);
            res.send(err);
            return res;
        }
    }
    async download(req, res) {
        const { uuid, key } = req.params;
        if (!uuid || !key) {
            res.status(400);
            res.send({message: "Missing arguments in request"});
            return res;
        }
        const video = await VideoOrm.retrieveVideoByUuid(uuid);
        const videoDetail = await VideoOrm.retrieveVideoDetailByVideoIdAndUuid(video.id, key);
        try {
            let videoPath = videoDetail.file;
            const remoteStats = sshConfig ? await remoteFileStat(sshConfig, videoPath) : null;
            const exists = sshConfig ? remoteStats !== null : fs.existsSync(videoPath);
            if (!exists) {
                res.status(500);
                res.send({message: "Missing file"});
                return res;
            }
            const fileSize = remoteStats ? remoteStats.size : fs.statSync(videoPath).size;
            const range = req.headers.range;
            if (range) {
                const parts = range.replace(/bytes=/, '').split('-');
                const start = parseInt(parts[0], 10);
                const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
                const chunkSize = end - start + 1;
                const file = sshConfig
                    ? await remoteReadStream(sshConfig, videoPath, { start, end })
                    : fs.createReadStream(videoPath, { start, end });
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
                    'Accept-Ranges': 'bytes',
                };
                const file = sshConfig
                    ? await remoteReadStream(sshConfig, videoPath)
                    : fs.createReadStream(videoPath);
                res.writeHead(200, headers);
                file.pipe(res);
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