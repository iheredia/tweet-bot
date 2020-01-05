const util = require('util');
const Twitter = require('twitter');
const MediaUploader = require('./media-uploader');
const Logger = require('./logger');

class TweetBot {

  /*
  * secrets: object with "consumer_key", "consumer_secret", "access_token_key"
  *          and "access_token_secret"
  * */
  constructor ({secrets, verbose}) {
    this.client = new Twitter(secrets);
    this.clientPost = util.promisify(this.client.post);
    this.verbose = verbose;
    this.logger = new Logger({ verbose });
  }

  /*
  * status: string with the final tweet text
  * mediaPath: path to .gif or .mp4 (optional)
  * */
  async tweet ({status, mediaPath}) {
    const postOptions = {
      status: status || '',
      media_ids: await this._uploadMedia(mediaPath)
    };
    this.logger.log(`Tweeting${ postOptions.status ? ` "${postOptions.status}"` : ''}${ postOptions.media_ids ? ` with media ${mediaPath}` : ''}`);
    try {
      await this.clientPost('statuses/update', postOptions);
    } catch (error) {
      this.logger.log(error);
      throw error;
    }
  }

  async _uploadMedia(mediaPath) {
    let mediaId = null;
    if (mediaPath) {
      const mediaUploader = new MediaUploader({
        client: this.client,
        mediaPath: mediaPath,
        verbose: this.verbose
      });
      mediaId = await mediaUploader.upload()
    }
    return mediaId
  }
}

module.exports = TweetBot;