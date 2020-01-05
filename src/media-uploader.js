const fs = require('fs');
const ChunkSize = 4 * 1024 * 1024;
const Logger = require('./logger');

class MediaUploader {

  /**
   * Creates a MediaUploader instance
   *
   * @param {object} config - Configuration for the MediaUploader instance
   * @param {object} config.client - Twitter API client
   * @param {string} config.mediaPath - Path to the file to be uploader
   * @param {boolean} config.verbose - Verbose flag for the Logger instance
   */
  constructor ({client, mediaPath, verbose}) {
    this.client = client;
    this.mediaPath = mediaPath;
    this.logger = new Logger({ verbose });
  }

  /**
   * Registers the media file in the Twitter API and then continue with the file upload
   *
   * @returns {Promise<number>} - Promise that resolves when upload is completed with the media id
   */
  async upload () {
    this.fileSize = fs.statSync(this.mediaPath).size;
    this.fileSync = fs.openSync(this.mediaPath, 'r');

    this.logger.log(`Starting upload of ${this.mediaPath}`);
    const uploadParams = {
      command: 'INIT',
      total_bytes: this.fileSize,
      media_type: this.mediaPath.endsWith('.mp4') ? 'video/mp4' : 'image/gif',
      media_category: 'tweet_gif',
    };
    const data = await this.client.postPromise('media/upload', uploadParams);
    this.mediaId = data['media_id_string'];
    this.totalChunks = Math.ceil(this.fileSize / ChunkSize);
    this.segmentIndex = 0;
    return this._appendUpload()
  }

  /**
   * Uploads the media file by chunks to the Twitter API. If the file size is bigger than the upload chunk size
   * this methods calls itself again to continue with the next chunk.
   *
   * @returns {Promise<number>} - Promise that resolves when upload is completed with the media id
   */
  async _appendUpload () {
    this.logger.log(`Uploading ${this.mediaPath}. Chunk ${this.segmentIndex+1} of ${this.totalChunks}`);
    const uploadParams = {
      command: 'APPEND',
      media_id: this.mediaId,
      media: this._readChunk(),
      segment_index: this.segmentIndex
    };
    await this.client.postPromise('media/upload', uploadParams);
    this.segmentIndex++;
    if (this.segmentIndex < this.totalChunks) {
      return this._appendUpload()
    }
    return this._endUpload()
  }

  /**
   * Reads chunk from the media file
   *
   * @returns {Buffer} - Buffer from the media file
   */
  _readChunk () {
    const buffer = Buffer.alloc(ChunkSize);
    const sizeRead = fs.readSync(this.fileSync, buffer, 0, ChunkSize);
    return sizeRead < ChunkSize ? buffer.slice(0, sizeRead) : buffer
  }

  /**
   * Makes the final request to end the media upload
   *
   * @returns {Promise<number>} - Id of the uploaded file
   */
  async _endUpload () {
    const uploadParams = { command: 'FINALIZE', media_id: this.mediaId };
    await this.client.postPromise('media/upload', uploadParams);
    this.logger.log(`${this.mediaPath} uploaded with id ${this.mediaId}`);
    return this.mediaId
  }

}

module.exports = MediaUploader;