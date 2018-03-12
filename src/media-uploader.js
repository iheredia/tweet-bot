const fs = require('fs');
const ChunkSize = 4 * 1024 * 1024;

class MediaUploader {
  constructor ({client, mediaPath, verbose}) {
    this.client = client;
    this.mediaPath = mediaPath;
    this.verbose = verbose;
  }

  upload () {
    return new Promise(resolve => {
      this.fileSize = fs.statSync(this.mediaPath).size;
      this.fileSync = fs.openSync(this.mediaPath, 'r');
      this.mediaResolve = resolve;
      console.log(`Starting upload ${this.mediaPath}`);
      const mediaParams = {
        command: 'INIT',
        total_bytes: this.fileSize,
        media_type: this.mediaPath.endsWith('.mp4') ? 'video/mp4' : 'image/gif',
        media_category: 'tweet_gif'
      };
      this.client.post('media/upload', mediaParams, (error, data) => {
        if (error) return console.log(error, data);
        this.mediaId = data['media_id_string'];
        this.totalChunks = Math.ceil(this.fileSize / ChunkSize);
        this.segmentIndex = 0;
        this.appendUpload()
      });
    });
  }

  appendUpload () {
    console.log(`Uploading ${this.mediaPath}. Chunk ${this.segmentIndex+1} of ${this.totalChunks}`);
    const uploadParams = {
      command: 'APPEND',
      media_id: this.mediaId,
      media: this.readChunk(),
      segment_index: this.segmentIndex
    };
    this.client.post('media/upload', uploadParams, (error) => {
      if (error) return console.log(error);
      this.segmentIndex++;
      this.segmentIndex < this.totalChunks ? this.appendUpload() : this.endUpload()
    })
  }

  readChunk () {
    const buffer = new Buffer(ChunkSize);
    const sizeRead = fs.readSync(this.fileSync, buffer, 0, ChunkSize);
    return sizeRead < ChunkSize ? buffer.slice(0, sizeRead) : buffer
  }

  endUpload () {
    console.log(`${this.mediaPath} uploaded with id ${this.mediaId}`);
    const uploadParams = {
      command: 'FINALIZE',
      media_id: this.mediaId
    };
    this.client.post('media/upload', uploadParams, (error) => {
      if (error) return console.log(error);
      this.mediaResolve(this.mediaId)
    })
  }

}

module.exports = MediaUploader;