const Twitter = require('twitter');
const fs = require('fs');
const ChunkSize = 4 * 1024 * 1024;

class TweetBot {
  constructor ({secrets}) {
    this.client = new Twitter(secrets);
    this.gifMediaType = 'image/gif';
    this.mp4MediaType = 'video/mp4';
    this.preventTweet = false;
  }

  tweet ({status, media}) {
    if (this.preventTweet) {
      const logMsg = `Prevented tweet`
        + (status ? ` "${status}"` : '')
        + (media ? ` with media ${media.path}` : '');
      return console.log(logMsg);
    }
    this.status = status || '';
    this.media = media;
    this.uploadMedia(media)
      .then(() => this.updateStatus())
  }

  uploadMedia (media={}) {
    if (!media.path) return Promise.resolve();
    return new Promise(resolve => {
      this.path = media.path;
    this.fileSize = fs.statSync(this.path).size;
    this.fileSync = fs.openSync(this.path, 'r');
    this.mediaResolve = resolve;
    console.log(`Starting upload ${this.path}`);
    const mediaParams = {
      command: 'INIT',
      total_bytes: this.fileSize,
      media_type: media.type || this.gifMediaType,
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
    console.log(`Uploading ${this.path}. Chunk ${this.segmentIndex+1} of ${this.totalChunks}`);
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
    console.log(`${this.path} uploaded with id ${this.mediaId}`);
    const uploadParams = {
      command: 'FINALIZE',
      media_id: this.mediaId
    };
    this.client.post('media/upload', uploadParams, (error) => {
      if (error) return console.log(error);
    this.mediaResolve()
  })
  }

  updateStatus () {
    const postOptions = {
      status: this.status,
      media_ids: this.mediaId
    };
    console.log(`Tweeting "${postOptions.status}"`);
    if (postOptions.media_ids) console.log(` with media ${postOptions.media_ids}`);
    this.client.post('statuses/update', postOptions, (error) => {
      if (error) return console.log(error);
    console.log(`Tweeting "${postOptions.status}" ✓`);
  });
  }
}

module.exports = TweetBot;