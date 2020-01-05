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
      media_ids: this._uploadMedia(mediaPath)
    };
    this.logger.log(`Tweeting "${postOptions.status}${ postOptions.media_ids ? ` with media ${mediaPath}` : ''}"`);
    this.client.post('statuses/update', postOptions, (error) => {
      if (error) return this.logger.log(error);
      this.logger.log(`Tweeted "${postOptions.status}" ✓`);
    });
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