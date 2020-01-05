const fs = require('fs');
const ChunkSize = 4 * 1024 * 1024;
const Logger = require('./logger');

class MediaUploader {
  /*
  * client: client created with the Twitter lib
  * mediaPath: path to .gif or .mp4
  * verbose: boolean. if true then the uploading process is logged
  * */
  constructor ({client, mediaPath, verbose}) {
    this.client = client;
    this.mediaPath = mediaPath;
    this.logger = new Logger({ verbose });
  }

  upload () {
    return new Promise((resolve, reject) => {
      this.mediaResolve = resolve;
      this.mediaReject = reject;

      this.fileSize = fs.statSync(this.mediaPath).size;
      this.fileSync = fs.openSync(this.mediaPath, 'r');

      this.logger.log(`Starting upload of ${this.mediaPath}`);
      const uploadParams = {
        command: 'INIT',
        total_bytes: this.fileSize,
        media_type: this.mediaPath.endsWith('.mp4') ? 'video/mp4' : 'image/gif',
        media_category: 'tweet_gif'
      };
      this.client.post('media/upload', uploadParams, (error, data) => {
        if (error) {
          this.logger.log(data);
          this.logger.log(error);
          this.mediaReject(error, data);
        }
        this.mediaId = data['media_id_string'];
        this.totalChunks = Math.ceil(this.fileSize / ChunkSize);
        this.segmentIndex = 0;
        this._appendUpload()
      });
    });
  }

  _appendUpload () {
    this.logger.log(`Uploading ${this.mediaPath}. Chunk ${this.segmentIndex+1} of ${this.totalChunks}`);
    const uploadParams = {
      command: 'APPEND',
      media_id: this.mediaId,
      media: this._readChunk(),
      segment_index: this.segmentIndex
    };
    this.client.post('media/upload', uploadParams, (error) => {
      if (error) {
        this.logger.log(error);
        this.mediaReject(error);
      }
      this.segmentIndex++;
      this.segmentIndex < this.totalChunks ? this._appendUpload() : this._endUpload()
    })
  }

  _readChunk () {
    const buffer = new Buffer(ChunkSize);
    const sizeRead = fs.readSync(this.fileSync, buffer, 0, ChunkSize);
    return sizeRead < ChunkSize ? buffer.slice(0, sizeRead) : buffer
  }

  _endUpload () {
    this.logger.log(`${this.mediaPath} uploaded with id ${this.mediaId}`);
    const uploadParams = {
      command: 'FINALIZE',
      media_id: this.mediaId
    };
    this.client.post('media/upload', uploadParams, (error) => {
      if (error) {
        this.logger.log(error);
        this.mediaReject(error);
      }
      this.mediaResolve(this.mediaId)
    })
  }

}

module.exports = MediaUploader;